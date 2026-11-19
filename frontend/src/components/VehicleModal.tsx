import { useState } from 'react';
import { X } from 'lucide-react';
import type { PowertrainType, TransmissionType, VehicleEntity } from '@voltguard/shared/expert';

interface VehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (vehicle: Omit<VehicleEntity, 'id' | 'createdAt'>) => Promise<void>;
}

export function VehicleModal({ isOpen, onClose, onSubmit }: VehicleModalProps) {
  const [manufacturer, setManufacturer] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState<number>(2022);
  const [powertrain, setPowertrain] = useState<PowertrainType>('gasoline');
  const [transmission, setTransmission] = useState<TransmissionType>('automatic');
  const [engineType, setEngineType] = useState('');
  const [mileageKm, setMileageKm] = useState<number>(45000);
  const [vin, setVin] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manufacturer.trim() || !model.trim() || !engineType.trim()) {
      setError('Please fill in manufacturer, model, and engine/motor type.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit({
        manufacturer: manufacturer.trim(),
        model: model.trim(),
        year,
        powertrain,
        transmission,
        engineType: engineType.trim(),
        mileageKm,
        vin: vin.trim() ? vin.trim().toUpperCase() : undefined,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to register vehicle.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-200">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold text-slate-900 mb-1">Register Vehicle Profile</h2>
        <p className="text-xs text-slate-500 mb-6">
          Vehicle attributes determine diagnostic rule applicability (combustion vs electric, transmission types).
        </p>

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 p-3 text-xs text-red-700 font-medium border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Manufacturer</label>
              <input
                type="text"
                placeholder="e.g. Toyota, Ford, BMW"
                value={manufacturer}
                onChange={(e) => setManufacturer(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-[#0B5D44] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Model</label>
              <input
                type="text"
                placeholder="e.g. Camry, F-150, Model 3"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-[#0B5D44] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Model Year</label>
              <input
                type="number"
                min="1970"
                max="2030"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                required
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-[#0B5D44] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Powertrain Type</label>
              <select
                value={powertrain}
                onChange={(e) => setPowertrain(e.target.value as PowertrainType)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-[#0B5D44] focus:outline-none bg-white"
              >
                <option value="gasoline">Gasoline (ICE)</option>
                <option value="diesel">Diesel (ICE)</option>
                <option value="hybrid">Hybrid (Gas/Electric)</option>
                <option value="electric">Battery Electric (BEV)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Transmission</label>
              <select
                value={transmission}
                onChange={(e) => setTransmission(e.target.value as TransmissionType)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-[#0B5D44] focus:outline-none bg-white"
              >
                <option value="automatic">Automatic</option>
                <option value="manual">Manual</option>
                <option value="cvt">Continuously Variable (CVT)</option>
                <option value="direct_drive">Direct Drive (Single Speed)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Engine / Motor Displacement</label>
              <input
                type="text"
                placeholder="e.g. 2.5L I4, Dual Motor"
                value={engineType}
                onChange={(e) => setEngineType(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-[#0B5D44] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Current Mileage (km)</label>
              <input
                type="number"
                min="0"
                value={mileageKm}
                onChange={(e) => setMileageKm(Number(e.target.value))}
                required
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-[#0B5D44] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">VIN (Optional)</label>
              <input
                type="text"
                maxLength={17}
                placeholder="17-character VIN"
                value={vin}
                onChange={(e) => setVin(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-[#0B5D44] focus:outline-none uppercase font-mono"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-[#0B5D44] px-5 py-2 text-xs font-semibold text-white hover:bg-[#084533] disabled:opacity-50"
            >
              {submitting ? 'Registering…' : 'Save Vehicle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
