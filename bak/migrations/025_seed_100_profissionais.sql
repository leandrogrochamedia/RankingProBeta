-- Proofly: +100 profissionais (IDs 91–190) · 60 autônomos + 40 vinculados
-- Aplicado via scripts/seed_100_profissionais.py (REST) ou rode este SQL no Supabase.

BEGIN;

DO $seed100$
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
  v_first TEXT[] := ARRAY[
    'Álvaro','Beatriz','Caio','Débora','Eduardo','Fabiana','Gustavo','Helena','Igor','Juliana',
    'Kleber','Larissa','Marcos','Natália','Osvaldo','Paula','Rafael','Sabrina','Túlio','Vitor',
    'Alice','Bruno','Camila','Daniel','Elisa','Felipe','Giovana','Henrique','Jorge','Karina',
    'Leandro','Marina','Nicolas','Olívia','Pietro','Renato','Tiago','Amanda','Breno','Carla',
    'Diego','Ester','Fábio','Gisele','Hugo','Ingrid','Júlio','Kelly','Lucas','Marta'
  ];
  v_last TEXT[] := ARRAY[
    'Almeida','Barbosa','Carvalho','Dias','Ferreira','Gomes','Henrique','Junqueira','Lacerda','Macedo',
    'Nascimento','Oliveira','Pereira','Queiroz','Ribeiro','Silva','Teixeira','Vargas','Abreu','Cavalcanti',
    'Duarte','Fonseca','Guimarães','Lima','Mello','Neves','Pacheco','Rocha','Santos','Torres',
    'Vieira','Aguiar','Braga','Correia','Dantas','Farias','Gonçalves','Leite','Monteiro','Nogueira',
    'Paiva','Rezende','Siqueira','Tavares','Viana','Azevedo','Batista','Coelho','Freitas','Souza'
  ];
  v_specs TEXT[] := ARRAY[
    'Barbeiro','Cabeleireiro','Colorista','Manicure','Esteticista','Maquiador',
    'Designer de Sobrancelhas','Barbeiro & Visagista','Nail Artist','Tricologista',
    'Depilador','Hair Stylist','Especialista em Mechas','Barbeiro Clássico','Visagista',
    'Micropigmentador','Massagista','Podólogo','Extensionista','Bronzeamento'
  ];
  v_idx INTEGER;
  v_i INTEGER;
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
  FOR v_idx IN 1..100 LOOP
    v_i := 90 + v_idx;
    v_prof_id := ('20000000-0000-4000-8000-' || lpad(to_hex(v_i), 12, '0'))::uuid;
    v_name := v_first[1 + ((v_idx - 1) % array_length(v_first, 1))] || ' '
           || v_last[1 + (((v_idx - 1) * 2) % array_length(v_last, 1))];
    v_spec := v_specs[1 + ((v_idx - 1) % array_length(v_specs, 1))];
    v_years := 2 + (v_idx % 15);
    v_autonomo := (v_idx <= 60);
    v_est_id := CASE WHEN v_autonomo THEN NULL ELSE v_est_ids[1 + ((v_idx - 1) % array_length(v_est_ids, 1))] END;
    v_carteira := 8 + ((v_idx * 3) % 70);
    v_rating := round((3.6 + (v_idx % 14) * 0.1)::numeric, 2);
    v_igv := LEAST(100, GREATEST(0, round((v_carteira * 0.45 + v_rating * 7 + v_years * 4 + 1.75)::numeric, 2)));

    INSERT INTO public.professionals (
      id, name, specialty, bio, phone, email, avatar_url, gallery_urls,
      music_tags, visual_tags, personality_tags, lifestyle_tags, work_tags, style_tags,
      price_range, availability, salary_expectation,
      available_now, seeking_work, client_portfolio_count, igv_score,
      current_establishment_id, previous_workplaces, avg_rating, total_reviews, is_active
    ) VALUES (
      v_prof_id, v_name, v_spec,
      CASE WHEN v_autonomo THEN v_spec || ' autônomo — mercado de talentos Proofly.'
           ELSE v_spec || ' no time fixo do estabelecimento.' END,
      '(41) 99' || lpad((100000 + v_i)::text, 7, '0'),
      'prof.' || v_i || '@proofly.demo',
      'https://randomuser.me/api/portraits/' || CASE WHEN v_idx % 3 = 0 THEN 'women' ELSE 'men' END || '/' || (12 + (v_idx % 68))::text || '.jpg',
      ARRAY[
        'https://images.unsplash.com/photo-1621605815977-fbc98d665033?w=640',
        'https://images.unsplash.com/photo-1593702275177-f8160f4a18a5?w=640'
      ],
      ARRAY['Hip Hop','Pop'], ARRAY['Streetwear'], ARRAY['Comunicativo','Criativo'],
      ARRAY['Esportista'], ARRAY['Experiente'],
      CASE WHEN v_idx % 5 = 0 THEN ARRAY['Streetwear','Hip Hop'] ELSE ARRAY['Moderno'] END,
      'R$50 - R$100', ARRAY['Terça','Quinta','Sábado'],
      'Comissão 40%', (v_autonomo AND (v_idx % 4 = 0 OR v_igv >= 58)), TRUE,
      v_carteira, v_igv, v_est_id,
      CASE WHEN v_autonomo THEN 'Barbearia Old School · Studio Glow Hair' ELSE NULL END,
      v_rating, 5 + ((v_idx * 2) % 60), TRUE
    )
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      specialty = EXCLUDED.specialty,
      current_establishment_id = EXCLUDED.current_establishment_id,
      igv_score = EXCLUDED.igv_score,
      client_portfolio_count = EXCLUDED.client_portfolio_count,
      available_now = EXCLUDED.available_now,
      seeking_work = EXCLUDED.seeking_work,
      is_active = EXCLUDED.is_active;

    INSERT INTO public.professional_profiles (professional_id, specialty, years_experience, bio, instagram)
    VALUES (v_prof_id, v_spec, v_years, 'Especialista em ' || lower(v_spec) || ' · ' || v_years || ' anos.',
            '@proofly_' || lower(v_last[1 + (((v_idx - 1) * 2) % array_length(v_last, 1))]) || v_i)
    ON CONFLICT (professional_id) DO UPDATE SET years_experience = EXCLUDED.years_experience;

    IF NOT v_autonomo THEN
      INSERT INTO public.professional_establishments (professional_id, establishment_id, is_current, started_at)
      VALUES (v_prof_id, v_est_id, TRUE, '2025-02-01'::date)
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
  RAISE NOTICE '✅ 100 profissionais (60 autônomos) — lote 91–190';
END $seed100$;

COMMIT;

SELECT
  COUNT(*) FILTER (WHERE current_establishment_id IS NULL AND is_active) AS autonomos,
  COUNT(*) FILTER (WHERE is_active) AS total_ativos
FROM public.professionals;

NOTIFY pgrst, 'reload schema';