-- Proofly: tabela clients completa para cadastro de clientes
-- Rode no SQL Editor do Supabase se a tabela já existir com schema antigo

CREATE TABLE IF NOT EXISTS public.clients (
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
  prof_style_tags   TEXT[] DEFAULT '{}'::text[],
  est_style_tags    TEXT[] DEFAULT '{}'::text[],
  tags              UUID[] DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS cpf TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS whatsapp TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS zip_code TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS street TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS number TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS complement TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS neighborhood TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Brasil';
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS prof_style_tags TEXT[] DEFAULT '{}'::text[];
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS est_style_tags TEXT[] DEFAULT '{}'::text[];

CREATE UNIQUE INDEX IF NOT EXISTS clients_email_unique ON public.clients (lower(email)) WHERE email IS NOT NULL AND email <> '';
CREATE UNIQUE INDEX IF NOT EXISTS clients_cpf_unique ON public.clients (cpf) WHERE cpf IS NOT NULL AND cpf <> '';

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS clients_anon_all ON public.clients;
CREATE POLICY clients_anon_all ON public.clients FOR ALL USING (true) WITH CHECK (true);