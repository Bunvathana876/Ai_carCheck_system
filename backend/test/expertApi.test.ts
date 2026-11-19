import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import type { AddressInfo } from 'node:net';
import { createApp } from '../src/app.js';
import { DiagnosticStore } from '../src/store.js';
import type { DiagnosisSession, DiagnosticRule, VehicleEntity } from '@voltguard/shared/expert';

async function serve(store: DiagnosticStore) {
  const server = createApp(store).listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  return {
    request: (path: string, method = 'GET', body?: unknown, headers: Record<string, string> = {}) =>
      fetch(`${base}/api${path}`, {
        method,
        headers: { 'Content-Type': 'application/json', ...headers },
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

test('EXPERT API: vehicle management, symptom retrieval, and rules catalog', async () => {
  const store = new DiagnosticStore(':memory:');
  const api = await serve(store);

  try {
    // 1. Health check
    const healthRes = await api.request('/health');
    assert.equal(healthRes.status, 200);
    const health = await healthRes.json();
    assert.equal(health.expertSystem, 'active');
    assert.equal(health.rulesCatalogCount, 50);

    // 2. List vehicles
    const vehiclesRes = await api.request('/expert-vehicles');
    assert.equal(vehiclesRes.status, 200);
    const vehicles = (await vehiclesRes.json()) as VehicleEntity[];
    assert.ok(vehicles.length >= 5);
    assert.ok(vehicles.some((v) => v.powertrain === 'electric'));
    assert.ok(vehicles.some((v) => v.powertrain === 'diesel'));
    assert.ok(vehicles.some((v) => v.powertrain === 'gasoline'));
    assert.ok(vehicles.some((v) => v.powertrain === 'hybrid'));

    // 3. Create a new vehicle
    const newVehRes = await api.request('/expert-vehicles', 'POST', {
      manufacturer: 'Subaru',
      model: 'Outback',
      year: 2022,
      powertrain: 'gasoline',
      transmission: 'cvt',
      engineType: '2.5L Boxer 4',
      mileageKm: 34000,
    });
    assert.equal(newVehRes.status, 201);
    const createdVeh = (await newVehRes.json()) as VehicleEntity;
    assert.equal(createdVeh.manufacturer, 'Subaru');
    assert.ok(createdVeh.id.startsWith('veh-'));

    // 4. Symptoms
    const symRes = await api.request('/symptoms');
    assert.equal(symRes.status, 200);
    const symptoms = await symRes.json();
    assert.ok(symptoms.length > 20);

    // 5. Rules Catalog
    const rulesRes = await api.request('/diagnostic-rules');
    assert.equal(rulesRes.status, 200);
    const rules = (await rulesRes.json()) as DiagnosticRule[];
    assert.equal(rules.length, 50);

    // Filter rules by category
    const brakeRulesRes = await api.request('/diagnostic-rules?category=BRAKING');
    assert.equal(brakeRulesRes.status, 200);
    const brakeRules = (await brakeRulesRes.json()) as DiagnosticRule[];
    assert.equal(brakeRules.length, 5);

    // Single rule retrieval
    const ruleBR01Res = await api.request('/diagnostic-rules/BR01');
    assert.equal(ruleBR01Res.status, 200);
    const ruleBR01 = (await ruleBR01Res.json()) as DiagnosticRule;
    assert.equal(ruleBR01.ruleId, 'BR01');
    assert.equal(ruleBR01.category, 'BRAKING');
  } finally {
    await api.close();
  }
});

test('EXPERT API: full diagnosis session lifecycle with interactive question answering', async () => {
  const store = new DiagnosticStore(':memory:');
  const api = await serve(store);

  try {
    // Start diagnosis on Gasoline car (bay-01) with slow crank symptom
    const startRes = await api.request('/diagnoses', 'POST', {
      vehicleId: 'bay-01',
      symptomCodes: ['SYM_SLOW_CRANK'],
    });
    assert.equal(startRes.status, 201);
    const session = (await startRes.json()) as DiagnosisSession;
    assert.ok(session.id.startsWith('diag-'));
    assert.equal(session.status, 'ACTIVE');
    assert.ok(session.latestResult);
    assert.ok(session.latestResult.hypotheses.some((h) => h.ruleId === 'EL01'));

    // Submit answer to low resting battery voltage
    const answerRes = await api.request(`/diagnoses/${session.id}/answers`, 'POST', {
      factCode: 'battery_resting_voltage_v',
      value: 11.9,
      unit: 'V',
    });
    assert.equal(answerRes.status, 200);
    const updatedSession = (await answerRes.json()) as DiagnosisSession;
    assert.ok(updatedSession.facts.battery_resting_voltage_v);

    const matchEL01 = updatedSession.latestResult?.hypotheses.find((h) => h.ruleId === 'EL01');
    assert.ok(matchEL01);
    assert.ok(matchEL01.ruleMatchScore >= 70);

    // Retrieve results directly
    const resultsRes = await api.request(`/diagnoses/${session.id}/results`);
    assert.equal(resultsRes.status, 200);
    const results = await resultsRes.json();
    assert.equal(results.sessionId, session.id);

    // History listing
    const historyRes = await api.request('/diagnoses/history');
    assert.equal(historyRes.status, 200);
    const history = (await historyRes.json()) as DiagnosisSession[];
    assert.ok(history.length >= 1);
    assert.equal(history[0].id, session.id);
  } finally {
    await api.close();
  }
});

test('EXPERT API: admin endpoints enforce authentication and authorize rule reviews', async () => {
  const store = new DiagnosticStore(':memory:');
  const api = await serve(store);

  try {
    // 1. Propose rule without auth -> 401
    const unauthRes = await api.request('/admin/rules', 'POST', {
      ruleId: 'TEST99',
      title: 'Unauthorized Rule',
    });
    assert.equal(unauthRes.status, 401);

    // 2. Submit rule review without auth -> 401
    const unauthReviewRes = await api.request('/admin/rules/EL04/reviews', 'POST', {
      reviewer: 'Test Engineer',
      reviewerRole: 'Auditor',
      status: 'VALIDATED',
      comments: 'Test approval',
    });
    assert.equal(unauthReviewRes.status, 401);

    // 3. Submit rule review WITH admin key -> 200
    const authReviewRes = await api.request(
      '/admin/rules/EL04/reviews',
      'POST',
      {
        reviewer: 'Senior Master Tech',
        reviewerRole: 'ASE Certified Master Automobile Technician',
        status: 'VALIDATED',
        comments: 'Verified against OEM starter wiring interlock schematics.',
      },
      { 'x-admin-key': 'carcheck-admin-2026' }
    );
    assert.equal(authReviewRes.status, 200);
    const updatedRule = (await authReviewRes.json()) as DiagnosticRule;
    assert.equal(updatedRule.validationStatus, 'VALIDATED');
    assert.equal(updatedRule.reviewedBy, 'Senior Master Tech');

    // 4. Verify review persists in public rule endpoint
    const publicRuleRes = await api.request('/diagnostic-rules/EL04');
    assert.equal(publicRuleRes.status, 200);
    const publicRule = (await publicRuleRes.json()) as DiagnosticRule;
    assert.equal(publicRule.validationStatus, 'VALIDATED');
  } finally {
    await api.close();
  }
});
