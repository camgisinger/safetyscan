alter table scans add column if not exists share_token text unique;
alter table scans add column if not exists share_enabled boolean default false;

create policy "Public can view shared scans" on scans
  for select using (share_enabled = true);
