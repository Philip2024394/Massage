/*
# [CRITICAL FIX] Grant Read Permissions for Activation Codes
This migration provides a definitive fix for the bug preventing activation codes from displaying in the admin panel. It explicitly grants the necessary SELECT permissions to the required roles and recreates the security policy to ensure the data is readable by the application.

## Query Description: This is a safe, non-destructive operation that adjusts permissions. It does not alter or delete any data.

## Metadata:
- Schema-Category: ["Security", "Structural"]
- Impact-Level: ["Low"]
- Requires-Backup: false
- Reversible: true

## Structure Details:
- Table: `special_activation_codes`
- Permissions: Grants SELECT to `anon` and `authenticated` roles.
- Policies: Recreates the `Allow all users to read activation codes` policy.

## Security Implications:
- RLS Status: Enabled
- Policy Changes: Yes, the SELECT policy is re-created to ensure correctness.
- Auth Requirements: None, allows public read as intended.

## Performance Impact:
- Indexes: None
- Triggers: None
- Estimated Impact: Negligible.
*/

-- Step 1: Explicitly grant SELECT permission on the table to the necessary roles.
-- This is the key step that was likely missing, ensuring the API user can access the table.
GRANT SELECT ON TABLE public.special_activation_codes TO anon, authenticated;

-- Step 2: Ensure RLS is enabled.
ALTER TABLE public.special_activation_codes ENABLE ROW LEVEL SECURITY;

-- Step 3: Drop the old policy if it exists, to ensure a clean state.
DROP POLICY IF EXISTS "Allow all users to read activation codes" ON public.special_activation_codes;

-- Step 4: Re-create the policy to allow reading all rows.
CREATE POLICY "Allow all users to read activation codes"
ON public.special_activation_codes
FOR SELECT
USING (true);
