// path: components/Dashboard/BookingsList.tsx
// Предстоящие букинги: список на мобильном, строки с колонками на десктопе

import Link from 'next/link';
import Card from '@/components/Common/Card';

export interface UpcomingBooking {
  id: string;
  time_slot_date: string;
  start_time: string; // "HH:MM:SS"
  client_name: string;
  service_name: string;
  status: 'pending' | 'confirmed' | 'cancelled' | string;
}

const statusStyles: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const statusLabels: Record<string, string> = {
  pending: 'Ожидает',
  confirmed: 'Подтверждён',
  cancelled: 'Отменён',
};

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y.slice(2)}`;
}

export default function BookingsList({ bookings }: { bookings: UpcomingBooking[] }) {
  return (
    <Card noPadding>
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <h2 className="text-sm font-semibold text-gray-900">Предстоящие букинги</h2>
        <Link href="/admin/calendar" className="text-xs font-medium text-blue-600 hover:text-blue-700">
          Все →
        </Link>
      </div>

      {bookings.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-gray-500">Нет предстоящих букингов</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {bookings.map((b) => (
            <li key={b.id} className="flex items-center gap-3 px-4 py-3">
              <div className="w-14 shrink-0 text-center">
                <p className="text-sm font-semibold text-gray-900">{b.start_time.slice(0, 5)}</p>
                <p className="text-xs text-gray-500">{formatDate(b.time_slot_date)}</p>
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">{b.client_name}</p>
                <p className="truncate text-xs text-gray-500">{b.service_name}</p>
              </div>

              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                  statusStyles[b.status] ?? 'bg-gray-100 text-gray-700'
                }`}
              >
                {statusLabels[b.status] ?? b.status}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
