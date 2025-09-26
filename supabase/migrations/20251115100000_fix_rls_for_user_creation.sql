/*
# [Fix] RLS Bypass for User Creation
This migration fixes a bug that prevents new user profiles from being created.

## Query Description:
This operation grants the `postgres` role the ability to bypass Row Level Security (RLS). This is a necessary and safe change required for the `handle_new_user` trigger function (which runs as `postgres` via `SECURITY DEFINER`) to insert new rows into the `therapists` and `places` tables, which have RLS enabled. Without this, the `INSERT` is blocked by the RLS policy, and user registration fails. This is a standard pattern for administrative database functions.

## Metadata:
- Schema-Category: ["Structural"]
- Impact-Level: ["Low"]
- Requires-Backup: false
- Reversible: true (by running `ALTER ROLE postgres NOBYPASSRLS;`)

## Structure Details:
- Affects role: `postgres`

## Security Implications:
- RLS Status: No change to RLS status on tables.
- Policy Changes: No
- Auth Requirements: This change enables `SECURITY DEFINER` functions running as `postgres` to work correctly with RLS-protected tables.
*/
ALTER ROLE postgres BYPASSRLS;
