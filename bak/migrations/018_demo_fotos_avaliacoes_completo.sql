-- ============================================================
-- PROOFLY — Demo completo (1 arquivo só)
-- ============================================================
-- Rode UMA VEZ no SQL Editor do Supabase.
--
-- O que faz:
--   1. Garante colunas avatar_url + gallery_urls
--   2. Coloca 4 fotos REAIS em TODOS profissionais e estabelecimentos
--      (randomuser.me + pravatar.cc + picsum — links que funcionam)
--   3. Completa avaliações com comentários (se faltar)
--   4. Cria QR codes faltantes
--   5. Recalcula médias, totais e IGV
--
-- Não apaga seus dados. Só corrige fotos e preenche o que estiver vazio.
-- ============================================================

BEGIN;

-- Colunas
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS gallery_urls TEXT[] DEFAULT '{}';
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS gallery_urls TEXT[] DEFAULT '{}';

-- ------------------------------------------------------------
-- Funções auxiliares
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.proofly_random_review_comment()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  comments TEXT[] := ARRAY[
    'Excelente atendimento! Muito profissional e atencioso.',
    'Ambiente muito agradável, voltarei com certeza.',
    'Gostei muito do serviço, nota 10!',
    'Profissional muito competente, recomendo a todos.',
    'Local limpo e organizado, atendimento de primeira.',
    'Fiquei muito satisfeito com o resultado, superou minhas expectativas.',
    'Atendimento rápido e eficiente, já marquei o próximo.',
    'Recomendo fortemente, experiência incrível!',
    'Ótimo custo-benefício, muito satisfeito.',
    'Pessoa muito educada e atenciosa, nota máxima.',
    'Serviço de qualidade, ambiente agradável e acolhedor.',
    'Profissional muito experiente, gostei muito do trabalho.',
    'Atendimento impecável, com certeza voltarei.',
    'Ambiente super agradável, adorei a música e a vibração.',
    'Trabalho muito bem feito, recomendo para todos.',
    'Atendimento impecável, voltarei com certeza!',
    'Profissional muito atencioso e resultado excelente.',
    'Superou minhas expectativas, recomendo.',
    'Pontual e caprichoso, adorei o resultado.',
    'Cuidado nos detalhes, nota 10.'
  ];
BEGIN
  RETURN comments[1 + floor(random() * array_length(comments, 1))::int];
END;
$$;

CREATE OR REPLACE FUNCTION public.proofly_prof_gallery_urls(p_id UUID)
RETURNS TEXT[]
LANGUAGE sql
IMMUTABLE
AS $$
  WITH h AS (
    SELECT abs(hashtext(p_id::text)) AS v
  ),
  portraits AS (
    SELECT ARRAY[
      'https://randomuser.me/api/portraits/men/32.jpg',
      'https://randomuser.me/api/portraits/men/44.jpg',
      'https://randomuser.me/api/portraits/men/52.jpg',
      'https://randomuser.me/api/portraits/men/65.jpg',
      'https://randomuser.me/api/portraits/men/71.jpg',
      'https://randomuser.me/api/portraits/men/83.jpg',
      'https://randomuser.me/api/portraits/women/32.jpg',
      'https://randomuser.me/api/portraits/women/44.jpg',
      'https://randomuser.me/api/portraits/women/52.jpg',
      'https://randomuser.me/api/portraits/women/65.jpg',
      'https://randomuser.me/api/portraits/women/71.jpg',
      'https://randomuser.me/api/portraits/women/83.jpg'
    ] AS pool
  )
  SELECT ARRAY[
    (SELECT pool[1 + (h.v % array_length(pool, 1))] FROM portraits),
    'https://i.pravatar.cc/400?u=' || p_id::text,
    'https://i.pravatar.cc/400?u=' || p_id::text || '-g2',
    'https://picsum.photos/seed/proofly-prof-' || replace(p_id::text, '-', '') || '/640/800'
  ]
  FROM h;
$$;

CREATE OR REPLACE FUNCTION public.proofly_est_gallery_urls(p_id UUID)
RETURNS TEXT[]
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT ARRAY[
    'https://picsum.photos/seed/proofly-est-' || replace(p_id::text, '-', '') || '-1/800/600',
    'https://picsum.photos/seed/proofly-est-' || replace(p_id::text, '-', '') || '-2/800/600',
    'https://picsum.photos/seed/proofly-est-' || replace(p_id::text, '-', '') || '-3/800/600',
    'https://picsum.photos/seed/proofly-est-' || replace(p_id::text, '-', '') || '-4/800/600'
  ];
$$;

-- ------------------------------------------------------------
-- 1. FOTOS — todos com exatamente 4 URLs
-- ------------------------------------------------------------
UPDATE public.professionals p
SET
  gallery_urls = public.proofly_prof_gallery_urls(p.id),
  avatar_url = (public.proofly_prof_gallery_urls(p.id))[1];

UPDATE public.establishments e
SET
  gallery_urls = public.proofly_est_gallery_urls(e.id),
  avatar_url = (public.proofly_est_gallery_urls(e.id))[1];

