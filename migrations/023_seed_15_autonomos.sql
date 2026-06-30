-- Proofly: 15 profissionais autônomos para mercado de talentos / recomendações
-- (sem current_establishment_id — aparecem em estabelecimento-marketplace.html)

BEGIN;

-- IDs escolhidos: alto IGV + mix de especialidades (não remove do Batel os 4 vinculados)
UPDATE public.professionals
SET
  current_establishment_id = NULL,
  seeking_work = TRUE,
  available_now = TRUE
WHERE id IN (
  '20000000-0000-4000-8000-00000000001b'::uuid, -- João Ferreira
  '20000000-0000-4000-8000-00000000000d'::uuid, -- Rodrigo Araújo
  '20000000-0000-4000-8000-000000000029'::uuid, -- Samuel Santos
  '20000000-0000-4000-8000-00000000001a'::uuid, -- Aline Pereira
  '20000000-0000-4000-8000-00000000000c'::uuid, -- Amanda Martins
  '20000000-0000-4000-8000-000000000019'::uuid, -- Pedro Costa
  '20000000-0000-4000-8000-00000000000b'::uuid, -- Gustavo Gomes
  '20000000-0000-4000-8000-000000000028'::uuid, -- Bianca Silva
  '20000000-0000-4000-8000-000000000027'::uuid, -- Alexandre Cavalcanti
  '20000000-0000-4000-8000-00000000000a'::uuid, -- Patrícia Carvalho
  '20000000-0000-4000-8000-000000000018'::uuid, -- Natália Lima
  '20000000-0000-4000-8000-000000000026'::uuid, -- Cristina Nascimento
  '20000000-0000-4000-8000-000000000009'::uuid, -- Diego Ribeiro
  '20000000-0000-4000-8000-000000000025'::uuid, -- Daniel Dias
  '20000000-0000-4000-8000-000000000017'::uuid  -- Matheus Souza
);

-- Encerra vínculo "atual" (histórico preservado)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'professional_establishments'
  ) THEN
    UPDATE public.professional_establishments
    SET is_current = FALSE, ended_at = COALESCE(ended_at, CURRENT_DATE)
    WHERE professional_id IN (
      '20000000-0000-4000-8000-00000000001b','20000000-0000-4000-8000-00000000000d',
      '20000000-0000-4000-8000-000000000029','20000000-0000-4000-8000-00000000001a',
      '20000000-0000-4000-8000-00000000000c','20000000-0000-4000-8000-000000000019',
      '20000000-0000-4000-8000-00000000000b','20000000-0000-4000-8000-000000000028',
      '20000000-0000-4000-8000-000000000027','20000000-0000-4000-8000-00000000000a',
      '20000000-0000-4000-8000-000000000018','20000000-0000-4000-8000-000000000026',
      '20000000-0000-4000-8000-000000000009','20000000-0000-4000-8000-000000000025',
      '20000000-0000-4000-8000-000000000017'
    )::uuid[]
      AND is_current = TRUE;
  END IF;
END $$;

COMMIT;

SELECT COUNT(*) AS autonomos_ativos
FROM public.professionals
WHERE is_active = TRUE AND current_establishment_id IS NULL;

NOTIFY pgrst, 'reload schema';