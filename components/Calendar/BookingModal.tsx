// path: components/Calendar/BookingModal.tsx
// Booking details: статус, сумма, notes, no-show; Save → PUT, Delete с подтверждением

'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/Common/Modal';
import Button from '@/components/Common/Button';
import Select from '@/components/Common/Select';
import Input from '@/components/Common/Input';
import ErrorMessage from '@/components/Common/ErrorMessage';
import { useApi } from '@/hooks/useApi';
import { type CalendarBooking, type BookingStatus, STATUS_LABELS } from './types';

interface BookingModalProps {
  booking: CalendarBooking | null;
  onClose: () => void;
  /** вызывается после успешного save/delete → refetch списка */
  onChanged: (message: string) => void;
}

const statusOptions = (['pending', 'confirmed', 'cancelled'] as BookingStatus[]).map((s) => ({
  value: s,
  label: STATUS_LABELS[s],
}));

export default function BookingModal({ booking, onClose, onChanged }: BookingModalProps) {
  const [status, setStatus] = useState<BookingStatus>('pending');
  const [notes, setNotes] = useState('');
  const [amount, setAmount] = useState('');
  const [noShow, setNoShow] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const save = useApi<{ booking: CalendarBooking }>();
  const remove = useApi<{ success: boolean }>();

  // заполняем форму при открытии нового букинга
  useEffect(() => {
    if (!booking) return;
    setStatus(booking.status);
    setNotes(booking.notes ?? '');
    setAmount(booking.amount_received !== null ? String(booking.amount_received) : '');
    setNoShow(booking.no_show);
    setConfirmDelete(false);
    save.clearError();
    remove.clearError();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booking?.id]);

  if (!booking) return null;

  const slot = booking.time_slots;
  const busy = save.loading || remove.loading;

  async function onSave() {
    const result = await save.request(`/api/bookings/${booking!.id}`, {
      method: 'PUT',
      body: {
        status,
        notes: notes.trim() || null,
        amount_received: amount === '' ? undefined : Number(amount),
        no_show: noShow,
      },
    });
    if (result) onChanged('Booking saved');
  }

  async function onDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    const result = await remove.request(`/api/bookings/${booking!.id}`, { method: 'DELETE' });
    if (result) onChanged('Booking deleted');
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Booking details"
      footer={
        <>
          <Button variant="danger" onClick={onDelete} loading={remove.loading} disabled={busy}>
            {confirmDelete ? 'Really delete?' : 'Delete'}
          </Button>
          <Button onClick={onSave} loading={save.loading} disabled={busy}>
            Save
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {(save.error || remove.error) && (
          <ErrorMessage message={save.error ?? remove.error ?? ''} />
        )}

        {/* время + услуга + клиент */}
        <div className="rounded-lg bg-gray-50 p-3">
          <p className="text-lg font-semibold text-gray-900">
            {slot ? `${formatDate(slot.date)} · ${slot.start_time.slice(0, 5)}` : '—'}
          </p>
          <p className="mt-0.5 text-sm text-gray-600">
            {booking.services?.name}
            {booking.services && ` · ${booking.services.duration_minutes} min`}
          </p>

          <div className="mt-3 border-t border-gray-200 pt-3">
            <p className="text-sm font-medium text-gray-900">{booking.client_name}</p>
            <a
              href={`tel:${booking.client_phone}`}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              {booking.client_phone}
            </a>
            {booking.client_email && (
              <p className="text-sm text-gray-500">{booking.client_email}</p>
            )}
          </div>
        </div>

        <Select
          label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value as BookingStatus)}
          options={statusOptions}
          disabled={busy}
        />

        <Input
          label="Amount (€)"
          type="number"
          min="0"
          step="0.01"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          disabled={busy}
        />

        <div>
          <label htmlFor="booking-notes" className="mb-1.5 block text-sm font-medium text-gray-700">
            Notes
          </label>
          <textarea
            id="booking-notes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={busy}
            placeholder="Client wishes, details..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900
              placeholder:text-gray-400 focus:border-blue-500 focus:outline-none
              focus:ring-2 focus:ring-blue-200 disabled:bg-gray-50"
          />
        </div>

        <label className="flex cursor-pointer items-center gap-2.5">
          <input
            type="checkbox"
            checked={noShow}
            onChange={(e) => setNoShow(e.target.checked)}
            disabled={busy}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">
            Client did not show up (no-show)
            <span className="block text-xs text-gray-500">not counted as income</span>
          </span>
        </label>
      </div>
    </Modal>
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
