
-- Remove public INSERT/UPDATE/DELETE policies on scenario_results
-- All mutations now go through save-intake edge function with service role key

DROP POLICY IF EXISTS "public_insert_scenario_results" ON public.scenario_results;
DROP POLICY IF EXISTS "public_update_scenario_results" ON public.scenario_results;
DROP POLICY IF EXISTS "public_delete_scenario_results" ON public.scenario_results;
