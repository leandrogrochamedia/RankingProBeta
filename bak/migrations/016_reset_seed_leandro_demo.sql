-- ============================================================
-- PROOFLY — Reset + população demo (beleza / barbearia)
-- ============================================================
-- O que faz:
--   1. Apaga TODOS os dados (inclusive usuários — recrie login no app)
--   2. Insere 6 estabelecimentos em Curitiba + 10 em São Paulo (endereços reais)
--   4. Insere 50 profissionais de beleza, vínculos, histórico e avaliações
--
-- Como rodar (RECOMENDADO — passo a passo no Supabase):
--   sql/demo/01_reset_keep_leandro.sql
--   sql/demo/02a_establishments_schema.sql
--   sql/demo/02b_establishments_data.sql
--   sql/demo/03_usuarios_seed_avaliadores.sql
--   sql/demo/04_profissionais_vinculos.sql
--   sql/demo/05_avaliacoes.sql
--   sql/demo/06_recalcular_metricas.sql
--   (veja sql/demo/00_EXECUTAR_NESTA_ORDEM.sql)
--
-- Opção monolito (este arquivo): só funciona se o schema já tiver as colunas
-- (rode 00b + 02a antes) OU use os arquivos sql/demo/ separados.
-- Idempotente: pode executar mais de uma vez
-- ATENÇÃO: apaga profissionais, estabelecimentos, reviews e outros usuários
-- ============================================================

BEGIN;

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

ALTER TABLE public.client_profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS client_id UUID;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ------------------------------------------------------------
-- 0a. Preparar tabela professional_establishments (schema antigo)
-- ------------------------------------------------------------
DO $prep$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'professional_establishments'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'professional_establishment' AND table_type = 'BASE TABLE'
    ) THEN
      ALTER TABLE public.professional_establishment RENAME TO professional_establishments;
    ELSE
      DROP VIEW IF EXISTS public.professional_establishment CASCADE;
      CREATE TABLE IF NOT EXISTS public.professional_establishments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        professional_id UUID REFERENCES public.professionals(id) ON DELETE CASCADE,
        establishment_id UUID REFERENCES public.establishments(id) ON DELETE CASCADE,
        is_current BOOLEAN NOT NULL DEFAULT FALSE,
        started_at TIMESTAMPTZ DEFAULT NOW(),
        ended_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    END IF;
    DROP VIEW IF EXISTS public.professional_establishment;
    CREATE OR REPLACE VIEW public.professional_establishment AS
    SELECT id, professional_id, establishment_id, is_current, started_at, ended_at, created_at
    FROM public.professional_establishments;
  END IF;
END $prep$;

-- ------------------------------------------------------------
-- 0b. Colunas faltantes (schema antigo) — antes do seed
-- ------------------------------------------------------------
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS specialty TEXT;
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS instagram TEXT;
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS gallery_urls TEXT[] DEFAULT '{}';
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS whatsapp TEXT;
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS zip_code TEXT;
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS street TEXT;
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS number TEXT;
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS neighborhood TEXT;
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Brasil';
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS style_tags TEXT[] DEFAULT '{}';
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS target_audience TEXT;
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS infra_tags TEXT[] DEFAULT '{}';
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS music_tags TEXT[] DEFAULT '{}';
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS positioning_tags TEXT[] DEFAULT '{}';
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS audience_tags TEXT[] DEFAULT '{}';
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS vibe_tags TEXT[] DEFAULT '{}';
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS avg_rating NUMERIC(3,2) DEFAULT 0;
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0;
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS years_active INTEGER;

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
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS avg_rating NUMERIC(3,2) DEFAULT 0;
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0;
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

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

ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS review_type TEXT DEFAULT 'client_to_professional';
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS source TEXT;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE;

