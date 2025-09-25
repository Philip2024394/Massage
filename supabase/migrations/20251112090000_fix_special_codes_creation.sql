/*
          # [Operation Name]
          Idempotent Creation of Special Activation Codes Table

          ## Query Description: [This script corrects a previous migration error by safely creating the `special_activation_codes` table and seeding it with 50 unique codes. It uses `CREATE TABLE IF NOT EXISTS` and `INSERT ... ON CONFLICT` to be idempotent, meaning it can be run multiple times without causing errors. This ensures the table and its data are set up correctly, resolving the "relation already exists" error.]
          
          ## Metadata:
          - Schema-Category: ["Structural"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [false]
          
          ## Structure Details:
          - Creates table: `public.special_activation_codes` (if it does not exist)
          - Inserts 50 rows into `public.special_activation_codes` (if they do not exist)
          
          ## Security Implications:
          - RLS Status: [Enabled]
          - Policy Changes: [Yes]
          - Auth Requirements: [A permissive policy is created for development. It should be secured for production.]
          
          ## Performance Impact:
          - Indexes: [Primary Key and Unique index are created.]
          - Triggers: [None]
          - Estimated Impact: [Negligible. Affects a small, non-transactional table.]
          */

-- Create the table only if it doesn't already exist to prevent errors.
CREATE TABLE IF NOT EXISTS public.special_activation_codes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code character varying NOT NULL UNIQUE,
    last_used_at timestamp with time zone
);

-- Enable Row Level Security on the table.
ALTER TABLE public.special_activation_codes ENABLE ROW LEVEL SECURITY;

-- Remove old policies to prevent conflicts.
DROP POLICY IF EXISTS "Allow admin read access" ON public.special_activation_codes;
DROP POLICY IF EXISTS "Allow authenticated users to read codes" ON public.special_activation_codes;

-- Create a policy to allow authenticated users to read the codes.
-- WARNING: This policy is for development convenience and allows any logged-in user to see the codes.
-- For production, you MUST replace `true` with a proper admin check,
-- for example, by checking a custom claim in the user's JWT.
CREATE POLICY "Allow authenticated users to read codes"
ON public.special_activation_codes
FOR SELECT
TO authenticated
USING (true);


-- Seed the 50 special activation codes.
-- The ON CONFLICT clause prevents errors if the codes already exist.
INSERT INTO public.special_activation_codes (code) VALUES
('MASSAGE-Y42J'), ('MASSAGE-58P3'), ('MASSAGE-7B9A'), ('MASSAGE-QZ6X'), ('MASSAGE-W2R8'),
('MASSAGE-T6K1'), ('MASSAGE-H5L4'), ('MASSAGE-9F8E'), ('MASSAGE-V3C7'), ('MASSAGE-M1N0'),
('MASSAGE-P9G6'), ('MASSAGE-2D3F'), ('MASSAGE-R4S5'), ('MASSAGE-U8V9'), ('MASSAGE-I7O6'),
('MASSAGE-L2K3'), ('MASSAGE-Z1X2'), ('MASSAGE-C5V6'), ('MASSAGE-B7N8'), ('MASSAGE-A9M0'),
('MASSAGE-S4T5'), ('MASSAGE-E6R7'), ('MASSAGE-F8G9'), ('MASSAGE-J1H2'), ('MASSAGE-K3L4'),
('MASSAGE-N5M6'), ('MASSAGE-O7P8'), ('MASSAGE-G9F0'), ('MASSAGE-X2Y3'), ('MASSAGE-T4R5'),
('MASSAGE-W6V7'), ('MASSAGE-B8C9'), ('MASSAGE-D1E2'), ('MASSAGE-H3J4'), ('MASSAGE-K5L6'),
('MASSAGE-M7N8'), ('MASSAGE-P9Q0'), ('MASSAGE-S1T2'), ('MASSAGE-U3V4'), ('MASSAGE-X5Y6'),
('MASSAGE-Z7A8'), ('MASSAGE-C9B0'), ('MASSAGE-E2D3'), ('MASSAGE-G4F5'), ('MASSAGE-I6H7'),
('MASSAGE-L8K9'), ('MASSAGE-N0M1'), ('MASSAGE-Q2P3'), ('MASSAGE-R4S5'), ('MASSAGE-V6T7')
ON CONFLICT (code) DO NOTHING;
