-- Run this in the Supabase SQL editor after add_photo_storage.sql
alter table scans add column if not exists photo_urls jsonb;
alter table scans add column if not exists work_types jsonb;
