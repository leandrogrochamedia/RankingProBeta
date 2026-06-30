-- Ranking Pro — Ponte Proofly (pyywdhjstvhmarvzijji)
-- Rodar no SQL Editor do Supabase Proofly. Sem DROP. Sem 001_nucleo.

-- =====================================================
-- 1. Coluna used_at em qr_codes
-- =====================================================

ALTER TABLE public.qr_codes
  ADD COLUMN IF NOT EXISTS used_at TIMESTAMPTZ;

-- =====================================================
-- 2. Índice reviews.qr_token
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_reviews_qr_token
  ON public.reviews(qr_token)
  WHERE qr_token IS NOT NULL;

-- =====================================================
-- 3. RPC: validar token QR
-- =====================================================

CREATE OR REPLACE FUNCTION public.validate_qr_token(p_token TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_qr qr_codes%ROWTYPE;
  v_prof professionals%ROWTYPE;
  v_token TEXT;
BEGIN
  v_token := TRIM(p_token);

  IF v_token IS NULL OR LENGTH(v_token) = 0 THEN
    RETURN json_build_object('status', 'invalid');
  END IF;

  SELECT * INTO v_qr
  FROM qr_codes
  WHERE token = v_token;

  IF NOT FOUND THEN
    RETURN json_build_object('status', 'invalid');
  END IF;

  SELECT * INTO v_prof
  FROM professionals
  WHERE id = v_qr.professional_id;

  IF v_qr.used_at IS NOT NULL OR EXISTS (
    SELECT 1 FROM reviews r WHERE r.qr_token = v_token
  ) THEN
    RETURN json_build_object(
      'status', 'used',
      'professional_id', v_prof.id,
      'professional_name', v_prof.name
    );
  END IF;

  IF v_qr.expires_at IS NOT NULL AND v_qr.expires_at < NOW() THEN
    RETURN json_build_object(
      'status', 'expired',
      'professional_id', v_prof.id,
      'professional_name', v_prof.name
    );
  END IF;

  RETURN json_build_object(
    'status', 'valid',
    'session_id', v_qr.id,
    'professional_id', v_prof.id,
    'professional_name', v_prof.name,
    'professional_specialty', v_prof.specialty,
    'expires_at', v_qr.expires_at
  );
END;
$$;

-- =====================================================
-- 4. RPC: submeter avaliação via QR (anônimo)
-- =====================================================

CREATE OR REPLACE FUNCTION public.submit_qr_review(
  p_token TEXT,
  p_rating INTEGER,
  p_comment TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_qr qr_codes%ROWTYPE;
  v_prof professionals%ROWTYPE;
  v_review_id UUID;
  v_comment TEXT;
  v_token TEXT;
BEGIN
  IF p_rating IS NULL OR p_rating < 1 OR p_rating > 5 THEN
    RETURN json_build_object('status', 'error', 'message', 'Nota inválida. Escolha de 1 a 5.');
  END IF;

  v_token := TRIM(p_token);
  v_comment := NULLIF(TRIM(p_comment), '');

  IF v_comment IS NOT NULL AND LENGTH(v_comment) > 500 THEN
    RETURN json_build_object('status', 'error', 'message', 'Comentário deve ter no máximo 500 caracteres.');
  END IF;

  IF v_token IS NULL OR LENGTH(v_token) = 0 THEN
    RETURN json_build_object('status', 'invalid');
  END IF;

  SELECT * INTO v_qr
  FROM qr_codes
  WHERE token = v_token
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('status', 'invalid');
  END IF;

  IF v_qr.used_at IS NOT NULL OR EXISTS (
    SELECT 1 FROM reviews r WHERE r.qr_token = v_token
  ) THEN
    RETURN json_build_object('status', 'used');
  END IF;

  IF v_qr.expires_at IS NOT NULL AND v_qr.expires_at < NOW() THEN
    RETURN json_build_object('status', 'expired');
  END IF;

  SELECT * INTO v_prof
  FROM professionals
  WHERE id = v_qr.professional_id;

  INSERT INTO reviews (
    professional_id,
    rating,
    comment,
    verified,
    is_verified,
    qr_token,
    review_type,
    source,
    user_id
  )
  VALUES (
    v_qr.professional_id,
    p_rating,
    v_comment,
    TRUE,
    TRUE,
    v_token,
    'client_to_professional',
    'cliente',
    NULL
  )
  RETURNING id INTO v_review_id;

  UPDATE qr_codes
  SET used_at = NOW()
  WHERE id = v_qr.id;

  RETURN json_build_object(
    'status', 'success',
    'review_id', v_review_id,
    'professional_id', v_prof.id,
    'professional_name', v_prof.name
  );
EXCEPTION
  WHEN unique_violation THEN
    UPDATE qr_codes SET used_at = COALESCE(used_at, NOW()) WHERE id = v_qr.id;
    RETURN json_build_object('status', 'used');
END;
$$;

-- =====================================================
-- 5. RPC: criar sessão QR (dev — default 2h)
-- =====================================================

CREATE OR REPLACE FUNCTION public.create_qr_session(
  p_professional_id UUID,
  p_expires_hours INTEGER DEFAULT 2,
  p_app_base_url TEXT DEFAULT 'http://localhost:8765'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prof professionals%ROWTYPE;
  v_token TEXT;
  v_session_id UUID;
  v_expires_at TIMESTAMPTZ;
  v_base TEXT;
  v_url TEXT;
BEGIN
  IF p_expires_hours IS NULL OR p_expires_hours < 1 OR p_expires_hours > 48 THEN
    p_expires_hours := 2;
  END IF;

  SELECT * INTO v_prof
  FROM professionals
  WHERE id = p_professional_id;

  IF NOT FOUND THEN
    RETURN json_build_object('status', 'error', 'message', 'Profissional não encontrado.');
  END IF;

  v_token := gen_random_uuid()::TEXT;
  v_expires_at := NOW() + (p_expires_hours || ' hours')::INTERVAL;

  v_base := NULLIF(TRIM(p_app_base_url), '');
  IF v_base IS NULL THEN
    v_base := 'http://localhost:8765';
  END IF;
  v_base := RTRIM(v_base, '/');
  v_url := v_base || '/qr/?token=' || v_token;

  INSERT INTO qr_codes (professional_id, token, url, expires_at)
  VALUES (p_professional_id, v_token, v_url, v_expires_at)
  RETURNING id INTO v_session_id;

  RETURN json_build_object(
    'status', 'success',
    'session_id', v_session_id,
    'token', v_token,
    'url', v_url,
    'expires_at', v_expires_at,
    'professional_id', v_prof.id,
    'professional_name', v_prof.name
  );
END;
$$;

-- =====================================================
-- 6. Grants
-- =====================================================

GRANT EXECUTE ON FUNCTION public.validate_qr_token(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_qr_review(TEXT, INTEGER, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_qr_session(UUID, INTEGER, TEXT) TO anon, authenticated;