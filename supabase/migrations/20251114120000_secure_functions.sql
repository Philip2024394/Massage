/*
# [Security Hardening] Set Function Search Path
This migration hardens the security of custom database functions by setting a fixed `search_path`. This is a best practice to prevent potential security vulnerabilities related to path manipulation and resolves the "Function Search Path Mutable" warnings.

## Query Description:
- This operation replaces two existing functions (`handle_new_user` and `update_review_stats`) to include `SET search_path = public` in their definitions.
- This change is non-destructive and does not affect existing data. It improves the security and predictability of the function execution environment.

## Metadata:
- Schema-Category: ["Safe", "Structural"]
- Impact-Level: ["Low"]
- Requires-Backup: false
- Reversible: true (by re-deploying the previous migration)

## Structure Details:
- Affects function: `public.handle_new_user()`
- Affects function: `public.update_review_stats()`

## Security Implications:
- RLS Status: Unchanged
- Policy Changes: No
- Auth Requirements: None
- Mitigates: Potential for search path attacks on SECURITY DEFINER functions.

## Performance Impact:
- Indexes: None
- Triggers: None
- Estimated Impact: Negligible.
*/

-- Secure the handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  account_type_val TEXT;
  new_login_code TEXT;
  new_account_number TEXT;
BEGIN
  account_type_val := NEW.raw_user_meta_data->>'account_type';
  
  LOOP
    new_login_code := (
      SELECT string_agg(substr('ABCDEFGHIJKLMNPQRSTUVWXYZ123456789', floor(random() * 35)::int + 1, 1), '')
      FROM generate_series(1, 6)
    );
    IF account_type_val = 'therapist' THEN
      IF NOT EXISTS (SELECT 1 FROM public.therapists WHERE login_code = new_login_code) THEN
        EXIT;
      END IF;
    ELSE
      IF NOT EXISTS (SELECT 1 FROM public.places WHERE login_code = new_login_code) THEN
        EXIT;
      END IF;
    END IF;
  END LOOP;
  
  new_account_number := UPPER(LEFT(account_type_val, 3)) || '-' || (
    SELECT string_agg(substr('ABCDEFGHIJKLMNPQRSTUVWXYZ123456789', floor(random() * 35)::int + 1, 1), '')
    FROM generate_series(1, 7)
  );

  IF account_type_val = 'therapist' THEN
    INSERT INTO public.therapists (id, email, name, login_code, account_number, status)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'name', new_login_code, new_account_number, 'unpaid');
  ELSIF account_type_val = 'place' THEN
    INSERT INTO public.places (id, email, name, login_code, account_number, status)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'name', new_login_code, new_account_number, 'unpaid');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- Secure the update_review_stats function
CREATE OR REPLACE FUNCTION public.update_review_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT' AND NEW.status = 'approved') OR (TG_OP = 'UPDATE' AND NEW.status = 'approved' AND OLD.status <> 'approved') THEN
        IF NEW.target_type = 'therapist' THEN
            UPDATE public.therapists
            SET review_count = review_count + 1,
                rating = (rating * (review_count) + NEW.rating) / (review_count + 1)
            WHERE id = NEW.target_id;
        ELSIF NEW.target_type = 'place' THEN
            UPDATE public.places
            SET review_count = review_count + 1,
                rating = (rating * (review_count) + NEW.rating) / (review_count + 1)
            WHERE id = NEW.target_id;
        END IF;
    ELSIF (TG_OP = 'UPDATE' AND OLD.status = 'approved' AND NEW.status <> 'approved') THEN
        IF NEW.target_type = 'therapist' THEN
            UPDATE public.therapists
            SET review_count = GREATEST(0, review_count - 1),
                rating = CASE WHEN review_count > 1 THEN (rating * review_count - OLD.rating) / (review_count - 1) ELSE 0 END
            WHERE id = NEW.target_id;
        ELSIF NEW.target_type = 'place' THEN
            UPDATE public.places
            SET review_count = GREATEST(0, review_count - 1),
                rating = CASE WHEN review_count > 1 THEN (rating * review_count - OLD.rating) / (review_count - 1) ELSE 0 END
            WHERE id = NEW.target_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
