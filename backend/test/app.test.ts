import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';
import type { AddressInfo } from 'node:net';
import { createApp } from '../src/app.js';
import { DiagnosticStore } from '../src/store.js';
import type { DashboardData } from '@voltguard/shared/diagnostics';

async function serve(store: DiagnosticStore) {
  const server = createApp(store).listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  return {
    request: (path: string, method = 'GET', body?: unknown, headers: Record<string, string> = {}) => fetch(`${base}/api${path}`, {
      method, headers: { 'Content-Type': 'application/json', ...headers },
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
    close: async () => {
      const closed = once(server, 'close');
      server.close();
      server.closeAllConnections();
      await closed;
      store.close();
    },
  };
}

test('HTTP operations persist across a database reopen and remain isolated by vehicle', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'voltguard-api-'));
  const filename = join(directory, 'test.sqlite');
  let instance = await serve(new DiagnosticStore(filename));
  try {
    assert.equal((await instance.request('/health')).status, 200);
    assert.equal((await (await instance.request('/vehicles')).json()).length, 3);
    const path = '/vehicles/bay-03';
    const updated = await instance.request(`${path}/modules/mod-a3`, 'PATCH', { enabled: false });
    assert.equal(updated.status, 200);
    assert.equal((await updated.json()).packSummary.effectiveChargePercent, 59);
    const other = await (await instance.request('/vehicles/bay-01/dashboard')).json();
    assert.equal(other.modules[0].enabled, true);
    assert.equal(other.packSummary.effectiveChargePercent, 64);

    const bookings = await Promise.all([1, 2].map(() => instance.request(`${path}/service-events`, 'POST', { date: '2099-12-20', timeSlot: '09:00' })));
    assert.deepEqual(bookings.map(response => response.status).sort(), [201, 409]);
    const scanResponse = await instance.request(`${path}/scans`, 'POST', {});
    assert.equal(scanResponse.status, 201);
    const scanned = await scanResponse.json() as DashboardData;
    assert.equal(scanned.lastScan?.summary.effectiveChargePercent, 59);
    assert.equal(scanned.lastScan?.source, 'sample');
    assert.equal(scanned.notifications[0].read, false);
    assert.equal((await instance.request(`${path}/notifications/read-all`, 'POST', {})).status, 200);

    await instance.close();
    instance = await serve(new DiagnosticStore(filename));
    const saved = await (await instance.request(`${path}/dashboard`)).json() as DashboardData;
    assert.equal(saved.modules[0].enabled, false);
    assert.equal(saved.packSummary.effectiveChargePercent, 59);
    assert.equal(saved.notifications.every(item => item.read), true);
    assert.equal(saved.lastScan?.id, scanned.lastScan?.id);
    const events = saved.eventsByDate['2099-12-20'];
    assert.equal(events.length, 1);
    assert.equal((await instance.request(`/vehicles/bay-01/service-events/${events[0].id}`, 'DELETE', {})).status, 404);
    assert.equal((await instance.request(`${path}/service-events/${events[0].id}`, 'DELETE', {})).status, 200);
    assert.equal((await instance.request(`${path}/service-events/${events[0].id}`, 'DELETE', {})).status, 404);
    assert.equal((await instance.request(`${path}/service-events`, 'POST', { date: '2099-12-20', timeSlot: '09:00' })).status, 201);
  } finally {
    await instance.close();
    rmSync(directory, { recursive: true, force: true });
  }
});

test('API rejects invalid input, missing resources and cross-origin writes without changing data', async () => {
  const instance = await serve(new DiagnosticStore(':memory:'));
  try {
    const path = '/vehicles/bay-03';
    for (const body of [{ enabled: 'false' }, { enabled: false, extra: 1 }, {}, null, []]) {
      const response = await instance.request(`${path}/modules/mod-a3`, 'PATCH', body);
      assert.equal(response.status, 400);
      assert.equal(typeof (await response.json()).error, 'string');
    }
    for (const body of [
      { date: '2026-02-30', timeSlot: '09:00' },
      { date: 'invalid', timeSlot: '09:00' },
      { date: '2026-05-16', timeSlot: '15:00' },
      { date: '2026-05-16', timeSlot: '09:00', title: '<script>' },
    ]) assert.equal((await instance.request(`${path}/service-events`, 'POST', body)).status, 400);
    assert.equal((await instance.request('/vehicles/missing/dashboard')).status, 404);
    assert.equal((await instance.request(`${path}/modules/missing`, 'PATCH', { enabled: false })).status, 404);
    assert.equal((await instance.request('/unknown')).status, 404);
    assert.equal((await instance.request(`${path}/modules/mod-a3`, 'PATCH', { enabled: false }, { Origin: 'https://untrusted.example' })).status, 403);
    assert.equal((await instance.request(`${path}/scans`, 'POST', {}, { 'Content-Type': 'text/plain' })).status, 415);
    assert.equal((await instance.request(`${path}/modules/mod-a3`, 'PATCH', { enabled: false, text: 'x'.repeat(20000) })).status, 413);
    const dashboard = await (await instance.request(`${path}/dashboard`)).json() as DashboardData;
    assert.equal(dashboard.modules[0].enabled, true);
    assert.equal(dashboard.lastScan, null);
  } finally {
    await instance.close();
  }
});
