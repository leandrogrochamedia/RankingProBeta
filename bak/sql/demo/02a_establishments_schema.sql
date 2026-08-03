-- ============================================================
-- 02a — SCHEMA establishments (rode SOZINHO — query separada)
-- Depois rode: 02b_establishments_data.sql
-- O Supabase valida INSERT antes de executar ALTER no mesmo arquivo.
-- ============================================================

ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS specialty TEXT;
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS instagram TEXT;
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS gallery_urls TEXT[] DEFAULT '{}';
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS whatsapp TEXT;
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS zip_code TEXT;
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS street TEXT;
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS number TEXT;
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS neighborhood TEXT;
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Brasil';
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS style_tags TEXT[] DEFAULT '{}';
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS target_audience TEXT;
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS infra_tags TEXT[] DEFAULT '{}';
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS music_tags TEXT[] DEFAULT '{}';
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS positioning_tags TEXT[] DEFAULT '{}';
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS audience_tags TEXT[] DEFAULT '{}';
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS vibe_tags TEXT[] DEFAULT '{}';
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS avg_rating NUMERIC(3,2) DEFAULT 0;
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0;
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS years_active INTEGER;
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Confirme que email existe antes de rodar o 02b:
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'establishments'
  AND column_name IN ('email','phone','city','specialty')
ORDER BY column_name;