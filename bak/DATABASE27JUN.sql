-- ============================================================
-- RANKING PRO (PROOFLY) — BASE DE DADOS COMPLETA
-- Gerado: 27/JUN/2026 — análise profunda do sistema
-- PostgreSQL 14+ / Supabase
-- ============================================================
-- FONTE DE VERDADE (confiável):
--   • base-de-dados-schema.js  (espelha modelo real)
--   • base-de-dados-completa.html / BASE DE DADOS COMPLETA.html
--
-- Cruzado com código JS:
--   • user-service.js, hiring-service.js, reviews-service.js
--   • talent-market.js, api.js, sql-runner.js, admin.js
--
-- NÃO confiar cegamente em: schema.sql antigo, migrations fragmentadas,
-- sql/demo/*, novo sql.sql — este arquivo consolida o estado final.
--
-- Modelo 2026:
--   users.client_id → client_profiles (1:1)
--   users.professional_id / establishment_id → perfis vinculados
--   establishments.owner_user_id → dono (contratar / marketplace)
--   user_profiles = DEPRECATED
-- ============================================================

-- ------------------------------------------------------------
-- 0. EXTENSÕES
-- ------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------
-- 1. DROP (opcional — descomente para recriar do zero)
-- ------------------------------------------------------------
/*
DROP FUNCTION IF EXISTS public.proofly_run_migration(text) CASCADE;
DROP FUNCTION IF EXISTS public.trg_reviews_recalc_talent() CASCADE;
DROP FUNCTION IF EXISTS public.recalc_prof_talent_metrics(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.set_updated_at() CASCADE;
DROP VIEW IF EXISTS public.professional_establishment CASCADE;
DROP TABLE IF EXISTS public.hiring_proposals CASCADE;
DROP TABLE IF EXISTS public.qr_codes CASCADE;
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.professional_establishments CASCADE;
DROP TABLE IF EXISTS public.professional_tags CASCADE;
DROP TABLE IF EXISTS public.establishment_tags CASCADE;
DROP TABLE IF EXISTS public.professional_private_data CASCADE;
DROP TABLE IF EXISTS public.professional_profiles CASCADE;
DROP TABLE IF EXISTS public.professionals CASCADE;
DROP TABLE IF EXISTS public.establishments CASCADE;
DROP TABLE IF EXISTS public.client_profiles CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.tags CASCADE;
*/

