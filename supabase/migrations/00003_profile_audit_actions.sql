-- path: supabase/migrations/00003_profile_audit_actions.sql
-- Audit actions для настроек профиля

alter type audit_action add value if not exists 'update_profile';
alter type audit_action add value if not exists 'change_password';
