// path: components/Clients/ClientModal.tsx
// Карточка клиента: контакты, теги (chips), заметки, история визитов.
// Save → PUT /api/clients/[id], Delete → GDPR soft delete с подтверждением.
// История приходит из GET /api/clients/[id] (client + bookings).

'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/Common/Modal';
import Button from '@/components/Common/Button';
import Input from '@/components/Common/Input';
import ErrorMessage from '@/components/Common/ErrorMessage';
import { SkeletonRows } from '@/components/Common/Loading';
import { useApi } from '@/hooks/useApi';
import { useFetch } from '@/hooks/useFetch';
import { type Client } from './ClientsTable';
import { PRESET_TAGS } from './ClientsFilter';

interface VisitHistoryItem {
  id: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  amount_received: string | number | null;
  no_show: boolean;
  services: { name: string } | null;
  time_slots: { date: string; start_time: string } | null;
}

interface ClientModalProps {
  clientId: string | null;
  onClose: () => void;
  onChanged: (message: string) => void;
}

const statusLabels: Record<string, string> = {
  pending: 'ожидает',
  confirmed: 'подтверждён',
  cancelled: 'отменён',
};

export default function ClientModal({ clientId, onClose, onChanged }: ClientModalProps) {
  const { data, loading, error } = useFetch<{ client: Client; bookings: VisitHistoryItem[] }>(
    `/api/clients/${clientId}`,
    { enabled: clientId !== null }
  );

  const [form, setForm] = useState({ name: '', phone: '', email: '', notes: '' });
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const save = useApi<{ client: Client }>();
  const remove = useApi<{ success: boolean }>();

  useEffect(() => {
    if (!data?.client) return;
    const c = data.client;
    setForm({ name: c.name, phone: c.phone, email: c.email ?? '', notes: c.notes ?? '' });
    setTags(c.tags);
    setConfirmDelete(false);
    setNewTag('');
  }, [data?.client]);

  if (clientId === null) return null;

  const busy = save.loading || remove.loading;

  function toggleTag(tag: string) {
    setTags((t) => (t.includes(tag) ? t.filter((x) => x !== tag) : [...t, tag]));
  }

  function addCustomTag() {
    const tag = newTag.trim().toLowerCase();
    if (tag && !tags.includes(tag)) setTags((t) => [...t, tag]);
    setNewTag('');
  }

  async function onSave() {
    const result = await save.request(`/api/clients/${clientId}`, {
      method: 'PUT',
      body: {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        notes: form.notes.trim() || undefined,
        tags,
      },
    });
    if (result) onChanged('Клиент сохранён');
  }

  async function onDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    const result = await remove.request(`/api/clients/${clientId}`, { method: 'DELETE' });
    if (result) onChanged('Клиент удалён (GDPR: история букингов сохранена для налоговой)');
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Клиент"
      footer={
        <>
          <Button variant="danger" onClick={onDelete} loading={remove.loading} disabled={busy || loading}>
            {confirmDelete ? 'Точно удалить? (GDPR)' : 'Удалить'}
          </Button>
          <Button onClick={onSave} loading={save.loading} disabled={busy || loading}>
            Сохранить
          </Button>
        </>
      }
    >
      {loading || !data ? (
        error ? (
          <ErrorMessage message={error} />
        ) : (
          <SkeletonRows rows={4} />
        )
      ) : (
        <div className="space-y-4">
          {(save.error || remove.error) && (
            <ErrorMessage message={save.error ?? remove.error ?? ''} />
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Имя"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              error={save.fieldErrors?.name?.[0]}
              disabled={busy}
            />
            <Input
              label="Телефон"
              type="tel"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              error={save.fieldErrors?.phone?.[0]}
              disabled={busy}
            />
          </div>

          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            error={save.fieldErrors?.email?.[0]}
            disabled={busy}
          />

          {/* теги */}
          <div>
            <p className="mb-1.5 text-sm font-medium text-gray-700">Теги</p>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  aria-pressed={tags.includes(tag)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    tags.includes(tag)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
              {tags
                .filter((t) => !PRESET_TAGS.includes(t))
                .map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => toggleTag(tag)}
                      aria-label={`Убрать тег ${tag}`}
                      className="hover:text-blue-900"
                    >
                      ×
                    </button>
                  </span>
                ))}
            </div>
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCustomTag();
                  }
                }}
                placeholder="Свой тег…"
                aria-label="Добавить свой тег"
                className="w-36 rounded-lg border border-gray-300 px-3 py-1.5 text-xs
                  focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
              <button
                type="button"
                onClick={addCustomTag}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium
                  text-gray-700 hover:bg-gray-50"
              >
                Добавить
              </button>
            </div>
          </div>

          {/* заметки */}
          <div>
            <label htmlFor="client-notes" className="mb-1.5 block text-sm font-medium text-gray-700">
              Заметки
            </label>
            <textarea
              id="client-notes"
              rows={3}
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              disabled={busy}
              placeholder="Аллергии, предпочтения, детали..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm
                placeholder:text-gray-400 focus:border-blue-500 focus:outline-none
                focus:ring-2 focus:ring-blue-200 disabled:bg-gray-50"
            />
          </div>

          {/* история визитов */}
          <div>
            <p className="mb-2 text-sm font-medium text-gray-700">
              История визитов ({data.bookings.length})
            </p>
            {data.bookings.length === 0 ? (
              <p className="rounded-lg bg-gray-50 py-4 text-center text-sm text-gray-500">
                Ещё не было визитов
              </p>
            ) : (
              <ul className="max-h-48 divide-y divide-gray-100 overflow-y-auto rounded-lg border border-gray-200">
                {data.bookings.map((b) => (
                  <li key={b.id} className="flex items-center gap-2 px-3 py-2 text-sm">
                    <span className="w-20 shrink-0 text-gray-600">
                      {b.time_slots ? formatDate(b.time_slots.date) : '—'}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-gray-900">
                      {b.services?.name ?? '—'}
                    </span>
                    <span
                      className={`shrink-0 text-xs ${
                        b.status === 'confirmed'
                          ? 'text-green-600'
                          : b.status === 'cancelled'
                            ? 'text-red-500'
                            : 'text-yellow-600'
                      }`}
                    >
                      {b.no_show ? 'no-show' : statusLabels[b.status]}
                    </span>
                    <span className="w-16 shrink-0 text-right font-medium text-gray-900">
                      €{Number(b.amount_received ?? 0).toFixed(0)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y.slice(2)}`;
}
