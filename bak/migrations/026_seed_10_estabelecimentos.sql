-- Proofly: +10 estabelecimentos (IDs 17–26) + vínculos com autônomos livres
-- Aplicado via scripts/seed_10_estabelecimentos.py (REST) ou rode no Supabase.

BEGIN;

DO $seed10est$
DECLARE
  v_est_names TEXT[] := ARRAY[
    'Barbearia Mercês Vintage','Studio Champagnat Hair','Corte & Arte Boqueirão','Glow Nail Studio Portão',
    'Barbearia Itaim Executive','Salão Moema Glow','Barber Lab Vila Olímpia','Estética Perdizes Care',
    'Hip Hop Cuts Santana','Proofly Tatuapé Unisex'
  ];
  v_types TEXT[] := ARRAY[
    'Barbearia','Salão de Beleza','Barbearia','Studio de Unhas','Barbearia',
    'Salão de Beleza','Barbearia','Espaço de Estética','Barbearia','Salão de Beleza'
  ];
  v_cities TEXT[] := ARRAY['Curitiba','Curitiba','Curitiba','Curitiba','São Paulo','São Paulo','São Paulo','São Paulo','São Paulo','São Paulo'];
  v_states TEXT[] := ARRAY['PR','PR','PR','PR','SP','SP','SP','SP','SP','SP'];
  v_staff INT[] := ARRAY[3,2,3,2,3,2,3,2,3,2];
  v_i INTEGER;
  v_n INTEGER;
  v_est_id UUID;
  v_prof_id UUID;
  v_assigned INTEGER := 0;
  v_need INTEGER;
  v_j INTEGER;
  prof_rec RECORD;
BEGIN
  FOR v_i IN 1..10 LOOP
    v_n := 16 + v_i;
    v_est_id := ('10000000-0000-4000-8000-' || lpad(to_hex(v_n), 12, '0'))::uuid;

    INSERT INTO public.establishments (
      id, name, type, description, specialty, phone, email,
      street, number, neighborhood, city, state, country,
      infra_tags, music_tags, positioning_tags, audience_tags, vibe_tags, style_tags,
      years_active, avg_rating, total_reviews
    ) VALUES (
      v_est_id, v_est_names[v_i], v_types[v_i],
      v_est_names[v_i] || ' — cadastro demo Proofly Ranking Pro.',
      v_types[v_i], '(41) 3333-30' || (16 + v_i)::text, 'est.' || v_n || '@proofly.demo',
      'Rua Demo', (100 + v_i)::text, 'Bairro ' || v_i::text, v_cities[v_i], v_states[v_i], 'Brasil',
      ARRAY['Wi-Fi','Ar Condicionado'], ARRAY['Pop','Hip Hop'], ARRAY['Moderno'], ARRAY['Todos'], ARRAY['Acolhedor'],
      ARRAY['Moderno'], 5 + v_i, 4.2 + (v_i % 5) * 0.1, 20 + v_i * 3
    )
    ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, city = EXCLUDED.city;

    v_need := v_staff[v_i];
    v_j := 0;
    FOR prof_rec IN
      SELECT id FROM public.professionals
      WHERE is_active AND current_establishment_id IS NULL
      ORDER BY igv_score DESC NULLS LAST, created_at
      LIMIT v_need
    LOOP
      UPDATE public.professionals SET
        current_establishment_id = v_est_id,
        seeking_work = FALSE,
        available_now = FALSE
      WHERE id = prof_rec.id;

      INSERT INTO public.professional_establishments (professional_id, establishment_id, is_current, started_at)
      VALUES (prof_rec.id, v_est_id, TRUE, '2025-03-01'::date)
      ON CONFLICT DO NOTHING;

      v_j := v_j + 1;
      v_assigned := v_assigned + 1;
      EXIT WHEN v_j >= v_need;
    END LOOP;
  END LOOP;

  RAISE NOTICE '✅ 10 estabelecimentos (17–26) · % profissionais vinculados', v_assigned;
END $seed10est$;

COMMIT;

SELECT COUNT(*) AS total_estabelecimentos FROM public.establishments;
SELECT COUNT(*) FILTER (WHERE current_establishment_id IS NULL) AS autonomos,
       COUNT(*) FILTER (WHERE current_establishment_id IS NOT NULL) AS vinculados
FROM public.professionals WHERE is_active;

NOTIFY pgrst, 'reload schema';