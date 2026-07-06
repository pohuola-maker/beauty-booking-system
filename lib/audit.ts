// path: lib/audit.ts
// Audit trail для Revenue.ie — пишется на каждое значимое действие.
// Записи иммутабельны (защищено триггером в БД).

import { db } from './supabase';
import { getRequestMeta } from './api';

export type AuditAction =
  | 'login'
  | 'create_booking'
  | 'update_booking'
  | 'delete_booking'
  | 'create_expense'
  | 'update_expense'
  | 'delete_expense'
  | 'create_client'
  | 'update_client'
  | 'delete_client'
  | 'create_service'
  | 'update_service'
  | 'delete_service'
  | 'create_time_slot'
  | 'delete_time_slot'
  | 'update_profile'
  | 'change_password'
  | 'export_report';

export type AuditEntityType =
  | 'booking'
  | 'expense'
  | 'client'
  | 'service'
  | 'time_slot'
  | 'user';

interface AuditParams {
  userId: string;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId?: string | null;
  oldValue?: unknown;
  newValue?: unknown;
  req: Request;
}

export async function logAudit(params: AuditParams): Promise<void> {
  const { ip, userAgent } = getRequestMeta(params.req);

  const { error } = await db().from('audit_logs').insert({
    user_id: params.userId,
    action: params.action,
    entity_type: params.entityType,
    entity_id: params.entityId ?? null,
    old_value: params.oldValue ?? null,
    new_value: params.newValue ?? null,
    ip_address: ip,
    user_agent: userAgent,
  });

  if (error) {
    // не роняем основной запрос, но фиксируем сбой — это критично для комплаенса
    console.error('[audit] FAILED to write audit log:', error.message, params.action);
  }
}
