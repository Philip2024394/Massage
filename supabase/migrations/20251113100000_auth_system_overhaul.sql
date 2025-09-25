/*
# [Auth System Overhaul: Email/Password & Profile Trigger]
This migration transitions the authentication system from a custom code-based login to Supabase's standard email/password authentication. It links user profiles in `therapists` and `places` tables to the central `auth.users` table.

## Query Description:
- Adds a `user_id` column to `therapists` and `places` tables to reference `auth.users`.
- Keeps the `login_code` for public profile URLs but removes the `failed_login_attempts` column.
- Creates a trigger function `public.handle_new_user()` that automatically creates a corresponding profile in either the `therapists` or `places` table when a new user signs up via `auth.users`. This function reads metadata provided during signup and generates a `login_code`.
- Sets up the trigger to fire after a new user is inserted into `auth.users`.
- Enables RLS on `therapists` and `places` and adds policies to ensure users can only manage their own profiles, while allowing public read access to active profiles.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "High"
- Requires-Backup: true
- Reversible: false

## Structure Details:
- **therapists**:
  - ADD COLUMN `user_id` UUID REFERENCES `auth.users(id)` ON DELETE CASCADE
  - DROP COLUMN `failed_login_attempts`
  - ADD RLS POLICY `Enable ALL for users based on user_id`
  - ADD RLS POLICY `Enable read access for all users`
- **places**:
  - ADD COLUMN `user_id` UUID REFERENCES `auth.users(id)` ON DELETE CASCADE
  - DROP COLUMN `failed_login_attempts`
  - ADD RLS POLICY `Enable ALL for users based on user_id`
  - ADD RLS POLICY `Enable read access for all users`
- **functions**:
  - CREATE FUNCTION `public.handle_new_user()`
- **triggers**:
  - CREATE TRIGGER `on_auth_user_created` ON `auth.users`

## Security Implications:
- RLS Status: Enabled on `therapists` and `places`.
- Policy Changes: Yes, new policies are added to restrict access to user-specific data. This is a significant security improvement.
- Auth Requirements: Moves from a custom code system to standard, more secure password-based authentication managed by Supabase.

## Performance Impact:
- Indexes: Foreign key constraints on `user_id` will create indexes, improving join performance.
- Triggers: Adds a trigger on `auth.users` insert, which has a minimal performance cost on signup operations but greatly simplifies profile creation logic.
- Estimated Impact: Positive. Simplifies application logic and improves security and data integrity.
*/

-- Step 1: Add user_id columns and foreign keys
alter table public.therapists
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table public.places
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

-- Step 2: Make the new user_id columns unique to enforce one-to-one relationship
alter table public.therapists add constraint therapists_user_id_key unique (user_id);
alter table public.places add constraint places_user_id_key unique (user_id);

-- Step 3: Remove obsolete columns if they exist
alter table public.therapists drop column if exists failed_login_attempts;
alter table public.places drop column if exists failed_login_attempts;

-- Step 4: Create the trigger function to handle new user signups
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  account_type text;
  table_name text;
  account_num text;
  login_c text;
begin
  -- Extract account type from metadata
  account_type := new.raw_user_meta_data->>'account_type';
  
  -- Generate common values
  login_c := upper(substr(md5(random()::text), 0, 7)); -- 6 chars

  -- Determine table name and generate account number
  if account_type = 'therapist' then
    table_name := 'therapists';
    account_num := 'THR-' || upper(substr(md5(random()::text), 0, 8));
  elsif account_type = 'place' then
    table_name := 'places';
    account_num := 'PLC-' || upper(substr(md5(random()::text), 0, 8));
  else
    -- If account_type is not therapist or place, do nothing.
    return new;
  end if;

  -- Insert into the determined table
  execute format('insert into public.%I (user_id, name, email, phone, city, status, account_number, login_code) values ($1, $2, $3, $4, $5, ''unpaid'', $6, $7)', table_name)
  using 
    new.id,
    new.raw_user_meta_data->>'name',
    new.email,
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'city',
    account_num,
    login_c;
    
  return new;
end;
$$;

-- Step 5: Create the trigger on the auth.users table if it doesn't exist
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Step 6: Enable RLS and add policies
-- Therapists Table
alter table public.therapists enable row level security;

drop policy if exists "Enable ALL for users based on user_id" on public.therapists;
create policy "Enable ALL for users based on user_id"
on public.therapists for all
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Enable read access for all users" on public.therapists;
create policy "Enable read access for all users"
on public.therapists for select
to anon, authenticated
using (status = 'active');

-- Places Table
alter table public.places enable row level security;

drop policy if exists "Enable ALL for users based on user_id" on public.places;
create policy "Enable ALL for users based on user_id"
on public.places for all
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Enable read access for all users" on public.places;
create policy "Enable read access for all users"
on public.places for select
to anon, authenticated
using (status = 'active');
