-- Adicionar colunas na tabela professionals
ALTER TABLE professionals 
ADD COLUMN IF NOT EXISTS style_tags text[],
ADD COLUMN IF NOT EXISTS price_range text,
ADD COLUMN IF NOT EXISTS availability text[],
ADD COLUMN IF NOT EXISTS previous_workplaces text;

-- Adicionar colunas na tabela establishments
ALTER TABLE establishments 
ADD COLUMN IF NOT EXISTS style_tags text[],
ADD COLUMN IF NOT EXISTS target_audience text;

-- Adicionar coluna review_type na tabela reviews (se não existir)
ALTER TABLE reviews 
ADD COLUMN IF NOT EXISTS review_type text DEFAULT 'client_to_professional';

ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_review_type_check;
ALTER TABLE reviews ADD CONSTRAINT reviews_review_type_check
  CHECK (review_type IN (
    'client_to_professional',
    'establishment_to_professional',
    'client_to_establishment',
    'professional_to_establishment',
    'profile_like'
  ));


-- ============================================================
-- POPULAR STYLE_TAGS ALEATORIAMENTE (PARA TESTES)
-- ============================================================

-- 1. Definir lista de estilos disponíveis
WITH estilos AS (
  SELECT unnest(ARRAY[
    'Hip Hop', 'Família', 'Punk', 'Clássico', 'Moderno',
    'Tradicional', 'Alternativo', 'Luxo', 'Minimalista', 'Despojado'
  ]) AS estilo
)

-- 2. Atualizar profissionais
UPDATE professionals
SET style_tags = (
  SELECT array_agg(estilo ORDER BY random())
  FROM estilos
  WHERE random() < 0.4  -- ~40% de chance de cada estilo ser incluído
  LIMIT (floor(random() * 3) + 1)::int  -- entre 1 e 3 estilos
)
WHERE style_tags IS NULL OR array_length(style_tags, 1) IS NULL;

-- 3. Atualizar estabelecimentos
UPDATE establishments
SET style_tags = (
  SELECT array_agg(estilo ORDER BY random())
  FROM estilos
  WHERE random() < 0.4
  LIMIT (floor(random() * 3) + 1)::int
)
WHERE style_tags IS NULL OR array_length(style_tags, 1) IS NULL; 

-- Popular price_range para profissionais
UPDATE professionals
SET price_range = (ARRAY['Até R$50', 'R$50 - R$100', 'R$100 - R$200', 'Acima de R$200'])[floor(random() * 4) + 1]
WHERE price_range IS NULL;

-- Popular availability (dias da semana) para profissionais
UPDATE professionals
SET availability = ARRAY[
  (ARRAY['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'])[floor(random() * 7) + 1],
  (ARRAY['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'])[floor(random() * 7) + 1]
]
WHERE availability IS NULL OR array_length(availability, 1) IS NULL;

-- Popular target_audience para estabelecimentos
UPDATE establishments
SET target_audience = (ARRAY['Infantil', 'Adulto', 'LGBTQIA+', 'Família', 'Empresarial', 'Todos'])[floor(random() * 6) + 1]
WHERE target_audience IS NULL;





