/*
          # [Operation Name]
          Add Service Areas Column

          ## Query Description: [This operation adds a new `service_areas` column to the `therapists` and `places` tables. This column will store an array of text strings, allowing providers to list the surrounding areas they serve. This change is non-destructive and will not affect existing data; the new column will be `NULL` for existing rows.]
          
          ## Metadata:
          - Schema-Category: ["Structural"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [true]
          
          ## Structure Details:
          - tables: `public.therapists`, `public.places`
          - columns: `service_areas` (TEXT[])
          
          ## Security Implications:
          - RLS Status: [Enabled]
          - Policy Changes: [No]
          - Auth Requirements: [The existing `SELECT` policies will allow this column to be read. The `update-profile` function will handle secure updates.]
          
          ## Performance Impact:
          - Indexes: [None]
          - Triggers: [None]
          - Estimated Impact: [Negligible performance impact.]
          */
ALTER TABLE public.therapists ADD COLUMN service_areas TEXT[] NULL;
ALTER TABLE public.places ADD COLUMN service_areas TEXT[] NULL;
