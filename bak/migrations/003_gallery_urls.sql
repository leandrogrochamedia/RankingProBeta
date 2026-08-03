-- Galeria de fotos (até 4) — profissionais e estabelecimentos
ALTER TABLE public.professionals
  ADD COLUMN IF NOT EXISTS gallery_urls TEXT[] DEFAULT '{}';

ALTER TABLE public.establishments
  ADD COLUMN IF NOT EXISTS gallery_urls TEXT[] DEFAULT '{}';