-- ------------------------------------------------------------
-- 0. Variáveis / IDs fixos (facilita debug)
-- ------------------------------------------------------------
DO $seed$
DECLARE
  v_est_ids UUID[] := ARRAY[
    -- Curitiba (6)
    '10000000-0000-4000-8000-000000000001'::uuid,
    '10000000-0000-4000-8000-000000000002'::uuid,
    '10000000-0000-4000-8000-000000000003'::uuid,
    '10000000-0000-4000-8000-000000000004'::uuid,
    '10000000-0000-4000-8000-000000000005'::uuid,
    '10000000-0000-4000-8000-000000000006'::uuid,
    -- São Paulo (10)
    '10000000-0000-4000-8000-000000000007'::uuid,
    '10000000-0000-4000-8000-000000000008'::uuid,
    '10000000-0000-4000-8000-000000000009'::uuid,
    '10000000-0000-4000-8000-00000000000a'::uuid,
    '10000000-0000-4000-8000-00000000000b'::uuid,
    '10000000-0000-4000-8000-00000000000c'::uuid,
    '10000000-0000-4000-8000-00000000000d'::uuid,
    '10000000-0000-4000-8000-00000000000e'::uuid,
    '10000000-0000-4000-8000-00000000000f'::uuid,
    '10000000-0000-4000-8000-000000000010'::uuid
  ];

  v_prof_id UUID;
  v_est_id  UUID;
  v_past_est UUID;
  v_seed_user UUID;
  v_i INTEGER;
  v_j INTEGER;
  v_rating INTEGER;
  v_years INTEGER;
  v_carteira INTEGER;
  v_specialty TEXT;
  v_first TEXT;
  v_last TEXT;
  v_prof_name TEXT;
  v_est_idx INTEGER;
  v_past_idx INTEGER;
  v_comments TEXT[] := ARRAY[
    'Atendimento impecável, voltarei com certeza!',
    'Profissional muito atencioso e resultado excelente.',
    'Ambiente agradável e serviço de qualidade.',
    'Superou minhas expectativas, recomendo.',
    'Bom custo-benefício, ficou exatamente como pedi.',
    'Pontual e caprichoso, adorei o resultado.',
    'Primeira vez aqui e já virei fã.',
    'Cuidado nos detalhes, nota 10.',
    'Conversa boa e trabalho rápido sem perder qualidade.',
    'Melhor experiência que tive no bairro.',
    'Indico para amigos e família.',
    'Profissional entendeu meu estilo na hora.',
    'Acabamento perfeito, muito satisfeito.',
    'Voltarei na próxima semana.',
    'Equipe simpática e espaço limpo.'
  ];
  v_est_comments TEXT[] := ARRAY[
    'Lugar incrível, super organizado.',
    'Música boa e atendimento premium.',
    'Estacionamento fácil e recepção nota 10.',
    'Ambiente moderno, vale cada centavo.',
    'Me senti muito bem acolhido.',
    'Estrutura top para quem busca qualidade.'
  ];

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

