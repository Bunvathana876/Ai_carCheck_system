import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import type { AddressInfo } from 'node:net';
import { JSDOM } from 'jsdom';
import { createApp } from '../../backend/src/app';
import { DiagnosticStore } from '../../backend/src/store';

test('frontend loads, retries, saves through HTTP, switches vehicles and restores saved state', async () => {
  const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost:3000', pretendToBeVisual: true });
  for (const key of ['window', 'document', 'navigator', 'HTMLElement', 'Element', 'SVGElement', 'Node', 'MutationObserver'] as const) {
    Object.defineProperty(globalThis, key, { configurable: true, value: dom.window[key] });
  }
  globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
  globalThis.requestAnimationFrame = dom.window.requestAnimationFrame.bind(dom.window);
  globalThis.cancelAnimationFrame = dom.window.cancelAnimationFrame.bind(dom.window);
  Object.defineProperty(dom.window, 'matchMedia', { value: () => ({ matches: true, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} }) });
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

  const { render, fireEvent, waitFor, cleanup } = await import('@testing-library/react');
  const { default: App } = await import('../../frontend/src/App');
  const store = new DiagnosticStore(':memory:');
  const server = createApp(store).listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  const originalFetch = globalThis.fetch;
  let failRead = true;
  let failWrite = false;
  globalThis.fetch = (input, init) => {
    if (failRead) { failRead = false; return Promise.reject(new TypeError('Offline')); }
    if (failWrite && init?.method === 'PATCH') {
      failWrite = false;
      return Promise.resolve(new Response(JSON.stringify({ error: 'Test save failure' }), { status: 500, headers: { 'Content-Type': 'application/json' } }));
    }
    return originalFetch(new URL(String(input), base), init);
  };
  try {
    let view = render(<App />);
    assert.match((await view.findByRole('alert')).textContent ?? '', /Could not reach the server/);
    fireEvent.click(view.getByRole('button', { name: 'Retry connection' }));
    const toggle = await view.findByRole('switch', { name: 'Toggle Module A3' });
    assert.equal(toggle.getAttribute('aria-checked'), 'true');

    failWrite = true;
    fireEvent.click(toggle);
    assert.match((await view.findByRole('alert')).textContent ?? '', /Test save failure/);
    assert.equal(toggle.getAttribute('aria-checked'), 'true');
    assert.equal(store.dashboard('bay-03').modules[0].enabled, true);
    fireEvent.click(view.getByRole('button', { name: 'Refresh data' }));
    await waitFor(() => assert.equal(view.queryByRole('alert'), null));
    await waitFor(() => assert.equal(view.container.querySelector('fieldset')?.disabled, false));
    fireEvent.click(view.getByRole('switch', { name: 'Toggle Module A3' }));
    await waitFor(() => assert.equal(view.getByRole('switch', { name: 'Toggle Module A3' }).getAttribute('aria-checked'), 'false'));
    assert.equal(store.dashboard('bay-03').packSummary.effectiveChargePercent, 59);
    assert.ok(view.getByText('59%'));

    fireEvent.click(view.getByRole('button', { name: 'Schedule diagnostic check at 09:00' }));
    await view.findByText('Thermal & HV isolation check');
    const date = store.dashboard('bay-03').initialDate;
    assert.equal(store.dashboard('bay-03').eventsByDate[date].filter(event => event.timeSlot === '09:00').length, 1);
    fireEvent.click(view.getByRole('button', { name: 'Demo Battery Scan' }));
    await view.findByText(/Last sample scan:/);
    assert.equal(store.dashboard('bay-03').lastScan?.summary.effectiveChargePercent, 59);
    fireEvent.click(view.getByRole('button', { name: /Notifications \(/ }));
    fireEvent.click(await view.findByRole('button', { name: 'Mark all read' }));
    await view.findByRole('button', { name: 'Notifications (0 unread)' });
    assert.equal(store.dashboard('bay-03').notifications.every(item => item.read), true);

    fireEvent.click(view.getByRole('button', { name: 'Switch workshop bay' }));
    fireEvent.click(await view.findByRole('button', { name: 'Workshop Bay 01 · VIN VG24-EV-714082' }));
    await view.findByText('64%');
    assert.equal(view.getByRole('switch', { name: 'Toggle Module A3' }).getAttribute('aria-checked'), 'true');

    cleanup();
    view = render(<App />);
    await view.findByText('59%');
    await view.findByText(/Last sample scan:/);
    await view.findByRole('button', { name: 'Notifications (0 unread)' });
    fireEvent.click(view.getByRole('button', { name: 'Cancel Thermal & HV isolation check at 09:00' }));
    await view.findByRole('button', { name: 'Schedule diagnostic check at 09:00' });
    assert.equal(store.dashboard('bay-03').eventsByDate[date].some(event => event.timeSlot === '09:00'), false);
  } finally {
    cleanup();
    globalThis.fetch = originalFetch;
    const closed = once(server, 'close');
    server.close();
    server.closeAllConnections();
    await closed;
    store.close();
    dom.window.close();
  }
});
