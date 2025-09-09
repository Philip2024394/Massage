/*
# [Initial Schema Setup for 2Go Massage Hub]
This script establishes the core database structure for the application, including tables for therapists and reviews. It also sets up user authentication integration and security policies.

## Query Description:
This is a foundational script that creates new tables and enables Row Level Security (RLS). It is designed for a fresh database and is not intended to alter existing user data. It is safe to run on a new project.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true (by dropping tables and functions)

## Structure Details:
- Tables Created: `therapists`, `reviews`
- Functions Created: `handle_new_user`
- Triggers Created: `on_auth_user_created`
- RLS Policies: Enabled for `therapists` and `reviews`

## Security Implications:
- RLS Status: Enabled
- Policy Changes: Yes, new policies are created.
- Auth Requirements: Integrates with `auth.users` table.

## Performance Impact:
- Indexes: Primary keys and foreign keys are indexed automatically.
- Triggers: Adds a trigger on user creation.
- Estimated Impact: Low impact on a new system.
*/

-- 1. Create Therapists Table
-- This table stores all public-facing information for massage therapists.
create table if not exists public.therapists (
  id uuid references auth.users not null primary key,
  name text not null,
  email text not null unique,
  profile_image_url text,
  rating numeric(2, 1) not null default 0.0,
  review_count integer not null default 0,
  specialties text[] not null default '{}',
  bio text,
  experience integer not null default 0,
  is_online boolean not null default false,
  status text not null default 'pending', -- 'pending', 'active', 'blocked'
  location jsonb, -- { "lat": float, "lng": float, "address": string, "city": string }
  pricing jsonb, -- { "session60": int, "session90": int, "session120": int }
  massage_types text[] not null default '{}',
  phone text,
  languages text[] not null default '{"English"}',
  certifications text[],
  created_at timestamptz default now()
);
comment on table public.therapists is 'Stores therapist profiles linked to authenticated users.';

-- 2. Create Reviews Table
-- This table stores customer reviews for therapists.
create table if not exists public.reviews (
  id uuid default gen_random_uuid() primary key,
  therapist_id uuid references public.therapists not null,
  customer_name text not null,
  customer_whatsapp text not null,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text not null,
  status text not null default 'pending', -- 'pending', 'approved', 'rejected'
  created_at timestamptz default now()
);
comment on table public.reviews is 'Stores customer reviews for therapists, pending admin approval.';

-- 3. Create Function to Handle New Users
-- This function automatically creates a therapist profile when a new user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.therapists (id, name, email, phone, certifications, experience)
  values (
    new.id,
    new.raw_user_meta_data->>'name',
    new.email,
    new.raw_user_meta_data->>'phone',
    ARRAY[concat('Therapist Number: ', new.raw_user_meta_data->>'therapistNumber')],
    (new.raw_user_meta_data->>'experience')::integer
  );
  return new;
end;
$$;
comment on function public.handle_new_user is 'Creates a therapist profile upon new user registration.';

-- 4. Create Trigger for New User Function
-- This trigger calls the handle_new_user function after a new user is inserted into auth.users.
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 5. Enable Row Level Security (RLS)
alter table public.therapists enable row level security;
alter table public.reviews enable row level security;

-- 6. Create RLS Policies for Therapists Table
-- Policy: Public can view active therapists.
create policy "Public can view active therapists"
  on public.therapists for select
  using ( status = 'active' );

-- Policy: Therapists can view their own profile regardless of status.
create policy "Therapists can view their own profile"
  on public.therapists for select
  using ( auth.uid() = id );

-- Policy: Therapists can update their own profile.
create policy "Therapists can update their own profile"
  on public.therapists for update
  using ( auth.uid() = id );

-- 7. Create RLS Policies for Reviews Table
-- Policy: Public can view approved reviews.
create policy "Public can view approved reviews"
  on public.reviews for select
  using ( status = 'approved' );

-- Policy: Anyone can submit a new review.
create policy "Anyone can submit a review"
  on public.reviews for insert
  with check ( true );

-- Note: Admin policies are not needed here as they will use the service_role key to bypass RLS.

-- 8. Enable image uploads to a 'avatars' bucket
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "Avatar images are publicly accessible."
  on storage.objects for select
  using ( bucket_id = 'avatars' );

create policy "Anyone can upload an avatar."
  on storage.objects for insert
  with check ( bucket_id = 'avatars' );

create policy "Therapists can update their own avatar."
  on storage.objects for update
  using ( auth.uid() = owner )
  with check ( bucket_id = 'avatars' );
