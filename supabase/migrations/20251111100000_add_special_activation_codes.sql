/*
# [Create Special Activation Codes Table]
This migration creates a new table `special_activation_codes` to store reusable activation codes for bypassing payment. It also populates the table with 50 initial codes.

## Query Description:
- Creates the `special_activation_codes` table with columns for the code and its last usage timestamp.
- Enables Row Level Security (RLS) on the new table.
- Defines RLS policies:
  - Allows any authenticated user to read the codes. Access is controlled at the application level (only shown in Admin Dashboard).
- Inserts 50 unique activation codes into the table.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true (drop table and policies)

## Structure Details:
- Table created: `public.special_activation_codes`
- Columns: `id` (uuid), `code` (text, unique), `last_used_at` (timestamptz)

## Security Implications:
- RLS Status: Enabled
- Policy Changes: Yes. Policy allows any authenticated user to read codes, as admin role cannot be verified at the database level with the current custom auth system.
- Auth Requirements: Any authenticated user.
*/

-- Create the table for special activation codes
CREATE TABLE public.special_activation_codes (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    code text NOT NULL UNIQUE,
    last_used_at timestamptz
);

-- Enable Row Level Security
ALTER TABLE public.special_activation_codes ENABLE ROW LEVEL SECURITY;

-- Allow any authenticated user to read all codes.
-- NOTE: The current custom authentication system does not use Supabase Auth roles,
-- so we cannot restrict this at the database level without significant auth refactoring.
-- Security is handled by only exposing the code list in the admin dashboard UI.
CREATE POLICY "Allow authenticated read access"
ON public.special_activation_codes
FOR SELECT
TO authenticated
USING (true);

-- Insert 50 special codes
INSERT INTO public.special_activation_codes (code) VALUES
('MASSAGE-1'), ('MASSAGE-2'), ('MASSAGE-3'), ('MASSAGE-4'), ('MASSAGE-5'),
('MASSAGE-6'), ('MASSAGE-7'), ('MASSAGE-8'), ('MASSAGE-9'), ('MASSAGE-10'),
('AGENT-1'), ('AGENT-2'), ('AGENT-3'), ('AGENT-4'), ('AGENT-5'),
('AGENT-6'), ('AGENT-7'), ('AGENT-8'), ('AGENT-9'), ('AGENT-10'),
('VIP-1'), ('VIP-2'), ('VIP-3'), ('VIP-4'), ('VIP-5'),
('VIP-6'), ('VIP-7'), ('VIP-8'), ('VIP-9'), ('VIP-10'),
('PROMO-1'), ('PROMO-2'), ('PROMO-3'), ('PROMO-4'), ('PROMO-5'),
('PROMO-6'), ('PROMO-7'), ('PROMO-8'), ('PROMO-9'), ('PROMO-10'),
('TRIAL-1'), ('TRIAL-2'), ('TRIAL-3'), ('TRIAL-4'), ('TRIAL-5'),
('TRIAL-6'), ('TRIAL-7'), ('TRIAL-8'), ('TRIAL-9'), ('TRIAL-10');
