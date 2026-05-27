-- Run this in the Supabase SQL editor.
-- IMPORTANT: First create the 'scan-photos' bucket manually in Supabase Storage UI
-- and set it to Public before running this script.

-- Add photo_url column if it doesn't already exist (it should from original schema)
alter table scans add column if not exists photo_url text;

-- Allow authenticated users to upload to their own folder
create policy "Users can upload own scan photos"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'scan-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access so photo URLs work without auth
create policy "Public read access on scan photos"
on storage.objects for select
using ( bucket_id = 'scan-photos' );

-- Allow users to delete their own photos
create policy "Users can delete own scan photos"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'scan-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);
