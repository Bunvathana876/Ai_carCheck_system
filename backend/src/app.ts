import express, { type ErrorRequestHandler } from 'express';
import { resolve } from 'node:path';
import type { ServiceEvent } from '@voltguard/shared/diagnostics';
import { DiagnosticStore } from './store.js';
import { HttpError } from './errors.js';

const slots = new Set(['07:00', '08:00', '09:00', '10:00', '11:00']);

function bodyObject(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new HttpError(400, 'A JSON object is required.');
  return body as Record<string, unknown>;
}

export function createApp(store: DiagnosticStore, options: { staticDirectory?: string; allowedOrigins?: string[] } = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.use('/api', (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    res.set('X-Content-Type-Options', 'nosniff');
    const origin = req.get('origin');
    const allowed = options.allowedOrigins ?? ['http://127.0.0.1:3000', 'http://localhost:3000'];
    if (origin && origin !== `${req.protocol}://${req.get('host')}` && !allowed.includes(origin)) {
      return next(new HttpError(403, 'Origin is not allowed.'));
    }
    if (['POST', 'PATCH', 'DELETE'].includes(req.method) && !req.is('application/json')) {
      return next(new HttpError(415, 'Use Content-Type: application/json.'));
    }
    next();
  });
  app.use('/api', express.json({ limit: '16kb' }));
  app.get('/api/health', (_req, res) => {
    store.health();
    res.json({ status: 'ok', database: 'sqlite', dataSource: 'sample' });
  });
  app.get('/api/vehicles', (_req, res) => res.json(store.listVehicles()));
  app.get('/api/vehicles/:id/dashboard', (req, res) => res.json(store.dashboard(req.params.id)));
  app.patch('/api/vehicles/:id/modules/:moduleId', (req, res) => {
    const body = bodyObject(req.body);
    if (typeof body.enabled !== 'boolean' || Object.keys(body).some(key => key !== 'enabled')) {
      throw new HttpError(400, 'Provide only an enabled boolean.');
    }
    res.json(store.setModule(req.params.id, req.params.moduleId, body.enabled));
  });
  app.post('/api/vehicles/:id/notifications/read-all', (req, res) => res.json(store.markNotificationsRead(req.params.id)));
  app.post('/api/vehicles/:id/service-events', (req, res) => {
    const { date, timeSlot, ...extra } = bodyObject(req.body);
    if (Object.keys(extra).length || typeof date !== 'string' || !/^20\d{2}-\d{2}-\d{2}$/.test(date) ||
        !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date ||
        typeof timeSlot !== 'string' || !slots.has(timeSlot)) {
      throw new HttpError(400, 'Provide a valid date (YYYY-MM-DD, 2000–2099) and a time slot from 07:00 to 11:00 on the hour.');
    }
    res.status(201).json(store.schedule(req.params.id, date, timeSlot as ServiceEvent['timeSlot']));
  });
  app.delete('/api/vehicles/:id/service-events/:eventId', (req, res) => res.json(store.cancelEvent(req.params.id, req.params.eventId)));
  app.post('/api/vehicles/:id/scans', (req, res) => res.status(201).json(store.scan(req.params.id)));
  app.use('/api', (_req, _res, next) => next(new HttpError(404, 'API route not found.')));
  if (options.staticDirectory) app.use(express.static(resolve(options.staticDirectory)));
  app.use((_req, res) => res.status(404).json({ error: 'Not found.' }));
  const errors: ErrorRequestHandler = (error, _req, res, _next) => {
    if (error instanceof HttpError) return void res.status(error.status).json({ error: error.message });
    if (error.type === 'entity.parse.failed') return void res.status(400).json({ error: 'Invalid JSON body.' });
    if (error.type === 'entity.too.large') return void res.status(413).json({ error: 'Request body is too large.' });
    console.error('API request failed:', error);
    res.status(500).json({ error: 'The server could not complete the request. Please try again.' });
  };
  app.use(errors);
  return app;
}
