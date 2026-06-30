-- ============================================================
-- 01 — Reset TOTAL (apaga TUDO, inclusive Leandro)
-- Recrie o login manualmente depois pelo app
-- ============================================================

BEGIN;

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

-- Corrige coluna updated_at ausente (trigger set_updated_at quebra sem ela)
ALTER TABLE public.client_profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Preparar tabela de vínculos prof ↔ estab
DO $prep$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'professional_establishments'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'professional_establishment' AND table_type = 'BASE TABLE'
    ) THEN
      ALTER TABLE public.professional_establishment RENAME TO professional_establishments;
    ELSE
      DROP VIEW IF EXISTS public.professional_establishment CASCADE;
      CREATE TABLE IF NOT EXISTS public.professional_establishments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        professional_id UUID REFERENCES public.professionals(id) ON DELETE CASCADE,
        establishment_id UUID REFERENCES public.establishments(id) ON DELETE CASCADE,
        is_current BOOLEAN NOT NULL DEFAULT FALSE,
        started_at TIMESTAMPTZ DEFAULT NOW(),
        ended_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    END IF;
    DROP VIEW IF EXISTS public.professional_establishment;
    CREATE OR REPLACE VIEW public.professional_establishment AS
    SELECT id, professional_id, establishment_id, is_current, started_at, ended_at, created_at
    FROM public.professional_establishments;
  END IF;
END $prep$;

-- Apagar tudo (ordem respeitando FKs) — só DELETE, sem UPDATE
DELETE FROM public.qr_codes;
DELETE FROM public.reviews;

DO $del_pe$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'professional_establishments') THEN
    DELETE FROM public.professional_establishments;
  ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'professional_establishment' AND table_type = 'BASE TABLE') THEN
    DELETE FROM public.professional_establishment;
  END IF;
END $del_pe$;

DELETE FROM public.professional_tags;
DELETE FROM public.establishment_tags;
DELETE FROM public.professional_profiles;
DELETE FROM public.professional_private_data;
DELETE FROM public.user_profiles;
DELETE FROM public.users;
DELETE FROM public.client_profiles;
DELETE FROM public.professionals;
DELETE FROM public.establishments;

COMMIT;

SELECT 'users' AS tabela, COUNT(*) AS restantes FROM public.users
UNION ALL SELECT 'client_profiles', COUNT(*) FROM public.client_profiles
UNION ALL SELECT 'establishments', COUNT(*) FROM public.establishments
UNION ALL SELECT 'professionals', COUNT(*) FROM public.professionals
UNION ALL SELECT 'reviews', COUNT(*) FROM public.reviews;