-- Proofly — Campos de perfil para contratantes (RH / mercado de talentos)
-- Rode no SQL Editor do Supabase

ALTER TABLE public.professionals
  ADD COLUMN IF NOT EXISTS average_job_duration_months INTEGER,
  ADD COLUMN IF NOT EXISTS work_style_tags TEXT[] DEFAULT '{}'::text[];

COMMENT ON COLUMN public.professionals.average_job_duration_months IS 'Média de permanência nos últimos empregos (meses)';
COMMENT ON COLUMN public.professionals.work_style_tags IS 'Estilo de trabalho declarado pelo profissional';

ALTER TABLE public.professional_private_data
  ADD COLUMN IF NOT EXISTS birth_date DATE;

COMMENT ON COLUMN public.professional_private_data.birth_date IS 'Data de nascimento (opcional) — idade exibida aos contratantes';