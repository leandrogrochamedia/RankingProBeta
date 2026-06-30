-- ============================================================
-- PROOFLY — Endereços fictícios para todos os profissionais
-- CEP e bairro reais · Curitiba (PR) e São Paulo (SP)
-- ============================================================

BEGIN;

DO $addr$
DECLARE
  rec RECORD;
  v_idx INTEGER;
  v_city TEXT;
  v_state TEXT;
  v_street TEXT;
  v_hood TEXT;
  v_cep TEXT;
  v_number TEXT;
  -- Curitiba — ruas/bairros/CEP reais
  ctb_streets TEXT[] := ARRAY[
    'Av. Sete de Setembro', 'Rua Padre Anchieta', 'Rua Comendador Araújo',
    'Rua XV de Novembro', 'Rua Nunes Machado', 'Av. Presidente Affonso Camargo',
    'Rua Bruno Filgueira', 'Rua Nilo Peçanha', 'Rua Nicola Pellanda',
    'Rua Augusto Staben', 'Rua Nilo Cairo', 'Rua Deputado Heitor Alencar Furtado',
    'Rua Pasteur', 'Rua Prof. Pedro Viriato Parigot de Souza', 'Rua Manoel Ribas'
  ];
  ctb_hoods TEXT[] := ARRAY[
    'Batel', 'Bigorrilho', 'Centro', 'Centro', 'Água Verde', 'Cristo Rei',
    'Mercês', 'Champagnat', 'Boqueirão', 'Portão', 'Cabral', 'Juvevê',
    'Ahú', 'Seminário', 'Santa Felicidade'
  ];
  ctb_ceps TEXT[] := ARRAY[
    '80240-000', '80730-000', '80420-000', '80020-310', '80250-200', '80050-370',
    '80810-110', '80710-150', '81650-000', '81050-000', '80060-050', '80030-150',
    '80250-080', '80440-080', '82020-000'
  ];
  -- São Paulo — ruas/bairros/CEP reais
  sp_streets TEXT[] := ARRAY[
    'Av. Paulista', 'Rua Oscar Freire', 'Rua Harmonia', 'Rua Teodoro Sampaio',
    'Rua Augusta', 'Rua Joaquim Floriano', 'Alameda dos Nhambiquaras', 'Rua Funchal',
    'Rua José Carlos Pace', 'Rua Aimberê', 'Rua Serra de Japi', 'Rua Voluntários da Pátria',
    'Rua Bom Pastor', 'Rua da Mooca', 'Rua Maranhão'
  ];
  sp_hoods TEXT[] := ARRAY[
    'Bela Vista', 'Jardins', 'Vila Madalena', 'Pinheiros', 'Consolação', 'Itaim Bibi',
    'Moema', 'Vila Olímpia', 'Brooklin', 'Perdizes', 'Tatuapé', 'Santana',
    'Ipiranga', 'Mooca', 'Higienópolis'
  ];
  sp_ceps TEXT[] := ARRAY[
    '01310-200', '01426-000', '05435-000', '05406-200', '01305-100', '04534-002',
    '04090-001', '04551-060', '04578-910', '05038-040', '03309-000', '02011-000',
    '04203-000', '03163-030', '01240-000'
  ];
BEGIN
  v_idx := 0;
  FOR rec IN
    SELECT p.id, p.name, p.email, p.phone, e.city AS est_city, e.state AS est_state
    FROM public.professionals p
    LEFT JOIN public.establishments e ON e.id = p.current_establishment_id
    WHERE p.is_active = TRUE
    ORDER BY p.id
  LOOP
    v_idx := v_idx + 1;

    IF rec.est_city IN ('São Paulo', 'Sao Paulo') THEN
      v_city := 'São Paulo';
      v_state := 'SP';
    ELSIF rec.est_city = 'Curitiba' THEN
      v_city := 'Curitiba';
      v_state := 'PR';
    ELSIF (v_idx % 2) = 0 THEN
      v_city := 'São Paulo';
      v_state := 'SP';
    ELSE
      v_city := 'Curitiba';
      v_state := 'PR';
    END IF;

    IF v_city = 'Curitiba' THEN
      v_street := ctb_streets[1 + ((v_idx - 1) % array_length(ctb_streets, 1))];
      v_hood := ctb_hoods[1 + ((v_idx - 1) % array_length(ctb_hoods, 1))];
      v_cep := ctb_ceps[1 + ((v_idx - 1) % array_length(ctb_ceps, 1))];
    ELSE
      v_street := sp_streets[1 + ((v_idx - 1) % array_length(sp_streets, 1))];
      v_hood := sp_hoods[1 + ((v_idx - 1) % array_length(sp_hoods, 1))];
      v_cep := sp_ceps[1 + ((v_idx - 1) % array_length(sp_ceps, 1))];
    END IF;

    v_number := (80 + ((v_idx * 47 + 13) % 1950))::text;

    INSERT INTO public.professional_private_data (
      professional_id, full_name, email, phone,
      zip_code, street, number, neighborhood, city, state, country
    ) VALUES (
      rec.id, rec.name, rec.email, rec.phone,
      v_cep, v_street, v_number, v_hood, v_city, v_state, 'Brasil'
    )
    ON CONFLICT (professional_id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      email = EXCLUDED.email,
      phone = EXCLUDED.phone,
      zip_code = EXCLUDED.zip_code,
      street = EXCLUDED.street,
      number = EXCLUDED.number,
      neighborhood = EXCLUDED.neighborhood,
      city = EXCLUDED.city,
      state = EXCLUDED.state,
      country = EXCLUDED.country,
      updated_at = NOW();
  END LOOP;

  RAISE NOTICE '✅ Endereços em % profissionais', v_idx;
END $addr$;

COMMIT;

SELECT city, COUNT(*) AS profissionais
FROM public.professional_private_data
GROUP BY city
ORDER BY city;

NOTIFY pgrst, 'reload schema';