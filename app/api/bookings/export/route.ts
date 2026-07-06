// path: app/api/bookings/export/route.ts
// GET /api/bookings/export?from=...&to=... — CSV всех букингов (админ)

import { NextRequest } from 'next/server';
import { db } from '@/lib/supabase';
import { handleApiError, throwDbError } from '@/lib/api';
import { requireAdmin } from '@/lib/auth';
import { dateSchema, queryToObject } from '@/lib/validation';
import { logAudit } from '@/lib/audit';
import { toCsv, csvResponse } from '@/lib/csv';
import { z } from 'zod';

const exportQuerySchema = z.object({
  from: dateSchema.optional(),
  to: dateSchema.optional(),
});

interface BookingRow {
  id: string;
  client_name: string;
  client_phone: string;
  client_email: string | null;
  status: string;
  amount_received: string | number | null;
  no_show: boolean;
  notes: string | null;
  created_at: string;
  services: { name: string } | null;
  time_slots: { date: string; start_time: string } | null;
}

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    const q = exportQuerySchema.parse(queryToObject(req.nextUrl.searchParams));

    let query = db()
      .from('bookings')
      .select(
        `id, client_name, client_phone, client_email, status,
         amount_received, no_show, notes, created_at,
         services ( name ),
         time_slots!inner ( date, start_time )`
      )
      .eq('user_id', auth.id)
      .order('created_at', { ascending: false })
      .limit(10000);

    if (q.from) query = query.gte('time_slots.date', q.from);
    if (q.to) query = query.lte('time_slots.date', q.to);

    const { data, error } = await query;
    if (error) throwDbError(error);

    const rows = (data ?? []) as unknown as BookingRow[];

    const csv = toCsv(rows, [
      { header: 'Date', value: (r) => r.time_slots?.date },
      { header: 'Time', value: (r) => r.time_slots?.start_time },
      { header: 'Client', value: (r) => r.client_name },
      { header: 'Phone', value: (r) => r.client_phone },
      { header: 'Email', value: (r) => r.client_email },
      { header: 'Service', value: (r) => r.services?.name },
      { header: 'Status', value: (r) => r.status },
      { header: 'Amount (EUR)', value: (r) => r.amount_received },
      { header: 'No show', value: (r) => (r.no_show ? 'yes' : 'no') },
      { header: 'Notes', value: (r) => r.notes },
      { header: 'Created at', value: (r) => r.created_at },
    ]);

    await logAudit({
      userId: auth.id,
      action: 'export_report',
      entityType: 'booking',
      newValue: { type: 'bookings_csv', rows: rows.length, from: q.from, to: q.to },
      req,
    });

    return csvResponse(csv, `bookings_${q.from ?? 'all'}_${q.to ?? 'all'}.csv`);
  } catch (error) {
    return handleApiError(error);
  }
}
