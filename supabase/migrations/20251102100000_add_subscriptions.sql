/*
          # [Operation Name]
          Add Subscription and Expiry Fields

          ## Query Description: "This operation adds subscription-related columns (`account_expiry`) to the `therapists` and `places` tables and adds a new 'unpaid' status to handle the new registration flow. This is a non-destructive structural change and is safe to run on existing data. No data will be lost."
          
          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Low"
          - Requires-Backup: false
          - Reversible: true
          
          ## Structure Details:
          - tables: `therapists`, `places`
          - columns_added: `account_expiry` (TIMESTAMPTZ)
          - enums_modified: `therapist_status`, `place_status` (adds 'unpaid' value)
          
          ## Security Implications:
          - RLS Status: Unchanged
          - Policy Changes: No
          - Auth Requirements: None
          
          ## Performance Impact:
          - Indexes: None
          - Triggers: None
          - Estimated Impact: "Negligible. Adds new nullable columns."
          */

-- Add 'unpaid' status to handle new registrations before payment
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'unpaid' AND enumtypid = 'public.therapist_status'::regtype) THEN
    ALTER TYPE public.therapist_status ADD VALUE 'unpaid';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'unpaid' AND enumtypid = 'public.place_status'::regtype) THEN
    ALTER TYPE public.place_status ADD VALUE 'unpaid';
  END IF;
END
$$;

-- Add expiry date column to therapists table
ALTER TABLE public.therapists
ADD COLUMN IF NOT EXISTS account_expiry TIMESTAMPTZ;

-- Add expiry date column to places table
ALTER TABLE public.places
ADD COLUMN IF NOT EXISTS account_expiry TIMESTAMPTZ;
