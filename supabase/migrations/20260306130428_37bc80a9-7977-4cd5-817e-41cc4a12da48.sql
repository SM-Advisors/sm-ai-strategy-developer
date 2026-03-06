CREATE TABLE public.scenario_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  stakeholder text NOT NULL,
  industry text NOT NULL,
  result_data jsonb NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (submission_id, stakeholder)
);

ALTER TABLE public.scenario_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_full_access" ON public.scenario_results FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "public_select_scenario_results" ON public.scenario_results FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_insert_scenario_results" ON public.scenario_results FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "public_update_scenario_results" ON public.scenario_results FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);