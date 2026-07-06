// path: app/(protected)/admin/page.tsx
// Главная страница админа: summary cards, quick actions,
// предстоящие букинги, недавние клиенты, график дохода за неделю

'use client';

import Link from 'next/link';
import AdminLayout from '@/components/Layout/AdminLayout';
import SummaryCard from '@/components/Dashboard/SummaryCard';
import BookingsList, { type UpcomingBooking } from '@/components/Dashboard/BookingsList';
import ClientsList, { type RecentClient } from '@/components/Dashboard/ClientsList';
import IncomeChart, { type DayIncome } from '@/components/Dashboard/IncomeChart';
import { SkeletonCards, SkeletonRows, SkeletonBlock } from '@/components/Common/Loading';
import ErrorMessage from '@/components/Common/ErrorMessage';
import Card from '@/components/Common/Card';
import { useFetch } from '@/hooks/useFetch';

interface DashboardResponse {
  bookings_today: number;
  income_today: number;
  total_clients: number;
  profit_margin: number;
  upcoming_bookings: UpcomingBooking[];
  recent_clients: RecentClient[];
  weekly_income: DayIncome[];
}

const quickActions = [
  { href: '/admin/services', label: '+ Add service' },
  { href: '/admin/calendar', label: 'Bookings' },
  { href: '/admin/finances', label: 'Finances' },
];

export default function AdminDashboardPage() {
  const { data, loading, error, refetch } = useFetch<DashboardResponse>('/api/finances/dashboard');

  return (
    <AdminLayout>
      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>

          {/* quick actions */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {quickActions.map((a) => (
              <Link
                key={a.href}
                href={a.href}
                className="shrink-0 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm
                  font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                {a.label}
              </Link>
            ))}
          </div>
        </div>

        {error && <ErrorMessage message={error} onRetry={refetch} />}

        {loading || !data ? (
          !error && (
            <>
              <SkeletonCards count={4} />
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <SkeletonRows rows={5} />
                </Card>
                <Card>
                  <SkeletonRows rows={3} />
                </Card>
              </div>
              <SkeletonBlock height="h-52" />
            </>
          )
        ) : (
          <>
            {/* summary: 2x2 на мобильном, 1 ряд на desktop */}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <SummaryCard label="Bookings today" value={String(data.bookings_today)} />
              <SummaryCard label="Income today" value={`€${data.income_today.toFixed(2)}`} />
              <SummaryCard label="Total clients" value={String(data.total_clients)} />
              <SummaryCard
                label="Profit margin"
                value={`${data.profit_margin}%`}
                trend="this month"
                trendPositive={data.profit_margin >= 0}
              />
            </div>

            {/* букинги + клиенты: вертикально на мобильном, 2 колонки на desktop */}
            <div className="grid gap-4 md:grid-cols-2">
              <BookingsList bookings={data.upcoming_bookings} />
              <ClientsList clients={data.recent_clients} />
            </div>

            <IncomeChart data={data.weekly_income} />
          </>
        )}
      </div>
    </AdminLayout>
  );
}
