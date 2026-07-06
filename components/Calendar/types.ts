// path: components/Calendar/types.ts
// Общие типы календаря (форма ответа GET /api/bookings)

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled';

export interface CalendarBooking {
  id: string;
  client_name: string;
  client_phone: string;
  client_email: string | null;
  status: BookingStatus;
  notes: string | null;
  amount_received: string | number | null;
  no_show: boolean;
  services: {
    id: string;
    name: string;
    price: string | number;
    duration_minutes: number;
  } | null;
  time_slots: {
    id: string;
    date: string; // YYYY-MM-DD
    start_time: string; // HH:MM:SS
    duration_minutes: number;
  } | null;
}

export const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
};

/** локальная дата → YYYY-MM-DD (без UTC-сдвига!) */
export function toISODate(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d + days);
  return toISODate(date);
}

/** "HH:MM:SS" → минуты от полуночи */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}
