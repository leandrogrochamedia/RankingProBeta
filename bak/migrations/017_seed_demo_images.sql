-- ============================================================
-- 017 — Fotos demo para profissionais e estabelecimentos
-- Preenche avatar_url + gallery_urls quando vazios.
-- Rode após seed (016 ou demo 02b/04) ou standalone no Supabase.
-- ============================================================

BEGIN;

ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS gallery_urls TEXT[] DEFAULT '{}';
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS gallery_urls TEXT[] DEFAULT '{}';

DO $seed$
DECLARE
  v_prof_avatars TEXT[] := ARRAY[
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
  ];
  v_prof_gallery TEXT[] := ARRAY[
    'https://images.unsplash.com/photo-1621605815977-fbc98d665033?w=640&h=800&fit=crop&q=80',
    'https://images.unsplash.com/photo-1593702275177-f8160f4a18a5?w=640&h=800&fit=crop&q=80',
    'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=640&h=800&fit=crop&q=80',
    'https://images.unsplash.com/photo-1562322560-ab81ecf0a088?w=640&h=800&fit=crop&q=80',
    'https://images.unsplash.com/photo-1634449571010-02389ed0f9b0?w=640&h=800&fit=crop&q=80',
    'https://images.unsplash.com/photo-1503951914875-4621620610a6?w=640&h=800&fit=crop&q=80'
  ];
  v_est_photos TEXT[] := ARRAY[
    'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=640&h=640&fit=crop&q=80',
    'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=640&h=640&fit=crop&q=80',
    'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=640&h=640&fit=crop&q=80',
    'https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?w=640&h=640&fit=crop&q=80',
    'https://images.unsplash.com/photo-1503951914875-4621620610a6?w=640&h=640&fit=crop&q=80',
    'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=640&h=640&fit=crop&q=80',
    'https://images.unsplash.com/photo-1622286342621-4bd786c244f8?w=640&h=640&fit=crop&q=80',
    'https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=640&h=640&fit=crop&q=80',
    'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=640&h=640&fit=crop&q=80',
    'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=640&h=640&fit=crop&q=80'
  ];
  v_avatar TEXT;
  v_g1 TEXT;
  v_g2 TEXT;
  v_g3 TEXT;
  v_h INTEGER;
  r RECORD;
BEGIN
  FOR r IN SELECT id FROM public.professionals LOOP
    IF r.id IS NULL THEN CONTINUE; END IF;
    SELECT avatar_url INTO v_avatar FROM public.professionals WHERE id = r.id;
    IF v_avatar IS NOT NULL AND btrim(v_avatar) <> '' THEN CONTINUE; END IF;

    v_h := abs(hashtext(r.id::text));
    v_avatar := v_prof_avatars[1 + (v_h % array_length(v_prof_avatars, 1))];
    v_g1 := v_prof_gallery[1 + ((v_h + 1) % array_length(v_prof_gallery, 1))];
    v_g2 := v_prof_gallery[1 + ((v_h + 2) % array_length(v_prof_gallery, 1))];
    v_g3 := v_prof_gallery[1 + ((v_h + 3) % array_length(v_prof_gallery, 1))];

    UPDATE public.professionals
    SET
      avatar_url = v_avatar,
      gallery_urls = ARRAY[v_avatar, v_g1, v_g2, v_g3]
    WHERE id = r.id;
  END LOOP;

  FOR r IN SELECT id FROM public.establishments LOOP
    IF r.id IS NULL THEN CONTINUE; END IF;
    SELECT avatar_url INTO v_avatar FROM public.establishments WHERE id = r.id;
    IF v_avatar IS NOT NULL AND btrim(v_avatar) <> '' THEN CONTINUE; END IF;

    v_h := abs(hashtext(r.id::text));
    v_avatar := v_est_photos[1 + (v_h % array_length(v_est_photos, 1))];
    v_g1 := v_est_photos[1 + ((v_h + 1) % array_length(v_est_photos, 1))];
    v_g2 := v_est_photos[1 + ((v_h + 2) % array_length(v_est_photos, 1))];
    v_g3 := v_est_photos[1 + ((v_h + 3) % array_length(v_est_photos, 1))];

    UPDATE public.establishments
    SET
      avatar_url = v_avatar,
      gallery_urls = ARRAY[v_avatar, v_g1, v_g2, v_g3]
    WHERE id = r.id;
  END LOOP;
END $seed$;

COMMIT;