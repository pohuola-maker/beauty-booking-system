// path: app/api/clients/export/route.ts
// GET /api/clients/export — CSV клиентской базы для маркетинга (админ)

import { NextRequest } from 'next/server';
import { db } from '@/lib/supabase';
import { handleApiError, throwDbError } from '@/lib/api';
import { requireAdmin } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { toCsv, csvResponse } from '@/lib/csv';

interface ClientRow {
  name: string;
  phone: string;
  email: string | null;
  tags: string[];
  total_visits: number;
  total_spent: string | number;
  first_visit_date: string | null;
  last_visit_date: string | null;
  notes: string | null;
  created_at: string;
}

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin();

    const { data, error } = await db()
      .from('clients')
      .select(
        'name, phone, email, tags, total_visits, total_spent, first_visit_date, last_visit_date, notes, created_at'
      )
      .eq('user_id', auth.id)
      .is('deleted_at', null)
      .order('total_spent', { ascending: false })
      .limit(10000);

    if (error) throwDbError(error);

    const rows = (data ?? []) as ClientRow[];

    const csv = toCsv(rows, [
      { header: 'Name', value: (r) => r.name },
      { header: 'Phone', value: (r) => r.phone },
      { header: 'Email', value: (r) => r.email },
      { header: 'Tags', value: (r) => r.tags },
      { header: 'Total visits', value: (r) => r.total_visits },
      { header: 'Total spent (EUR)', value: (r) => r.total_spent },
      { header: 'First visit', value: (r) => r.first_visit_date },
      { header: 'Last visit', value: (r) => r.last_visit_date },
      { header: 'Notes', value: (r) => r.notes },
      { header: 'Added at', value: (r) => r.created_at },
    ]);

    await logAudit({
      userId: auth.id,
      action: 'export_report',
      entityType: 'client',
      newValue: { type: 'clients_csv', rows: rows.length },
      req,
    });

    return csvResponse(csv, 'clients.csv');
  } catch (error) {
    return handleApiError(error);
  }
}
