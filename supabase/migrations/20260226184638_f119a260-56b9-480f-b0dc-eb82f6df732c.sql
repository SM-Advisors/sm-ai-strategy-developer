
-- Allow public uploads to the plans bucket (anon can insert)
CREATE POLICY "Public can upload plans"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'plans');

-- Allow admin to read plans
CREATE POLICY "Admin can read plans"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'plans'
    AND auth.email() = ANY (ARRAY['coryk@smaiadvisors.com'::text, 'allim@smaiadvisors.com'::text])
  );

-- Allow admin to delete plans
CREATE POLICY "Admin can delete plans"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'plans'
    AND auth.email() = ANY (ARRAY['coryk@smaiadvisors.com'::text, 'allim@smaiadvisors.com'::text])
  );
