/*
# [Fix] Grant Insert Permissions for Profile Creation
This migration fixes a critical issue where new user profiles were not being created upon sign-up. The database trigger (`handle_new_user`) that creates a profile record was failing due to insufficient permissions.

## Query Description:
This script grants the `authenticator` role the necessary `INSERT` permissions on the `therapists` and `places` tables. Although the trigger function uses `SECURITY DEFINER` to run with elevated privileges, Supabase's execution context for auth triggers requires the calling role (`authenticator` during sign-up) to have these base permissions. This change allows the trigger to execute successfully, ensuring that a corresponding profile is created for every new user.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Medium"
- Requires-Backup: false
- Reversible: true

## Structure Details:
- Grants INSERT on `public.therapists` to role `authenticator`.
- Grants INSERT on `public.places` to role `authenticator`.

## Security Implications:
- RLS Status: Enabled
- Policy Changes: No
- Auth Requirements: This is a corrective action for the auth flow. RLS policies are not required for this `INSERT` operation because it is performed by a `SECURITY DEFINER` trigger, which bypasses RLS. This is a standard and secure pattern for this scenario.

## Performance Impact:
- Indexes: None
- Triggers: None
- Estimated Impact: Negligible.
*/
GRANT INSERT ON TABLE public.therapists TO authenticator;
GRANT INSERT ON TABLE public.places TO authenticator;
