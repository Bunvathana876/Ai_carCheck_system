import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import type { AddressInfo } from 'node:net';
import { JSDOM } from 'jsdom';
import { createApp } from '../../backend/src/app.js';
import { DiagnosticStore } from '../../backend/src/store.js';

test('EXPERT DIAGNOSIS INTEGRATION: full user journey through symptoms, inference, questions, and knowledge base', async () => {
  const dom = new JSDOM('<!doctype html><html><body></body></html>', {
    url: 'http://localhost:3000',
    pretendToBeVisual: true,
  });

  for (const key of ['window', 'document', 'navigator', 'HTMLElement', 'Element', 'SVGElement', 'Node', 'MutationObserver'] as const) {
    Object.defineProperty(globalThis, key, { configurable: true, value: dom.window[key] });
  }
  globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
  globalThis.requestAnimationFrame = dom.window.requestAnimationFrame.bind(dom.window);
  globalThis.cancelAnimationFrame = dom.window.cancelAnimationFrame.bind(dom.window);
  Object.defineProperty(dom.window, 'matchMedia', {
    value: () => ({ matches: true, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} }),
  });
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

  const { render, fireEvent, waitFor, cleanup } = await import('@testing-library/react');
  const { default: App } = await import('../../frontend/src/App.js');
  const store = new DiagnosticStore(':memory:');
  const server = createApp(store).listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

  const originalFetch = globalThis.fetch;
  globalThis.fetch = (input, init) => {
    return originalFetch(new URL(String(input), base), init);
  };

  try {
    const view = render(<App />);

    // Wait for initial load
    await view.findByText('Ai CarCheck');

    // Switch to "Expert Diagnosis" tab
    const expertTabBtn = view.getByRole('button', { name: /Expert Diagnosis/ });
    fireEvent.click(expertTabBtn);

    // Verify Active Test Vehicle is visible
    await view.findByText('Active Test Vehicle');
    await view.findByText(/Step 1: Select Observed Symptoms/);

    // Find and select a symptom checkbox (e.g. Engine cranks very slowly)
    const slowCrankCheckbox = await view.findByLabelText(/Engine cranks very slowly/);
    fireEvent.click(slowCrankCheckbox);

    // Click "Start Diagnosis"
    const startBtn = view.getByRole('button', { name: /Start Diagnosis/ });
    fireEvent.click(startBtn);

    // Should transition to Step 2: Diagnostic Questions
    await view.findByText(/Diagnostic Follow-Up Question/);

    // Submit answer or skip to results
    const skipBtn = view.getByRole('button', { name: /Skip this question/ });
    fireEvent.click(skipBtn);

    // Now switch to Knowledge Base tab
    const kbTabBtn = view.getByRole('button', { name: /Knowledge Base \(50 Rules\)/ });
    fireEvent.click(kbTabBtn);

    await view.findByText(/Knowledge Base: 50 Diagnostic Rules/);
    await view.findByText('All 50 Rules');
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
