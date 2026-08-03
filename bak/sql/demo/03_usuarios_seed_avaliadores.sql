-- ============================================================
-- 03 — 20 usuários fictícios (autores das avaliações)
-- ============================================================

BEGIN;

INSERT INTO public.users (id, name, email, provider, role) VALUES
  ('30000000-0000-4000-8000-000000000001', 'Ana Silva',        'seed.demo01@proofly.demo', 'seed', 'cliente'),
  ('30000000-0000-4000-8000-000000000002', 'Bruno Costa',      'seed.demo02@proofly.demo', 'seed', 'cliente'),
  ('30000000-0000-4000-8000-000000000003', 'Camila Rocha',     'seed.demo03@proofly.demo', 'seed', 'cliente'),
  ('30000000-0000-4000-8000-000000000004', 'Diego Lima',       'seed.demo04@proofly.demo', 'seed', 'cliente'),
  ('30000000-0000-4000-8000-000000000005', 'Elena Martins',    'seed.demo05@proofly.demo', 'seed', 'cliente'),
  ('30000000-0000-4000-8000-000000000006', 'Felipe Souza',     'seed.demo06@proofly.demo', 'seed', 'cliente'),
  ('30000000-0000-4000-8000-000000000007', 'Gabriela Dias',    'seed.demo07@proofly.demo', 'seed', 'cliente'),
  ('30000000-0000-4000-8000-000000000008', 'Henrique Alves',   'seed.demo08@proofly.demo', 'seed', 'cliente'),
  ('30000000-0000-4000-8000-000000000009', 'Isabela Pereira',  'seed.demo09@proofly.demo', 'seed', 'cliente'),
  ('30000000-0000-4000-8000-00000000000a', 'João Santos',      'seed.demo10@proofly.demo', 'seed', 'cliente'),
  ('30000000-0000-4000-8000-00000000000b', 'Karina Mendes',    'seed.demo11@proofly.demo', 'seed', 'cliente'),
  ('30000000-0000-4000-8000-00000000000c', 'Lucas Barbosa',    'seed.demo12@proofly.demo', 'seed', 'cliente'),
  ('30000000-0000-4000-8000-00000000000d', 'Mariana Nunes',    'seed.demo13@proofly.demo', 'seed', 'cliente'),
  ('30000000-0000-4000-8000-00000000000e', 'Nicolas Carvalho', 'seed.demo14@proofly.demo', 'seed', 'cliente'),
  ('30000000-0000-4000-8000-00000000000f', 'Olivia Freitas',   'seed.demo15@proofly.demo', 'seed', 'cliente'),
  ('30000000-0000-4000-8000-000000000010', 'Paulo Teixeira',   'seed.demo16@proofly.demo', 'seed', 'cliente'),
  ('30000000-0000-4000-8000-000000000011', 'Rafaela Moraes',   'seed.demo17@proofly.demo', 'seed', 'cliente'),
  ('30000000-0000-4000-8000-000000000012', 'Sérgio Pinto',     'seed.demo18@proofly.demo', 'seed', 'cliente'),
  ('30000000-0000-4000-8000-000000000013', 'Tatiane Veiga',    'seed.demo19@proofly.demo', 'seed', 'cliente'),
  ('30000000-0000-4000-8000-000000000014', 'Vitor Campos',     'seed.demo20@proofly.demo', 'seed', 'cliente')
ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name;

COMMIT;

SELECT COUNT(*) AS usuarios_seed FROM public.users WHERE email LIKE 'seed.demo%@proofly.demo';