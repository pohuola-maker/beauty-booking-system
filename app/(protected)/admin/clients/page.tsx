// path: app/(protected)/admin/clients/page.tsx
// CRM: поиск (debounce), фильтры (тег, min_spent), таблица/карточки,
// pagination 50/стр, CSV export, модалка клиента

'use client';

import { useState, useCallback } from 'react';
import AdminLayout from '@/components/Layout/AdminLayout';
import ClientsTable, { type Client } from '@/components/Clients/ClientsTable';
import ClientsSearch from '@/components/Clients/ClientsSearch';
import ClientsFilter, { type ClientFilters } from '@/components/Clients/ClientsFilter';
import ClientModal from '@/components/Clients/ClientModal';
import Pagination from '@/components/Common/Pagination';
import Button from '@/components/Common/Button';
import Card from '@/components/Common/Card';
import ErrorMessage from '@/components/Common/ErrorMessage';
import Toast, { type ToastType } from '@/components/Common/Toast';
import { SkeletonRows } from '@/components/Common/Loading';
import { useFetch, type Pagination as PaginationInfo } from '@/hooks/useFetch';

const PAGE_LIMIT = 50;

export default function ClientsPage() {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<ClientFilters>({ tag: '', minSpent: '' });
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [exporting, setExporting] = useState(false);

  const { data, loading, error, refetch } = useFetch<{
    clients: Client[];
    pagination: PaginationInfo;
  }>('/api/clients', {
    params: {
      search: search || undefined,
      tag: filters.tag || undefined,
      min_spent: filters.minSpent || undefined,
      page,
      limit: PAGE_LIMIT,
    },
  });

  // поиск/фильтры сбрасывают страницу на первую
  const onSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  function onFiltersChange(next: ClientFilters) {
    setFilters(next);
    setPage(1);
  }

  function onClientChanged(message: string) {
    setSelectedId(null);
    setToast({ message, type: 'success' });
    void refetch();
  }

  async function exportCsv() {
    setExporting(true);
    try {
      const res = await fetch('/api/clients/export', { credentials: 'same-origin' });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `clients_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      setToast({ message: 'CSV скачан', type: 'success' });
    } catch {
      setToast({ message: 'Не удалось экспортировать CSV', type: 'error' });
    } finally {
      setExporting(false);
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">Клиенты</h1>
          <Button variant="secondary" size="sm" onClick={exportCsv} loading={exporting}>
            Export CSV
          </Button>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <ClientsSearch onSearch={onSearch} resultCount={data?.pagination.total ?? null} />
          <ClientsFilter filters={filters} onChange={onFiltersChange} />
        </div>

        {error ? (
          <ErrorMessage message={error} onRetry={refetch} />
        ) : loading || !data ? (
          <Card>
            <SkeletonRows rows={8} />
          </Card>
        ) : (
          <>
            <ClientsTable clients={data.clients} onView={(c) => setSelectedId(c.id)} />
            <Pagination
              page={data.pagination.page}
              limit={data.pagination.limit}
              total={data.pagination.total}
              onPageChange={setPage}
            />
          </>
        )}
      </div>

      <ClientModal
        clientId={selectedId}
        onClose={() => setSelectedId(null)}
        onChanged={onClientChanged}
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </AdminLayout>
  );
}
