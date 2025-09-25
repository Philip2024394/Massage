/*
# [Operation] Subscription Flow Update
This migration adds a unique `email` column to the `therapists` and `places` tables, which is critical for the new registration and renewal notification system. It ensures each user has a unique email address.

## Query Description:
- **Impact:** This operation adds a new `email` column and enforces a `UNIQUE` constraint on it for both `therapists` and `places` tables.
- **Risks:** If there are existing records with duplicate or `NULL` emails, the `UNIQUE` constraint will fail. The script is designed for a clean setup.
- **Precautions:** It's recommended to back up your data if you have existing user records.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Medium"
- Requires-Backup: true
- Reversible: true (manually)

## Structure Details:
- **Tables Affected:** `public.therapists`, `public.places`
- **Columns Added:** `email` (TEXT)
- **Constraints Added:** `therapists_email_key` (UNIQUE), `places_email_key` (UNIQUE)

## Security Implications:
- RLS Status: Unchanged
- Policy Changes: No
- Auth Requirements: None

## Performance Impact:
- Indexes: Adds unique indexes on the `email` columns.
- Triggers: None
- Estimated Impact: Minimal performance impact on writes, potential improvement on email lookups.
*/

-- Add email column if it doesn't exist
ALTER TABLE public.therapists ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS email TEXT;

-- Drop existing unique constraints if they exist, to re-create them cleanly
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'therapists_email_key' AND conrelid = 'public.therapists'::regclass
  ) THEN
    ALTER TABLE public.therapists DROP CONSTRAINT therapists_email_key;
  END IF;
END;
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'places_email_key' AND conrelid = 'public.places'::regclass
  ) THEN
    ALTER TABLE public.places DROP CONSTRAINT places_email_key;
  END IF;
END;
$$;

-- Add unique constraint. This will fail if there are duplicate non-NULL emails.
-- It's important to ensure data integrity.
ALTER TABLE public.therapists ADD CONSTRAINT therapists_email_key UNIQUE (email);
ALTER TABLE public.places ADD CONSTRAINT places_email_key UNIQUE (email);