BEGIN
  -- ----------------------------------------------------------
  -- 1. Limpeza total
  -- ----------------------------------------------------------
  DELETE FROM public.qr_codes;
  DELETE FROM public.reviews;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'professional_establishments') THEN
    DELETE FROM public.professional_establishments;
  ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'professional_establishment' AND table_type = 'BASE TABLE') THEN
    DELETE FROM public.professional_establishment;
  END IF;
  DELETE FROM public.professional_tags;
  DELETE FROM public.establishment_tags;
  DELETE FROM public.professional_profiles;
  DELETE FROM public.professional_private_data;
  DELETE FROM public.user_profiles;
  DELETE FROM public.users;
  DELETE FROM public.client_profiles;
  DELETE FROM public.professionals;
  DELETE FROM public.establishments;

  -- ----------------------------------------------------------
  -- 2. Estabelecimentos (endereços reais — nomes fictícios Proofly)
  -- ----------------------------------------------------------
  EXECUTE $sql$
  INSERT INTO public.establishments (
    id, name, type, description, specialty, phone, whatsapp, email,
    address, zip_code, street, number, neighborhood, city, state, country,
    infra_tags, music_tags, positioning_tags, audience_tags, vibe_tags,
    style_tags, target_audience, years_active, avg_rating, total_reviews
  ) VALUES
  -- CURITIBA (6)
  ('10000000-0000-4000-8000-000000000001', 'Proofly Batel Barber Club', 'Barbearia',
   'Barbearia premium no Batel com visagismo e barba terapia.',
   'Barbearia masculina', '(41) 3333-1001', '(41) 99901-0001', 'batel.barber@proofly.demo',
   'Av. Sete de Setembro, 2775 - Batel, Curitiba - PR', '80240-000', 'Av. Sete de Setembro', '2775', 'Batel', 'Curitiba', 'PR', 'Brasil',
   ARRAY['Wi-Fi','Ar Condicionado','Estacionamento'], ARRAY['Hip Hop','Rock'], ARRAY['Premium','Moderno'], ARRAY['Adulto','Empresarial'], ARRAY['Descontraído','Acolhedor'],
   ARRAY['Moderno','Premium'], 'Adulto', 8, 0, 0),

  ('10000000-0000-4000-8000-000000000002', 'Studio Hair Bigorrilho', 'Salão de Beleza',
   'Cortes femininos e masculinos, coloração e tratamentos capilares.',
   'Cabeleireiro unissex', '(41) 3333-1002', '(41) 99901-0002', 'bigorrilho.hair@proofly.demo',
   'Rua Padre Anchieta, 2045 - Bigorrilho, Curitiba - PR', '80730-000', 'Rua Padre Anchieta', '2045', 'Bigorrilho', 'Curitiba', 'PR', 'Brasil',
   ARRAY['Wi-Fi','Café','Ar Condicionado'], ARRAY['Pop','MPB'], ARRAY['Moderno','Popular'], ARRAY['Família','Todos'], ARRAY['Acolhedor','Calmo'],
   ARRAY['Moderno'], 'Todos', 12, 0, 0),

  ('10000000-0000-4000-8000-000000000003', 'Elegance Centro Salão', 'Salão de Beleza',
   'Salão completo: corte, mechas, manicure e maquiagem.',
   'Beleza completa', '(41) 3333-1003', '(41) 99901-0003', 'elegance.centro@proofly.demo',
   'Rua Comendador Araújo, 143 - Centro, Curitiba - PR', '80420-000', 'Rua Comendador Araújo', '143', 'Centro', 'Curitiba', 'PR', 'Brasil',
   ARRAY['Wi-Fi','Ar Condicionado','Acessibilidade'], ARRAY['MPB','Jazz'], ARRAY['Tradicional','Premium'], ARRAY['Adulto','Empresarial'], ARRAY['Sério','Intimista'],
   ARRAY['Clássico','Elegante'], 'Adulto', 15, 0, 0),

  ('10000000-0000-4000-8000-000000000004', 'Barbearia XV Centro', 'Barbearia',
   'Barbearia clássica no coração de Curitiba, especialista em degradê.',
   'Barbeiro clássico', '(41) 3333-1004', '(41) 99901-0004', 'xv.centro@proofly.demo',
   'Rua XV de Novembro, 478 - Centro, Curitiba - PR', '80020-310', 'Rua XV de Novembro', '478', 'Centro', 'Curitiba', 'PR', 'Brasil',
   ARRAY['Wi-Fi','TV'], ARRAY['Rock','Sertanejo'], ARRAY['Popular','Tradicional'], ARRAY['Todos'], ARRAY['Descontraído','Animado'],
   ARRAY['Tradicional'], 'Todos', 6, 0, 0),

  ('10000000-0000-4000-8000-000000000005', 'Espaço Beleza Água Verde', 'Espaço de Estética',
   'Estética facial, corporal, depilação e design de sobrancelhas.',
   'Estética avançada', '(41) 3333-1005', '(41) 99901-0005', 'aguasverde@proofly.demo',
   'Rua Nunes Machado, 672 - Água Verde, Curitiba - PR', '80250-200', 'Rua Nunes Machado', '672', 'Água Verde', 'Curitiba', 'PR', 'Brasil',
   ARRAY['Wi-Fi','Ar Condicionado','Pet Friendly'], ARRAY['Eletrônico','Pop'], ARRAY['Moderno','Despojado'], ARRAY['LGBTQIA+','Adulto'], ARRAY['Calmo','Acolhedor'],
   ARRAY['Moderno','Despojado'], 'LGBTQIA+', 5, 0, 0),

  ('10000000-0000-4000-8000-000000000006', 'Salão Cristo Rei Style', 'Salão de Beleza',
   'Cortes modernos, progressiva e nail art em ambiente familiar.',
   'Salão familiar', '(41) 3333-1006', '(41) 99901-0006', 'cristorei@proofly.demo',
   'Av. Presidente Affonso Camargo, 928 - Cristo Rei, Curitiba - PR', '80050-370', 'Av. Presidente Affonso Camargo', '928', 'Cristo Rei', 'Curitiba', 'PR', 'Brasil',
   ARRAY['Estacionamento','Café','Ar Condicionado'], ARRAY['Sertanejo','Pop'], ARRAY['Popular'], ARRAY['Família','Infantil'], ARRAY['Acolhedor','Animado'],
   ARRAY['Popular','Família'], 'Família', 9, 0, 0),

  -- SÃO PAULO (10)
  ('10000000-0000-4000-8000-000000000007', 'Barbearia Paulista Prime', 'Barbearia',
   'Barbearia de alto padrão na Paulista com atendimento executivo.',
   'Barbearia premium', '(11) 3333-2001', '(11) 99902-0001', 'paulista@proofly.demo',
   'Av. Paulista, 1578 - Bela Vista, São Paulo - SP', '01310-200', 'Av. Paulista', '1578', 'Bela Vista', 'São Paulo', 'SP', 'Brasil',
   ARRAY['Wi-Fi','Ar Condicionado','Bar'], ARRAY['Hip Hop','Jazz'], ARRAY['Luxo','Premium'], ARRAY['Empresarial','Adulto'], ARRAY['Sério','Intimista'],
   ARRAY['Premium','Elegante'], 'Empresarial', 10, 0, 0),

  ('10000000-0000-4000-8000-000000000008', 'Studio Oscar Freire Hair', 'Salão de Beleza',
   'Salão de luxo nos Jardins: coloração, tratamentos e styling.',
   'Hair design premium', '(11) 3333-2002', '(11) 99902-0002', 'oscarfreire@proofly.demo',
   'Rua Oscar Freire, 379 - Jardins, São Paulo - SP', '01426-000', 'Rua Oscar Freire', '379', 'Jardins', 'São Paulo', 'SP', 'Brasil',
   ARRAY['Wi-Fi','Café','Ar Condicionado','Estacionamento'], ARRAY['Jazz','MPB'], ARRAY['Luxo','Premium'], ARRAY['Adulto'], ARRAY['Intimista','Calmo'],
   ARRAY['Luxo','Elegante'], 'Adulto', 14, 0, 0),

  ('10000000-0000-4000-8000-000000000009', 'Harmonia Beauty Lab', 'Salão de Beleza',
   'Salão criativo na Vila Madalena com foco em coloração artística.',
   'Coloração criativa', '(11) 3333-2003', '(11) 99902-0003', 'harmonia@proofly.demo',
   'Rua Harmonia, 766 - Vila Madalena, São Paulo - SP', '05435-000', 'Rua Harmonia', '766', 'Vila Madalena', 'São Paulo', 'SP', 'Brasil',
   ARRAY['Wi-Fi','Pet Friendly'], ARRAY['Rock','Eletrônico'], ARRAY['Moderno','Despojado'], ARRAY['LGBTQIA+','Adulto'], ARRAY['Descontraído','Animado'],
   ARRAY['Alternativo','Moderno'], 'LGBTQIA+', 7, 0, 0),

  ('10000000-0000-4000-8000-00000000000a', 'Barbearia Pinheiros Urban', 'Barbearia',
   'Barbearia urbana em Pinheiros: fade, barba e produtos artesanais.',
   'Barbeiro urbano', '(11) 3333-2004', '(11) 99902-0004', 'pinheiros@proofly.demo',
   'Rua Teodoro Sampaio, 2555 - Pinheiros, São Paulo - SP', '05406-200', 'Rua Teodoro Sampaio', '2555', 'Pinheiros', 'São Paulo', 'SP', 'Brasil',
   ARRAY['Wi-Fi','Ar Condicionado'], ARRAY['Hip Hop','Rock'], ARRAY['Moderno','Popular'], ARRAY['Adulto','Todos'], ARRAY['Descontraído'],
   ARRAY['Streetwear','Moderno'], 'Todos', 5, 0, 0),

  ('10000000-0000-4000-8000-00000000000b', 'Espaço Augusta Unissex', 'Salão de Beleza',
   'Salão unissex na Consolação com horário estendido.',
   'Corte unissex', '(11) 3333-2005', '(11) 99902-0005', 'augusta@proofly.demo',
   'Rua Augusta, 1508 - Consolação, São Paulo - SP', '01305-100', 'Rua Augusta', '1508', 'Consolação', 'São Paulo', 'SP', 'Brasil',
   ARRAY['Wi-Fi','Ar Condicionado','Acessibilidade'], ARRAY['Pop','Eletrônico'], ARRAY['Popular','Moderno'], ARRAY['Todos'], ARRAY['Animado','Acolhedor'],
   ARRAY['Moderno'], 'Todos', 11, 0, 0),

  ('10000000-0000-4000-8000-00000000000c', 'Nail & Brow Aspicuelta', 'Studio de Unhas',
   'Manicure, pedicure, nail art e design de sobrancelhas.',
   'Nail & brow studio', '(11) 3333-2006', '(11) 99902-0006', 'aspicuelta@proofly.demo',
   'Rua Aspicuelta, 345 - Vila Madalena, São Paulo - SP', '05433-010', 'Rua Aspicuelta', '345', 'Vila Madalena', 'São Paulo', 'SP', 'Brasil',
   ARRAY['Wi-Fi','Café'], ARRAY['Pop','Reggae'], ARRAY['Moderno'], ARRAY['Adulto','LGBTQIA+'], ARRAY['Descontraído','Calmo'],
   ARRAY['Moderno','Criativo'], 'Adulto', 4, 0, 0),

  ('10000000-0000-4000-8000-00000000000d', 'Haddock Grooming House', 'Barbearia',
   'Barbearia boutique em Cerqueira César com serviço de bar premium.',
   'Grooming masculino', '(11) 3333-2007', '(11) 99902-0007', 'haddock@proofly.demo',
   'Rua Haddock Lobo, 595 - Cerqueira César, São Paulo - SP', '01414-001', 'Rua Haddock Lobo', '595', 'Cerqueira César', 'São Paulo', 'SP', 'Brasil',
   ARRAY['Wi-Fi','Ar Condicionado','Bar','Estacionamento'], ARRAY['Jazz','Blues'], ARRAY['Premium','Luxo'], ARRAY['Empresarial'], ARRAY['Sério','Intimista'],
   ARRAY['Elegante','Premium'], 'Empresarial', 8, 0, 0),

  ('10000000-0000-4000-8000-00000000000e', 'Bela Cintra Beauty House', 'Salão de Beleza',
   'Salão feminino com maquiagem, penteado e noivas.',
   'Beleza feminina', '(11) 3333-2008', '(11) 99902-0008', 'belacintra@proofly.demo',
   'Rua Bela Cintra, 2160 - Consolação, São Paulo - SP', '01414-002', 'Rua Bela Cintra', '2160', 'Consolação', 'São Paulo', 'SP', 'Brasil',
   ARRAY['Wi-Fi','Ar Condicionado','Café'], ARRAY['MPB','Pop'], ARRAY['Premium'], ARRAY['Adulto','Empresarial'], ARRAY['Acolhedor','Calmo'],
   ARRAY['Elegante'], 'Adulto', 13, 0, 0),

  ('10000000-0000-4000-8000-00000000000f', 'Fradique Barber Social', 'Barbearia',
   'Barbearia social em Pinheiros com cerveja artesanal e jogos.',
   'Barbearia social', '(11) 3333-2009', '(11) 99902-0009', 'fradique@proofly.demo',
   'Rua Fradique Coutinho, 915 - Pinheiros, São Paulo - SP', '05416-010', 'Rua Fradique Coutinho', '915', 'Pinheiros', 'São Paulo', 'SP', 'Brasil',
   ARRAY['Wi-Fi','Bar','TV','Pet Friendly'], ARRAY['Rock','Hip Hop'], ARRAY['Despojado','Popular'], ARRAY['Adulto','Todos'], ARRAY['Descontraído','Animado'],
   ARRAY['Despojado'], 'Todos', 6, 0, 0),

  ('10000000-0000-4000-8000-000000000010', 'Alameda Santos Glam', 'Salão de Beleza',
   'Salão glam no Jardim Paulista: mechas, botox capilar e eventos.',
   'Hair glam', '(11) 3333-2010', '(11) 99902-0010', 'alameda@proofly.demo',
   'Alameda Santos, 1826 - Jardim Paulista, São Paulo - SP', '01418-102', 'Alameda Santos', '1826', 'Jardim Paulista', 'São Paulo', 'SP', 'Brasil',
   ARRAY['Wi-Fi','Estacionamento','Ar Condicionado','Café'], ARRAY['Pop','Eletrônico'], ARRAY['Luxo','Premium'], ARRAY['Adulto','Empresarial'], ARRAY['Intimista','Sério'],
   ARRAY['Luxo','Premium'], 'Empresarial', 16, 0, 0)
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    city = EXCLUDED.city,
    neighborhood = EXCLUDED.neighborhood,
    street = EXCLUDED.street,
    number = EXCLUDED.number,
    zip_code = EXCLUDED.zip_code,
    state = EXCLUDED.state
  $sql$;

  -- ----------------------------------------------------------
  -- 5. Usuários seed para autoria de avaliações (não são Leandro)
  -- ----------------------------------------------------------
  FOR v_i IN 1..20 LOOP
    INSERT INTO public.users (id, name, email, provider, role)
    VALUES (
      ('30000000-0000-4000-8000-' || lpad(to_hex(v_i), 12, '0'))::uuid,
      (ARRAY['Ana Silva','Bruno Costa','Camila Rocha','Diego Lima','Elena Martins',
             'Felipe Souza','Gabriela Dias','Henrique Alves','Isabela Pereira','João Santos',
             'Karina Mendes','Lucas Barbosa','Mariana Nunes','Nicolas Carvalho','Olivia Freitas',
             'Paulo Teixeira','Rafaela Moraes','Sérgio Pinto','Tatiane Veiga','Vitor Campos'])[v_i],
      'seed.demo' || lpad(v_i::text, 2, '0') || '@proofly.demo',
      'seed', 'cliente'
    )
    ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name;
  END LOOP;

  -- ----------------------------------------------------------
  -- 6. 50 profissionais + perfis + vínculos + histórico
  -- ----------------------------------------------------------
  FOR v_i IN 1..50 LOOP
    v_prof_id := ('20000000-0000-4000-8000-' || lpad(to_hex(v_i), 12, '0'))::uuid;
    v_first := v_first_names[v_i];
    v_last := v_last_names[1 + (v_i % array_length(v_last_names, 1))];
    v_prof_name := v_first || ' ' || v_last;
    v_specialty := v_specialties[1 + ((v_i - 1) % array_length(v_specialties, 1))];
    v_est_idx := 1 + ((v_i - 1) % array_length(v_est_ids, 1));
    v_est_id := v_est_ids[v_est_idx];
    v_years := 2 + (v_i % 14);
    v_carteira := 0;

    INSERT INTO public.professionals (
      id, name, specialty, bio, phone, email,
      music_tags, visual_tags, personality_tags, lifestyle_tags, work_tags,
      price_range, availability, salary_expectation,
      available_now, seeking_work, client_portfolio_count, igv_score,
      current_establishment_id, previous_workplaces, avg_rating, total_reviews, is_active
    ) VALUES (
      v_prof_id,
      v_prof_name,
      v_specialty,
      'Profissional de ' || lower(v_specialty) || ' com foco em experiência do cliente e resultado consistente. Atua em ' ||
        CASE WHEN v_est_idx <= 6 THEN 'Curitiba' ELSE 'São Paulo' END || '.',
      CASE WHEN v_est_idx <= 6 THEN '(41) 99' || lpad((100000 + v_i)::text, 7, '0')
           ELSE '(11) 99' || lpad((200000 + v_i)::text, 7, '0') END,
      'prof.' || lpad(v_i::text, 2, '0') || '@proofly.demo',
      ARRAY[v_music[1 + (v_i % array_length(v_music, 1))], v_music[1 + ((v_i + 2) % array_length(v_music, 1))]],
      ARRAY[v_visual[1 + (v_i % array_length(v_visual, 1))]],
      ARRAY[v_personality[1 + (v_i % array_length(v_personality, 1))], v_personality[1 + ((v_i + 1) % array_length(v_personality, 1))]],
      ARRAY[v_lifestyle[1 + (v_i % array_length(v_lifestyle, 1))]],
      ARRAY[v_work[1 + (v_i % array_length(v_work, 1))]],
      v_price[1 + (v_i % array_length(v_price, 1))],
      ARRAY[v_days[1 + (v_i % array_length(v_days, 1))], v_days[1 + ((v_i + 2) % array_length(v_days, 1))], v_days[1 + ((v_i + 4) % array_length(v_days, 1))]],
      CASE WHEN v_i % 4 = 0 THEN 'R$ 3.500 + comissão' WHEN v_i % 4 = 1 THEN 'Comissão 40%' WHEN v_i % 4 = 2 THEN 'R$ 4.200 fixo' ELSE 'A combinar' END,
      (v_i % 5 = 0),
      TRUE,
      0,
      NULL,
      v_est_id,
      NULL,
      0,
      0,
      TRUE
    )
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      specialty = EXCLUDED.specialty,
      current_establishment_id = EXCLUDED.current_establishment_id;

    INSERT INTO public.professional_profiles (professional_id, specialty, years_experience, bio, instagram)
    VALUES (
      v_prof_id,
      v_specialty,
      v_years,
      'Especialista em ' || lower(v_specialty) || ' · ' || v_years || ' anos de experiência.',
      '@proofly_' || lower(replace(v_first, 'í', 'i')) || v_i
    )
    ON CONFLICT (professional_id) DO UPDATE SET
      specialty = EXCLUDED.specialty,
      years_experience = EXCLUDED.years_experience;

    -- vínculo atual
    INSERT INTO public.professional_establishments (professional_id, establishment_id, is_current, started_at)
    VALUES (v_prof_id, v_est_id, TRUE, NOW() - ((v_i % 24) + 3) * INTERVAL '1 month');

    -- histórico em 0–2 estabelecimentos anteriores
    FOR v_j IN 1..(v_i % 3) LOOP
      v_past_idx := 1 + ((v_est_idx + v_j + v_i) % array_length(v_est_ids, 1));
      IF v_past_idx = v_est_idx THEN
        v_past_idx := 1 + (v_past_idx % array_length(v_est_ids, 1));
      END IF;
      v_past_est := v_est_ids[v_past_idx];
      INSERT INTO public.professional_establishments (
        professional_id, establishment_id, is_current, started_at, ended_at
      ) VALUES (
        v_prof_id, v_past_est, FALSE,
        NOW() - ((v_j + 2) * 14 + v_i) * INTERVAL '1 month',
        NOW() - ((v_j + 1) * 8 + v_i) * INTERVAL '1 month'
      );
    END LOOP;

    -- texto previous_workplaces (nomes dos vínculos passados)
    UPDATE public.professionals p
    SET previous_workplaces = sub.nomes
    FROM (
      SELECT string_agg(e.name, ' · ' ORDER BY pe.ended_at DESC NULLS LAST) AS nomes
      FROM public.professional_establishments pe
      JOIN public.establishments e ON e.id = pe.establishment_id
      WHERE pe.professional_id = v_prof_id AND pe.is_current = FALSE
    ) sub
    WHERE p.id = v_prof_id;

    -- ----------------------------------------------------------
    -- 7. Avaliações por profissional (clientes + estabelecimentos)
    -- ----------------------------------------------------------
    FOR v_j IN 1..(4 + (v_i % 5)) LOOP
      v_rating := 3 + ((v_i + v_j) % 3); -- 3, 4 ou 5
      v_seed_user := ('30000000-0000-4000-8000-' || lpad(to_hex(1 + ((v_i + v_j) % 20)), 12, '0'))::uuid;

      INSERT INTO public.reviews (
        user_id, professional_id, rating, comment, verified, is_verified,
        source, review_type, created_at
      ) VALUES (
        v_seed_user,
        v_prof_id,
        v_rating,
        v_comments[1 + ((v_i + v_j) % array_length(v_comments, 1))],
        (v_j % 3 <> 0),
        (v_j % 3 <> 0),
        'cliente',
        'client_to_professional',
        NOW() - ((v_i * 3 + v_j) * 4) * INTERVAL '1 day'
      );
    END LOOP;

    -- avaliações de estabelecimentos (empregadores)
    IF v_i % 2 = 0 THEN
      INSERT INTO public.reviews (
        professional_id, establishment_id, rating, comment, verified, is_verified,
        source, review_type, created_at
      ) VALUES (
        v_prof_id,
        v_est_id,
        4 + (v_i % 2),
        'Profissional pontual, técnica sólida e bom relacionamento com clientes.',
        TRUE, TRUE,
        'estabelecimento',
        'establishment_to_professional',
        NOW() - (v_i * 5) * INTERVAL '1 day'
      );
    END IF;

    IF (v_i % 3 = 0) AND v_j > 0 THEN
      v_past_idx := 1 + ((v_est_idx + 3) % array_length(v_est_ids, 1));
      INSERT INTO public.reviews (
        professional_id, establishment_id, rating, comment, verified, is_verified,
        source, review_type, created_at
      ) VALUES (
        v_prof_id,
        v_est_ids[v_past_idx],
        4,
        'Boa performance no período em que trabalhou conosco.',
        TRUE, TRUE,
        'estabelecimento',
        'establishment_to_professional',
        NOW() - (v_i * 9) * INTERVAL '1 day'
      );
    END IF;
  END LOOP;

  -- ----------------------------------------------------------
  -- 8. Avaliações dos estabelecimentos (clientes)
  -- ----------------------------------------------------------
  FOR v_i IN 1..array_length(v_est_ids, 1) LOOP
    v_est_id := v_est_ids[v_i];
    FOR v_j IN 1..(3 + (v_i % 4)) LOOP
      v_seed_user := ('30000000-0000-4000-8000-' || lpad(to_hex(1 + ((v_i + v_j) % 20)), 12, '0'))::uuid;
      INSERT INTO public.reviews (
        user_id, establishment_id, rating, comment, verified, is_verified,
        source, review_type, created_at
      ) VALUES (
        v_seed_user,
        v_est_id,
        4 + ((v_i + v_j) % 2),
        v_est_comments[1 + ((v_i + v_j) % array_length(v_est_comments, 1))],
        TRUE, TRUE,
        'cliente',
        'client_to_establishment',
        NOW() - ((v_i + v_j) * 6) * INTERVAL '1 day'
      );
    END LOOP;
  END LOOP;

  -- ----------------------------------------------------------
  -- 9. Recalcular métricas (IGV / carteira / médias)
  -- ----------------------------------------------------------
  FOR v_i IN 1..50 LOOP
    v_prof_id := ('20000000-0000-4000-8000-' || lpad(to_hex(v_i), 12, '0'))::uuid;
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'recalc_prof_talent_metrics') THEN
      PERFORM public.recalc_prof_talent_metrics(v_prof_id);
    ELSE
      UPDATE public.professionals p
      SET
        client_portfolio_count = sub.cnt,
        avg_rating = sub.avg,
        total_reviews = sub.total,
        igv_score = LEAST(100, GREATEST(0, ROUND((
          (sub.cnt * 0.45) + (sub.avg * 7) + (COALESCE(pp.years_experience, 0) * 4) + (sub.verified_ratio * 5)
        )::numeric, 2)))
      FROM (
        SELECT
          COUNT(DISTINCT COALESCE(r.user_id::text, r.id::text)) AS cnt,
          COUNT(*) AS total,
          COALESCE(ROUND(AVG(r.rating)::numeric, 2), 0) AS avg,
          CASE WHEN COUNT(*) = 0 THEN 0::numeric
               ELSE COUNT(*) FILTER (WHERE COALESCE(r.is_verified, r.verified, FALSE))::numeric / COUNT(*)
          END AS verified_ratio
        FROM public.reviews r
        WHERE r.professional_id = v_prof_id
          AND (r.source = 'cliente' OR r.review_type = 'client_to_professional')
      ) sub
      LEFT JOIN public.professional_profiles pp ON pp.professional_id = p.id
      WHERE p.id = v_prof_id;
    END IF;
  END LOOP;

  UPDATE public.establishments e
  SET
    avg_rating = COALESCE(sub.avg, 0),
    total_reviews = COALESCE(sub.cnt, 0)
  FROM (
    SELECT establishment_id, ROUND(AVG(rating)::numeric, 2) AS avg, COUNT(*) AS cnt
    FROM public.reviews
    WHERE establishment_id IS NOT NULL
      AND review_type = 'client_to_establishment'
    GROUP BY establishment_id
  ) sub
  WHERE e.id = sub.establishment_id;

  RAISE NOTICE '✅ Seed concluído — Estabelecimentos: %, Profissionais: 50', array_length(v_est_ids, 1);
