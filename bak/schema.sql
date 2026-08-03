-- ============================================================
-- PROOFLY — SCHEMA COMPLETO DO BANCO DE DADOS
-- PostgreSQL 14+ / Supabase
-- ============================================================
-- Execute no SQL Editor do Supabase (ou psql).
-- ATENÇÃO: a seção DROP apaga dados existentes. Comente se for migração.
--
-- Modelo cliente (2026): users.client_id → client_profiles (1:1).
-- user_profiles = DEPRECATED. Migração: migrations/020_simplificar_client_model.sql
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
DROP VIEW IF EXISTS professional_establishment CASCADE;
DROP TABLE IF EXISTS qr_codes CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS professional_establishments CASCADE;
DROP TABLE IF EXISTS professional_tags CASCADE;
DROP TABLE IF EXISTS establishment_tags CASCADE;
DROP TABLE IF EXISTS professional_private_data CASCADE;
DROP TABLE IF EXISTS professional_profiles CASCADE;
DROP TABLE IF EXISTS professionals CASCADE;
DROP TABLE IF EXISTS establishments CASCADE;
DROP TABLE IF EXISTS client_profiles CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS tags CASCADE;
*/

-- ------------------------------------------------------------
-- 2. FUNÇÕES AUXILIARES
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------
-- 3. TABELAS CORE
-- ------------------------------------------------------------

-- Usuários do sistema (login demo / Google fake)
CREATE TABLE IF NOT EXISTS public.users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  email           TEXT NOT NULL UNIQUE,
  provider        TEXT DEFAULT 'google',
  role            TEXT NOT NULL DEFAULT 'cliente'
                    CHECK (role IN ('cliente', 'profissional', 'estabelecimento', 'admin')),
  professional_id UUID,
  establishment_id UUID,
  client_id       UUID,
  is_admin        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- DEPRECATED — multi-perfil futuro (não usar; ver users.client_id)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN ('professional', 'establishment', 'client')),
  profile_id  UUID NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, type, profile_id)
);

-- Tags normalizadas (sistema relacional legado)
CREATE TABLE IF NOT EXISTS public.tags (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  category    TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (name, category)
);

-- Estabelecimentos
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

