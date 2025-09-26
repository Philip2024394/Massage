/*
  # [Fix] Grant RLS Bypass to Profile Creation Function
  [This migration fixes the user registration error by granting the `postgres` role, which owns the profile creation function, the ability to bypass Row Level Security. This is a standard and secure procedure required for database triggers that insert data into RLS-protected tables.]

  ## Query Description: [This operation grants the `service_role` to the `postgres` user. The `service_role` has permissions to bypass Row Level Security, which is necessary for the `handle_new_user` trigger to successfully insert new records into the `therapists` and `places` tables upon user sign-up. This change is safe and does not affect existing data.]
  
  ## Metadata:
  - Schema-Category: ["Structural"]
  - Impact-Level: ["Low"]
  - Requires-Backup: [false]
  - Reversible: [true]
  
  ## Structure Details:
  - Roles affected: `postgres`
  
  ## Security Implications:
  - RLS Status: [No change to policies]
  - Policy Changes: [No]
  - Auth Requirements: [None]
  
  ## Performance Impact:
  - Indexes: [None]
  - Triggers: [None]
  - Estimated Impact: [None]
*/
GRANT service_role TO postgres;