-- ------------------------------------------------------------
-- 2. Usuários avaliadores (se não existir nenhum cliente)
-- ------------------------------------------------------------
INSERT INTO public.users (name, email, provider, role)
SELECT v.name, v.email, 'seed', 'cliente'
FROM (VALUES
  ('Ana Silva', 'seed.demo01@proofly.demo'),
  ('Bruno Costa', 'seed.demo02@proofly.demo'),
  ('Camila Rocha', 'seed.demo03@proofly.demo'),
  ('Diego Lima', 'seed.demo04@proofly.demo'),
  ('Elena Martins', 'seed.demo05@proofly.demo'),
  ('Felipe Souza', 'seed.demo06@proofly.demo'),
  ('Gabriela Dias', 'seed.demo07@proofly.demo'),
  ('Henrique Alves', 'seed.demo08@proofly.demo'),
  ('Isabela Pereira', 'seed.demo09@proofly.demo'),
  ('João Santos', 'seed.demo10@proofly.demo'),
  ('Karina Mendes', 'seed.demo11@proofly.demo'),
  ('Lucas Barbosa', 'seed.demo12@proofly.demo'),
  ('Mariana Nunes', 'seed.demo13@proofly.demo'),
  ('Nicolas Carvalho', 'seed.demo14@proofly.demo'),
  ('Olivia Freitas', 'seed.demo15@proofly.demo'),
  ('Paulo Teixeira', 'seed.demo16@proofly.demo'),
  ('Rafaela Moraes', 'seed.demo17@proofly.demo'),
  ('Sérgio Pinto', 'seed.demo18@proofly.demo'),
  ('Tatiane Veiga', 'seed.demo19@proofly.demo'),
  ('Vitor Campos', 'seed.demo20@proofly.demo')
) AS v(name, email)
WHERE NOT EXISTS (
  SELECT 1 FROM public.users u WHERE u.role = 'cliente' OR u.email LIKE '%@proofly.demo'
);

-- ------------------------------------------------------------
-- 3. AVALIAÇÕES — completa até mínimo por perfil
-- ------------------------------------------------------------
DO $reviews$
DECLARE
  r RECORD;
  v_user_id UUID;
  v_need INTEGER;
  v_j INTEGER;
  v_rating INTEGER;
  v_users UUID[];
  v_user_count INTEGER;
  v_est_comments TEXT[] := ARRAY[
    'Lugar incrível, super organizado.',
    'Música boa e atendimento premium.',
    'Estacionamento fácil e recepção nota 10.',
    'Ambiente moderno, vale cada centavo.',
    'Me senti muito bem acolhido.',
    'Estrutura top para quem busca qualidade.',
    'Ambiente agradável e serviço de qualidade.',
    'Voltarei com a família.'
  ];
BEGIN
  SELECT ARRAY(SELECT id FROM public.users WHERE role = 'cliente' OR email LIKE '%@proofly.demo' ORDER BY created_at LIMIT 30)
  INTO v_users;
  v_user_count := COALESCE(array_length(v_users, 1), 0);
  IF v_user_count = 0 THEN
    RAISE NOTICE 'Sem usuários cliente — pulando avaliações';
    RETURN;
  END IF;

  -- Clientes → profissionais (mínimo 4 com comentário)
  FOR r IN SELECT id, current_establishment_id FROM public.professionals LOOP
    SELECT GREATEST(0, 4 - COUNT(*)::int) INTO v_need
    FROM public.reviews
    WHERE professional_id = r.id AND review_type = 'client_to_professional';

    FOR v_j IN 1..v_need LOOP
      v_user_id := v_users[1 + ((abs(hashtext(r.id::text)) + v_j) % v_user_count)];
      v_rating := 3 + ((v_j + abs(hashtext(r.id::text))) % 3);
      INSERT INTO public.reviews (
        user_id, professional_id, rating, comment,
        verified, is_verified, source, review_type, created_at
      ) VALUES (
        v_user_id, r.id, v_rating,
        public.proofly_random_review_comment(),
        (v_j % 3 <> 0), (v_j % 3 <> 0), 'cliente', 'client_to_professional',
        NOW() - ((v_j * 7 + 3) * INTERVAL '1 day')
      );
    END LOOP;

    -- Estabelecimento → profissional (se tem vínculo e falta)
    IF r.current_establishment_id IS NOT NULL THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.reviews
        WHERE professional_id = r.id
          AND establishment_id = r.current_establishment_id
          AND review_type = 'establishment_to_professional'
      ) THEN
        INSERT INTO public.reviews (
          professional_id, establishment_id, rating, comment,
          verified, is_verified, source, review_type, created_at
        ) VALUES (
          r.id, r.current_establishment_id, 4 + (abs(hashtext(r.id::text)) % 2),
          'Profissional pontual, técnica sólida e bom relacionamento com clientes.',
          TRUE, TRUE, 'estabelecimento', 'establishment_to_professional',
          NOW() - (15 * INTERVAL '1 day')
        );
      END IF;
    END IF;
  END LOOP;

  -- Clientes → estabelecimentos (mínimo 3 com comentário)
  FOR r IN SELECT id FROM public.establishments LOOP
    SELECT GREATEST(0, 3 - COUNT(*)::int) INTO v_need
    FROM public.reviews
    WHERE establishment_id = r.id AND review_type = 'client_to_establishment';

    FOR v_j IN 1..v_need LOOP
      v_user_id := v_users[1 + ((abs(hashtext(r.id::text)) + v_j) % v_user_count)];
      v_rating := 4 + ((v_j + abs(hashtext(r.id::text))) % 2);
      INSERT INTO public.reviews (
        user_id, establishment_id, rating, comment,
        verified, is_verified, source, review_type, created_at
      ) VALUES (
        v_user_id, r.id, v_rating,
        v_est_comments[1 + ((v_j + abs(hashtext(r.id::text))) % array_length(v_est_comments, 1))],
        TRUE, TRUE, 'cliente', 'client_to_establishment',
        NOW() - ((v_j * 5 + 2) * INTERVAL '1 day')
      );
    END LOOP;
  END LOOP;

  RAISE NOTICE '✅ Avaliações conferidas/completadas';
