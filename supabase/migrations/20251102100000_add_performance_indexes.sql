/*
          # [Operation Name] Add Performance Indexes
          [This operation adds database indexes to frequently queried columns to improve application performance and search speed.]

          ## Query Description: [This operation is safe and will not affect existing data. It creates indexes on the `therapists`, `places`, and `reviews` tables. This will significantly speed up filtering by city and status, as well as fetching reviews for a specific profile, especially as the database grows.]
          
          ## Metadata:
          - Schema-Category: ["Structural"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [true]
          
          ## Structure Details:
          - therapists: Adds index on (city, status)
          - places: Adds index on (city, status)
          - reviews: Adds index on (target_id, status)
          
          ## Security Implications:
          - RLS Status: [Enabled]
          - Policy Changes: [No]
          - Auth Requirements: [None]
          
          ## Performance Impact:
          - Indexes: [Added]
          - Triggers: [None]
          - Estimated Impact: [Positive. Read queries will be faster. Write operations will have a negligible overhead.]
          */

CREATE INDEX IF NOT EXISTS idx_therapists_city_status ON public.therapists (city, status);
CREATE INDEX IF NOT EXISTS idx_places_city_status ON public.places (city, status);
CREATE INDEX IF NOT EXISTS idx_reviews_target_id_status ON public.reviews (target_id, status);
