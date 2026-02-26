
-- Create submissions table
CREATE TABLE public.submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT,
  industry TEXT,
  num_employees TEXT,
  intake_data JSONB NOT NULL,
  plan_file_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- Only admin can access
CREATE POLICY "admin_full_access" ON public.submissions
  FOR ALL
  USING (auth.email() = 'coryk@smaiadvisors.com')
  WITH CHECK (auth.email() = 'coryk@smaiadvisors.com');

-- Create plans storage bucket (private)
INSERT INTO storage.buckets (id, name, public) VALUES ('plans', 'plans', false)
ON CONFLICT (id) DO NOTHING;

-- Admin can read/write plans bucket
CREATE POLICY "admin_read_plans" ON storage.objects
  FOR SELECT USING (bucket_id = 'plans' AND auth.email() = 'coryk@smaiadvisors.com');

CREATE POLICY "admin_insert_plans" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'plans' AND auth.email() = 'coryk@smaiadvisors.com');

CREATE POLICY "admin_update_plans" ON storage.objects
  FOR UPDATE USING (bucket_id = 'plans' AND auth.email() = 'coryk@smaiadvisors.com');

CREATE POLICY "admin_delete_plans" ON storage.objects
  FOR DELETE USING (bucket_id = 'plans' AND auth.email() = 'coryk@smaiadvisors.com');
