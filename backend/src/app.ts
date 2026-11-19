import express, { type ErrorRequestHandler, type Request, type Response, type NextFunction } from 'express';
import { resolve } from 'node:path';
import type { ServiceEvent } from '@voltguard/shared/diagnostics';
import type { PowertrainType, TransmissionType, RuleCategory, ValidationStatus } from '@voltguard/shared/expert';
import { DiagnosticStore } from './store.js';
import { HttpError } from './errors.js';

const slots = new Set(['07:00', '08:00', '09:00', '10:00', '11:00']);
const ADMIN_KEY = process.env.ADMIN_KEY ?? 'carcheck-admin-2026';

function bodyObject(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new HttpError(400, 'A JSON object is required.');
  }
  return body as Record<string, unknown>;
}

function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.get('authorization') ?? '';
  const keyHeader = req.get('x-admin-key');
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : keyHeader;

  if (!token || token !== ADMIN_KEY) {
    return next(new HttpError(401, 'Unauthorized: Valid administrative key required.'));
  }
  next();
}

export function createApp(
  store: DiagnosticStore,
  options: { staticDirectory?: string; allowedOrigins?: string[] } = {}
) {
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

  // =========================================================================
  // SYSTEM HEALTH
  // =========================================================================
  app.get('/api/health', (_req, res) => {
    store.health();
    res.json({
      status: 'ok',
      database: 'sqlite',
      expertSystem: 'active',
      rulesCatalogCount: 50,
      dataSource: 'sample',
    });
  });

  // =========================================================================
  // VOLTGUARD EV DASHBOARD (PRESERVED)
  // =========================================================================
  app.get('/api/vehicles', (_req, res) => res.json(store.listVehicles()));
  app.get('/api/vehicles/:id/dashboard', (req, res) => res.json(store.dashboard(req.params.id)));

  app.patch('/api/vehicles/:id/modules/:moduleId', (req, res) => {
    const body = bodyObject(req.body);
    if (typeof body.enabled !== 'boolean' || Object.keys(body).some((key) => key !== 'enabled')) {
      throw new HttpError(400, 'Provide only an enabled boolean.');
    }
    res.json(store.setModule(req.params.id, req.params.moduleId, body.enabled));
  });

  app.post('/api/vehicles/:id/notifications/read-all', (req, res) =>
    res.json(store.markNotificationsRead(req.params.id))
  );

  app.post('/api/vehicles/:id/service-events', (req, res) => {
    const { date, timeSlot, ...extra } = bodyObject(req.body);
    if (
      Object.keys(extra).length ||
      typeof date !== 'string' ||
      !/^20\d{2}-\d{2}-\d{2}$/.test(date) ||
      !Number.isFinite(Date.parse(date)) ||
      new Date(date).toISOString().slice(0, 10) !== date ||
      typeof timeSlot !== 'string' ||
      !slots.has(timeSlot)
    ) {
      throw new HttpError(
        400,
        'Provide a valid date (YYYY-MM-DD, 2000–2099) and a time slot from 07:00 to 11:00 on the hour.'
      );
    }
    res.status(201).json(store.schedule(req.params.id, date, timeSlot as ServiceEvent['timeSlot']));
  });

  app.delete('/api/vehicles/:id/service-events/:eventId', (req, res) =>
    res.json(store.cancelEvent(req.params.id, req.params.eventId))
  );

  app.post('/api/vehicles/:id/scans', (req, res) => res.status(201).json(store.scan(req.params.id)));

  // =========================================================================
  // EXPERT SYSTEM: VEHICLES
  // =========================================================================
  app.get('/api/expert-vehicles', (_req, res) => {
    res.json(store.listExpertVehicles());
  });

  app.get('/api/expert-vehicles/:id', (req, res) => {
    res.json(store.getExpertVehicle(req.params.id));
  });

  app.post('/api/expert-vehicles', (req, res) => {
    const body = bodyObject(req.body);
    const { manufacturer, model, year, powertrain, transmission, engineType, mileageKm, vin } = body;

    const validPowertrains = ['gasoline', 'diesel', 'hybrid', 'electric'];
    const validTransmissions = ['automatic', 'manual', 'cvt', 'direct_drive'];

    if (
      typeof manufacturer !== 'string' ||
      !manufacturer.trim() ||
      typeof model !== 'string' ||
      !model.trim() ||
      typeof year !== 'number' ||
      year < 1950 ||
      year > 2030 ||
      typeof powertrain !== 'string' ||
      !validPowertrains.includes(powertrain) ||
      typeof transmission !== 'string' ||
      !validTransmissions.includes(transmission) ||
      typeof engineType !== 'string' ||
      !engineType.trim() ||
      typeof mileageKm !== 'number' ||
      mileageKm < 0
    ) {
      throw new HttpError(
        400,
        'Invalid vehicle registration details. Provide manufacturer, model, year (1950-2030), valid powertrain, transmission, engineType, and positive mileage.'
      );
    }

    const created = store.createExpertVehicle({
      manufacturer: manufacturer.trim(),
      model: model.trim(),
      year,
      powertrain: powertrain as PowertrainType,
      transmission: transmission as TransmissionType,
      engineType: engineType.trim(),
      mileageKm,
      vin: typeof vin === 'string' && vin.trim() ? vin.trim().toUpperCase() : undefined,
    });

    res.status(201).json(created);
  });

  // =========================================================================
  // EXPERT SYSTEM: SYMPTOMS
  // =========================================================================
  app.get('/api/symptoms', (req, res) => {
    const category = typeof req.query.category === 'string' ? (req.query.category as RuleCategory) : undefined;
    res.json(store.listSymptoms(category));
  });

  // =========================================================================
  // EXPERT SYSTEM: DIAGNOSTIC RULES
  // =========================================================================
  app.get('/api/diagnostic-rules', (req, res) => {
    const category = typeof req.query.category === 'string' ? (req.query.category as RuleCategory) : undefined;
    const status = typeof req.query.status === 'string' ? (req.query.status as ValidationStatus) : undefined;
    res.json(store.listRules({ category, status }));
  });

  app.get('/api/diagnostic-rules/:id', (req, res) => {
    res.json(store.getRule(req.params.id));
  });

  // =========================================================================
  // EXPERT SYSTEM: DIAGNOSIS SESSIONS & REASONING WORKFLOW
  // =========================================================================
  app.post('/api/diagnoses', (req, res) => {
    const body = bodyObject(req.body);
    const { vehicleId, symptomCodes } = body;

    if (
      typeof vehicleId !== 'string' ||
      !vehicleId.trim() ||
      !Array.isArray(symptomCodes) ||
      symptomCodes.length === 0 ||
      symptomCodes.some((code) => typeof code !== 'string')
    ) {
      throw new HttpError(400, 'Provide vehicleId and non-empty array of symptomCodes.');
    }

    const session = store.startDiagnosisSession(vehicleId.trim(), symptomCodes as string[]);
    res.status(201).json(session);
  });

  app.get('/api/diagnoses/history', (req, res) => {
    const vehicleId = typeof req.query.vehicleId === 'string' ? req.query.vehicleId : undefined;
    res.json(store.listDiagnosisHistory(vehicleId));
  });

  app.get('/api/diagnoses/:id', (req, res) => {
    res.json(store.getDiagnosisSession(req.params.id));
  });

  app.post('/api/diagnoses/:id/answers', (req, res) => {
    const body = bodyObject(req.body);
    const { factCode, value, unit } = body;

    if (
      typeof factCode !== 'string' ||
      !factCode.trim() ||
      value === undefined ||
      (typeof value !== 'boolean' && typeof value !== 'string' && typeof value !== 'number')
    ) {
      throw new HttpError(400, 'Provide factCode and a valid value (boolean, string, or number).');
    }

    const updated = store.submitAnswer(
      req.params.id,
      factCode.trim(),
      value,
      typeof unit === 'string' ? unit : undefined
    );
    res.json(updated);
  });

  app.get('/api/diagnoses/:id/results', (req, res) => {
    const session = store.evaluateDiagnosis(req.params.id);
    res.json(session.latestResult);
  });

  // =========================================================================
  // EXPERT SYSTEM: ADMIN KNOWLEDGE BASE MANAGEMENT
  // =========================================================================
  app.post('/api/admin/rules', requireAdmin, (req, res) => {
    const body = bodyObject(req.body);
    if (!body.ruleId || typeof body.ruleId !== 'string' || !body.title || typeof body.title !== 'string') {
      throw new HttpError(400, 'ruleId and title are required for new rules.');
    }
    // Update or insert rule
    const updated = store.updateRule(body.ruleId as string, body);
    res.status(201).json(updated);
  });

  app.patch('/api/admin/rules/:id', requireAdmin, (req, res) => {
    const body = bodyObject(req.body);
    const ruleId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const updated = store.updateRule(ruleId, body);
    res.json(updated);
  });

  app.post('/api/admin/rules/:id/reviews', requireAdmin, (req, res) => {
    const body = bodyObject(req.body);
    const ruleId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { reviewer, reviewerRole, status, comments } = body;

    const validStatuses = ['DRAFT', 'RESEARCHED', 'EXPERT_REVIEW_PENDING', 'VALIDATED', 'REJECTED'];
    if (
      typeof reviewer !== 'string' ||
      !reviewer.trim() ||
      typeof reviewerRole !== 'string' ||
      typeof status !== 'string' ||
      !validStatuses.includes(status) ||
      typeof comments !== 'string'
    ) {
      throw new HttpError(400, 'Provide reviewer, reviewerRole, valid status, and comments.');
    }

    const reviewedRule = store.addRuleReview(ruleId, {
      reviewer: reviewer.trim(),
      reviewerRole: reviewerRole.trim(),
      status: status as ValidationStatus,
      comments: comments.trim(),
    });

    res.json(reviewedRule);
  });

  // Catch-all 404 for unknown /api routes
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
