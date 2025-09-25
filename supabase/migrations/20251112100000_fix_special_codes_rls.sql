/*
  # [Operation Name]
  Secure Special Activation Codes RLS Policy
  [Description of what this operation does]
  This script updates the Row Level Security (RLS) policies for the `special_activation_codes` table to enhance security. It removes any existing broad SELECT policies and ensures that only server-side processes (like Edge Functions using the service_role key) can read the full list of codes. This prevents unauthorized client-side access.

  ## Query Description:
  - Impact: This change restricts direct browser access to the special codes list, which is a security improvement. The admin dashboard will now fetch codes through a dedicated, secure Edge Function.
  - Risks: Low. The application is being updated simultaneously to use the new secure fetching method.
  - Precautions: None needed.
  
  ## Metadata:
  - Schema-Category: ["Security"]
  - Impact-Level: ["Low"]
  - Requires-Backup: [false]
  - Reversible: [true]
  
  ## Structure Details:
  - Table: `special_activation_codes`
  - Policies being removed: "Allow admin read access", "Allow authenticated users to use codes"
  
  ## Security Implications:
  - RLS Status: Enabled
  - Policy Changes: Yes. Removes all client-side read access.
  - Auth Requirements: All reads must now happen through a privileged role (service_role).
*/

-- Ensure RLS is enabled on the table
ALTER TABLE public.special_activation_codes ENABLE ROW LEVEL SECURITY;

-- Remove previous, potentially insecure or non-functional policies.
-- It's safe to run DROP IF EXISTS.
DROP POLICY IF EXISTS "Allow admin read access" ON public.special_activation_codes;
DROP POLICY IF EXISTS "Allow authenticated users to use codes" ON public.special_activation_codes;
DROP POLICY IF EXISTS "Allow public read access" ON public.special_activation_codes;

-- By not adding any new SELECT policies for 'anon' or 'authenticated' roles,
-- we effectively block all client-side read access to the entire table,
-- which is the desired secure state. Edge Functions using the service_role key
-- will bypass RLS and can still access the data.
