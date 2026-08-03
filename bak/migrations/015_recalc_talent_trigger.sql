-- Proofly Fase 2 — Trigger automático: recalcula carteira + IGV + média ao alterar reviews
-- Rode APÓS 014_backfill_igv_carteira.sql
-- Idempotente: pode executar mais de uma vez

-- ------------------------------------------------------------
-- Função: recalcula métricas de talento de um profissional
-- Carteira = clientes únicos (user_id distinto) em reviews de cliente
-- IGV = min(100, carteira×0.45 + nota×7 + anos×4 + verificação×5)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.recalc_prof_talent_metrics(p_prof_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_carteira INTEGER := 0;
  v_total INTEGER := 0;
  v_avg NUMERIC(5,2) := 0;
  v_years INTEGER := 0;
  v_verified_ratio NUMERIC := 0;
  v_igv NUMERIC(5,2) := 0;
BEGIN
  IF p_prof_id IS NULL THEN
    RETURN;
  END IF;

  SELECT
    COUNT(DISTINCT COALESCE(r.user_id::text, r.id::text)),
    COUNT(*),
    CASE WHEN COUNT(*) = 0 THEN 0
         ELSE ROUND(AVG(r.rating)::numeric, 2)
    END,
    CASE WHEN COUNT(*) = 0 THEN 0::numeric
         ELSE COUNT(*) FILTER (WHERE COALESCE(r.is_verified, r.verified, FALSE))::numeric / COUNT(*)
    END
  INTO v_carteira, v_total, v_avg, v_verified_ratio
  FROM public.reviews r
  WHERE r.professional_id = p_prof_id
    AND (
      r.source = 'cliente'
      OR r.review_type = 'client_to_professional'
      OR (r.source IS NULL AND (r.review_type IS NULL OR r.review_type = 'client_to_professional'))
    );

  SELECT COALESCE(pp.years_experience, 0)
  INTO v_years
  FROM public.professional_profiles pp
  WHERE pp.professional_id = p_prof_id;

  v_igv := LEAST(100, GREATEST(0, ROUND((
    (COALESCE(v_carteira, 0) * 0.45)
    + (COALESCE(v_avg, 0) * 7)
    + (COALESCE(v_years, 0) * 4)
    + (COALESCE(v_verified_ratio, 0) * 5)
  )::numeric, 2)));

  UPDATE public.professionals
  SET
    client_portfolio_count = COALESCE(v_carteira, 0),
    igv_score = v_igv,
    avg_rating = COALESCE(v_avg, 0),
    total_reviews = COALESCE(v_total, 0)
  WHERE id = p_prof_id;
END;
$$;

COMMENT ON FUNCTION public.recalc_prof_talent_metrics(UUID) IS
  'Recalcula carteira, IGV, média e total de reviews de cliente para um profissional';

-- ------------------------------------------------------------
-- Trigger: dispara após INSERT / UPDATE / DELETE em reviews
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_reviews_recalc_talent()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.professional_id IS NOT NULL THEN
      PERFORM public.recalc_prof_talent_metrics(OLD.professional_id);
    END IF;
    RETURN OLD;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF OLD.professional_id IS DISTINCT FROM NEW.professional_id AND OLD.professional_id IS NOT NULL THEN
      PERFORM public.recalc_prof_talent_metrics(OLD.professional_id);
    END IF;
  END IF;

  IF NEW.professional_id IS NOT NULL THEN
    PERFORM public.recalc_prof_talent_metrics(NEW.professional_id);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS reviews_recalc_talent ON public.reviews;

CREATE TRIGGER reviews_recalc_talent
  AFTER INSERT OR UPDATE OF professional_id, rating, review_type, source, user_id, is_verified, verified
  OR DELETE
  ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_reviews_recalc_talent();

NOTIFY pgrst, 'reload schema';