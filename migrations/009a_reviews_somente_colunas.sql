-- ============================================================
-- PROOFLY — PASSO 1 (se o script completo falhar)
-- Rode SOMENTE isto primeiro, depois rode 009b
-- ============================================================

ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS review_type TEXT;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS source TEXT;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS is_verified BOOLEAN;

ALTER TABLE public.reviews ALTER COLUMN review_type SET DEFAULT 'client_to_professional';
ALTER TABLE public.reviews ALTER COLUMN is_verified SET DEFAULT FALSE;