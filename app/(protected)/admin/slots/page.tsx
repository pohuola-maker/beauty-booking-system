// path: app/(protected)/admin/slots/page.tsx
// Time slots: one-tap generation (today / 7 days / 30 days, 08:00–21:00)
// + upcoming slots list grouped by date, mobile-first

'use client';

import { useState } from 'react';
import AdminLayout from '@/components/Layout/AdminLayout';
import Card from '@/components/Common/Card';
import Button from '@/components/Common/Button';
import Select from '@/components/Common/Select';
import Input from '@/components/Common/Input';
import ErrorMessage from '@/components/Common/ErrorMessage';
import Toast, { type ToastType } from '@/components/Common/Toast';
import Pagination from '@/components/Common/Pagination';
import { SkeletonRows } from '@/components/Common/Loading';
import { useFetch, type Pagination as PaginationInfo } from '@/hooks/useFetch';
import { useApi } from '@/hooks/useApi';
import { toISODate, addDays } from '@/components/Calendar/types';

interface TimeSlot {
  id: string;
  date: string;
  start_time: string;
  duration_minutes: number;
  available: boolean;
}

interface SlotInput {
  date: string;
  start_time: string;
  duration_minutes: number;
}

type RangePreset = 'today' | 'week' | 'month';

const rangeLabels: Record<RangePreset, { label: string; days: number }> = {
  today: { label: 'Today', days: 1 },
  week: { label: '7 days', days: 7 },
  month: { label: '30 days', days: 30 },
};

const lengthOptions = ['30', '45', '60', '90', '120', '150'].map((v) => ({
  value: v,
  label: `${v} min`,
}));

function buildSlots(days: number, from: string, to: string, lengthMin: number): SlotInput[] {
  const [fromH, fromM] = from.split(':').map(Number);
  const [toH, toM] = to.split(':').map(Number);
  const startMin = fromH * 60 + fromM;
  const endMin = toH * 60 + toM;
  const today = toISODate(new Date());

  const slots: SlotInput[] = [];
  for (let d = 0; d < days; d++) {
    const date = addDays(today, d);
    for (let t = startMin; t + lengthMin <= endMin; t += lengthMin) {
      const h = String(Math.floor(t / 60)).padStart(2, '0');
      const m = String(t % 60).padStart(2, '0');
      slots.push({ date, start_time: `${h}:${m}`, duration_minutes: lengthMin });
    }
  }
  return slots;
}