-- Profissionais
CREATE TABLE IF NOT EXISTS public.professionals (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                      TEXT NOT NULL,
  specialty                 TEXT,
  bio                       TEXT,
  phone                     TEXT,
  email                     TEXT,
  avatar_url                TEXT,
  gallery_urls              TEXT[] DEFAULT '{}',
  tags                      TEXT[] DEFAULT '{}',
  style_tags                TEXT[] DEFAULT '{}',
  music_tags                TEXT[] DEFAULT '{}',
  visual_tags               TEXT[] DEFAULT '{}',
  personality_tags          TEXT[] DEFAULT '{}',
  lifestyle_tags            TEXT[] DEFAULT '{}',
  work_tags                 TEXT[] DEFAULT '{}',
  price_range               TEXT,
  availability              TEXT[] DEFAULT '{}',
  salary_expectation        TEXT,
  average_job_duration_months INTEGER,
  work_style_tags           TEXT[] DEFAULT '{}',
  available_now             BOOLEAN NOT NULL DEFAULT FALSE,
  seeking_work              BOOLEAN NOT NULL DEFAULT TRUE,
  client_portfolio_count    INTEGER NOT NULL DEFAULT 0,
  igv_score                 NUMERIC(5,2),
  previous_workplaces       TEXT,
  current_establishment_id  UUID REFERENCES public.establishments(id) ON DELETE SET NULL,
  avg_rating                NUMERIC(3,2) DEFAULT 0,
  total_reviews             INTEGER NOT NULL DEFAULT 0,
  is_active                 BOOLEAN NOT NULL DEFAULT TRUE,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- FK users → perfis (após criar professionals/establishments)
ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_professional_id_fkey,
  DROP CONSTRAINT IF EXISTS users_establishment_id_fkey;

ALTER TABLE public.users
  ADD CONSTRAINT users_professional_id_fkey
    FOREIGN KEY (professional_id) REFERENCES public.professionals(id) ON DELETE SET NULL,
  ADD CONSTRAINT users_establishment_id_fkey
    FOREIGN KEY (establishment_id) REFERENCES public.establishments(id) ON DELETE SET NULL;

-- Perfil público do profissional
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

-- Dados privados / LGPD do profissional
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

-- Perfil 1:1 do cliente (vinculado via users.client_id)
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

ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_client_id_fkey;

ALTER TABLE public.users
  ADD CONSTRAINT users_client_id_fkey
    FOREIGN KEY (client_id) REFERENCES public.client_profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_users_client_id ON public.users(client_id);

COMMENT ON TABLE public.client_profiles IS
  'Perfil 1:1 do cliente — dados ricos. Vinculado via users.client_id.';
COMMENT ON TABLE public.user_profiles IS
  'DEPRECATED — multi-perfil futuro. Não usar.';

-- ------------------------------------------------------------
-- 4. RELACIONAMENTOS N:N E HISTÓRICO
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.establishment_tags (
  establishment_id  UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  tag_id            UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (establishment_id, tag_id)
);

CREATE TABLE IF NOT EXISTS public.professional_tags (
  professional_id   UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  tag_id              UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (professional_id, tag_id)
);

-- Histórico profissional ↔ estabelecimento
CREATE TABLE IF NOT EXISTS public.professional_establishments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id   UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  establishment_id  UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  is_current        BOOLEAN NOT NULL DEFAULT FALSE,
  started_at        TIMESTAMPTZ DEFAULT NOW(),
  ended_at          TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- View de compatibilidade (admin.js usa nome singular)
CREATE OR REPLACE VIEW public.professional_establishment AS
SELECT
  id,
  professional_id,
  establishment_id,
  is_current,
  started_at,
  ended_at,
  created_at
FROM public.professional_establishments;

-- ------------------------------------------------------------
-- 5. AVALIAÇÕES E QR
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.reviews (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID REFERENCES public.users(id) ON DELETE SET NULL,
  professional_id   UUID REFERENCES public.professionals(id) ON DELETE CASCADE,
  establishment_id  UUID REFERENCES public.establishments(id) ON DELETE CASCADE,
  rating            INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment           TEXT,
  verified          BOOLEAN NOT NULL DEFAULT FALSE,
  is_verified       BOOLEAN NOT NULL DEFAULT FALSE,
  source            TEXT CHECK (source IS NULL OR source IN ('cliente', 'estabelecimento', 'profissional')),
  review_type       TEXT NOT NULL DEFAULT 'client_to_professional'
                    CHECK (review_type IN (
                      'client_to_professional',
                      'establishment_to_professional',
                      'client_to_establishment',
                      'professional_to_establishment',
                      'profile_like'
                    )),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  qr_token          TEXT,
  rating_weight     NUMERIC(4,2),
  prof_link_snapshot JSONB,
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

-- ------------------------------------------------------------
-- 6. ÍNDICES
-- ------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_professionals_name ON public.professionals(name);
CREATE INDEX IF NOT EXISTS idx_professionals_specialty ON public.professionals(specialty);
CREATE INDEX IF NOT EXISTS idx_professionals_current_establishment ON public.professionals(current_establishment_id);
CREATE INDEX IF NOT EXISTS idx_professionals_avg_rating ON public.professionals(avg_rating DESC);
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

-- GIN para busca por tags em array
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
-- 7. TRIGGERS updated_at
-- ------------------------------------------------------------

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'users', 'establishments', 'professionals',
    'professional_profiles', 'professional_private_data', 'client_profiles'
  ]
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%s_updated_at ON public.%I', t, t);
    EXECUTE format(
      'CREATE TRIGGER trg_%s_updated_at BEFORE UPDATE ON public.%I
       FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()', t, t
    );
  END LOOP;
END $$;

-- ------------------------------------------------------------
-- 8. ROW LEVEL SECURITY (Supabase — modo demo aberto)
-- ------------------------------------------------------------
-- O frontend usa a anon key diretamente. Estas policies liberam CRUD.
-- Em produção, restrinja por auth.uid().

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

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'users', 'user_profiles', 'tags', 'establishments', 'professionals',
    'professional_profiles', 'professional_private_data', 'client_profiles',
    'establishment_tags', 'professional_tags', 'professional_establishments',
    'reviews', 'qr_codes'
  ]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Allow all for anon" ON public.%I', tbl);
    EXECUTE format(
      'CREATE POLICY "Allow all for anon" ON public.%I FOR ALL USING (true) WITH CHECK (true)',
      tbl
    );
  END LOOP;
END $$;

-- Grants para PostgREST / Supabase
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT ON public.professional_establishment TO anon, authenticated, service_role;

-- ------------------------------------------------------------
-- 9. SEED — TAGS PADRÃO
-- ------------------------------------------------------------

