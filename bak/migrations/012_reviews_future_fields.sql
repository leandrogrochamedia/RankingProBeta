-- Proofly: campos futuros (ranking + QR token + snapshot de vínculo)
-- Não altera comportamento atual — apenas estrutura

ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS qr_token TEXT;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS rating_weight NUMERIC(4,2);
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS prof_link_snapshot JSONB;

COMMENT ON COLUMN public.reviews.rating_weight IS 'Peso futuro no ranking (cliente=1, prof=2, estab=3)';
COMMENT ON COLUMN public.reviews.prof_link_snapshot IS 'Snapshot JSON do vínculo prof↔estab no momento da avaliação';
COMMENT ON COLUMN public.reviews.qr_token IS 'Token QR validado na avaliação verificada';

NOTIFY pgrst, 'reload schema';