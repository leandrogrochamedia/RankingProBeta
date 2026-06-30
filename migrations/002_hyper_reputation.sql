-- Proofly Hyper Reputation System — migração incremental
-- Execute no SQL Editor do Supabase

ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS review_type TEXT DEFAULT 'client_to_professional';

ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_review_type_check;
ALTER TABLE public.reviews ADD CONSTRAINT reviews_review_type_check
  CHECK (review_type IN (
    'client_to_professional',
    'establishment_to_professional',
    'client_to_establishment',
    'professional_to_establishment',
    'profile_like'
  ));

CREATE INDEX IF NOT EXISTS idx_reviews_type ON public.reviews(review_type);