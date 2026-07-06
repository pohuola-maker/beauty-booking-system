// path: components/Services/ServiceForm.tsx
// Модалка создания/редактирования услуги

'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/Common/Modal';
import Input from '@/components/Common/Input';
import Button from '@/components/Common/Button';
import ErrorMessage from '@/components/Common/ErrorMessage';
import { useApi } from '@/hooks/useApi';
import type { Service } from './ServicesList';

interface ServiceFormProps {
  open: boolean;
  /** null = создание новой услуги */
  service: Service | null;
  onClose: () => void;
  onSaved: (message: string) => void;
}

interface FormErrors {
  name?: string;
  duration?: string;
  price?: string;
}

export default function ServiceForm({ open, service, onClose, onSaved }: ServiceFormProps) {
  const [name, setName] = useState('');
  const [duration, setDuration] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [clientErrors, setClientErrors] = useState<FormErrors>({});

  const { request, loading, error, fieldErrors, clearError } = useApi<{ service: Service }>();

  useEffect(() => {
    if (!open) return;
    setName(service?.name ?? '');
    setDuration(service ? String(service.duration_minutes) : '');
    setPrice(service ? String(service.price) : '');
    setDescription(service?.description ?? '');
    setClientErrors({});
    clearError();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, service?.id]);

  function validate(): boolean {
    const errors: FormErrors = {};
    if (name.trim().length < 2) errors.name = 'Name must be at least 2 characters';
    const dur = Number(duration);
    if (!duration || !Number.isInteger(dur) || dur <= 0 || dur > 1440) {
      errors.duration = 'Duration must be whole minutes (1–1440)';
    }
    if (!price || Number(price) <= 0) errors.price = 'Price must be greater than 0';
    setClientErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function onSubmit() {
    if (!validate()) return;

    const body = {
      name: name.trim(),
      duration_minutes: Number(duration),
      price: Number(price),
      description: description.trim() || undefined,
    };

    const result = service
      ? await request(`/api/services/${service.id}`, { method: 'PUT', body })
      : await request('/api/services', { method: 'POST', body });

    if (result) onSaved(service ? 'Service updated' : 'Service added');
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={service ? 'Edit service' : 'New service'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={onSubmit} loading={loading}>
            {service ? 'Save' : 'Add'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <ErrorMessage message={error} />}

        <Input
          label="Name"
          placeholder="Lash extensions 2D"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={clientErrors.name ?? fieldErrors?.name?.[0]}
          disabled={loading}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Duration (min)"
            type="number"
            min="5"
            step="5"
            inputMode="numeric"
            placeholder="120"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            error={clientErrors.duration ?? fieldErrors?.duration_minutes?.[0]}
            disabled={loading}
          />

          <Input
            label="Price (€)"
            type="number"
            min="0.01"
            step="0.01"
            inputMode="decimal"
            placeholder="65.00"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            error={clientErrors.price ?? fieldErrors?.price?.[0]}
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="service-description" className="mb-1.5 block text-sm font-medium text-gray-700">
            Description (optional)
          </label>
          <textarea
            id="service-description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={loading}
            placeholder="What's included, who it's for…"
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm
              placeholder:text-gray-400 focus:border-blue-500 focus:outline-none
              focus:ring-2 focus:ring-blue-200 disabled:bg-gray-50"
          />
        </div>
      </div>
    </Modal>
  );
}
