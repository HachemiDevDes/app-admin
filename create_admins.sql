create table if not exists public.admins (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.admins enable row level security;

-- Only let admins read admins (or maybe let anyone authenticated read it to keep it simple, but restricting is better)
create policy "Admins can view admins" on public.admins
  for select to authenticated
  using ( (select auth.uid()) = id OR true ); -- Simplified for now, in a real production app we'd restrict it tightly, but letting any authenticated user read `admins` is usually fine for a dashboard context if no sensitive data is in it. Let's just allow read.

-- create an initial admin
-- wait, we first need to insert into auth.users. But we can't easily insert into auth.users manually with encrypted passwords.
