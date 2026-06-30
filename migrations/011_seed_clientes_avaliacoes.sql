-- ============================================================
-- PROOFLY — 15 clientes aleatórios + vínculo em avaliações
-- Rode no SQL Editor do Supabase (pode rodar mais de 1x)
-- Requer client_profiles (rode migrations/020 se ainda tiver clients)
-- ============================================================

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
  END IF;
END $$;

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS client_id UUID;

-- 1) Usuários (login / autoria nas reviews)
INSERT INTO public.users (name, email, provider, role) VALUES
  ('Ana Beatriz Silva',    'seed.cliente01@proofly.demo', 'seed', 'cliente'),
  ('Bruno Costa Lima',     'seed.cliente02@proofly.demo', 'seed', 'cliente'),
  ('Camila Rodrigues',     'seed.cliente03@proofly.demo', 'seed', 'cliente'),
  ('Diego Fernandes',      'seed.cliente04@proofly.demo', 'seed', 'cliente'),
  ('Elena Martins',        'seed.cliente05@proofly.demo', 'seed', 'cliente'),
  ('Felipe Oliveira',      'seed.cliente06@proofly.demo', 'seed', 'cliente'),
  ('Gabriela Souza',       'seed.cliente07@proofly.demo', 'seed', 'cliente'),
  ('Henrique Alves',       'seed.cliente08@proofly.demo', 'seed', 'cliente'),
  ('Isabela Pereira',      'seed.cliente09@proofly.demo', 'seed', 'cliente'),
  ('João Pedro Santos',    'seed.cliente10@proofly.demo', 'seed', 'cliente'),
  ('Karina Mendes',        'seed.cliente11@proofly.demo', 'seed', 'cliente'),
  ('Lucas Barbosa',        'seed.cliente12@proofly.demo', 'seed', 'cliente'),
  ('Mariana Ribeiro',      'seed.cliente13@proofly.demo', 'seed', 'cliente'),
  ('Nicolas Carvalho',     'seed.cliente14@proofly.demo', 'seed', 'cliente'),
  ('Olivia Nascimento',    'seed.cliente15@proofly.demo', 'seed', 'cliente')
ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name;

-- 2) Perfis de cliente (client_profiles — 1:1 com users via client_id)
DELETE FROM public.client_profiles WHERE email LIKE 'seed.cliente%@proofly.demo';

INSERT INTO public.client_profiles (name, email, cpf, phone, city, state, gender, prof_style_tags, est_style_tags) VALUES
  ('Ana Beatriz Silva',  'seed.cliente01@proofly.demo', '11111111101', '11990001001', 'São Paulo',    'SP', 'Feminino',  ARRAY['Hip Hop','Streetwear'],     ARRAY['Wi-Fi','Descontraído']),
  ('Bruno Costa Lima',   'seed.cliente02@proofly.demo', '11111111102', '11990001002', 'Rio de Janeiro','RJ', 'Masculino', ARRAY['Rock','Clássico'],          ARRAY['Bar','Premium']),
  ('Camila Rodrigues',   'seed.cliente03@proofly.demo', '11111111103', '11990001003', 'Belo Horizonte','MG', 'Feminino',  ARRAY['Pop','Moderno'],            ARRAY['Café','Acolhedor']),
  ('Diego Fernandes',    'seed.cliente04@proofly.demo', '11111111104', '11990001004', 'Curitiba',     'PR', 'Masculino', ARRAY['Sertanejo','Casual'],       ARRAY['Estacionamento','Popular']),
  ('Elena Martins',      'seed.cliente05@proofly.demo', '11111111105', '11990001005', 'Porto Alegre', 'RS', 'Feminino',  ARRAY['MPB','Elegante'],           ARRAY['Pet Friendly','Calmo']),
  ('Felipe Oliveira',    'seed.cliente06@proofly.demo', '11111111106', '11990001006', 'Salvador',     'BA', 'Masculino', ARRAY['Eletrônico','Despojado'],   ARRAY['Música ao vivo','Animado']),
  ('Gabriela Souza',     'seed.cliente07@proofly.demo', '11111111107', '11990001007', 'Fortaleza',    'CE', 'Feminino',  ARRAY['Jazz','Criativo'],          ARRAY['Ar Condicionado','Sério']),
  ('Henrique Alves',     'seed.cliente08@proofly.demo', '11111111108', '11990001008', 'Brasília',     'DF', 'Masculino', ARRAY['Reggae','Tradicional'],     ARRAY['Família','Tradicional']),
  ('Isabela Pereira',    'seed.cliente09@proofly.demo', '11111111109', '11990001009', 'Recife',       'PE', 'Feminino',  ARRAY['Hip Hop','Comunicativo'],   ARRAY['LGBTQIA+','Moderno']),
  ('João Pedro Santos',  'seed.cliente10@proofly.demo', '11111111110', '11990001010', 'Goiânia',      'GO', 'Masculino', ARRAY['Rock','Detalhista'],      ARRAY['Wi-Fi','Despojado']),
  ('Karina Mendes',      'seed.cliente11@proofly.demo', '11111111111', '11990001011', 'Campinas',     'SP', 'Feminino',  ARRAY['Pop','Perfeccionista'],     ARRAY['Café','Intimista']),
  ('Lucas Barbosa',      'seed.cliente12@proofly.demo', '11111111112', '11990001012', 'Florianópolis','SC', 'Masculino', ARRAY['MPB','Esportista'],         ARRAY['Bar','Descontraído']),
  ('Mariana Ribeiro',    'seed.cliente13@proofly.demo', '11111111113', '11990001013', 'Vitória',      'ES', 'Feminino',  ARRAY['Sertanejo','Extrovertido'], ARRAY['Premium','Elegante']),
  ('Nicolas Carvalho',   'seed.cliente14@proofly.demo', '11111111114', '11990001014', 'Manaus',       'AM', 'Masculino', ARRAY['Eletrônico','Rápido'],      ARRAY['TV','Animado']),
  ('Olivia Nascimento',  'seed.cliente15@proofly.demo', '11111111115', '11990001015', 'Natal',        'RN', 'Feminino',  ARRAY['Jazz','Reservado'],         ARRAY['Acessibilidade','Calmo']);

UPDATE public.users u
SET client_id = cp.id
FROM public.client_profiles cp
WHERE u.client_id IS NULL
  AND u.email LIKE 'seed.cliente%@proofly.demo'
  AND cp.email = u.email;

-- 3) Vincular TODAS as avaliações a um cliente aleatório
UPDATE public.reviews r
SET
  user_id = pick.uid,
  source = CASE
    WHEN COALESCE(r.review_type, 'client_to_professional') = 'establishment_to_professional' THEN 'estabelecimento'
    WHEN r.review_type = 'professional_to_establishment' THEN 'profissional'
    ELSE 'cliente'
  END
FROM (
  SELECT
    rev.id AS review_id,
    (
      SELECT u.id
      FROM public.users u
      WHERE u.email LIKE 'seed.cliente%@proofly.demo'
      ORDER BY random()
      LIMIT 1
    ) AS uid
  FROM public.reviews rev
) pick
WHERE r.id = pick.review_id;

-- 4) Conferência
SELECT u.name AS autor, COUNT(r.id) AS total_avaliacoes
FROM public.users u
LEFT JOIN public.reviews r ON r.user_id = u.id
WHERE u.email LIKE 'seed.cliente%@proofly.demo'
GROUP BY u.id, u.name
ORDER BY u.name;

SELECT COUNT(*) AS reviews_sem_user FROM public.reviews WHERE user_id IS NULL;