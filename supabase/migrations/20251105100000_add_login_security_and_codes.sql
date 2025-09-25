/*
          # [Operation Name]
          Add Login Security and Special Activation Codes

          ## Query Description: [This migration introduces significant security and feature enhancements. It adds a table to store 50 reusable activation codes with a 3-day cooldown mechanism. It also adds a `failed_login_attempts` column to the `therapists` and `places` tables to enable a 3-strikes-and-email security policy for failed logins. This operation is structural and safe, as it only adds new tables and columns without altering existing data.]
          
          ## Metadata:
          - Schema-Category: ["Structural"]
          - Impact-Level: ["Medium"]
          - Requires-Backup: [false]
          - Reversible: [true]
          
          ## Structure Details:
          - New Table: `public.special_activation_codes` (columns: id, code, last_used_at)
          - New Column: `failed_login_attempts` added to `public.therapists`
          - New Column: `failed_login_attempts` added to `public.places`
          
          ## Security Implications:
          - RLS Status: [Enabled]
          - Policy Changes: [Yes]
          - Auth Requirements: [The new table is protected, only accessible by service_role.]
          
          ## Performance Impact:
          - Indexes: [Primary key and unique index on new table.]
          - Triggers: [None]
          - Estimated Impact: [Low. The changes are additive and will not impact existing query performance.]
          */

-- Create the table for special activation codes
CREATE TABLE IF NOT EXISTS public.special_activation_codes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code text NOT NULL,
    last_used_at timestamp with time zone,
    CONSTRAINT special_activation_codes_pkey PRIMARY KEY (id),
    CONSTRAINT special_activation_codes_code_key UNIQUE (code)
);

-- Enable RLS and set policies for the new table
ALTER TABLE public.special_activation_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow admin read access" ON public.special_activation_codes FOR SELECT USING (auth.role() = 'service_role');
CREATE POLICY "Allow admin update access" ON public.special_activation_codes FOR UPDATE USING (auth.role() = 'service_role');

-- Add failed login attempts columns to user tables
ALTER TABLE public.therapists ADD COLUMN IF NOT EXISTS failed_login_attempts integer DEFAULT 0 NOT NULL;
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS failed_login_attempts integer DEFAULT 0 NOT NULL;

-- Generate and insert 50 unique, random codes
DO $$
DECLARE
    i int;
    new_code text;
    chars text[] := string_to_array('ABCDEFGHIJKLMNPQRSTUVWXYZ123456789', NULL);
BEGIN
    FOR i IN 1..50 LOOP
        LOOP
            new_code := (
                SELECT string_agg(chars[1 + floor(random() * array_length(chars, 1))], '')
                FROM generate_series(1, 8)
            );
            BEGIN
                INSERT INTO public.special_activation_codes (code) VALUES (new_code);
                EXIT; -- Exit loop if insert is successful
            EXCEPTION WHEN unique_violation THEN
                -- Do nothing, loop will continue to generate a new code
            END;
        END LOOP;
    END LOOP;
END $$;
