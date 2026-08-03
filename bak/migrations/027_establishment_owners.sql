-- ============================================================
-- PROOFLY — Todo estabelecimento deve ter owner (owner_user_id)
-- Rode no Supabase ou via scripts/seed_establishment_owners.py
-- ============================================================

BEGIN;

ALTER TABLE public.establishments
  ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_establishments_owner_user
  ON public.establishments(owner_user_id);

COMMENT ON COLUMN public.establishments.owner_user_id IS
  'Usuário dono do estabelecimento (experiência owner / contratar).';

-- Leandro permanece owner do Batel Barber Club
UPDATE public.establishments e
SET owner_user_id = u.id, updated_at = NOW()
FROM public.users u
WHERE u.email = 'leandro@proofly.com'
  AND e.id = '10000000-0000-4000-8000-000000000001'::uuid
  AND (e.owner_user_id IS NULL OR e.owner_user_id IS DISTINCT FROM u.id);

UPDATE public.users u
SET establishment_id = '10000000-0000-4000-8000-000000000001'::uuid,
    role = CASE WHEN u.role = 'cliente' THEN 'estabelecimento' ELSE u.role END,
    updated_at = NOW()
WHERE u.email = 'leandro@proofly.com'
  AND (u.establishment_id IS NULL OR u.establishment_id IS DISTINCT FROM '10000000-0000-4000-8000-000000000001'::uuid);

-- Demais estabelecimentos: usuário owner dedicado (IDs determinísticos 4000…)
DO $owners$
DECLARE
  est RECORD;
  v_owner_id UUID;
  v_owner_email TEXT;
  v_owner_name TEXT;
  v_hex TEXT;
BEGIN
  FOR est IN
    SELECT e.id, e.name, e.email
    FROM public.establishments e
    WHERE e.owner_user_id IS NULL
    ORDER BY e.name
  LOOP
    v_hex := right(replace(est.id::text, '-', ''), 12);
    v_owner_id := ('40000000-0000-4000-8000-' || v_hex)::uuid;
    v_owner_email := 'owner.' || v_hex || '@proofly.demo';
    v_owner_name := est.name || ' — Owner';

    INSERT INTO public.users (id, name, email, provider, role, establishment_id)
    VALUES (v_owner_id, v_owner_name, v_owner_email, 'seed', 'estabelecimento', est.id)
    ON CONFLICT (email) DO UPDATE SET
      name = EXCLUDED.name,
      establishment_id = EXCLUDED.establishment_id,
      role = 'estabelecimento',
      updated_at = NOW()
    RETURNING id INTO v_owner_id;

    IF v_owner_id IS NULL THEN
      SELECT id INTO v_owner_id FROM public.users WHERE email = v_owner_email;
    END IF;

    UPDATE public.establishments
    SET owner_user_id = v_owner_id, updated_at = NOW()
    WHERE id = est.id;
  END LOOP;
END $owners$;

COMMIT;

SELECT
  COUNT(*) AS total_estabelecimentos,
  COUNT(*) FILTER (WHERE owner_user_id IS NOT NULL) AS com_owner,
  COUNT(*) FILTER (WHERE owner_user_id IS NULL) AS sem_owner
FROM public.establishments;