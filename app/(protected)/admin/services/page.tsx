// path: app/(protected)/admin/services/page.tsx
// Управление услугами: список + создание/редактирование в модалке

'use client';

import { useState } from 'react';
import AdminLayout from '@/components/Layout/AdminLayout';
import ServicesList, { type Service } from '@/components/Services/ServicesList';
import ServiceForm from '@/components/Services/ServiceForm';
import Button from '@/components/Common/Button';
import Card from '@/components/Common/Card';
import ErrorMessage from '@/components/Common/ErrorMessage';
import Toast, { type ToastType } from '@/components/Common/Toast';
import { SkeletonRows } from '@/components/Common/Loading';
import { useFetch } from '@/hooks/useFetch';

export default function ServicesPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const { data, loading, error, refetch } = useFetch<{ services: Service[] }>('/api/services');

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(service: Service) {
    setEditing(service);
    setFormOpen(true);
  }

  function onSaved(message: string) {
    setFormOpen(false);
    setToast({ message, type: 'success' });
    void refetch();
  }

  function onDeleted(message: string) {
    setToast({ message, type: 'success' });
    void refetch();
  }

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">Services</h1>
          <Button size="sm" onClick={openCreate}>
            + Add service
          </Button>
        </div>

        {error ? (
          <ErrorMessage message={error} onRetry={refetch} />
        ) : loading || !data ? (
          <Card>
            <SkeletonRows rows={4} />
          </Card>
        ) : (
          <ServicesList
            services={data.services}
            onEdit={openEdit}
            onDeleted={onDeleted}
            onError={(m) => setToast({ message: m, type: 'error' })}
          />
        )}
      </div>

      <ServiceForm
        open={formOpen}
        service={editing}
        onClose={() => setFormOpen(false)}
        onSaved={onSaved}
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </AdminLayout>
  );
}
