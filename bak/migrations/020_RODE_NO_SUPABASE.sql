-- ============================================================
-- PROOFLY — RODE ESTE ARQUIVO INTEIRO NO SUPABASE (SQL Editor)
-- Não rode só a query de conferência com client_profiles antes disto.
-- "No limit" se o editor pedir.
-- ============================================================

-- A) O que existe hoje?
SELECT table_name AS tabela_atual
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('clients', 'client_profiles')
ORDER BY table_name;

-- B) Criar clients se não existir nenhuma das duas
CREATE TABLE IF NOT EXISTS public.clients (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,
  email             TEXT,
  cpf               TEXT,
  phone             TEXT,
  whatsapp          TEXT,
  birth_date        DATE,
  gender            TEXT,
  avatar_url        TEXT,
  zip_code          TEXT,
  street            TEXT,
  number            TEXT,
  complement        TEXT,
  neighborhood      TEXT,
  city              TEXT,
  state             TEXT,
  country           TEXT DEFAULT 'Brasil',
  prof_style_tags   TEXT[] DEFAULT '{}'::text[],
  est_style_tags    TEXT[] DEFAULT '{}'::text[],
  tags              UUID[] DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- C) Renomear clients → client_profiles
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'clients'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'client_profiles'
  ) THEN
    ALTER TABLE public.clients RENAME TO client_profiles;
    RAISE NOTICE 'OK: clients renomeado para client_profiles';
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'client_profiles'
  ) THEN
    RAISE NOTICE 'OK: client_profiles já existe';
  ELSE
    RAISE EXCEPTION 'Não foi possível criar client_profiles — verifique permissões';
  END IF;
END $$;

-- D) users.client_id + FK
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS client_id UUID;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'client_profiles'
  ) THEN
    ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_client_id_fkey;
    ALTER TABLE public.users
      ADD CONSTRAINT users_client_id_fkey
        FOREIGN KEY (client_id) REFERENCES public.client_profiles(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_users_client_id ON public.users(client_id);

    UPDATE public.users u
    SET client_id = cp.id
    FROM public.client_profiles cp
    WHERE u.client_id IS NULL
      AND cp.email IS NOT NULL
      AND u.email IS NOT NULL
      AND lower(trim(u.email)) = lower(trim(cp.email));

    ALTER TABLE public.client_profiles ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS clients_anon_all ON public.client_profiles;
    DROP POLICY IF EXISTS client_profiles_anon_all ON public.client_profiles;
    CREATE POLICY client_profiles_anon_all ON public.client_profiles
      FOR ALL USING (true) WITH CHECK (true);
    GRANT ALL ON public.client_profiles TO anon, authenticated, service_role;

    COMMENT ON TABLE public.client_profiles IS
      'Perfil 1:1 do cliente. Vinculado via users.client_id.';
  END IF;
END $$;

-- E) Conferência (segura — só consulta client_profiles se existir)
SELECT
  EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'client_profiles'
  ) AS tem_client_profiles,
  (SELECT COUNT(*) FROM public.users WHERE client_id IS NOT NULL) AS users_com_client_id;