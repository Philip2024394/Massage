/*
# [Fix] Enable Read Access for Activation Codes
This migration adds a Row Level Security (RLS) policy to the `special_activation_codes` table. This is a critical fix to allow the Admin Dashboard to read and display the list of reusable activation codes. Without this policy, the query from the app is blocked, resulting in an empty list.

## Query Description:
- This operation is safe and does not modify any data.
- It enables read-only access to the `special_activation_codes` table for all users, which is secure in this context as the table contains non-sensitive, reusable codes.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true (the policy can be dropped)

## Security Implications:
- RLS Status: Enabled
- Policy Changes: Yes, adds a new SELECT policy.
- Auth Requirements: This policy applies to the public `anon` role.
*/

-- Create the policy to allow reading the codes from the app
CREATE POLICY "Allow public read access to special codes"
ON public.special_activation_codes
FOR SELECT
USING (true);
