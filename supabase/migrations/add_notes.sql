alter table scans add column if not exists notes text;
alter table scans add column if not exists checklist_state jsonb;