INSERT INTO public.tags (name, category) VALUES
  -- Profissional — Música
  ('Hip Hop', 'Música'),
  ('Rock', 'Música'),
  ('Sertanejo', 'Música'),
  ('Pop', 'Música'),
  ('MPB', 'Música'),
  ('Eletrônico', 'Música'),
  ('Jazz', 'Música'),
  ('Reggae', 'Música'),
  ('Blues', 'Música'),
  -- Profissional — Visual
  ('Streetwear', 'Visual'),
  ('Clássico', 'Visual'),
  ('Moderno', 'Visual'),
  ('Tradicional', 'Visual'),
  ('Casual', 'Visual'),
  ('Elegante', 'Visual'),
  ('Despojado', 'Visual'),
  -- Profissional — Personalidade
  ('Comunicativo', 'Personalidade'),
  ('Reservado', 'Personalidade'),
  ('Extrovertido', 'Personalidade'),
  ('Detalhista', 'Personalidade'),
  ('Rápido', 'Personalidade'),
  ('Perfeccionista', 'Personalidade'),
  ('Criativo', 'Personalidade'),
  -- Profissional — Estilo de Vida
  ('Não bebe', 'Estilo de Vida'),
  ('Bebe socialmente', 'Estilo de Vida'),
  ('Não fuma', 'Estilo de Vida'),
  ('Vegano', 'Estilo de Vida'),
  ('Esportista', 'Estilo de Vida'),
  ('Noturno', 'Estilo de Vida'),
  -- Profissional — Trabalho
  ('Especialista', 'Trabalho'),
  ('Generalista', 'Trabalho'),
  ('Experiente', 'Trabalho'),
  ('Premium', 'Trabalho'),
  ('Popular', 'Trabalho'),
  -- Estabelecimento — Infraestrutura
  ('Wi-Fi', 'Infraestrutura'),
  ('Café', 'Infraestrutura'),
  ('Bar', 'Infraestrutura'),
  ('Ar Condicionado', 'Infraestrutura'),
  ('Estacionamento', 'Infraestrutura'),
  ('Pet Friendly', 'Infraestrutura'),
  ('Acessibilidade', 'Infraestrutura'),
  ('TV', 'Infraestrutura'),
  -- Estabelecimento — Música Ambiente
  ('Hip Hop', 'Música Ambiente'),
  ('Rock', 'Música Ambiente'),
  ('Sertanejo', 'Música Ambiente'),
  ('Pop', 'Música Ambiente'),
  ('MPB', 'Música Ambiente'),
  ('Eletrônico', 'Música Ambiente'),
  ('Jazz', 'Música Ambiente'),
  ('Reggae', 'Música Ambiente'),
  -- Estabelecimento — Posicionamento
  ('Premium', 'Posicionamento'),
  ('Popular', 'Posicionamento'),
  ('Tradicional', 'Posicionamento'),
  ('Moderno', 'Posicionamento'),
  ('Luxo', 'Posicionamento'),
  ('Despojado', 'Posicionamento'),
  -- Estabelecimento — Público
  ('Família', 'Público'),
  ('Adulto', 'Público'),
  ('LGBTQIA+', 'Público'),
  ('Empresarial', 'Público'),
  ('Infantil', 'Público'),
  ('Terceira idade', 'Público'),
  ('Todos', 'Público'),
  -- Estabelecimento — Vibe
  ('Descontraído', 'Vibe'),
  ('Sério', 'Vibe'),
  ('Animado', 'Vibe'),
  ('Calmo', 'Vibe'),
  ('Intimista', 'Vibe'),
  ('Acolhedor', 'Vibe')
ON CONFLICT (name, category) DO NOTHING;

-- ------------------------------------------------------------
-- 10. MIGRAÇÕES INCREMENTAIS (bases já existentes)
-- ------------------------------------------------------------
-- Rode apenas se as tabelas já existirem e faltarem colunas:

ALTER TABLE public.professionals
  ADD COLUMN IF NOT EXISTS style_tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS price_range TEXT,
  ADD COLUMN IF NOT EXISTS availability TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS previous_workplaces TEXT,
  ADD COLUMN IF NOT EXISTS music_tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS visual_tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS personality_tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS lifestyle_tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS work_tags TEXT[] DEFAULT '{}';

ALTER TABLE public.establishments
  ADD COLUMN IF NOT EXISTS style_tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS target_audience TEXT,
  ADD COLUMN IF NOT EXISTS infra_tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS music_tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS positioning_tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS audience_tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS vibe_tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS years_active INTEGER,
  ADD COLUMN IF NOT EXISTS avg_rating NUMERIC(3,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0;

ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS review_type TEXT DEFAULT 'client_to_professional',
  ADD COLUMN IF NOT EXISTS qr_token TEXT,
  ADD COLUMN IF NOT EXISTS rating_weight NUMERIC(4,2),
  ADD COLUMN IF NOT EXISTS prof_link_snapshot JSONB;

ALTER TABLE public.professionals
  ADD COLUMN IF NOT EXISTS salary_expectation TEXT,
  ADD COLUMN IF NOT EXISTS available_now BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS seeking_work BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS client_portfolio_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS igv_score NUMERIC(5,2);

-- Hyper Reputation: expandir review_type (execute se o CHECK antigo existir)
ALTER TABLE public.professionals
  ADD COLUMN IF NOT EXISTS gallery_urls TEXT[] DEFAULT '{}';

ALTER TABLE public.establishments
  ADD COLUMN IF NOT EXISTS gallery_urls TEXT[] DEFAULT '{}';

ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_review_type_check;
ALTER TABLE public.reviews ADD CONSTRAINT reviews_review_type_check
  CHECK (review_type IN (
    'client_to_professional',
    'establishment_to_professional',
    'client_to_establishment',
    'professional_to_establishment',
    'profile_like'
  ));

-- ============================================================
-- FIM — Proofly schema
-- ============================================================