-- Users are handled by Supabase Auth automatically

-- Projects table
create table projects (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  location text,
  created_at timestamp with time zone default timezone('utc', now()) not null
);

-- Scans table
create table scans (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  project_id uuid references projects(id) on delete set null,
  work_type text,
  status text,
  confidence text,
  legislation jsonb,
  findings jsonb,
  summary text,
  checklist jsonb,
  follow_up_questions jsonb,
  photo_url text,
  created_at timestamp with time zone default timezone('utc', now()) not null
);

-- Enable Row Level Security
alter table projects enable row level security;
alter table scans enable row level security;

-- Policies — users can only see their own data
create policy "Users can view own projects" on projects for select using (auth.uid() = user_id);
create policy "Users can insert own projects" on projects for insert with check (auth.uid() = user_id);
create policy "Users can delete own projects" on projects for delete using (auth.uid() = user_id);

create policy "Users can view own scans" on scans for select using (auth.uid() = user_id);
create policy "Users can insert own scans" on scans for insert with check (auth.uid() = user_id);
create policy "Users can delete own scans" on scans for delete using (auth.uid() = user_id);
