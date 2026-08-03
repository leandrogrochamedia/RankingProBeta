-- Proofly: +40 profissionais (IDs 51–90) · 25 autônomos + 15 vinculados
-- Aplicado via scripts/seed_40_profissionais.py (REST) ou rode este SQL no Supabase.
-- Padrão: sql/demo/04_profissionais_vinculos.sql + migrations/023

BEGIN;

DO $seed40$
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
  v_names TEXT[][] := ARRAY[
    ARRAY['Kaique','Mendes'],ARRAY['Yasmin','Teixeira'],ARRAY['Otávio','Pacheco'],ARRAY['Lorena','Vieira'],
    ARRAY['Benício','Cardoso'],ARRAY['Heloísa','Monteiro'],ARRAY['Davi','Correia'],ARRAY['Mirela','Farias'],
    ARRAY['Theo','Campos'],ARRAY['Agatha','Rezende'],ARRAY['Noah','Lopes'],ARRAY['Cecília','Moura'],
    ARRAY['Miguel','Batista'],ARRAY['Lívia','Peixoto'],ARRAY['Arthur','Coelho'],ARRAY['Valentina','Ramos'],
    ARRAY['Heitor','Freitas'],ARRAY['Manuela','Castro'],ARRAY['Bernardo','Azevedo'],ARRAY['Clara','Pinto'],
    ARRAY['Enzo','Machado'],ARRAY['Sophia','Barros'],ARRAY['Lorenzo','Cunha'],ARRAY['Isadora','Nogueira'],
    ARRAY['Gabriel','Tavares'],ARRAY['Luna','Miranda'],ARRAY['Ravi','Sales'],ARRAY['Mel','Antunes'],
    ARRAY['Ian','Borges'],ARRAY['Nina','Siqueira'],ARRAY['Joel','Viana'],ARRAY['Zara','Fonseca'],
    ARRAY['Bento','Macedo'],ARRAY['Aurora','Guimarães'],ARRAY['Cauã','Dantas'],ARRAY['Eloá','Braga'],
    ARRAY['Ryan','Queiroz'],ARRAY['Stella','Paiva'],ARRAY['Joaquim','Leite'],ARRAY['Maya','Cordeiro']
  ];
  v_specs TEXT[] := ARRAY[
    'Barbeiro','Cabeleireiro','Colorista','Manicure','Esteticista','Maquiador',
    'Designer de Sobrancelhas','Barbeiro & Visagista','Nail Artist','Tricologista',
    'Depilador','Hair Stylist','Especialista em Mechas','Barbeiro Clássico','Visagista'
  ];
  v_i INTEGER;
  v_idx INTEGER;
  v_prof_id UUID;
  v_name TEXT;
  v_spec TEXT;
  v_years INTEGER;
  v_autonomo BOOLEAN;
  v_est_id UUID;
  v_carteira INTEGER;
  v_rating NUMERIC;
  v_igv NUMERIC;
BEGIN
  FOR v_idx IN 1..40 LOOP
    v_i := 50 + v_idx;
    v_prof_id := ('20000000-0000-4000-8000-' || lpad(to_hex(v_i), 12, '0'))::uuid;
    v_name := v_names[v_idx][1] || ' ' || v_names[v_idx][2];
    v_spec := v_specs[1 + ((v_idx - 1) % array_length(v_specs, 1))];
    v_years := 3 + (v_idx % 12);
    v_autonomo := (v_idx <= 25);
    v_est_id := CASE WHEN v_autonomo THEN NULL ELSE v_est_ids[1 + ((v_idx - 1) % array_length(v_est_ids, 1))] END;
    v_carteira := 12 + ((v_idx * 2) % 55);
    v_rating := round((3.8 + (v_idx % 12) * 0.1)::numeric, 2);
    v_igv := LEAST(100, GREATEST(0, round((v_carteira * 0.45 + v_rating * 7 + v_years * 4 + 1.75)::numeric, 2)));

    INSERT INTO public.professionals (
      id, name, specialty, bio, phone, email, avatar_url, gallery_urls,
      music_tags, visual_tags, personality_tags, lifestyle_tags, work_tags, style_tags,
      price_range, availability, salary_expectation,
      available_now, seeking_work, client_portfolio_count, igv_score,
      current_establishment_id, previous_workplaces, avg_rating, total_reviews, is_active
    ) VALUES (
      v_prof_id, v_name, v_spec,
      CASE WHEN v_autonomo THEN v_spec || ' autônomo disponível no mercado de talentos.'
           ELSE v_spec || ' no time fixo do estabelecimento.' END,
      '(41) 99' || lpad((100000 + v_i)::text, 7, '0'),
      'prof.' || v_i || '@proofly.demo',
      'https://randomuser.me/api/portraits/' || CASE WHEN v_idx % 2 = 0 THEN 'women' ELSE 'men' END || '/' || (12 + (v_idx % 20))::text || '.jpg',
      ARRAY[
        'https://images.unsplash.com/photo-1621605815977-fbc98d665033?w=640',
        'https://images.unsplash.com/photo-1593702275177-f8160f4a18a5?w=640'
      ],
      ARRAY['Hip Hop','Pop'], ARRAY['Streetwear'], ARRAY['Comunicativo','Criativo'],
      ARRAY['Esportista'], ARRAY['Experiente'],
      CASE WHEN v_idx % 4 = 0 THEN ARRAY['Streetwear'] ELSE ARRAY['Moderno'] END,
      'R$50 - R$100', ARRAY['Terça','Quinta','Sábado'],
      'Comissão 40%', (v_autonomo AND v_idx % 3 = 0), TRUE,
      v_carteira, v_igv, v_est_id,
      CASE WHEN v_autonomo THEN 'Barbearia Old School · Studio Glow Hair' ELSE NULL END,
      v_rating, 8 + ((v_idx * 3) % 45), TRUE
    )
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      specialty = EXCLUDED.specialty,
      current_establishment_id = EXCLUDED.current_establishment_id,
      igv_score = EXCLUDED.igv_score,
      client_portfolio_count = EXCLUDED.client_portfolio_count,
      available_now = EXCLUDED.available_now,
      seeking_work = EXCLUDED.seeking_work;

    INSERT INTO public.professional_profiles (professional_id, specialty, years_experience, bio, instagram)
    VALUES (v_prof_id, v_spec, v_years, 'Especialista em ' || lower(v_spec) || ' · ' || v_years || ' anos.',
            '@proofly_' || lower(v_names[v_idx][1]) || v_i)
    ON CONFLICT (professional_id) DO UPDATE SET years_experience = EXCLUDED.years_experience;

    IF NOT v_autonomo THEN
      INSERT INTO public.professional_establishments (professional_id, establishment_id, is_current, started_at)
      VALUES (v_prof_id, v_est_id, TRUE, '2025-01-15'::date)
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
  RAISE NOTICE '✅ 40 profissionais (25 autônomos) — lote 51–90';
END $seed40$;

COMMIT;

SELECT
  COUNT(*) FILTER (WHERE current_establishment_id IS NULL) AS autonomos,
  COUNT(*) AS total
FROM public.professionals WHERE is_active = TRUE;

NOTIFY pgrst, 'reload schema';