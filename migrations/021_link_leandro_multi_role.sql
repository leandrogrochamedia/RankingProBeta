-- ============================================================
-- PROOFLY — Vínculos demo Leandro (owner + profissional)
-- Rode no Supabase após o seed de estabelecimentos/profissionais
-- ============================================================
-- Leandro → owner do Proofly Batel Barber Club (Curitiba)
-- professional_id = NULL (Lucas Santos era vínculo demo confuso — removido)
-- ============================================================

BEGIN;

-- Garante colunas de vínculo
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS professional_id UUID;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS establishment_id UUID;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS client_id UUID;

-- Estabelecimento existente no seed (sql/demo/02b)
-- ID: 10000000-0000-4000-8000-000000000001 — Proofly Batel Barber Club
-- Profissional existente no seed (sql/demo/04) — primeiro da série
-- ID: 20000000-0000-4000-8000-000000000001

UPDATE public.users
SET
  establishment_id = '10000000-0000-4000-8000-000000000001'::uuid,
  professional_id    = NULL,
  updated_at         = NOW()
WHERE email = 'leandro@proofly.com';

-- Se o usuário ainda não existir (primeiro login pelo app), nada é alterado.
-- O app também aplica esses vínculos em ensureDemoUserLinks() no login.

COMMIT;

SELECT
  u.email,
  u.name,
  e.name AS establishment,
  p.name AS professional
FROM public.users u
LEFT JOIN public.establishments e ON e.id = u.establishment_id
LEFT JOIN public.professionals p ON p.id = u.professional_id
WHERE u.email = 'leandro@proofly.com';