END $reviews$;

-- ------------------------------------------------------------
-- 4. QR codes (profissionais sem token)
-- ------------------------------------------------------------
INSERT INTO public.qr_codes (professional_id, token, url, expires_at)
SELECT
  p.id,
  encode(gen_random_bytes(16), 'hex'),
  'https://proofly.app/cliente.html?professionalId=' || p.id::text || '&token=' || encode(gen_random_bytes(8), 'hex'),
  NOW() + INTERVAL '90 days'
FROM public.professionals p
WHERE NOT EXISTS (
  SELECT 1 FROM public.qr_codes q WHERE q.professional_id = p.id
);

-- ------------------------------------------------------------
-- 5. Recalcular métricas
-- ------------------------------------------------------------
DO $metrics$
DECLARE
  r RECORD;
  v_cnt INTEGER;
  v_total INTEGER;
  v_avg NUMERIC;
  v_verified_ratio NUMERIC;
  v_years INTEGER;
  v_igv NUMERIC;
BEGIN
  FOR r IN SELECT id FROM public.professionals LOOP
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'recalc_prof_talent_metrics') THEN
      PERFORM public.recalc_prof_talent_metrics(r.id);
    ELSE
      SELECT
        COUNT(DISTINCT COALESCE(rv.user_id::text, rv.id::text))::int,
        COUNT(*)::int,
        COALESCE(ROUND(AVG(rv.rating)::numeric, 2), 0),
        CASE WHEN COUNT(*) = 0 THEN 0::numeric
             ELSE COUNT(*) FILTER (WHERE COALESCE(rv.is_verified, rv.verified, FALSE))::numeric / COUNT(*)
        END
      INTO v_cnt, v_total, v_avg, v_verified_ratio
      FROM public.reviews rv
      WHERE rv.professional_id = r.id
        AND (rv.source = 'cliente' OR rv.review_type = 'client_to_professional');

      SELECT COALESCE(pp.years_experience, 0) INTO v_years
      FROM public.professional_profiles pp
      WHERE pp.professional_id = r.id;

      v_years := COALESCE(v_years, 0);
      v_igv := LEAST(100, GREATEST(0, ROUND((
        (v_cnt * 0.45) + (v_avg * 7) + (v_years * 4) + (v_verified_ratio * 5)
      )::numeric, 2)));

      UPDATE public.professionals
      SET
        client_portfolio_count = v_cnt,
        avg_rating = v_avg,
        total_reviews = v_total,
        igv_score = v_igv
      WHERE id = r.id;
    END IF;
  END LOOP;
END $metrics$;

UPDATE public.establishments e
SET
  avg_rating = COALESCE(sub.avg, 0),
  total_reviews = COALESCE(sub.cnt, 0)
FROM (
  SELECT establishment_id, ROUND(AVG(rating)::numeric, 2) AS avg, COUNT(*) AS cnt
  FROM public.reviews
  WHERE establishment_id IS NOT NULL AND review_type = 'client_to_establishment'
  GROUP BY establishment_id
) sub
WHERE e.id = sub.establishment_id;

COMMIT;

-- ------------------------------------------------------------
-- Conferência rápida
-- ------------------------------------------------------------
SELECT 'profissionais com 4 fotos' AS check_item,
  COUNT(*) AS ok
FROM public.professionals
WHERE array_length(gallery_urls, 1) = 4;

SELECT 'estabelecimentos com 4 fotos' AS check_item,
  COUNT(*) AS ok
FROM public.establishments
WHERE array_length(gallery_urls, 1) = 4;

SELECT review_type, COUNT(*) AS total
FROM public.reviews
GROUP BY review_type
ORDER BY review_type;

SELECT name, array_length(gallery_urls, 1) AS fotos, avg_rating, total_reviews
FROM public.professionals
ORDER BY name
LIMIT 8;

SELECT name, array_length(gallery_urls, 1) AS fotos, avg_rating, total_reviews
FROM public.establishments
ORDER BY name
LIMIT 8;