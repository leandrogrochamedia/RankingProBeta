-- ============================================================
-- 06 — Recalcular IGV, carteira, médias + conferência
-- ============================================================

BEGIN;

DO $metrics$
DECLARE
  v_prof_id UUID;
  v_i INTEGER;
BEGIN
  FOR v_i IN 1..50 LOOP
    v_prof_id := ('20000000-0000-4000-8000-' || lpad(to_hex(v_i), 12, '0'))::uuid;
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'recalc_prof_talent_metrics') THEN
      PERFORM public.recalc_prof_talent_metrics(v_prof_id);
    ELSE
      UPDATE public.professionals p
      SET
        client_portfolio_count = sub.cnt,
        avg_rating = sub.avg,
        total_reviews = sub.total,
        igv_score = LEAST(100, GREATEST(0, ROUND((
          (sub.cnt * 0.45) + (sub.avg * 7) + (COALESCE(pp.years_experience, 0) * 4) + (sub.verified_ratio * 5)
        )::numeric, 2)))
      FROM (
        SELECT
          COUNT(DISTINCT COALESCE(r.user_id::text, r.id::text)) AS cnt,
          COUNT(*) AS total,
          COALESCE(ROUND(AVG(r.rating)::numeric, 2), 0) AS avg,
          CASE WHEN COUNT(*) = 0 THEN 0::numeric
               ELSE COUNT(*) FILTER (WHERE COALESCE(r.is_verified, r.verified, FALSE))::numeric / COUNT(*)
          END AS verified_ratio
        FROM public.reviews r
        WHERE r.professional_id = v_prof_id
          AND (r.source = 'cliente' OR r.review_type = 'client_to_professional')
      ) sub
      LEFT JOIN public.professional_profiles pp ON pp.professional_id = p.id
      WHERE p.id = v_prof_id;
    END IF;
  END LOOP;
END $metrics$;

UPDATE public.establishments e
SET avg_rating = COALESCE(sub.avg, 0), total_reviews = COALESCE(sub.cnt, 0)
FROM (
  SELECT establishment_id, ROUND(AVG(rating)::numeric, 2) AS avg, COUNT(*) AS cnt
  FROM public.reviews
  WHERE establishment_id IS NOT NULL AND review_type = 'client_to_establishment'
  GROUP BY establishment_id
) sub
WHERE e.id = sub.establishment_id;

COMMIT;

-- Conferência
SELECT 'users' AS tabela, COUNT(*) AS total FROM public.users
UNION ALL SELECT 'client_profiles', COUNT(*) FROM public.client_profiles
UNION ALL SELECT 'establishments', COUNT(*) FROM public.establishments
UNION ALL SELECT 'professionals', COUNT(*) FROM public.professionals
UNION ALL SELECT 'professional_establishments', COUNT(*) FROM public.professional_establishments
UNION ALL SELECT 'reviews', COUNT(*) FROM public.reviews
ORDER BY tabela;

SELECT city, COUNT(*) AS qtd FROM public.establishments GROUP BY city ORDER BY city;

SELECT e.city, e.name, COUNT(p.id) AS profissionais, ROUND(e.avg_rating::numeric, 1) AS nota
FROM public.establishments e
LEFT JOIN public.professionals p ON p.current_establishment_id = e.id
GROUP BY e.city, e.name, e.avg_rating
ORDER BY e.city, e.name;

SELECT name, specialty, avg_rating, total_reviews, igv_score, client_portfolio_count
FROM public.professionals
ORDER BY igv_score DESC NULLS LAST
LIMIT 10;