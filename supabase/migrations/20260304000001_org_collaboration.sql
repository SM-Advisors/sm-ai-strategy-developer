
-- ============================================================
-- Phase 1: Organization-based collaboration schema
-- ============================================================

-- 1. Add org_name to access_codes (backfill from label)
ALTER TABLE public.access_codes
  ADD COLUMN IF NOT EXISTS org_name text;

UPDATE public.access_codes
  SET org_name = label
  WHERE org_name IS NULL AND label IS NOT NULL;

-- 2. Create org_users table
CREATE TABLE IF NOT EXISTS public.org_users (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  access_code_id uuid NOT NULL REFERENCES public.access_codes(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT org_users_code_email_key UNIQUE (access_code_id, email)
);

ALTER TABLE public.org_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_full_access" ON public.org_users
  FOR ALL
  USING (auth.email() = ANY (ARRAY['coryk@smaiadvisors.com', 'allim@smaiadvisors.com']))
  WITH CHECK (auth.email() = ANY (ARRAY['coryk@smaiadvisors.com', 'allim@smaiadvisors.com']));

-- Allow service role (edge functions) to manage org_users
CREATE POLICY "service_role_full_access" ON public.org_users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 3. Modify submissions to link to org
ALTER TABLE public.submissions
  ADD COLUMN IF NOT EXISTS access_code_id uuid REFERENCES public.access_codes(id),
  ADD COLUMN IF NOT EXISTS last_edited_by uuid REFERENCES public.org_users(id),
  ADD COLUMN IF NOT EXISTS last_edited_at timestamptz;

-- One submission per org (partial unique index — allows NULLs for legacy rows)
CREATE UNIQUE INDEX IF NOT EXISTS submissions_access_code_id_unique
  ON public.submissions(access_code_id)
  WHERE access_code_id IS NOT NULL;

-- 4. Create field_edit_log (append-only audit trail)
CREATE TABLE IF NOT EXISTS public.field_edit_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id uuid NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  field_id text NOT NULL,
  old_value text,
  new_value text,
  edited_by uuid REFERENCES public.org_users(id),
  edited_by_andrea boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.field_edit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_full_access" ON public.field_edit_log
  FOR ALL
  USING (auth.email() = ANY (ARRAY['coryk@smaiadvisors.com', 'allim@smaiadvisors.com']))
  WITH CHECK (auth.email() = ANY (ARRAY['coryk@smaiadvisors.com', 'allim@smaiadvisors.com']));

CREATE POLICY "service_role_full_access" ON public.field_edit_log
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 5. Create field_notes (one note per user per field)
CREATE TABLE IF NOT EXISTS public.field_notes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id uuid NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  field_id text NOT NULL,
  org_user_id uuid NOT NULL REFERENCES public.org_users(id) ON DELETE CASCADE,
  note_text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT field_notes_unique_per_user UNIQUE (submission_id, field_id, org_user_id)
);

ALTER TABLE public.field_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_full_access" ON public.field_notes
  FOR ALL
  USING (auth.email() = ANY (ARRAY['coryk@smaiadvisors.com', 'allim@smaiadvisors.com']))
  WITH CHECK (auth.email() = ANY (ARRAY['coryk@smaiadvisors.com', 'allim@smaiadvisors.com']));

CREATE POLICY "service_role_full_access" ON public.field_notes
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow service role to manage submissions (needed for upsert in save-intake)
CREATE POLICY "service_role_full_access" ON public.submissions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
