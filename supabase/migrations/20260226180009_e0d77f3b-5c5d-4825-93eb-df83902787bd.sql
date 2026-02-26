
-- Allow public inserts into submissions (no auth needed — intake is anonymous)
CREATE POLICY "public_insert_submissions" ON public.submissions
  FOR INSERT WITH CHECK (true);
