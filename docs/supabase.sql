-- Pixel Arcade · optional accounts (Supabase). Paste into Supabase: SQL Editor > New query > Run.
-- One table, one row per signed-in player. Row level security lets each player read and change only their own row;
-- the CHECK constraints reject bad values even if someone calls the API directly with the public anon key.
-- The arcade only ever sends JSON through Supabase's REST API (PostgREST), which passes values as parameters, never
-- as SQL text, so there is no SQL injection path. Nothing here needs a secret key in the arcade's code.

create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  name       text not null check (char_length(name) between 1 and 16 and name ~ '^[[:alnum:] ._-]+$'),
  tokens     integer not null default 0 check (tokens between 0 and 100000000),
  wins       integer not null default 0 check (wins between 0 and 10000000),
  played     integer not null default 0 check (played between 0 and 10000000),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.profiles force row level security;

drop policy if exists "read own profile" on public.profiles;
drop policy if exists "insert own profile" on public.profiles;
drop policy if exists "update own profile" on public.profiles;
create policy "read own profile"   on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "insert own profile" on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
create policy "update own profile" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
-- no delete policy: rows go away with the account (on delete cascade)

-- guests (the anon role) get nothing; signed-in players get only these columns
revoke all on public.profiles from anon, authenticated;
grant select, insert, update (id, name, tokens, wins, played) on public.profiles to authenticated;

create or replace function public.touch_profile() returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at := now(); return new; end $$;
drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before insert or update on public.profiles for each row execute function public.touch_profile();
