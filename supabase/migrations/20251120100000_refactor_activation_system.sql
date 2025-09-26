/*
          # [Refactor Activation System]
          This migration removes the activation code system and replaces it with an admin-controlled subscription flag.

          ## Query Description: [This operation removes the `special_activation_codes` table and adds a new `is_continuous` boolean column to the `therapists` and `places` tables. This simplifies the activation flow to be fully controlled by an admin. Existing data in other tables will not be affected. This change is not easily reversible without a backup.]
          
          ## Metadata:
          - Schema-Category: ["Structural"]
          - Impact-Level: ["Medium"]
          - Requires-Backup: [true]
          - Reversible: [false]
          
          ## Structure Details:
          - DROPS table `public.special_activation_codes`.
          - ALTERS table `public.therapists` to add `is_continuous` column.
          - ALTERS table `public.places` to add `is_continuous` column.
          
          ## Security Implications:
          - RLS Status: [No Change]
          - Policy Changes: [No]
          - Auth Requirements: [None]
          
          ## Performance Impact:
          - Indexes: [None]
          - Triggers: [None]
          - Estimated Impact: [Low. The new columns have defaults and will not impact read performance initially.]
          */

-- Step 1: Drop the obsolete special activation codes table
DROP TABLE IF EXISTS public.special_activation_codes;

-- Step 2: Add the 'is_continuous' flag to the therapists table
ALTER TABLE public.therapists
ADD COLUMN is_continuous BOOLEAN NOT NULL DEFAULT false;

-- Step 3: Add the 'is_continuous' flag to the places table
ALTER TABLE public.places
ADD COLUMN is_continuous BOOLEAN NOT NULL DEFAULT false;
