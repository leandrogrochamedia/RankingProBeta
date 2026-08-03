-- Proofly: propostas de contratação (opcional — app usa localStorage como fallback)

CREATE TABLE IF NOT EXISTS public.hiring_proposals (
  id TEXT PRIMARY KEY,
  establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'proposed',
  proposal_type TEXT DEFAULT 'negotiate',
  compensation_model TEXT DEFAULT 'a_combinar',
  offer_text TEXT,
  message TEXT,
  match_percent NUMERIC(5,2),
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hiring_proposals_est ON public.hiring_proposals(establishment_id);
CREATE INDEX IF NOT EXISTS idx_hiring_proposals_prof ON public.hiring_proposals(professional_id);
CREATE INDEX IF NOT EXISTS idx_hiring_proposals_status ON public.hiring_proposals(status);

ALTER TABLE public.hiring_proposals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for anon" ON public.hiring_proposals;
CREATE POLICY "Allow all for anon" ON public.hiring_proposals FOR ALL USING (true) WITH CHECK (true);

GRANT ALL ON public.hiring_proposals TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';