END $seed$;

-- Fotos demo (profissionais + estabelecimentos sem avatar)
DO $img$
DECLARE
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
    SELECT avatar_url INTO v_avatar FROM public.professionals WHERE id = r.id;
    IF v_avatar IS NOT NULL AND btrim(v_avatar) <> '' THEN CONTINUE; END IF;
    v_h := abs(hashtext(r.id::text));
    v_avatar := v_prof_avatars[1 + (v_h % array_length(v_prof_avatars, 1))];
    v_g1 := v_prof_gallery[1 + ((v_h + 1) % array_length(v_prof_gallery, 1))];
    v_g2 := v_prof_gallery[1 + ((v_h + 2) % array_length(v_prof_gallery, 1))];
    v_g3 := v_prof_gallery[1 + ((v_h + 3) % array_length(v_prof_gallery, 1))];
    UPDATE public.professionals SET avatar_url = v_avatar, gallery_urls = ARRAY[v_avatar, v_g1, v_g2, v_g3] WHERE id = r.id;
  END LOOP;
  FOR r IN SELECT id FROM public.establishments LOOP
    SELECT avatar_url INTO v_avatar FROM public.establishments WHERE id = r.id;
    IF v_avatar IS NOT NULL AND btrim(v_avatar) <> '' THEN CONTINUE; END IF;
    v_h := abs(hashtext(r.id::text));
    v_avatar := v_est_photos[1 + (v_h % array_length(v_est_photos, 1))];
    v_g1 := v_est_photos[1 + ((v_h + 1) % array_length(v_est_photos, 1))];
    v_g2 := v_est_photos[1 + ((v_h + 2) % array_length(v_est_photos, 1))];
    v_g3 := v_est_photos[1 + ((v_h + 3) % array_length(v_est_photos, 1))];
    UPDATE public.establishments SET avatar_url = v_avatar, gallery_urls = ARRAY[v_avatar, v_g1, v_g2, v_g3] WHERE id = r.id;
  END LOOP;
END $img$;

COMMIT;

-- ------------------------------------------------------------
-- 10. Conferência rápida
-- ------------------------------------------------------------
SELECT 'users' AS tabela, COUNT(*) AS total FROM public.users
UNION ALL SELECT 'client_profiles', COUNT(*) FROM public.client_profiles
UNION ALL SELECT 'establishments', COUNT(*) FROM public.establishments
UNION ALL SELECT 'professionals', COUNT(*) FROM public.professionals
UNION ALL SELECT 'professional_establishments', COUNT(*) FROM public.professional_establishments
UNION ALL SELECT 'reviews', COUNT(*) FROM public.reviews
ORDER BY tabela;

SELECT city, COUNT(*) AS qtd FROM public.establishments GROUP BY city ORDER BY city;

SELECT e.city, e.name, COUNT(p.id) AS profissionais
FROM public.establishments e
LEFT JOIN public.professionals p ON p.current_establishment_id = e.id
GROUP BY e.city, e.name
ORDER BY e.city, e.name;