export default function SlotsPage() {
  const [range, setRange] = useState<RangePreset>('week');
  const [fromTime, setFromTime] = useState('08:00');
  const [toTime, setToTime] = useState('21:00');
  const [slotLength, setSlotLength] = useState('60');
  const [generating, setGenerating] = useState(false);
  const [page, setPage] = useState(1);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const list = useFetch<{ time_slots: TimeSlot[]; pagination: PaginationInfo }>(
    '/api/time-slots',
    { params: { from: toISODate(new Date()), page, limit: 100 } }
  );

  const api = useApi<{ created: number; requested: number }>();
  const remove = useApi<{ success: boolean }>();

  async function generate() {
    if (fromTime >= toTime) {
      setToast({ message: 'Start time must be before end time', type: 'error' });
      return;
    }

    setGenerating(true);
    const slots = buildSlots(rangeLabels[range].days, fromTime, toTime, Number(slotLength));

    // API принимает максимум 100 слотов за запрос — шлём чанками
    let created = 0;
    let failed = false;
    for (let i = 0; i < slots.length; i += 100) {
      const result = await api.request('/api/time-slots', {
        method: 'POST',
        body: { slots: slots.slice(i, i + 100) },
      });
      if (!result) {
        failed = true;
        break;
      }
      created += result.created;
    }
    setGenerating(false);

    if (failed) {
      setToast({ message: api.error ?? 'Failed to generate slots', type: 'error' });
    } else {
      const skipped = slots.length - created;
      setToast({
        message: `Created ${created} slots${skipped > 0 ? `, ${skipped} already existed` : ''}`,
        type: 'success',
      });
      void list.refetch();
    }
  }

  async function deleteSlot(id: string) {
    if (confirmId !== id) {
      setConfirmId(id);
      return;
    }
    const result = await remove.request(`/api/time-slots/${id}`, { method: 'DELETE' });
    setConfirmId(null);
    if (result) {
      setToast({ message: 'Slot deleted', type: 'success' });
      void list.refetch();
    } else if (remove.error) {
      setToast({ message: remove.error, type: 'error' });
    }
  }

  // группировка по дате
  const grouped = new Map<string, TimeSlot[]>();
  for (const slot of list.data?.time_slots ?? []) {
    const arr = grouped.get(slot.date) ?? [];
    arr.push(slot);
    grouped.set(slot.date, arr);
  }

  return (
    <AdminLayout>
      <div className="space-y-4">
        <h1 className="text-xl font-semibold text-gray-900">Time slots</h1>

        {/* генератор */}
        <Card>
          <h2 className="mb-3 text-sm font-semibold text-gray-900">Generate slots</h2>

          <div className="space-y-3">
            <div>
              <p className="mb-1.5 text-sm font-medium text-gray-700">Period</p>
              <div className="flex gap-2">
                {(Object.keys(rangeLabels) as RangePreset[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRange(r)}
                    aria-pressed={range === r}
                    className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                      range === r
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {rangeLabels[r].label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Input
                label="From"
                type="time"
                value={fromTime}
                onChange={(e) => setFromTime(e.target.value)}
              />
              <Input
                label="To"
                type="time"
                value={toTime}
                onChange={(e) => setToTime(e.target.value)}
              />
              <Select
                label="Slot length"
                value={slotLength}
                onChange={(e) => setSlotLength(e.target.value)}
                options={lengthOptions}
              />
            </div>

            <Button fullWidth loading={generating} onClick={generate}>
              Generate {rangeLabels[range].label.toLowerCase()} · {fromTime}–{toTime}
            </Button>
          </div>
        </Card>

        {/* список слотов */}
        <div>
          <h2 className="mb-2 text-sm font-semibold text-gray-900">Upcoming slots</h2>

          {list.error ? (
            <ErrorMessage message={list.error} onRetry={list.refetch} />
          ) : list.loading || !list.data ? (
            <Card>
              <SkeletonRows rows={6} />
            </Card>
          ) : grouped.size === 0 ? (
            <Card>
              <p className="py-8 text-center text-sm text-gray-500">
                No upcoming slots — generate some above so clients can be booked
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {Array.from(grouped.entries()).map(([date, slots]) => (
                <Card key={date} className="p-3">
                  <p className="mb-2 text-sm font-semibold capitalize text-gray-900">
                    {formatDate(date)}
                    <span className="ml-2 text-xs font-normal text-gray-500">
                      {slots.filter((s) => s.available).length} free / {slots.length}
                    </span>
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {slots.map((s) => (
                      <span
                        key={s.id}
                        className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-medium ${
                          s.available
                            ? 'border-green-200 bg-green-50 text-green-800'
                            : 'border-gray-200 bg-gray-100 text-gray-500'
                        }`}
                      >
                        {s.start_time.slice(0, 5)}
                        {s.available ? (
                          <button
                            type="button"
                            onClick={() => deleteSlot(s.id)}
                            disabled={remove.loading}
                            aria-label={`Delete slot ${s.start_time.slice(0, 5)}`}
                            className={`rounded px-0.5 leading-none ${
                              confirmId === s.id
                                ? 'bg-red-600 text-white'
                                : 'text-green-700 hover:text-red-600'
                            }`}
                          >
                            {confirmId === s.id ? '✓?' : '×'}
                          </button>
                        ) : (
                          <span aria-label="Booked">●</span>
                        )}
                      </span>
                    ))}
                  </div>
                </Card>
              ))}

              <Pagination
                page={list.data.pagination.page}
                limit={list.data.pagination.limit}
                total={list.data.pagination.total}
                onPageChange={setPage}
              />
            </div>
          )}
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </AdminLayout>
  );
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Intl.DateTimeFormat('en-IE', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
  }).format(new Date(y, m - 1, d));
}
