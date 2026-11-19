import { useEffect, useRef, useState } from 'react';
import type { DashboardData, VehicleProfile } from '@voltguard/shared/diagnostics';
import { api } from '../lib/api';

export function useDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [vehicles, setVehicles] = useState<VehicleProfile[]>([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pending = useRef<AbortController | null>(null);

  async function run(operation: (signal: AbortSignal) => Promise<DashboardData>) {
    if (pending.current) return;
    const controller = new AbortController();
    pending.current = controller;
    setBusy(true);
    setError(null);
    try {
      const next = await operation(controller.signal);
      if (!controller.signal.aborted) setData(next);
    } catch (reason) {
      if (!controller.signal.aborted) {
        setError(reason instanceof Error && reason.name !== 'TypeError' && reason.name !== 'TimeoutError'
          ? reason.message : 'Could not reach the server. Check the connection and retry.');
      }
    } finally {
      if (pending.current === controller) {
        pending.current = null;
        setBusy(false);
      }
    }
  }

  function load(id?: string) {
    return run(async signal => {
      const profiles = await api.vehicles(signal);
      const selected = id ?? profiles[0]?.id;
      if (!selected) throw new Error('No vehicles are available.');
      const dashboard = await api.dashboard(selected, signal);
      if (!signal.aborted) setVehicles(profiles);
      return dashboard;
    });
  }

  useEffect(() => {
    void load();
    return () => {
      pending.current?.abort();
      pending.current = null;
    };
  }, []);

  return { data, vehicles, busy, error, load, run };
}
