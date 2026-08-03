-- Proofly: reviews vinculadas ao usuário + source (cliente | estabelecimento)

ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS source TEXT;

UPDATE public.reviews
SET source = 'cliente'
WHERE source IS NULL
  AND review_type IN ('client_to_professional', 'client_to_establishment');

UPDATE public.reviews
SET source = 'estabelecimento'
WHERE source IS NULL
  AND review_type = 'establishment_to_professional';

ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_source_check;
ALTER TABLE public.reviews ADD CONSTRAINT reviews_source_check
  CHECK (source IS NULL OR source IN ('cliente', 'estabelecimento'));

ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_target_check;
ALTER TABLE public.reviews ADD CONSTRAINT reviews_target_check
  CHECK (professional_id IS NOT NULL OR establishment_id IS NOT NULL);

ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_user_id_fkey;
ALTER TABLE public.reviews
  ADD CONSTRAINT reviews_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_source ON public.reviews(source);

NOTIFY pgrst, 'reload schema';