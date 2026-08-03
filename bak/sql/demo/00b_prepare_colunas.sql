-- ============================================================
-- 00b — Colunas faltantes (establishments / professionals / reviews)
-- Rode se o 02 ou 04 falhar com "column does not exist"
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

-- client_profiles / users (trigger updated_at)
ALTER TABLE public.client_profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS client_id UUID;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- establishments
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

-- professionals
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS specialty TEXT;
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS gallery_urls TEXT[] DEFAULT '{}';
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS style_tags TEXT[] DEFAULT '{}';
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS music_tags TEXT[] DEFAULT '{}';
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS visual_tags TEXT[] DEFAULT '{}';
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS personality_tags TEXT[] DEFAULT '{}';
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS lifestyle_tags TEXT[] DEFAULT '{}';
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS work_tags TEXT[] DEFAULT '{}';
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS price_range TEXT;
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS availability TEXT[] DEFAULT '{}';
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS salary_expectation TEXT;
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS available_now BOOLEAN DEFAULT FALSE;
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS seeking_work BOOLEAN DEFAULT TRUE;
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS client_portfolio_count INTEGER DEFAULT 0;
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS igv_score NUMERIC(5,2);
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS previous_workplaces TEXT;
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS current_establishment_id UUID;
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS avg_rating NUMERIC(3,2) DEFAULT 0;
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0;
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- professional_profiles (ON CONFLICT exige UNIQUE em professional_id)
CREATE TABLE IF NOT EXISTS public.professional_profiles (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id   UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  bio               TEXT,
  specialty         TEXT,
  years_experience  INTEGER,
  instagram         TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.professional_profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.professional_profiles ADD COLUMN IF NOT EXISTS specialty TEXT;
ALTER TABLE public.professional_profiles ADD COLUMN IF NOT EXISTS years_experience INTEGER;
ALTER TABLE public.professional_profiles ADD COLUMN IF NOT EXISTS instagram TEXT;
ALTER TABLE public.professional_profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.professional_profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Remove duplicatas antes de criar índice único (seguro após reset)
DELETE FROM public.professional_profiles a
USING public.professional_profiles b
WHERE a.professional_id = b.professional_id
  AND a.ctid < b.ctid;

CREATE UNIQUE INDEX IF NOT EXISTS uq_professional_profiles_professional_id
  ON public.professional_profiles (professional_id);

-- reviews
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS review_type TEXT DEFAULT 'client_to_professional';
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS source TEXT;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE;

SELECT column_name FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'establishments'
ORDER BY column_name;