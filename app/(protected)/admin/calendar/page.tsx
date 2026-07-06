// path: app/(protected)/admin/calendar/page.tsx
// Календарь: [День][Неделя][Месяц] toggle, DayView по умолчанию,
// свайп влево/вправо на мобильном = следующий/предыдущий день

'use client';

import { useState, useRef, type TouchEvent } from 'react';
import AdminLayout from '@/components/Layout/AdminLayout';
import DayView from '@/components/Calendar/DayView';
import DatePicker from '@/components/Calendar/DatePicker';
import BookingModal from '@/components/Calendar/BookingModal';
import { type CalendarBooking, toISODate, addDays } from '@/components/Calendar/types';
import { SkeletonBlock } from '@/components/Common/Loading';
import ErrorMessage from '@/components/Common/ErrorMessage';
import Toast, { type ToastType } from '@/components/Common/Toast';
import Card from '@/components/Common/Card';
import { useFetch } from '@/hooks/useFetch';

type CalendarView = 'day' | 'week' | 'month';

const viewLabels: Record<CalendarView, string> = {
  day: 'День',
  week: 'Неделя',
  month: 'Месяц',
};

export default function CalendarPage() {
  const [view, setView] = useState<CalendarView>('day');
  const [date, setDate] = useState(() => toISODate(new Date()));
  const [selected, setSelected] = useState<CalendarBooking | null>(null);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const { data, loading, error, refetch } = useFetch<{ bookings: CalendarBooking[] }>(
    '/api/bookings',
    { params: { from: date, to: date, limit: 100 } }
  );

  // --- swipe навигация (mobile) ---
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  function onTouchStart(e: TouchEvent) {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }

  function onTouchEnd(e: TouchEvent) {
    if (!touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    touchStart.current = null;
    // горизонтальный свайп, не вертикальный скролл
    if (Math.abs(dx) > 60 && Math.abs(dy) < 50) {
      setDate((d) => addDays(d, dx < 0 ? 1 : -1));
    }
  }

  function onBookingChanged(message: string) {
    setSelected(null);
    setToast({ message, type: 'success' });
    void refetch();
  }

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-xl font-semibold text-gray-900">Календарь</h1>

          {/* view toggle */}
          <div role="tablist" aria-label="Вид календаря" className="flex rounded-lg border border-gray-300 bg-white p-0.5">
            {(Object.keys(viewLabels) as CalendarView[]).map((v) => (
              <button
                key={v}
                type="button"
                role="tab"
                aria-selected={view === v}
                onClick={() => setView(v)}
                className={`flex-1 rounded-md px-4 py-1.5 text-sm font-medium transition-colors sm:flex-none ${
                  view === v ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {viewLabels[v]}
              </button>
            ))}
          </div>
        </div>

        <DatePicker date={date} onChange={setDate} />

        {view === 'day' ? (
          <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
            {error ? (
              <ErrorMessage message={error} onRetry={refetch} />
            ) : loading || !data ? (
              <SkeletonBlock height="h-[500px]" />
            ) : (
              <DayView date={date} bookings={data.bookings} onSelectBooking={setSelected} />
            )}
          </div>
        ) : (
          <Card>
            <p className="py-12 text-center text-sm text-gray-500">
              Вид «{viewLabels[view]}» появится в Phase 2 — пока используй «День»
            </p>
          </Card>
        )}
      </div>

      <BookingModal booking={selected} onClose={() => setSelected(null)} onChanged={onBookingChanged} />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </AdminLayout>
  );
}
