-- ============================================================
-- 04 — 50 profissionais + perfis + vínculos + histórico
-- Se falhar em ON CONFLICT (professional_id): rode 00b_prepare_colunas.sql antes
-- ============================================================

BEGIN;

-- professional_profiles: garante colunas + UNIQUE(professional_id) para ON CONFLICT
CREATE TABLE IF NOT EXISTS public.professional_profiles (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id   UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  bio               TEXT,
  specialty         TEXT,
  years_experience  INTEGER,
  instagram         TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.professional_profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.professional_profiles ADD COLUMN IF NOT EXISTS specialty TEXT;
ALTER TABLE public.professional_profiles ADD COLUMN IF NOT EXISTS years_experience INTEGER;
ALTER TABLE public.professional_profiles ADD COLUMN IF NOT EXISTS instagram TEXT;

DELETE FROM public.professional_profiles a
USING public.professional_profiles b
WHERE a.professional_id = b.professional_id
  AND a.ctid < b.ctid;

CREATE UNIQUE INDEX IF NOT EXISTS uq_professional_profiles_professional_id
  ON public.professional_profiles (professional_id);

-- Colunas professionals (schema antigo) — ou rode 00b_prepare_colunas.sql antes
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS specialty TEXT;
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS music_tags TEXT[] DEFAULT '{}';
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS visual_tags TEXT[] DEFAULT '{}';
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS personality_tags TEXT[] DEFAULT '{}';
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS lifestyle_tags TEXT[] DEFAULT '{}';
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS work_tags TEXT[] DEFAULT '{}';
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS price_range TEXT;
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS availability TEXT[] DEFAULT '{}';
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS salary_expectation TEXT;
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS available_now BOOLEAN DEFAULT FALSE;
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS seeking_work BOOLEAN DEFAULT TRUE;
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS client_portfolio_count INTEGER DEFAULT 0;
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS igv_score NUMERIC(5,2);
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS previous_workplaces TEXT;
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS current_establishment_id UUID;

DO $prof$
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
  v_past_est UUID;
  v_i INTEGER;
  v_j INTEGER;
  v_years INTEGER;
  v_est_idx INTEGER;
  v_past_idx INTEGER;
  v_first TEXT;
  v_last TEXT;
  v_prof_name TEXT;
  v_specialty TEXT;
  v_first_names TEXT[] := ARRAY[
    'Lucas','Mariana','Rafael','Camila','Thiago','Juliana','Bruno','Fernanda','Diego','Patrícia',
    'Gustavo','Amanda','Rodrigo','Larissa','Felipe','Beatriz','André','Carolina','Vinícius','Gabriela',
    'Leonardo','Isabela','Matheus','Natália','Pedro','Aline','João','Renata','Caio','Débora',
    'Eduardo','Priscila','Henrique','Tatiana','Marcos','Vanessa','Daniel','Cristina','Alexandre','Bianca',
    'Samuel','Letícia','Igor','Paula','Fábio','Simone','Ricardo','Elaine','Murilo','Jéssica'
  ];
  v_last_names TEXT[] := ARRAY[
    'Silva','Santos','Oliveira','Souza','Lima','Costa','Pereira','Ferreira','Almeida','Ribeiro',
    'Carvalho','Gomes','Martins','Araújo','Melo','Barbosa','Rocha','Dias','Nascimento','Cavalcanti'
  ];
  v_specialties TEXT[] := ARRAY[
    'Barbeiro','Cabeleireiro','Colorista','Manicure','Esteticista','Maquiador',
    'Designer de Sobrancelhas','Barbeiro & Visagista','Nail Artist','Tricologista',
    'Depilador','Cabeleireiro Infantil','Especialista em Mechas','Barbeiro Clássico','Hair Stylist'
  ];
  v_music TEXT[] := ARRAY['Hip Hop','Rock','Pop','Sertanejo','MPB','Jazz','Eletrônico'];
  v_visual TEXT[] := ARRAY['Streetwear','Clássico','Moderno','Elegante','Casual','Despojado'];
  v_personality TEXT[] := ARRAY['Comunicativo','Detalhista','Criativo','Extrovertido','Perfeccionista','Rápido'];
  v_lifestyle TEXT[] := ARRAY['Esportista','Noturno','Não fuma','Bebe socialmente','Vegano'];
  v_work TEXT[] := ARRAY['Especialista','Experiente','Premium','Popular','Generalista'];
  v_price TEXT[] := ARRAY['Até R$50','R$50 - R$100','R$100 - R$200','Acima de R$200'];
  v_days TEXT[] := ARRAY['Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
  v_prof_avatars TEXT[] := ARRAY[
    'https://randomuser.me/api/portraits/men/32.jpg','https://randomuser.me/api/portraits/men/44.jpg',
    'https://randomuser.me/api/portraits/men/52.jpg','https://randomuser.me/api/portraits/men/65.jpg',
    'https://randomuser.me/api/portraits/men/71.jpg','https://randomuser.me/api/portraits/men/83.jpg',
    'https://randomuser.me/api/portraits/women/32.jpg','https://randomuser.me/api/portraits/women/44.jpg',
    'https://randomuser.me/api/portraits/women/52.jpg','https://randomuser.me/api/portraits/women/65.jpg',
    'https://randomuser.me/api/portraits/women/71.jpg','https://randomuser.me/api/portraits/women/83.jpg'
  ];
  v_prof_gallery TEXT[] := ARRAY[
    'https://images.unsplash.com/photo-1621605815977-fbc98d665033?w=640&h=800&fit=crop&q=80',
    'https://images.unsplash.com/photo-1593702275177-f8160f4a18a5?w=640&h=800&fit=crop&q=80',
    'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=640&h=800&fit=crop&q=80',
    'https://images.unsplash.com/photo-1562322560-ab81ecf0a088?w=640&h=800&fit=crop&q=80',
    'https://images.unsplash.com/photo-1634449571010-02389ed0f9b0?w=640&h=800&fit=crop&q=80',
    'https://images.unsplash.com/photo-1503951914875-4621620610a6?w=640&h=800&fit=crop&q=80'
  ];
  v_avatar TEXT;
  v_g1 TEXT;
  v_g2 TEXT;
  v_g3 TEXT;
BEGIN
  FOR v_i IN 1..50 LOOP
    v_prof_id := ('20000000-0000-4000-8000-' || lpad(to_hex(v_i), 12, '0'))::uuid;
    v_first := v_first_names[v_i];
    v_last := v_last_names[1 + (v_i % array_length(v_last_names, 1))];
    v_prof_name := v_first || ' ' || v_last;
    v_specialty := v_specialties[1 + ((v_i - 1) % array_length(v_specialties, 1))];
    v_est_idx := 1 + ((v_i - 1) % array_length(v_est_ids, 1));
    v_est_id := v_est_ids[v_est_idx];
    v_years := 2 + (v_i % 14);
    v_avatar := v_prof_avatars[1 + (v_i % array_length(v_prof_avatars, 1))];
    v_g1 := v_prof_gallery[1 + (v_i % array_length(v_prof_gallery, 1))];
    v_g2 := v_prof_gallery[1 + ((v_i + 1) % array_length(v_prof_gallery, 1))];
    v_g3 := v_prof_gallery[1 + ((v_i + 2) % array_length(v_prof_gallery, 1))];

    INSERT INTO public.professionals (
      id, name, specialty, bio, phone, email, avatar_url, gallery_urls,
      music_tags, visual_tags, personality_tags, lifestyle_tags, work_tags,
      price_range, availability, salary_expectation,
      available_now, seeking_work, client_portfolio_count, igv_score,
      current_establishment_id, previous_workplaces, avg_rating, total_reviews, is_active
    ) VALUES (
      v_prof_id, v_prof_name, v_specialty,
      'Profissional de ' || lower(v_specialty) || ' com foco em experiência do cliente. Atua em ' ||
        CASE WHEN v_est_idx <= 6 THEN 'Curitiba' ELSE 'São Paulo' END || '.',
      CASE WHEN v_est_idx <= 6 THEN '(41) 99' || lpad((100000 + v_i)::text, 7, '0')
           ELSE '(11) 99' || lpad((200000 + v_i)::text, 7, '0') END,
      'prof.' || lpad(v_i::text, 2, '0') || '@proofly.demo',
      v_avatar,
      ARRAY[v_avatar, v_g1, v_g2, v_g3],
      ARRAY[v_music[1 + (v_i % array_length(v_music, 1))], v_music[1 + ((v_i + 2) % array_length(v_music, 1))]],
      ARRAY[v_visual[1 + (v_i % array_length(v_visual, 1))]],
      ARRAY[v_personality[1 + (v_i % array_length(v_personality, 1))], v_personality[1 + ((v_i + 1) % array_length(v_personality, 1))]],
      ARRAY[v_lifestyle[1 + (v_i % array_length(v_lifestyle, 1))]],
      ARRAY[v_work[1 + (v_i % array_length(v_work, 1))]],
      v_price[1 + (v_i % array_length(v_price, 1))],
      ARRAY[v_days[1 + (v_i % array_length(v_days, 1))], v_days[1 + ((v_i + 2) % array_length(v_days, 1))], v_days[1 + ((v_i + 4) % array_length(v_days, 1))]],
      CASE WHEN v_i % 4 = 0 THEN 'R$ 3.500 + comissão' WHEN v_i % 4 = 1 THEN 'Comissão 40%' WHEN v_i % 4 = 2 THEN 'R$ 4.200 fixo' ELSE 'A combinar' END,
      (v_i % 5 = 0), TRUE, 0, NULL, v_est_id, NULL, 0, 0, TRUE
    )
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      specialty = EXCLUDED.specialty,
      current_establishment_id = EXCLUDED.current_establishment_id,
      avatar_url = COALESCE(NULLIF(btrim(public.professionals.avatar_url), ''), EXCLUDED.avatar_url),
      gallery_urls = CASE
        WHEN public.professionals.gallery_urls IS NULL OR array_length(public.professionals.gallery_urls, 1) IS NULL
        THEN EXCLUDED.gallery_urls
        ELSE public.professionals.gallery_urls
      END;

    INSERT INTO public.professional_profiles (professional_id, specialty, years_experience, bio, instagram)
    VALUES (
      v_prof_id, v_specialty, v_years,
      'Especialista em ' || lower(v_specialty) || ' · ' || v_years || ' anos de experiência.',
      '@proofly_' || lower(replace(v_first, 'í', 'i')) || v_i
    )
    ON CONFLICT (professional_id) DO UPDATE SET specialty = EXCLUDED.specialty, years_experience = EXCLUDED.years_experience;

    INSERT INTO public.professional_establishments (professional_id, establishment_id, is_current, started_at)
    VALUES (v_prof_id, v_est_id, TRUE, NOW() - ((v_i % 24) + 3) * INTERVAL '1 month');

    FOR v_j IN 1..(v_i % 3) LOOP
      v_past_idx := 1 + ((v_est_idx + v_j + v_i) % array_length(v_est_ids, 1));
      IF v_past_idx = v_est_idx THEN v_past_idx := 1 + (v_past_idx % array_length(v_est_ids, 1)); END IF;
      v_past_est := v_est_ids[v_past_idx];
      INSERT INTO public.professional_establishments (professional_id, establishment_id, is_current, started_at, ended_at)
      VALUES (v_prof_id, v_past_est, FALSE,
        NOW() - ((v_j + 2) * 14 + v_i) * INTERVAL '1 month',
        NOW() - ((v_j + 1) * 8 + v_i) * INTERVAL '1 month');
    END LOOP;

    UPDATE public.professionals p
    SET previous_workplaces = sub.nomes
    FROM (
      SELECT string_agg(e.name, ' · ' ORDER BY pe.ended_at DESC NULLS LAST) AS nomes
      FROM public.professional_establishments pe
      JOIN public.establishments e ON e.id = pe.establishment_id
      WHERE pe.professional_id = v_prof_id AND pe.is_current = FALSE
    ) sub
    WHERE p.id = v_prof_id;
  END LOOP;

  RAISE NOTICE '✅ 50 profissionais inseridos com vínculos e histórico';
END $prof$;

COMMIT;

SELECT COUNT(*) AS profissionais FROM public.professionals;
SELECT COUNT(*) AS vinculos FROM public.professional_establishments;