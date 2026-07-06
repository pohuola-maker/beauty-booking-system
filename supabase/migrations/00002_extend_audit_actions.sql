-- path: supabase/migrations/00002_extend_audit_actions.sql
-- Расширение enum audit_action: полное покрытие CRUD для audit trail

alter type audit_action add value if not exists 'create_service';
alter type audit_action add value if not exists 'update_service';
alter type audit_action add value if not exists 'delete_service';
alter type audit_action add value if not exists 'create_time_slot';
alter type audit_action add value if not exists 'delete_time_slot';
alter type audit_action add value if not exists 'delete_booking';
alter type audit_action add value if not exists 'create_client';
alter type audit_action add value if not exists 'update_client';
