
-- Update access_codes admin policy for both admin emails
DROP POLICY IF EXISTS "admin_full_access" ON public.access_codes;
CREATE POLICY "admin_full_access" ON public.access_codes
  FOR ALL
  USING (auth.email() = ANY (ARRAY['coryk@smaiadvisors.com', 'allim@smaiadvisors.com']))
  WITH CHECK (auth.email() = ANY (ARRAY['coryk@smaiadvisors.com', 'allim@smaiadvisors.com']));

-- Update submissions admin policy for both admin emails
DROP POLICY IF EXISTS "admin_full_access" ON public.submissions;
CREATE POLICY "admin_full_access" ON public.submissions
  FOR ALL
  USING (auth.email() = ANY (ARRAY['coryk@smaiadvisors.com', 'allim@smaiadvisors.com']))
  WITH CHECK (auth.email() = ANY (ARRAY['coryk@smaiadvisors.com', 'allim@smaiadvisors.com']));
