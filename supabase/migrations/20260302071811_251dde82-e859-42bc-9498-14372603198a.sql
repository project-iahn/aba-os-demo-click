
-- =============================================
-- Trial-Centric ABA Data Model
-- Child → Session → Program → Trial
-- =============================================

-- 1. Children table
CREATE TABLE public.children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id UUID REFERENCES public.centers(id) ON DELETE SET NULL,
  therapist_user_id UUID NOT NULL, -- references profiles.user_id
  name TEXT NOT NULL,
  age INT,
  birth_date DATE,
  concern TEXT,
  diagnosis TEXT,
  guardian_name TEXT,
  guardian_phone TEXT,
  guardian_relation TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  start_date DATE,
  last_session_date DATE,
  notes TEXT,
  estimated_dev_age INT, -- developmental age in months
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;

-- Therapists see their own children, admins see all center children
CREATE POLICY "Therapists can view own children"
  ON public.children FOR SELECT
  TO authenticated
  USING (
    therapist_user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Therapists can insert children"
  ON public.children FOR INSERT
  TO authenticated
  WITH CHECK (
    therapist_user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Therapists can update own children"
  ON public.children FOR UPDATE
  TO authenticated
  USING (
    therapist_user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
  );

-- 2. Programs (Goals) table
CREATE TABLE public.programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- skill domain: 의사소통, 수용언어, 표현언어, 사회성, 놀이, 감각통합, 행동, 자조기술
  target_criteria TEXT,
  status TEXT NOT NULL DEFAULT 'active', -- active, mastered, paused
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Therapists can view programs for own children"
  ON public.programs FOR SELECT
  TO authenticated
  USING (
    child_id IN (SELECT id FROM public.children WHERE therapist_user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Therapists can insert programs"
  ON public.programs FOR INSERT
  TO authenticated
  WITH CHECK (
    child_id IN (SELECT id FROM public.children WHERE therapist_user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Therapists can update programs"
  ON public.programs FOR UPDATE
  TO authenticated
  USING (
    child_id IN (SELECT id FROM public.children WHERE therapist_user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

-- 3. Sessions table
CREATE TABLE public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  therapist_user_id UUID NOT NULL,
  session_date DATE NOT NULL,
  duration_minutes INT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Therapists can view own sessions"
  ON public.sessions FOR SELECT
  TO authenticated
  USING (
    therapist_user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Therapists can insert sessions"
  ON public.sessions FOR INSERT
  TO authenticated
  WITH CHECK (
    therapist_user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Therapists can update own sessions"
  ON public.sessions FOR UPDATE
  TO authenticated
  USING (
    therapist_user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
  );

-- 4. Trials table (CORE - behavioral unit data)
CREATE TABLE public.trials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  trial_order INT NOT NULL DEFAULT 1,
  stimulus TEXT, -- what was presented (e.g., "사과", "앉아")
  response TEXT, -- what child did
  result TEXT NOT NULL DEFAULT 'correct', -- correct, incorrect, no_response
  prompt_level INT NOT NULL DEFAULT 0, -- 0=independent, 1=gestural, 2=verbal, 3=partial_physical, 4=full_physical
  latency_seconds NUMERIC, -- response time
  problem_behavior BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.trials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Therapists can view trials for own sessions"
  ON public.trials FOR SELECT
  TO authenticated
  USING (
    session_id IN (SELECT id FROM public.sessions WHERE therapist_user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Therapists can insert trials"
  ON public.trials FOR INSERT
  TO authenticated
  WITH CHECK (
    session_id IN (SELECT id FROM public.sessions WHERE therapist_user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Therapists can update trials"
  ON public.trials FOR UPDATE
  TO authenticated
  USING (
    session_id IN (SELECT id FROM public.sessions WHERE therapist_user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Therapists can delete trials"
  ON public.trials FOR DELETE
  TO authenticated
  USING (
    session_id IN (SELECT id FROM public.sessions WHERE therapist_user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

-- 5. Reports table
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  period TEXT,
  period_start DATE,
  period_end DATE,
  summary TEXT,
  content TEXT,
  included_program_ids UUID[],
  created_by_user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Therapists can view reports for own children"
  ON public.reports FOR SELECT
  TO authenticated
  USING (
    created_by_user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Therapists can insert reports"
  ON public.reports FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by_user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Therapists can update own reports"
  ON public.reports FOR UPDATE
  TO authenticated
  USING (
    created_by_user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
  );

-- 6. Indexes for performance
CREATE INDEX idx_programs_child_id ON public.programs(child_id);
CREATE INDEX idx_sessions_child_id ON public.sessions(child_id);
CREATE INDEX idx_sessions_date ON public.sessions(session_date);
CREATE INDEX idx_trials_session_id ON public.trials(session_id);
CREATE INDEX idx_trials_program_id ON public.trials(program_id);
CREATE INDEX idx_trials_result ON public.trials(result);
CREATE INDEX idx_reports_child_id ON public.reports(child_id);

-- 7. Updated_at triggers
CREATE TRIGGER update_children_updated_at
  BEFORE UPDATE ON public.children
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_programs_updated_at
  BEFORE UPDATE ON public.programs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reports_updated_at
  BEFORE UPDATE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
