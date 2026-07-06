// path: components/Dashboard/ClientsList.tsx
// Recent clients: имя, телефон, визиты, потрачено

import Link from 'next/link';
import Card from '@/components/Common/Card';

export interface RecentClient {
  id: string;
  name: string;
  phone: string;
  total_visits: number;
  total_spent: string | number;
}

export default function ClientsList({ clients }: { clients: RecentClient[] }) {
  return (
    <Card noPadding>
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <h2 className="text-sm font-semibold text-gray-900">Recent clients</h2>
        <Link href="/admin/clients" className="text-xs font-medium text-blue-600 hover:text-blue-700">
          All →
        </Link>
      </div>

      {clients.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-gray-500">No clients yet</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {clients.map((c) => (
            <li key={c.id} className="flex items-center gap-3 px-4 py-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-semibold text-blue-700">
                {c.name.trim().charAt(0).toUpperCase()}
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">{c.name}</p>
                <p className="truncate text-xs text-gray-500">{c.phone}</p>
              </div>

              <div className="shrink-0 text-right">
                <p className="text-sm font-medium text-gray-900">
                  €{Number(c.total_spent).toFixed(0)}
                </p>
                <p className="text-xs text-gray-500">
                  {c.total_visits} {visitsLabel(c.total_visits)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function visitsLabel(n: number): string {
  return n === 1 ? 'visit' : 'visits';
}
