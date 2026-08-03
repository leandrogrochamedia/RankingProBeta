-- Proofly Fase 1 — Backfill Carteira + IGV (Match Avançado / dados reais)
-- Rode APÓS 013_talent_market_rh.sql
-- Idempotente: pode executar mais de uma vez

-- ------------------------------------------------------------
-- 1. Carteira = clientes ÚNICOS nas reviews de cliente
-- ------------------------------------------------------------
UPDATE public.professionals p
SET client_portfolio_count = 0;

UPDATE public.professionals p
SET client_portfolio_count = sub.cnt
FROM (
  SELECT
    r.professional_id,
    COUNT(DISTINCT COALESCE(r.user_id::text, r.id::text)) AS cnt
  FROM public.reviews r
  WHERE r.professional_id IS NOT NULL
    AND (
      r.source = 'cliente'
      OR r.review_type = 'client_to_professional'
      OR (r.source IS NULL AND (r.review_type IS NULL OR r.review_type = 'client_to_professional'))
    )
  GROUP BY r.professional_id
) sub
WHERE p.id = sub.professional_id;

-- ------------------------------------------------------------
-- 2. IGV — fórmula transparente Fase 1 (cap 0–100)
--    IGV = carteira×0.45 + nota×7 + anos×4 + verificação×5
-- ------------------------------------------------------------
UPDATE public.professionals p
SET igv_score = sub.score
FROM (
  SELECT
    p2.id,
    LEAST(100, GREATEST(0, ROUND((
      (COALESCE(p2.client_portfolio_count, 0) * 0.45)
      + (COALESCE(p2.avg_rating, 0) * 7)
      + (COALESCE(pp.years_experience, 0) * 4)
      + (COALESCE(v.verified_ratio, 0) * 5)
    )::numeric, 2))) AS score
  FROM public.professionals p2
  LEFT JOIN public.professional_profiles pp ON pp.professional_id = p2.id
  LEFT JOIN LATERAL (
    SELECT
      CASE WHEN COUNT(*) = 0 THEN 0::numeric
           ELSE COUNT(*) FILTER (WHERE COALESCE(r.is_verified, r.verified, FALSE))::numeric / COUNT(*)
      END AS verified_ratio
    FROM public.reviews r
    WHERE r.professional_id = p2.id
      AND (
        r.source = 'cliente'
        OR r.review_type = 'client_to_professional'
        OR (r.source IS NULL AND (r.review_type IS NULL OR r.review_type = 'client_to_professional'))
      )
  ) v ON TRUE
) sub
WHERE p.id = sub.id;

NOTIFY pgrst, 'reload schema';