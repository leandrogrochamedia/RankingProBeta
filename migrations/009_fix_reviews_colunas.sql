-- ============================================================
-- PROOFLY — CRIAR COLUNAS (rode PRIMEIRO, sozinho)
-- Supabase → SQL Editor → Run
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'review_type'
  ) THEN
    ALTER TABLE public.reviews ADD COLUMN review_type TEXT DEFAULT 'client_to_professional';
    RAISE NOTICE 'Coluna review_type criada';
  ELSE
    RAISE NOTICE 'Coluna review_type já existe';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.reviews ADD COLUMN user_id UUID;
    RAISE NOTICE 'Coluna user_id criada';
  ELSE
    RAISE NOTICE 'Coluna user_id já existe';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'source'
  ) THEN
    ALTER TABLE public.reviews ADD COLUMN source TEXT;
    RAISE NOTICE 'Coluna source criada';
  ELSE
    RAISE NOTICE 'Coluna source já existe';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'is_verified'
  ) THEN
    ALTER TABLE public.reviews ADD COLUMN is_verified BOOLEAN DEFAULT FALSE;
    RAISE NOTICE 'Coluna is_verified criada';
  ELSE
    RAISE NOTICE 'Coluna is_verified já existe';
  END IF;
END $$;

-- Confirme o resultado (deve listar 4 linhas):
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'reviews'
  AND column_name IN ('review_type', 'user_id', 'source', 'is_verified')
ORDER BY column_name;