-- path: supabase/migrations/00004_token_version_english_data.sql
-- 1) token_version: смена пароля инвалидирует все старые JWT
-- 2) дефолтные категории расходов и теги клиентов — на английском

alter table users add column if not exists token_version integer not null default 0;

-- новые аккаунты получают английские категории
create or replace function seed_expense_categories()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role = 'admin' then
    insert into expense_categories (user_id, name)
    values
      (new.id, 'materials'),
      (new.id, 'rent'),
      (new.id, 'utilities'),
      (new.id, 'salary'),
      (new.id, 'other');
  end if;
  return new;
end;
$$;

-- существующие русские категории → английские
update expense_categories set name = 'materials'  where name = 'материалы';
update expense_categories set name = 'rent'       where name = 'аренда';
update expense_categories set name = 'utilities'  where name = 'коммунальные';
update expense_categories set name = 'salary'     where name = 'зарплата';
update expense_categories set name = 'other'      where name = 'прочее';

-- русские теги клиентов → английские
update clients set tags = array_replace(tags, 'новая', 'new');
update clients set tags = array_replace(tags, 'постоянная', 'regular');
update clients set tags = array_replace(tags, 'неактивная', 'inactive');
