// path: components/Calendar/DayView.tsx
// Дневная временная шкала 07:00–20:00 (Google Calendar style):
// линии каждые 30 мин, букинги позиционируются абсолютно по времени и длительности,
// красная линия — текущее время (если открыт сегодняшний день).

'use client';

import { useEffect, useState } from 'react';
import {
  type CalendarBooking,
  type BookingStatus,
  STATUS_LABELS,
  timeToMinutes,
  toISODate,
} from './types';

const DAY_START = 7 * 60; // 07:00
const DAY_END = 20 * 60; // 20:00
const SLOT_MIN = 30;
const ROW_H = 52; // px на 30 минут

const statusBlockStyles: Record<BookingStatus, string> = {
  pending: 'bg-yellow-100 border-yellow-300 hover:bg-yellow-200',
  confirmed: 'bg-green-100 border-green-300 hover:bg-green-200',
  cancelled: 'bg-red-100 border-red-300 opacity-50 hover:opacity-70',
};

const statusDotStyles: Record<BookingStatus, string> = {
  pending: 'bg-yellow-500',
  confirmed: 'bg-green-600',
  cancelled: 'bg-red-500',
};

interface DayViewProps {
  date: string; // YYYY-MM-DD
  bookings: CalendarBooking[];
  onSelectBooking: (booking: CalendarBooking) => void;
}

export default function DayView({ date, bookings, onSelectBooking }: DayViewProps) {
  const rows = (DAY_END - DAY_START) / SLOT_MIN;
  const totalHeight = rows * ROW_H;
  const isToday = date === toISODate(new Date());

  // позиция красной линии "сейчас" — обновляется раз в минуту
  const [nowMinutes, setNowMinutes] = useState(() => currentMinutes());
  useEffect(() => {
    const timer = setInterval(() => setNowMinutes(currentMinutes()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const visible = bookings.filter((b) => b.time_slots);

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      {visible.length === 0 && (
        <p className="border-b border-gray-100 px-4 py-3 text-center text-sm text-gray-500">
          No bookings for this day
        </p>
      )}

      <div className="relative" style={{ height: totalHeight }}>
        {/* сетка: линия каждые 30 мин, подпись каждый час */}
        {Array.from({ length: rows + 1 }).map((_, i) => {
          const minutes = DAY_START + i * SLOT_MIN;
          const isHour = minutes % 60 === 0;
          return (
            <div
              key={minutes}
              className={`absolute inset-x-0 border-t ${isHour ? 'border-gray-200' : 'border-gray-100'}`}
              style={{ top: i * ROW_H }}
            >
              {isHour && (
                <span className="absolute -top-2.5 left-2 bg-white pr-1 text-xs font-medium text-gray-400">
                  {String(minutes / 60).padStart(2, '0')}:00
                </span>
              )}
            </div>
          );
        })}

        {/* красная линия текущего времени */}
        {isToday && nowMinutes >= DAY_START && nowMinutes <= DAY_END && (
          <div
            className="pointer-events-none absolute inset-x-0 z-20 flex items-center"
            style={{ top: ((nowMinutes - DAY_START) / SLOT_MIN) * ROW_H }}
            aria-hidden="true"
          >
            <span className="ml-12 h-2 w-2 rounded-full bg-red-500" />
            <span className="h-px flex-1 bg-red-500" />
          </div>
        )}

        {/* букинги */}
        {visible.map((b) => {
          const slot = b.time_slots!;
          const start = Math.max(timeToMinutes(slot.start_time), DAY_START);
          const duration = b.services?.duration_minutes ?? slot.duration_minutes;
          const end = Math.min(start + duration, DAY_END);
          const top = ((start - DAY_START) / SLOT_MIN) * ROW_H + 1;
          const height = Math.max(((end - start) / SLOT_MIN) * ROW_H - 3, 26);
          const compact = height < 48;

          return (
            <button
              key={b.id}
              type="button"
              onClick={() => onSelectBooking(b)}
              style={{ top, height }}
              aria-label={`${slot.start_time.slice(0, 5)}, ${b.client_name}, ${
                b.services?.name ?? ''
              }, ${STATUS_LABELS[b.status]}`}
              className={`absolute left-14 right-2 z-10 overflow-hidden rounded-lg border-l-4 px-2.5
                text-left transition-colors focus-visible:outline-none focus-visible:ring-2
                focus-visible:ring-blue-600 sm:left-16 ${statusBlockStyles[b.status]}
                ${compact ? 'py-0.5' : 'py-1.5'}`}
            >
              <span className={`flex items-center gap-1.5 ${compact ? '' : 'mb-0.5'}`}>
                <span
                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${statusDotStyles[b.status]}`}
                  aria-hidden="true"
                />
                <span className="text-xs font-semibold text-gray-900">
                  {slot.start_time.slice(0, 5)}
                </span>
                <span className="truncate text-xs font-medium text-gray-900">{b.client_name}</span>
                {b.no_show && (
                  <span className="shrink-0 rounded bg-gray-800 px-1 text-[10px] font-medium text-white">
                    no-show
                  </span>
                )}
              </span>
              {!compact && (
                <span className="block truncate text-xs text-gray-600">{b.services?.name}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function currentMinutes(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}
