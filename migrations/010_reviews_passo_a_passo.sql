-- ============================================================
-- PROOFLY — ATUALIZAR REVIEWS (rode CADA BLOCO separado no Supabase)
-- Não cole tudo de uma vez. Espere "Success" em cada bloco.
-- ============================================================

-- ▶ BLOCO 0 — Diagnóstico (rode primeiro)
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'reviews'
ORDER BY ordinal_position;

-- ▶ BLOCO 1 — Criar colunas (rode sozinho, depois confira BLOCO 2)
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS review_type TEXT;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS source TEXT;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS is_verified BOOLEAN;

-- ▶ BLOCO 2 — Confirme 4 colunas (DEVE retornar 4 linhas antes do BLOCO 3)
SELECT column_name FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'reviews'
  AND column_name IN ('review_type', 'user_id', 'source', 'is_verified');

-- ▶ BLOCO 3 — Preencher dados (SOMENTE se BLOCO 2 retornou 4 linhas)
UPDATE public.reviews SET review_type = 'client_to_professional' WHERE review_type IS NULL;

UPDATE public.reviews SET is_verified = COALESCE(verified, FALSE) WHERE is_verified IS NULL;

UPDATE public.reviews SET source = 'cliente'
WHERE source IS NULL
  AND COALESCE(review_type, 'client_to_professional') IN ('client_to_professional', 'client_to_establishment');

UPDATE public.reviews SET source = 'estabelecimento'
WHERE source IS NULL AND review_type = 'establishment_to_professional';

UPDATE public.reviews SET source = 'profissional'
WHERE source IS NULL AND review_type = 'professional_to_establishment';

-- ▶ BLOCO 4 — Constraints (por último)
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_user_id_fkey;
ALTER TABLE public.reviews
  ADD CONSTRAINT reviews_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_source ON public.reviews(source);
CREATE INDEX IF NOT EXISTS idx_reviews_is_verified ON public.reviews(is_verified);

NOTIFY pgrst, 'reload schema';