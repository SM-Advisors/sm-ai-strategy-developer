-- Create access_codes table for managing user access to the platform
CREATE TABLE public.access_codes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code text NOT NULL,
  label text NULL,
  is_active boolean NOT NULL DEFAULT true,
  use_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT access_codes_pkey PRIMARY KEY (id),
  CONSTRAINT access_codes_code_key UNIQUE (code)
);

-- Enable Row Level Security
ALTER TABLE public.access_codes ENABLE ROW LEVEL SECURITY;

-- Only admin (coryk@smaiadvisors.com) can read and write access codes
CREATE POLICY "admin_full_access" ON public.access_codes
  FOR ALL
  TO authenticated
  USING (auth.email() = 'coryk@smaiadvisors.com')
  WITH CHECK (auth.email() = 'coryk@smaiadvisors.com');
