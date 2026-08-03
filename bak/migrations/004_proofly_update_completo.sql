ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS style_tags TEXT[] DEFAULT '{}'::text[];
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS price_range TEXT;
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS availability TEXT[] DEFAULT '{}'::text[];
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS previous_workplaces TEXT;
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS music_tags TEXT[] DEFAULT '{}'::text[];
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS visual_tags TEXT[] DEFAULT '{}'::text[];
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS personality_tags TEXT[] DEFAULT '{}'::text[];
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS lifestyle_tags TEXT[] DEFAULT '{}'::text[];
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS work_tags TEXT[] DEFAULT '{}'::text[];
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS gallery_urls TEXT[] DEFAULT '{}'::text[];

ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS style_tags TEXT[] DEFAULT '{}'::text[];
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS target_audience TEXT;
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS infra_tags TEXT[] DEFAULT '{}'::text[];
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS music_tags TEXT[] DEFAULT '{}'::text[];
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS positioning_tags TEXT[] DEFAULT '{}'::text[];
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS audience_tags TEXT[] DEFAULT '{}'::text[];
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS vibe_tags TEXT[] DEFAULT '{}'::text[];
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS avg_rating NUMERIC(3,2) DEFAULT 0;
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0;
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS gallery_urls TEXT[] DEFAULT '{}'::text[];

ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS review_type TEXT DEFAULT 'client_to_professional';
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_review_type_check;
ALTER TABLE public.reviews ADD CONSTRAINT reviews_review_type_check CHECK (review_type IN ('client_to_professional', 'establishment_to_professional', 'client_to_establishment', 'professional_to_establishment', 'profile_like'));
CREATE INDEX IF NOT EXISTS idx_reviews_type ON public.reviews(review_type);

SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name IN ('professionals', 'establishments') AND column_name = 'gallery_urls' ORDER BY table_name;