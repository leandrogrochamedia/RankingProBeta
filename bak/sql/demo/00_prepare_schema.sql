-- ============================================================
-- 00 — Preparar schema (rode ANTES do 01 se der erro de tabela)
-- Corrige: professional_establishments inexistente · updated_at ausente
-- Garante client_profiles (rename de clients se ainda não migrou)
-- ============================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'clients'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'client_profiles'
  ) THEN
    ALTER TABLE public.clients RENAME TO client_profiles;
  END IF;
END $$;

ALTER TABLE public.client_profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS client_id UUID;

-- Garante tabela professional_establishments (plural) + view singular (API)
DO $prep$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'professional_establishments'
  ) THEN
    RAISE NOTICE 'OK: professional_establishments já existe';
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'professional_establishment' AND table_type = 'BASE TABLE'
  ) THEN
    ALTER TABLE public.professional_establishment RENAME TO professional_establishments;
    RAISE NOTICE 'Renomeado: professional_establishment → professional_establishments';
  ELSE
    DROP VIEW IF EXISTS public.professional_establishment CASCADE;
    CREATE TABLE public.professional_establishments (
      id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      professional_id   UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
      establishment_id  UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
      is_current        BOOLEAN NOT NULL DEFAULT FALSE,
      started_at        TIMESTAMPTZ DEFAULT NOW(),
      ended_at          TIMESTAMPTZ,
      created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    RAISE NOTICE 'Criado: professional_establishments';
  END IF;
END $prep$;

DROP VIEW IF EXISTS public.professional_establishment;
CREATE OR REPLACE VIEW public.professional_establishment AS
SELECT id, professional_id, establishment_id, is_current, started_at, ended_at, created_at
FROM public.professional_establishments;

CREATE INDEX IF NOT EXISTS idx_prof_est_professional ON public.professional_establishments(professional_id);
CREATE INDEX IF NOT EXISTS idx_prof_est_establishment ON public.professional_establishments(establishment_id);
CREATE INDEX IF NOT EXISTS idx_prof_est_current ON public.professional_establishments(is_current) WHERE is_current = TRUE;

ALTER TABLE public.professional_establishments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for anon" ON public.professional_establishments;
CREATE POLICY "Allow all for anon" ON public.professional_establishments FOR ALL USING (true) WITH CHECK (true);

GRANT ALL ON public.professional_establishments TO anon, authenticated, service_role;
GRANT SELECT ON public.professional_establishment TO anon, authenticated, service_role;

SELECT 'professional_establishments' AS tabela, COUNT(*) AS registros FROM public.professional_establishments;