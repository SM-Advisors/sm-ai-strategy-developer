CREATE TABLE public.plan_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  version_number integer NOT NULL DEFAULT 1,
  file_path text NOT NULL,
  label text NOT NULL DEFAULT 'Generated',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (submission_id, version_number)
);

ALTER TABLE public.plan_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_full_access" ON public.plan_versions FOR ALL
  USING (auth.email() = ANY (ARRAY['coryk@smaiadvisors.com', 'allim@smaiadvisors.com']))
  WITH CHECK (auth.email() = ANY (ARRAY['coryk@smaiadvisors.com', 'allim@smaiadvisors.com']));

CREATE POLICY "service_role_full_access" ON public.plan_versions FOR ALL
  USING (true) WITH CHECK (true);

CREATE POLICY "public_insert_plan_versions" ON public.plan_versions FOR INSERT
  WITH CHECK (true);