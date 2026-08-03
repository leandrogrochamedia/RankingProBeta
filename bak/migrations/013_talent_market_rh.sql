-- Proofly: Mercado de talentos — campos RH + métricas calculadas

ALTER TABLE public.professionals
  ADD COLUMN IF NOT EXISTS salary_expectation TEXT,
  ADD COLUMN IF NOT EXISTS available_now BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS seeking_work BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS client_portfolio_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS igv_score NUMERIC(5,2);

COMMENT ON COLUMN public.professionals.salary_expectation IS 'Pretensão salarial/comissão informada no cadastro RH';
COMMENT ON COLUMN public.professionals.available_now IS 'Disponível para contratação imediata';
COMMENT ON COLUMN public.professionals.seeking_work IS 'Aberto a novas oportunidades';
COMMENT ON COLUMN public.professionals.client_portfolio_count IS 'Carteira calculada — avaliações de clientes (não auto-declarado)';
COMMENT ON COLUMN public.professionals.igv_score IS 'Índice de Geração de Valor — calculado pelo sistema';

CREATE INDEX IF NOT EXISTS idx_professionals_igv ON public.professionals(igv_score DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_professionals_portfolio ON public.professionals(client_portfolio_count DESC);
CREATE INDEX IF NOT EXISTS idx_professionals_available_now ON public.professionals(available_now) WHERE available_now = TRUE;

-- Backfill: execute migrations/014_backfill_igv_carteira.sql após esta migration

NOTIFY pgrst, 'reload schema';