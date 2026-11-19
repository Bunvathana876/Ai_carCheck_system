import type { DashboardData, ServiceEvent, VehicleProfile } from '@voltguard/shared/diagnostics';
import type {
  DiagnosisSession,
  DiagnosticRule,
  InferenceResult,
  RuleCategory,
  Symptom,
  ValidationStatus,
  VehicleEntity,
} from '@voltguard/shared/expert';

async function request<T>(
  path: string,
  method = 'GET',
  body?: unknown,
  headers?: Record<string, string>,
  signal?: AbortSignal
): Promise<T> {
  const timeout = AbortSignal.timeout(10000);
  const response = await fetch(`/api${path}`, {
    method,
    headers: {
      ...(method !== 'GET' ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
  });

  if (!response.headers.get('content-type')?.includes('application/json')) {
    throw new Error('The API is unavailable. Start both services with npm run dev.');
  }
  const result = await response.json();
  if (!response.ok) throw new Error(result.error ?? `Request failed (${response.status}).`);
  return result as T;
}

const vehiclePath = (id: string) => `/vehicles/${encodeURIComponent(id)}`;

export const api = {
  // --- Voltguard EV Dashboard Endpoints ---
  vehicles: (signal?: AbortSignal) => request<VehicleProfile[]>('/vehicles', 'GET', undefined, undefined, signal),
  dashboard: (id: string, signal?: AbortSignal) =>
    request<DashboardData>(`${vehiclePath(id)}/dashboard`, 'GET', undefined, undefined, signal),
  setModule: (id: string, moduleId: string, enabled: boolean, signal?: AbortSignal) =>
    request<DashboardData>(`${vehiclePath(id)}/modules/${encodeURIComponent(moduleId)}`, 'PATCH', { enabled }, undefined, signal),
  readNotifications: (id: string, signal?: AbortSignal) =>
    request<DashboardData>(`${vehiclePath(id)}/notifications/read-all`, 'POST', {}, undefined, signal),
  schedule: (id: string, date: string, timeSlot: ServiceEvent['timeSlot'], signal?: AbortSignal) =>
    request<DashboardData>(`${vehiclePath(id)}/service-events`, 'POST', { date, timeSlot }, undefined, signal),
  cancelEvent: (id: string, eventId: string, signal?: AbortSignal) =>
    request<DashboardData>(`${vehiclePath(id)}/service-events/${encodeURIComponent(eventId)}`, 'DELETE', {}, undefined, signal),
  scan: (id: string, signal?: AbortSignal) =>
    request<DashboardData>(`${vehiclePath(id)}/scans`, 'POST', {}, undefined, signal),

  // --- Expert System: Vehicles ---
  expertVehicles: {
    list: (signal?: AbortSignal) => request<VehicleEntity[]>('/expert-vehicles', 'GET', undefined, undefined, signal),
    get: (id: string, signal?: AbortSignal) =>
      request<VehicleEntity>(`/expert-vehicles/${encodeURIComponent(id)}`, 'GET', undefined, undefined, signal),
    create: (data: Omit<VehicleEntity, 'id' | 'createdAt'>, signal?: AbortSignal) =>
      request<VehicleEntity>('/expert-vehicles', 'POST', data, undefined, signal),
  },

  // --- Expert System: Symptoms & Rules ---
  symptoms: {
    list: (category?: RuleCategory, signal?: AbortSignal) =>
      request<Symptom[]>(`/symptoms${category ? `?category=${encodeURIComponent(category)}` : ''}`, 'GET', undefined, undefined, signal),
  },
  diagnosticRules: {
    list: (options?: { category?: RuleCategory; status?: ValidationStatus }, signal?: AbortSignal) => {
      const params = new URLSearchParams();
      if (options?.category) params.set('category', options.category);
      if (options?.status) params.set('status', options.status);
      const query = params.toString() ? `?${params.toString()}` : '';
      return request<DiagnosticRule[]>(`/diagnostic-rules${query}`, 'GET', undefined, undefined, signal);
    },
    get: (ruleId: string, signal?: AbortSignal) =>
      request<DiagnosticRule>(`/diagnostic-rules/${encodeURIComponent(ruleId)}`, 'GET', undefined, undefined, signal),
  },

  // --- Expert System: Diagnoses Sessions ---
  diagnoses: {
    start: (vehicleId: string, symptomCodes: string[], signal?: AbortSignal) =>
      request<DiagnosisSession>('/diagnoses', 'POST', { vehicleId, symptomCodes }, undefined, signal),
    get: (id: string, signal?: AbortSignal) =>
      request<DiagnosisSession>(`/diagnoses/${encodeURIComponent(id)}`, 'GET', undefined, undefined, signal),
    answer: (id: string, factCode: string, value: boolean | string | number, unit?: string, signal?: AbortSignal) =>
      request<DiagnosisSession>(`/diagnoses/${encodeURIComponent(id)}/answers`, 'POST', { factCode, value, unit }, undefined, signal),
    results: (id: string, signal?: AbortSignal) =>
      request<InferenceResult>(`/diagnoses/${encodeURIComponent(id)}/results`, 'GET', undefined, undefined, signal),
    history: (vehicleId?: string, signal?: AbortSignal) =>
      request<DiagnosisSession[]>(`/diagnoses/history${vehicleId ? `?vehicleId=${encodeURIComponent(vehicleId)}` : ''}`, 'GET', undefined, undefined, signal),
  },

  // --- Expert System: Admin Knowledge Base ---
  admin: {
    updateRule: (ruleId: string, updates: Partial<DiagnosticRule>, adminKey: string, signal?: AbortSignal) =>
      request<DiagnosticRule>(
        `/admin/rules/${encodeURIComponent(ruleId)}`,
        'PATCH',
        updates,
        { 'x-admin-key': adminKey },
        signal
      ),
    addReview: (
      ruleId: string,
      review: { reviewer: string; reviewerRole: string; status: ValidationStatus; comments: string },
      adminKey: string,
      signal?: AbortSignal
    ) =>
      request<DiagnosticRule>(
        `/admin/rules/${encodeURIComponent(ruleId)}/reviews`,
        'POST',
        review,
        { 'x-admin-key': adminKey },
        signal
      ),
  },
};
