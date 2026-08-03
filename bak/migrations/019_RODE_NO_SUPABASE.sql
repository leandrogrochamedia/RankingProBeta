-- ============================================================
-- PROOFLY — Campos RH para contratantes (RODE INTEIRO NO SUPABASE)
-- Corrige: column professionals.work_style_tags does not exist
-- ============================================================

ALTER TABLE public.professionals
  ADD COLUMN IF NOT EXISTS average_job_duration_months INTEGER,
  ADD COLUMN IF NOT EXISTS work_style_tags TEXT[] DEFAULT '{}'::text[];

ALTER TABLE public.professional_private_data
  ADD COLUMN IF NOT EXISTS birth_date DATE;

COMMENT ON COLUMN public.professionals.average_job_duration_months IS
  'Média de permanência nos últimos empregos (meses)';
COMMENT ON COLUMN public.professionals.work_style_tags IS
  'Estilo de trabalho declarado pelo profissional';
COMMENT ON COLUMN public.professional_private_data.birth_date IS
  'Data de nascimento (opcional) — idade exibida aos contratantes';

-- Conferência
SELECT
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'professionals' AND column_name = 'work_style_tags'
  ) AS tem_work_style_tags,
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'professionals' AND column_name = 'average_job_duration_months'
  ) AS tem_avg_job_duration,
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'professional_private_data' AND column_name = 'birth_date'
  ) AS tem_birth_date;