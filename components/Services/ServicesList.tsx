// path: components/Services/ServicesList.tsx
// Список услуг: таблица (desktop) / карточки (mobile), delete с подтверждением

'use client';

import { useState } from 'react';
import Card from '@/components/Common/Card';
import { useApi } from '@/hooks/useApi';

export interface Service {
  id: string;
  name: string;
  duration_minutes: number;
  price: string | number;
  description: string | null;
  photo_url: string | null;
  created_at: string;
}

interface ServicesListProps {
  services: Service[];
  onEdit: (service: Service) => void;
  onDeleted: (message: string) => void;
  onError: (message: string) => void;
}

function formatDuration(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

export default function ServicesList({ services, onEdit, onDeleted, onError }: ServicesListProps) {
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const { request, loading } = useApi<{ success: boolean }>();

  async function onDelete(id: string) {
    if (confirmId !== id) {
      setConfirmId(id);
      return;
    }
    const result = await request(`/api/services/${id}`, { method: 'DELETE' });
    setConfirmId(null);
    if (result) onDeleted('Service deleted');
    // 409 = у услуги есть букинги, текст придёт с бэкенда
  }

  if (services.length === 0) {
    return (
      <Card>
        <p className="py-8 text-center text-sm text-gray-500">
          No services yet — add your first one so clients can book
        </p>
      </Card>
    );
  }

  const actions = (s: Service) => (
    <div className="flex shrink-0 gap-1.5">
      <button
        type="button"
        onClick={() => onEdit(s)}
        className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium
          text-gray-700 transition-colors hover:bg-gray-100"
      >
        Edit
      </button>
      <button
        type="button"
        onClick={() => onDelete(s.id)}
        disabled={loading}
        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
          confirmId === s.id
            ? 'bg-red-600 text-white hover:bg-red-700'
            : 'text-red-600 hover:bg-red-50'
        }`}
      >
        {confirmId === s.id ? 'Sure?' : 'Delete'}
      </button>
    </div>
  );

  return (
    <>
      {/* desktop */}
      <Card noPadding className="hidden md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500">
              <th className="px-4 py-3 font-medium">Service</th>
              <th className="px-4 py-3 font-medium">Duration</th>
              <th className="px-4 py-3 text-right font-medium">Price</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {services.map((s) => (
              <tr key={s.id} className="transition-colors hover:bg-gray-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{s.name}</p>
                  {s.description && (
                    <p className="mt-0.5 max-w-md truncate text-xs text-gray-500">{s.description}</p>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-700">{formatDuration(s.duration_minutes)}</td>
                <td className="px-4 py-3 text-right font-medium text-gray-900">
                  €{Number(s.price).toFixed(2)}
                </td>
                <td className="px-4 py-3 text-right">{actions(s)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* mobile */}
      <ul className="space-y-2 md:hidden">
        {services.map((s) => (
          <li key={s.id} className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
            <div className="mb-2 flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-gray-900">{s.name}</p>
                <p className="text-xs text-gray-500">{formatDuration(s.duration_minutes)}</p>
              </div>
              <span className="shrink-0 text-sm font-semibold text-gray-900">
                €{Number(s.price).toFixed(2)}
              </span>
            </div>
            {actions(s)}
          </li>
        ))}
      </ul>
    </>
  );
}
