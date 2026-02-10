-- REFINED SUPABASE EMAIL GATING SCRIPT
-- Run this in your Supabase SQL Editor

-- 1. Create the gating function
CREATE OR REPLACE FUNCTION public.check_user_whitelist()
RETURNS TRIGGER AS $$
BEGIN
  -- List your authorized emails here (lower case comparison for safety)
  IF LOWER(NEW.email) IN (
    'rock.whittington@gmail.com', 
    'marianneangelir@gmail.com'
  ) THEN
    RETURN NEW; -- Authorized
  ELSE
    -- Rejection message
    RAISE EXCEPTION 'This email is not authorized to create an account.';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Attach the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.check_user_whitelist();
