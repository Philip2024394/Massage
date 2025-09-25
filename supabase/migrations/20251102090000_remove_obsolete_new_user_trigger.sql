/*
  # [Fix User ID Column Reference by Removing Obsolete Trigger]
  This migration script addresses the 'column "user_id" does not exist' error by removing a likely obsolete database trigger.

  ## Query Description:
  The application appears to use a custom, code-based authentication system and does not have a user-facing registration flow that uses Supabase Auth. The error likely originates from a leftover 'handle_new_user' trigger on the 'auth.users' table, which is associated with a standard Supabase Auth sign-up flow that is not currently implemented.

  This script safely drops the trigger and its associated function. This should resolve the error without affecting the application's current login functionality. If you plan to implement Supabase Auth registration in the future, you will need to create a new, correct trigger and function.

  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: false

  ## Structure Details:
  - Function: public.handle_new_user (dropped)
  - Trigger: on_auth_user_created on auth.users (dropped)

  ## Security Implications:
  - RLS Status: Unchanged
  - Policy Changes: No

  ## Performance Impact:
  - Triggers: Removes a trigger, which might slightly improve insert performance on 'auth.users', though this is negligible as sign-ups are not used.
  - Estimated Impact: Low.
*/

-- Drop the trigger and function associated with the old Supabase Auth sign-up flow.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

/*
  ## Note on RLS Policies
  If the error persists after applying this migration, it may be caused by a Row Level Security (RLS) policy on one of your tables (e.g., 'therapists', 'places', 'reviews').

  Check your policies in the Supabase Dashboard (Authentication > Policies). Look for any policy that contains `user_id` in its `USING` or `WITH CHECK` clause.

  Example of a faulty policy:
  `CREATE POLICY "example" ON public.therapists FOR SELECT USING (auth.uid() = user_id);`

  You would need to correct it to reference the correct column, which is typically `id`:
  `CREATE POLICY "example" ON public.therapists FOR SELECT USING (auth.uid() = id);`

  Since the app uses a custom authentication system, your policies might not need to reference `auth.uid()` at all. A common pattern is to allow public read access for 'active' records:
  `CREATE POLICY "Public can read active therapists" ON public.therapists FOR SELECT USING (status = 'active');`
*/
