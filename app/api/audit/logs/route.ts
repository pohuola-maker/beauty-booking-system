// path: app/api/audit/logs/route.ts
// GET /api/audit/logs — audit trail (только админ; фильтры action/entity_type/from/to)

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { handleApiError, throwDbError, paginate } from '@/lib/api';
import { requireAdmin } from '@/lib/auth';
import { auditLogsQuerySchema, queryToObject } from '@/lib/validation';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    const q = auditLogsQuerySchema.parse(queryToObject(req.nextUrl.searchParams));

    let query = db()
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .eq('user_id', auth.id)
      .order('timestamp', { ascending: false });

    if (q.action) query = query.eq('action', q.action);
    if (q.entity_type) query = query.eq('entity_type', q.entity_type);
    if (q.from) query = query.gte('timestamp', `${q.from}T00:00:00Z`);
    if (q.to) query = query.lte('timestamp', `${q.to}T23:59:59Z`);

    const { from, to } = paginate(q.page, q.limit);
    const { data, count, error } = await query.range(from, to);
    if (error) throwDbError(error);

    return NextResponse.json({
      logs: data ?? [],
      pagination: { page: q.page, limit: q.limit, total: count ?? 0 },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
