/*
          # [Operation Name]
          Fix Special Activation Codes RLS Policy

          ## Query Description: [This operation corrects the Row Level Security (RLS) policy for the `special_activation_codes` table. The previous policy was too restrictive, preventing the admin dashboard from reading the codes. This new policy grants the necessary read access, allowing the codes to be displayed correctly. This is a safe, non-destructive operation.]
          
          ## Metadata:
          - Schema-Category: ["Structural"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [true]
          
          ## Structure Details:
          - Affects RLS policy on `public.special_activation_codes`.
          
          ## Security Implications:
          - RLS Status: [Enabled]
          - Policy Changes: [Yes]
          - Auth Requirements: [Allows read access for the application's API key.]
          
          ## Performance Impact:
          - Indexes: [No change]
          - Triggers: [No change]
          - Estimated Impact: [None]
          */

-- Drop the old, incorrect policy if it exists.
DROP POLICY IF EXISTS "Allow authenticated users to read codes" ON public.special_activation_codes;
DROP POLICY IF EXISTS "Allow public read access to codes" ON public.special_activation_codes;

-- Create a new, correct policy that allows the application to read the codes.
CREATE POLICY "Allow public read access to codes"
ON public.special_activation_codes FOR SELECT
USING (true);
