-- Tighten scenario_results RLS: remove public INSERT/UPDATE/DELETE policies.
-- All mutations now go through the save-intake edge function (service role key).
-- Public SELECT remains for reading results in the UI.

DROP POLICY IF EXISTS "public_insert_scenario_results" ON public.scenario_results;
DROP POLICY IF EXISTS "public_update_scenario_results" ON public.scenario_results;
DROP POLICY IF EXISTS "public_delete_scenario_results" ON public.scenario_results;
