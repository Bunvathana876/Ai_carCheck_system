import type { DashboardData, ServiceEvent, VehicleProfile } from '@voltguard/shared/diagnostics';

async function request<T>(path: string, method = 'GET', body?: unknown, signal?: AbortSignal): Promise<T> {
  const timeout = AbortSignal.timeout(10000);
  const response = await fetch(`/api${path}`, {
    method,
    headers: method === 'GET' ? undefined : { 'Content-Type': 'application/json' },
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
  vehicles: (signal?: AbortSignal) => request<VehicleProfile[]>('/vehicles', 'GET', undefined, signal),
  dashboard: (id: string, signal?: AbortSignal) => request<DashboardData>(`${vehiclePath(id)}/dashboard`, 'GET', undefined, signal),
  setModule: (id: string, moduleId: string, enabled: boolean, signal?: AbortSignal) =>
    request<DashboardData>(`${vehiclePath(id)}/modules/${encodeURIComponent(moduleId)}`, 'PATCH', { enabled }, signal),
  readNotifications: (id: string, signal?: AbortSignal) => request<DashboardData>(`${vehiclePath(id)}/notifications/read-all`, 'POST', {}, signal),
  schedule: (id: string, date: string, timeSlot: ServiceEvent['timeSlot'], signal?: AbortSignal) =>
    request<DashboardData>(`${vehiclePath(id)}/service-events`, 'POST', { date, timeSlot }, signal),
  cancelEvent: (id: string, eventId: string, signal?: AbortSignal) =>
    request<DashboardData>(`${vehiclePath(id)}/service-events/${encodeURIComponent(eventId)}`, 'DELETE', {}, signal),
  scan: (id: string, signal?: AbortSignal) => request<DashboardData>(`${vehiclePath(id)}/scans`, 'POST', {}, signal),
};
