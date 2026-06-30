-- ============================================================
-- PROOFLY — RPC para rodar migrations pelo sql-log.html (DEV)
-- Rode UMA VEZ no Supabase SQL Editor. Depois use o botão no app.
-- ============================================================

CREATE OR REPLACE FUNCTION public.proofly_run_migration(p_key text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  est RECORD;
  v_owner_id UUID;
  v_owner_email TEXT;
  v_owner_name TEXT;
  v_hex TEXT;
  v_total INTEGER;
  v_with_owner INTEGER;
BEGIN
  IF p_key IS DISTINCT FROM '027_establishment_owners' THEN
    RETURN jsonb_build_object(
      'ok', false,
      'error', 'Migration desconhecida: ' || COALESCE(p_key, '(null)'),
      'hint', 'Atualize migrations/028_proofly_sql_runner_rpc.sql no Supabase.'
    );
  END IF;

  ALTER TABLE public.establishments
    ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL;

  CREATE INDEX IF NOT EXISTS idx_establishments_owner_user
    ON public.establishments(owner_user_id);

  UPDATE public.establishments e
  SET owner_user_id = u.id, updated_at = NOW()
  FROM public.users u
  WHERE u.email = 'leandro@proofly.com'
    AND e.id = '10000000-0000-4000-8000-000000000001'::uuid;

  UPDATE public.users u
  SET establishment_id = '10000000-0000-4000-8000-000000000001'::uuid,
      role = CASE WHEN u.role = 'cliente' THEN 'estabelecimento' ELSE u.role END,
      updated_at = NOW()
  WHERE u.email = 'leandro@proofly.com';

  FOR est IN
    SELECT e.id, e.name
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

  SELECT COUNT(*), COUNT(*) FILTER (WHERE owner_user_id IS NOT NULL)
  INTO v_total, v_with_owner
  FROM public.establishments;

  RETURN jsonb_build_object(
    'ok', true,
    'migration', p_key,
    'total_establishments', v_total,
    'with_owner', v_with_owner,
    'message', v_with_owner::text || '/' || v_total::text || ' estabelecimentos com owner'
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'ok', false,
    'error', SQLERRM,
    'sqlstate', SQLSTATE,
    'migration', p_key
  );
END;
$func$;

GRANT EXECUTE ON FUNCTION public.proofly_run_migration(text) TO anon, authenticated, service_role;

COMMENT ON FUNCTION public.proofly_run_migration(text) IS
  'DEV — executa migrations allowlisted pelo sql-log.html do Ranking Pro.';

-- Smoke test (opcional):
-- SELECT public.proofly_run_migration('027_establishment_owners');