/*
# [SECURITY] Set Function Search Path
This migration secures existing database functions by explicitly setting the `search_path`. This addresses the "Function Search Path Mutable" security advisory by preventing potential hijacking attacks where a function might execute code from an untrusted schema.

## Query Description:
This operation modifies the definition of four existing functions: `handle_new_user`, `update_therapist_rating`, `update_place_rating`, and `update_account_number_and_code`. It adds `SET search_path = public;` to the beginning of each function body. This change is non-destructive and enhances security without affecting function behavior.

## Metadata:
- Schema-Category: ["Security", "Structural"]
- Impact-Level: ["Low"]
- Requires-Backup: false
- Reversible: true

## Structure Details:
- Functions modified:
  - public.handle_new_user()
  - public.update_therapist_rating()
  - public.update_place_rating()
  - public.update_account_number_and_code()

## Security Implications:
- RLS Status: Unchanged
- Policy Changes: No
- Auth Requirements: None
- Mitigates: "Function Search Path Mutable" vulnerability.

## Performance Impact:
- Indexes: None
- Triggers: None
- Estimated Impact: Negligible. Adds a single command to the start of function execution.
*/

-- Secure handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  SET search_path = public;
  IF NEW.raw_user_meta_data->>'account_type' = 'therapist' THEN
    INSERT INTO public.therapists (id, email, name, status)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'name', 'unpaid');
  ELSIF NEW.raw_user_meta_data->>'account_type' = 'place' THEN
    INSERT INTO public.places (id, email, name, status)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'name', 'unpaid');
  END IF;
  RETURN NEW;
END;
$$;

-- Secure update_therapist_rating function
CREATE OR REPLACE FUNCTION public.update_therapist_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  SET search_path = public;
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE public.therapists
    SET
      rating = (
        SELECT AVG(rating)
        FROM public.reviews
        WHERE target_id = NEW.target_id AND status = 'approved'
      ),
      review_count = (
        SELECT COUNT(*)
        FROM public.reviews
        WHERE target_id = NEW.target_id AND status = 'approved'
      )
    WHERE id = NEW.target_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.therapists
    SET
      rating = (
        SELECT COALESCE(AVG(rating), 0)
        FROM public.reviews
        WHERE target_id = OLD.target_id AND status = 'approved'
      ),
      review_count = (
        SELECT COUNT(*)
        FROM public.reviews
        WHERE target_id = OLD.target_id AND status = 'approved'
      )
    WHERE id = OLD.target_id;
  END IF;
  RETURN NULL;
END;
$$;

-- Secure update_place_rating function
CREATE OR REPLACE FUNCTION public.update_place_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  SET search_path = public;
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE public.places
    SET
      rating = (
        SELECT AVG(rating)
        FROM public.reviews
        WHERE target_id = NEW.target_id AND status = 'approved'
      ),
      review_count = (
        SELECT COUNT(*)
        FROM public.reviews
        WHERE target_id = NEW.target_id AND status = 'approved'
      )
    WHERE id = NEW.target_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.places
    SET
      rating = (
        SELECT COALESCE(AVG(rating), 0)
        FROM public.reviews
        WHERE target_id = OLD.target_id AND status = 'approved'
      ),
      review_count = (
        SELECT COUNT(*)
        FROM public.reviews
        WHERE target_id = OLD.target_id AND status = 'approved'
      )
    WHERE id = OLD.target_id;
  END IF;
  RETURN NULL;
END;
$$;

-- Secure update_account_number_and_code function
CREATE OR REPLACE FUNCTION public.update_account_number_and_code()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  _prefix TEXT;
  _random_str TEXT;
BEGIN
  SET search_path = public;
  _prefix := LEFT(TG_TABLE_NAME, 3);
  _random_str := SUBSTRING(MD5(RANDOM()::TEXT), 1, 7);
  NEW.account_number := UPPER(CONCAT(_prefix, '-', _random_str));
  NEW.login_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 6));
  RETURN NEW;
END;
$$;
