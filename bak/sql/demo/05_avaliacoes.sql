-- ============================================================
-- 05 — Avaliações (clientes, estabelecimentos → profissionais)
-- ============================================================

BEGIN;

DO $reviews$
DECLARE
  v_est_ids UUID[] := ARRAY[
    '10000000-0000-4000-8000-000000000001'::uuid,'10000000-0000-4000-8000-000000000002'::uuid,
    '10000000-0000-4000-8000-000000000003'::uuid,'10000000-0000-4000-8000-000000000004'::uuid,
    '10000000-0000-4000-8000-000000000005'::uuid,'10000000-0000-4000-8000-000000000006'::uuid,
    '10000000-0000-4000-8000-000000000007'::uuid,'10000000-0000-4000-8000-000000000008'::uuid,
    '10000000-0000-4000-8000-000000000009'::uuid,'10000000-0000-4000-8000-00000000000a'::uuid,
    '10000000-0000-4000-8000-00000000000b'::uuid,'10000000-0000-4000-8000-00000000000c'::uuid,
    '10000000-0000-4000-8000-00000000000d'::uuid,'10000000-0000-4000-8000-00000000000e'::uuid,
    '10000000-0000-4000-8000-00000000000f'::uuid,'10000000-0000-4000-8000-000000000010'::uuid
  ];
  v_prof_id UUID;
  v_est_id UUID;
  v_seed_user UUID;
  v_i INTEGER;
  v_j INTEGER;
  v_rating INTEGER;
  v_est_idx INTEGER;
  v_past_idx INTEGER;
  v_comments TEXT[] := ARRAY[
    'Atendimento impecável, voltarei com certeza!',
    'Profissional muito atencioso e resultado excelente.',
    'Ambiente agradável e serviço de qualidade.',
    'Superou minhas expectativas, recomendo.',
    'Bom custo-benefício, ficou exatamente como pedi.',
    'Pontual e caprichoso, adorei o resultado.',
    'Primeira vez aqui e já virei fã.',
    'Cuidado nos detalhes, nota 10.',
    'Conversa boa e trabalho rápido sem perder qualidade.',
    'Melhor experiência que tive no bairro.',
    'Indico para amigos e família.',
    'Profissional entendeu meu estilo na hora.',
    'Acabamento perfeito, muito satisfeito.',
    'Voltarei na próxima semana.',
    'Equipe simpática e espaço limpo.'
  ];
  v_est_comments TEXT[] := ARRAY[
    'Lugar incrível, super organizado.',
    'Música boa e atendimento premium.',
    'Estacionamento fácil e recepção nota 10.',
    'Ambiente moderno, vale cada centavo.',
    'Me senti muito bem acolhido.',
    'Estrutura top para quem busca qualidade.'
  ];
BEGIN
  -- Avaliações de clientes → profissionais
  FOR v_i IN 1..50 LOOP
    v_prof_id := ('20000000-0000-4000-8000-' || lpad(to_hex(v_i), 12, '0'))::uuid;
    v_est_idx := 1 + ((v_i - 1) % array_length(v_est_ids, 1));
    v_est_id := v_est_ids[v_est_idx];

    FOR v_j IN 1..(4 + (v_i % 5)) LOOP
      v_rating := 3 + ((v_i + v_j) % 3);
      v_seed_user := ('30000000-0000-4000-8000-' || lpad(to_hex(1 + ((v_i + v_j) % 20)), 12, '0'))::uuid;
      INSERT INTO public.reviews (user_id, professional_id, rating, comment, verified, is_verified, source, review_type, created_at)
      VALUES (
        v_seed_user,
        v_prof_id, v_rating,
        v_comments[1 + ((v_i + v_j) % array_length(v_comments, 1))],
        (v_j % 3 <> 0), (v_j % 3 <> 0), 'cliente', 'client_to_professional',
        NOW() - ((v_i * 3 + v_j) * 4) * INTERVAL '1 day'
      );
    END LOOP;

    IF v_i % 2 = 0 THEN
      INSERT INTO public.reviews (professional_id, establishment_id, rating, comment, verified, is_verified, source, review_type, created_at)
      VALUES (v_prof_id, v_est_id, 4 + (v_i % 2),
        'Profissional pontual, técnica sólida e bom relacionamento com clientes.',
        TRUE, TRUE, 'estabelecimento', 'establishment_to_professional',
        NOW() - (v_i * 5) * INTERVAL '1 day');
    END IF;

    IF v_i % 3 = 0 THEN
      v_past_idx := 1 + ((v_est_idx + 3) % array_length(v_est_ids, 1));
      INSERT INTO public.reviews (professional_id, establishment_id, rating, comment, verified, is_verified, source, review_type, created_at)
      VALUES (v_prof_id, v_est_ids[v_past_idx], 4,
        'Boa performance no período em que trabalhou conosco.',
        TRUE, TRUE, 'estabelecimento', 'establishment_to_professional',
        NOW() - (v_i * 9) * INTERVAL '1 day');
    END IF;
  END LOOP;

  -- Avaliações de clientes → estabelecimentos
  FOR v_i IN 1..array_length(v_est_ids, 1) LOOP
    v_est_id := v_est_ids[v_i];
    FOR v_j IN 1..(3 + (v_i % 4)) LOOP
      v_seed_user := ('30000000-0000-4000-8000-' || lpad(to_hex(1 + ((v_i + v_j) % 20)), 12, '0'))::uuid;
      INSERT INTO public.reviews (user_id, establishment_id, rating, comment, verified, is_verified, source, review_type, created_at)
      VALUES (
        v_seed_user,
        v_est_id, 4 + ((v_i + v_j) % 2),
        v_est_comments[1 + ((v_i + v_j) % array_length(v_est_comments, 1))],
        TRUE, TRUE, 'cliente', 'client_to_establishment',
        NOW() - ((v_i + v_j) * 6) * INTERVAL '1 day'
      );
    END LOOP;
  END LOOP;

  RAISE NOTICE '✅ Avaliações inseridas';
END $reviews$;

COMMIT;

SELECT review_type, COUNT(*) AS total FROM public.reviews GROUP BY review_type ORDER BY review_type;