-- ------------------------------------------------------------
-- 2. FUNÇÕES
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Carteira + IGV + média — espelha talent-market.js e migrations/015
CREATE OR REPLACE FUNCTION public.recalc_prof_talent_metrics(p_prof_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_carteira INTEGER := 0;
  v_total INTEGER := 0;
  v_avg NUMERIC(5,2) := 0;
  v_years INTEGER := 0;
  v_verified_ratio NUMERIC := 0;
  v_igv NUMERIC(5,2) := 0;
BEGIN
  IF p_prof_id IS NULL THEN RETURN; END IF;

  SELECT
    COUNT(DISTINCT COALESCE(r.user_id::text, r.id::text)),
    COUNT(*),
    CASE WHEN COUNT(*) = 0 THEN 0 ELSE ROUND(AVG(r.rating)::numeric, 2) END,
    CASE WHEN COUNT(*) = 0 THEN 0::numeric
         ELSE COUNT(*) FILTER (WHERE COALESCE(r.is_verified, r.verified, FALSE))::numeric / COUNT(*)
    END
  INTO v_carteira, v_total, v_avg, v_verified_ratio
  FROM public.reviews r
  WHERE r.professional_id = p_prof_id
    AND (
      r.source = 'cliente'
      OR r.review_type = 'client_to_professional'
      OR (r.source IS NULL AND (r.review_type IS NULL OR r.review_type = 'client_to_professional'))
    );

  SELECT COALESCE(pp.years_experience, 0) INTO v_years
  FROM public.professional_profiles pp WHERE pp.professional_id = p_prof_id;

  v_igv := LEAST(100, GREATEST(0, ROUND((
    (COALESCE(v_carteira, 0) * 0.45)
    + (COALESCE(v_avg, 0) * 7)
    + (COALESCE(v_years, 0) * 4)
    + (COALESCE(v_verified_ratio, 0) * 5)
  )::numeric, 2)));

  UPDATE public.professionals SET
    client_portfolio_count = COALESCE(v_carteira, 0),
    igv_score = v_igv,
    avg_rating = COALESCE(v_avg, 0),
    total_reviews = COALESCE(v_total, 0)
  WHERE id = p_prof_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_reviews_recalc_talent()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.professional_id IS NOT NULL THEN
      PERFORM public.recalc_prof_talent_metrics(OLD.professional_id);
    END IF;
    RETURN OLD;
  END IF;
  IF TG_OP = 'UPDATE' THEN
    IF OLD.professional_id IS DISTINCT FROM NEW.professional_id AND OLD.professional_id IS NOT NULL THEN
      PERFORM public.recalc_prof_talent_metrics(OLD.professional_id);
    END IF;
  END IF;
  IF NEW.professional_id IS NOT NULL THEN
    PERFORM public.recalc_prof_talent_metrics(NEW.professional_id);
  END IF;
  RETURN NEW;
END;
$$;

-- DEV — sql-log.html / sql-runner.js
CREATE OR REPLACE FUNCTION public.proofly_run_migration(p_key text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  est RECORD;
  v_owner_id UUID;
  v_owner_email TEXT;
  v_owner_name TEXT;
  v_hex TEXT;
  v_total INTEGER;
  v_with_owner INTEGER;
BEGIN
  IF p_key IS DISTINCT FROM '027_establishment_owners' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Migration desconhecida: ' || COALESCE(p_key, '(null)'));
  END IF;

  ALTER TABLE public.establishments
    ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL;
  CREATE INDEX IF NOT EXISTS idx_establishments_owner_user ON public.establishments(owner_user_id);

  UPDATE public.establishments e SET owner_user_id = u.id, updated_at = NOW()
  FROM public.users u
  WHERE u.email = 'leandro@proofly.com'
    AND e.id = '10000000-0000-4000-8000-000000000001'::uuid;

  UPDATE public.users u SET
    establishment_id = '10000000-0000-4000-8000-000000000001'::uuid,
    role = CASE WHEN u.role = 'cliente' THEN 'estabelecimento' ELSE u.role END,
    updated_at = NOW()
  WHERE u.email = 'leandro@proofly.com';

  FOR est IN
    SELECT e.id, e.name FROM public.establishments e
    WHERE e.owner_user_id IS NULL ORDER BY e.name
  LOOP
    v_hex := right(replace(est.id::text, '-', ''), 12);
    v_owner_id := ('40000000-0000-4000-8000-' || v_hex)::uuid;
    v_owner_email := 'owner.' || v_hex || '@proofly.demo';
    v_owner_name := est.name || ' — Owner';

    INSERT INTO public.users (id, name, email, provider, role, establishment_id)
    VALUES (v_owner_id, v_owner_name, v_owner_email, 'seed', 'estabelecimento', est.id)
    ON CONFLICT (email) DO UPDATE SET
      name = EXCLUDED.name, establishment_id = EXCLUDED.establishment_id,
      role = 'estabelecimento', updated_at = NOW()
    RETURNING id INTO v_owner_id;

    IF v_owner_id IS NULL THEN
      SELECT id INTO v_owner_id FROM public.users WHERE email = v_owner_email;
    END IF;
    UPDATE public.establishments SET owner_user_id = v_owner_id, updated_at = NOW() WHERE id = est.id;
  END LOOP;

  SELECT COUNT(*), COUNT(*) FILTER (WHERE owner_user_id IS NOT NULL)
  INTO v_total, v_with_owner FROM public.establishments;

  RETURN jsonb_build_object(
    'ok', true, 'migration', p_key,
    'total_establishments', v_total, 'with_owner', v_with_owner,
    'message', v_with_owner::text || '/' || v_total::text || ' estabelecimentos com owner'
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('ok', false, 'error', SQLERRM, 'sqlstate', SQLSTATE, 'migration', p_key);
END;
$func$;

-- ------------------------------------------------------------
-- 3. TABELAS — AUTH & CLIENTES
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.users (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,
  email             TEXT NOT NULL UNIQUE,
  provider          TEXT DEFAULT 'google',
  role              TEXT NOT NULL DEFAULT 'cliente'
                      CHECK (role IN ('cliente', 'profissional', 'estabelecimento', 'admin')),
  professional_id   UUID,
  establishment_id  UUID,
  client_id         UUID,
  is_admin          BOOLEAN NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_profiles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN ('professional', 'establishment', 'client')),
  profile_id  UUID NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, type, profile_id)
);

CREATE TABLE IF NOT EXISTS public.client_profiles (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,
  email             TEXT,
  cpf               TEXT,
  phone             TEXT,
  whatsapp          TEXT,
  birth_date        DATE,
  gender            TEXT,
  avatar_url        TEXT,
  zip_code          TEXT,
  street            TEXT,
  number            TEXT,
  complement        TEXT,
  neighborhood      TEXT,
  city              TEXT,
  state             TEXT,
  country           TEXT DEFAULT 'Brasil',
  prof_style_tags   TEXT[] DEFAULT '{}',
  est_style_tags    TEXT[] DEFAULT '{}',
  tags              UUID[] DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 4. TABELAS — NÚCLEO
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.tags (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  category    TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (name, category)
);

CREATE TABLE IF NOT EXISTS public.establishments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,
  type              TEXT,
  description       TEXT,
  specialty         TEXT,
  instagram         TEXT,
  avatar_url        TEXT,
  gallery_urls      TEXT[] DEFAULT '{}',
  phone             TEXT,
  whatsapp          TEXT,
  email             TEXT,
  address           TEXT,
  zip_code          TEXT,
  street            TEXT,
  number            TEXT,
  neighborhood      TEXT,
  city              TEXT,
  state             TEXT,
  country           TEXT DEFAULT 'Brasil',
  tags              TEXT[] DEFAULT '{}',
  style_tags        TEXT[] DEFAULT '{}',
  target_audience   TEXT,
  infra_tags        TEXT[] DEFAULT '{}',
  music_tags        TEXT[] DEFAULT '{}',
  positioning_tags  TEXT[] DEFAULT '{}',
  audience_tags     TEXT[] DEFAULT '{}',
  vibe_tags         TEXT[] DEFAULT '{}',
  avg_rating        NUMERIC(3,2) DEFAULT 0,
  total_reviews     INTEGER NOT NULL DEFAULT 0,
  years_active      INTEGER,
  owner_user_id     UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.professionals (
  id                            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                          TEXT NOT NULL,
  specialty                     TEXT,
  bio                           TEXT,
  phone                         TEXT,
  email                         TEXT,
  avatar_url                    TEXT,
  gallery_urls                  TEXT[] DEFAULT '{}',
  tags                          TEXT[] DEFAULT '{}',
  style_tags                    TEXT[] DEFAULT '{}',
  music_tags                    TEXT[] DEFAULT '{}',
  visual_tags                   TEXT[] DEFAULT '{}',
  personality_tags              TEXT[] DEFAULT '{}',
  lifestyle_tags                TEXT[] DEFAULT '{}',
  work_tags                     TEXT[] DEFAULT '{}',
  price_range                   TEXT,
  availability                  TEXT[] DEFAULT '{}',
  salary_expectation            TEXT,
  average_job_duration_months   INTEGER,
  work_style_tags               TEXT[] DEFAULT '{}',
  available_now                 BOOLEAN NOT NULL DEFAULT FALSE,
  seeking_work                  BOOLEAN NOT NULL DEFAULT TRUE,
  client_portfolio_count        INTEGER NOT NULL DEFAULT 0,
  igv_score                     NUMERIC(5,2),
  previous_workplaces           TEXT,
  current_establishment_id      UUID REFERENCES public.establishments(id) ON DELETE SET NULL,
  avg_rating                    NUMERIC(3,2) DEFAULT 0,
  total_reviews                 INTEGER NOT NULL DEFAULT 0,
  is_active                     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_professional_id_fkey,
  DROP CONSTRAINT IF EXISTS users_establishment_id_fkey,
  DROP CONSTRAINT IF EXISTS users_client_id_fkey;

ALTER TABLE public.users
  ADD CONSTRAINT users_professional_id_fkey
    FOREIGN KEY (professional_id) REFERENCES public.professionals(id) ON DELETE SET NULL,
  ADD CONSTRAINT users_establishment_id_fkey
    FOREIGN KEY (establishment_id) REFERENCES public.establishments(id) ON DELETE SET NULL,
  ADD CONSTRAINT users_client_id_fkey
    FOREIGN KEY (client_id) REFERENCES public.client_profiles(id) ON DELETE SET NULL;

-- ------------------------------------------------------------
-- 5. PERFIS & LGPD
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.professional_profiles (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id   UUID NOT NULL UNIQUE REFERENCES public.professionals(id) ON DELETE CASCADE,
  bio               TEXT,
  specialty         TEXT,
  years_experience  INTEGER,
  instagram         TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.professional_private_data (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id   UUID NOT NULL UNIQUE REFERENCES public.professionals(id) ON DELETE CASCADE,
  full_name         TEXT,
  cpf               TEXT,
  birth_date        DATE,
  email             TEXT,
  phone             TEXT,
  zip_code          TEXT,
  street            TEXT,
  number            TEXT,
  neighborhood      TEXT,
  city              TEXT,
  state             TEXT,
  country           TEXT DEFAULT 'Brasil',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 6. TAGS N:N (legado relacional)
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.establishment_tags (
  establishment_id  UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  tag_id            UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (establishment_id, tag_id)
);

CREATE TABLE IF NOT EXISTS public.professional_tags (
  professional_id   UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  tag_id            UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (professional_id, tag_id)
);

-- ------------------------------------------------------------
-- 7. VÍNCULOS
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.professional_establishments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id   UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  establishment_id  UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  is_current        BOOLEAN NOT NULL DEFAULT FALSE,
  started_at        TIMESTAMPTZ DEFAULT NOW(),
  ended_at          TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE VIEW public.professional_establishment AS
SELECT id, professional_id, establishment_id, is_current, started_at, ended_at, created_at
FROM public.professional_establishments;

-- ------------------------------------------------------------
-- 8. AVALIAÇÕES, QR & CONTRATAÇÃO
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.reviews (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID REFERENCES public.users(id) ON DELETE SET NULL,
  professional_id     UUID REFERENCES public.professionals(id) ON DELETE CASCADE,
  establishment_id    UUID REFERENCES public.establishments(id) ON DELETE CASCADE,
  rating              INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment             TEXT,
  verified            BOOLEAN NOT NULL DEFAULT FALSE,
  is_verified         BOOLEAN NOT NULL DEFAULT FALSE,
  source              TEXT CHECK (source IS NULL OR source IN ('cliente', 'estabelecimento', 'profissional')),
  review_type         TEXT NOT NULL DEFAULT 'client_to_professional'
                        CHECK (review_type IN (
                          'client_to_professional', 'establishment_to_professional',
                          'client_to_establishment', 'professional_to_establishment', 'profile_like'
                        )),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  qr_token            TEXT,
  rating_weight       NUMERIC(4,2),
  prof_link_snapshot  JSONB,
  CHECK (professional_id IS NOT NULL OR establishment_id IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS public.qr_codes (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id   UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  token             TEXT NOT NULL UNIQUE,
  url               TEXT NOT NULL,
  expires_at        TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.hiring_proposals (
  id                TEXT PRIMARY KEY,
  establishment_id  UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  professional_id   UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  status            TEXT NOT NULL DEFAULT 'proposed',
  proposal_type     TEXT DEFAULT 'negotiate',
  compensation_model TEXT DEFAULT 'a_combinar',
  offer_text        TEXT,
  message           TEXT,
  match_percent     NUMERIC(5,2),
  payload           JSONB,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 9. COMENTÁRIOS
-- ------------------------------------------------------------

COMMENT ON TABLE public.user_profiles IS 'DEPRECATED — use users.client_id / professional_id / establishment_id';
COMMENT ON TABLE public.client_profiles IS 'Perfil 1:1 do cliente — vinculado via users.client_id';
COMMENT ON COLUMN public.establishments.owner_user_id IS 'Dono do estabelecimento (marketplace / contratar)';
COMMENT ON COLUMN public.professionals.igv_score IS 'Índice de Geração de Valor — fórmula em talent-market.js';
COMMENT ON TABLE public.hiring_proposals IS 'Propostas contratação — hiring-service.js (localStorage + Supabase)';

-- ------------------------------------------------------------
-- 10. ÍNDICES
-- ------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_client_id ON public.users(client_id);
CREATE INDEX IF NOT EXISTS idx_professionals_name ON public.professionals(name);
CREATE INDEX IF NOT EXISTS idx_professionals_specialty ON public.professionals(specialty);
CREATE INDEX IF NOT EXISTS idx_professionals_current_establishment ON public.professionals(current_establishment_id);
CREATE INDEX IF NOT EXISTS idx_professionals_avg_rating ON public.professionals(avg_rating DESC);
CREATE INDEX IF NOT EXISTS idx_professionals_igv ON public.professionals(igv_score DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_professionals_portfolio ON public.professionals(client_portfolio_count DESC);
CREATE INDEX IF NOT EXISTS idx_professionals_available_now ON public.professionals(available_now) WHERE available_now = TRUE;
CREATE INDEX IF NOT EXISTS idx_establishments_owner_user ON public.establishments(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_establishments_name ON public.establishments(name);
CREATE INDEX IF NOT EXISTS idx_establishments_city ON public.establishments(city);
CREATE INDEX IF NOT EXISTS idx_establishments_avg_rating ON public.establishments(avg_rating DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_professional ON public.reviews(professional_id);
CREATE INDEX IF NOT EXISTS idx_reviews_establishment ON public.reviews(establishment_id);
CREATE INDEX IF NOT EXISTS idx_reviews_type ON public.reviews(review_type);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_source ON public.reviews(source);
CREATE INDEX IF NOT EXISTS idx_reviews_is_verified ON public.reviews(is_verified);
CREATE INDEX IF NOT EXISTS idx_prof_est_professional ON public.professional_establishments(professional_id);
CREATE INDEX IF NOT EXISTS idx_prof_est_establishment ON public.professional_establishments(establishment_id);
CREATE INDEX IF NOT EXISTS idx_prof_est_current ON public.professional_establishments(is_current) WHERE is_current = TRUE;
CREATE INDEX IF NOT EXISTS idx_hiring_proposals_est ON public.hiring_proposals(establishment_id);
CREATE INDEX IF NOT EXISTS idx_hiring_proposals_prof ON public.hiring_proposals(professional_id);
CREATE INDEX IF NOT EXISTS idx_hiring_proposals_status ON public.hiring_proposals(status);
CREATE INDEX IF NOT EXISTS idx_professionals_music_tags ON public.professionals USING GIN (music_tags);
CREATE INDEX IF NOT EXISTS idx_professionals_visual_tags ON public.professionals USING GIN (visual_tags);
CREATE INDEX IF NOT EXISTS idx_professionals_personality_tags ON public.professionals USING GIN (personality_tags);
CREATE INDEX IF NOT EXISTS idx_professionals_lifestyle_tags ON public.professionals USING GIN (lifestyle_tags);
CREATE INDEX IF NOT EXISTS idx_professionals_work_tags ON public.professionals USING GIN (work_tags);
CREATE INDEX IF NOT EXISTS idx_establishments_infra_tags ON public.establishments USING GIN (infra_tags);
CREATE INDEX IF NOT EXISTS idx_establishments_music_tags ON public.establishments USING GIN (music_tags);
CREATE INDEX IF NOT EXISTS idx_establishments_positioning_tags ON public.establishments USING GIN (positioning_tags);
CREATE INDEX IF NOT EXISTS idx_establishments_audience_tags ON public.establishments USING GIN (audience_tags);
CREATE INDEX IF NOT EXISTS idx_establishments_vibe_tags ON public.establishments USING GIN (vibe_tags);

-- ------------------------------------------------------------
-- 11. TRIGGERS
-- ------------------------------------------------------------

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'users', 'establishments', 'professionals', 'professional_profiles',
    'professional_private_data', 'client_profiles', 'hiring_proposals'
  ]
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%s_updated_at ON public.%I', t, t);
    EXECUTE format(
      'CREATE TRIGGER trg_%s_updated_at BEFORE UPDATE ON public.%I
       FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()', t, t);
  END LOOP;
END $$;

DROP TRIGGER IF EXISTS reviews_recalc_talent ON public.reviews;
CREATE TRIGGER reviews_recalc_talent
  AFTER INSERT OR UPDATE OF professional_id, rating, review_type, source, user_id, is_verified, verified
  OR DELETE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.trg_reviews_recalc_talent();

-- ------------------------------------------------------------
-- 12. RLS (demo aberto — frontend usa anon key)
-- ------------------------------------------------------------

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.establishments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_private_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.establishment_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_establishments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hiring_proposals ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'users', 'user_profiles', 'tags', 'establishments', 'professionals',
    'professional_profiles', 'professional_private_data', 'client_profiles',
    'establishment_tags', 'professional_tags', 'professional_establishments',
    'reviews', 'qr_codes', 'hiring_proposals'
  ]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Allow all for anon" ON public.%I', tbl);
    EXECUTE format(
      'CREATE POLICY "Allow all for anon" ON public.%I FOR ALL USING (true) WITH CHECK (true)', tbl);
  END LOOP;
END $$;

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT ON public.professional_establishment TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.proofly_run_migration(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.recalc_prof_talent_metrics(UUID) TO anon, authenticated, service_role;

-- ------------------------------------------------------------
-- 13. SEED — CATÁLOGO DE TAGS
-- ------------------------------------------------------------

INSERT INTO public.tags (name, category) VALUES
  ('Hip Hop', 'Música'), ('Rock', 'Música'), ('Sertanejo', 'Música'), ('Pop', 'Música'),
  ('MPB', 'Música'), ('Eletrônico', 'Música'), ('Jazz', 'Música'), ('Reggae', 'Música'), ('Blues', 'Música'),
  ('Streetwear', 'Visual'), ('Clássico', 'Visual'), ('Moderno', 'Visual'), ('Tradicional', 'Visual'),
  ('Casual', 'Visual'), ('Elegante', 'Visual'), ('Despojado', 'Visual'),
  ('Comunicativo', 'Personalidade'), ('Reservado', 'Personalidade'), ('Extrovertido', 'Personalidade'),
  ('Detalhista', 'Personalidade'), ('Rápido', 'Personalidade'), ('Perfeccionista', 'Personalidade'), ('Criativo', 'Personalidade'),
  ('Não bebe', 'Estilo de Vida'), ('Bebe socialmente', 'Estilo de Vida'), ('Não fuma', 'Estilo de Vida'),
  ('Vegano', 'Estilo de Vida'), ('Esportista', 'Estilo de Vida'), ('Noturno', 'Estilo de Vida'),
  ('Especialista', 'Trabalho'), ('Generalista', 'Trabalho'), ('Experiente', 'Trabalho'), ('Premium', 'Trabalho'), ('Popular', 'Trabalho'),
  ('Wi-Fi', 'Infraestrutura'), ('Café', 'Infraestrutura'), ('Bar', 'Infraestrutura'),
  ('Ar Condicionado', 'Infraestrutura'), ('Estacionamento', 'Infraestrutura'), ('Pet Friendly', 'Infraestrutura'),
  ('Acessibilidade', 'Infraestrutura'), ('TV', 'Infraestrutura'),
  ('Hip Hop', 'Música Ambiente'), ('Rock', 'Música Ambiente'), ('Sertanejo', 'Música Ambiente'),
  ('Pop', 'Música Ambiente'), ('MPB', 'Música Ambiente'), ('Eletrônico', 'Música Ambiente'),
  ('Jazz', 'Música Ambiente'), ('Reggae', 'Música Ambiente'),
  ('Premium', 'Posicionamento'), ('Popular', 'Posicionamento'), ('Tradicional', 'Posicionamento'),
  ('Moderno', 'Posicionamento'), ('Luxo', 'Posicionamento'), ('Despojado', 'Posicionamento'),
  ('Família', 'Público'), ('Adulto', 'Público'), ('LGBTQIA+', 'Público'), ('Empresarial', 'Público'),
  ('Infantil', 'Público'), ('Terceira idade', 'Público'), ('Todos', 'Público'),
  ('Descontraído', 'Vibe'), ('Sério', 'Vibe'), ('Animado', 'Vibe'), ('Calmo', 'Vibe'),
  ('Intimista', 'Vibe'), ('Acolhedor', 'Vibe')
ON CONFLICT (name, category) DO NOTHING;

-- ============================================================
-- RESUMO DO MODELO (base-de-dados-completa.html)
-- ============================================================
-- 15 tabelas + 1 view + 4 funções
-- Grupos: auth, core, profiles, tags, relations, reviews, views
-- Tabelas ausentes no schema.js mas presentes no código:
--   hiring_proposals, establishments.owner_user_id
-- ============================================================

NOTIFY pgrst, 'reload schema';