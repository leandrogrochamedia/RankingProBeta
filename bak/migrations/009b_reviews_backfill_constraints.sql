-- ============================================================
-- PROOFLY — PASSO 2 (rode DEPOIS do 009a)
-- ============================================================

UPDATE public.reviews SET review_type = 'client_to_professional' WHERE review_type IS NULL;
UPDATE public.reviews SET is_verified = COALESCE(verified, FALSE) WHERE is_verified IS NULL;
ALTER TABLE public.reviews ALTER COLUMN is_verified SET NOT NULL;

UPDATE public.reviews
SET source = 'cliente'
WHERE source IS NULL
  AND COALESCE(review_type, 'client_to_professional') IN ('client_to_professional', 'client_to_establishment');

UPDATE public.reviews
SET source = 'estabelecimento'
WHERE source IS NULL AND review_type = 'establishment_to_professional';

UPDATE public.reviews
SET source = 'profissional'
WHERE source IS NULL AND review_type = 'professional_to_establishment';

ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_review_type_check;
ALTER TABLE public.reviews ADD CONSTRAINT reviews_review_type_check
  CHECK (review_type IN (
    'client_to_professional', 'establishment_to_professional',
    'client_to_establishment', 'professional_to_establishment', 'profile_like'
  ));

ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_source_check;
ALTER TABLE public.reviews ADD CONSTRAINT reviews_source_check
  CHECK (source IS NULL OR source IN ('cliente', 'estabelecimento', 'profissional'));

ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_target_check;
ALTER TABLE public.reviews ADD CONSTRAINT reviews_target_check
  CHECK (professional_id IS NOT NULL OR establishment_id IS NOT NULL);

ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_user_id_fkey;
ALTER TABLE public.reviews
  ADD CONSTRAINT reviews_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_reviews_type ON public.reviews(review_type);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_source ON public.reviews(source);
CREATE INDEX IF NOT EXISTS idx_reviews_is_verified ON public.reviews(is_verified);

NOTIFY pgrst, 'reload schema';