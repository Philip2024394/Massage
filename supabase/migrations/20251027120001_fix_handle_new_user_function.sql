/*
  # [Fix] Correct handle_new_user Trigger Function
  This operation corrects the `handle_new_user` function, which is responsible for creating a new therapist profile when a new user signs up. The original function failed because it incorrectly referenced a `user_id` column that does not exist in the `auth.users` table.

  ## Query Description:
  - **DROP FUNCTION**: The existing, faulty `handle_new_user` function is safely removed.
  - **CREATE FUNCTION**: The function is recreated with the correct logic. It now correctly uses `new.id` to get the user's unique identifier and populates the `public.therapists` table with the metadata (`name`, `phone`, `therapist_number`, `experience`) provided during registration. This change is critical for user registration to function correctly. There is no risk to existing data as this only affects the creation of new user profiles.

  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true

  ## Structure Details:
  - **Affected Function**: `public.handle_new_user()`
  - **Logic Change**: Changed `new.user_id` to `new.id`. Added extraction of user metadata from `new.raw_user_meta_data`.

  ## Security Implications:
  - RLS Status: Unchanged.
  - Policy Changes: No.
  - Auth Requirements: This function is triggered by the Supabase Auth system.

  ## Performance Impact:
  - Indexes: None.
  - Triggers: The existing trigger `on_auth_user_created` will now execute this corrected function.
  - Estimated Impact: Negligible performance impact. This fixes a broken core functionality.
*/

-- Drop the existing function if it exists to ensure a clean slate
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create the corrected function that properly references `new.id` and extracts metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET SEARCH_PATH = public
AS $$
BEGIN
  INSERT INTO public.therapists (id, email, name, phone, therapist_number, experience)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'therapist_number',
    (new.raw_user_meta_data->>'experience')::integer
  );
  RETURN new;
END;
$$;
