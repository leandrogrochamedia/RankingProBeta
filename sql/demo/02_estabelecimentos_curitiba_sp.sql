-- ============================================================
-- 02 — Estabelecimentos (2 queries separadas no Supabase)
-- ============================================================
-- O SQL Editor valida o INSERT antes de rodar ALTER no mesmo arquivo.
-- Por isso o passo 02 foi dividido em dois arquivos:
--
--   PASSO A → sql/demo/02a_establishments_schema.sql  (só ALTER)
--   PASSO B → sql/demo/02b_establishments_data.sql    (só INSERT)
--
-- Rode A, espere "Success", depois rode B.
-- ============================================================

SELECT 'Execute 02a_establishments_schema.sql e depois 02b_establishments_data.sql' AS proximo_passo;