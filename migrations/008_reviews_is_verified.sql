-- Proofly: is_verified + source completo + user_id FK (delegação autoria)

ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS source TEXT;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT FALSE;

-- Sincroniza com coluna legada verified
UPDATE public.reviews SET is_verified = COALESCE(verified, FALSE) WHERE is_verified IS DISTINCT FROM COALESCE(verified, FALSE);
UPDATE public.reviews SET verified = is_verified WHERE verified IS DISTINCT FROM is_verified;

UPDATE public.reviews SET source = 'cliente'
WHERE source IS NULL AND review_type IN ('client_to_professional', 'client_to_establishment');

UPDATE public.reviews SET source = 'estabelecimento'
WHERE source IS NULL AND review_type = 'establishment_to_professional';

UPDATE public.reviews SET source = 'profissional'
WHERE source IS NULL AND review_type = 'professional_to_establishment';

ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_user_id_fkey;
ALTER TABLE public.reviews
  ADD CONSTRAINT reviews_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_source_check;
ALTER TABLE public.reviews ADD CONSTRAINT reviews_source_check
  CHECK (source IS NULL OR source IN ('cliente', 'estabelecimento', 'profissional'));

ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_target_check;
ALTER TABLE public.reviews ADD CONSTRAINT reviews_target_check
  CHECK (professional_id IS NOT NULL OR establishment_id IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_source ON public.reviews(source);
CREATE INDEX IF NOT EXISTS idx_reviews_is_verified ON public.reviews(is_verified);

NOTIFY pgrst, 'reload schema';