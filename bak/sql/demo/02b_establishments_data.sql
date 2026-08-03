-- ============================================================
-- 02b — Dados dos 16 estabelecimentos
-- OBRIGATÓRIO: rode 02a_establishments_schema.sql ANTES (query separada)
-- ============================================================

INSERT INTO public.establishments (
  id, name, type, description, specialty, phone, whatsapp, email,
  address, zip_code, street, number, neighborhood, city, state, country,
  infra_tags, music_tags, positioning_tags, audience_tags, vibe_tags,
  style_tags, target_audience, years_active, avg_rating, total_reviews
) VALUES
('10000000-0000-4000-8000-000000000001', 'Proofly Batel Barber Club', 'Barbearia',
 'Barbearia premium no Batel com visagismo e barba terapia.', 'Barbearia masculina',
 '(41) 3333-1001', '(41) 99901-0001', 'batel.barber@proofly.demo',
 'Av. Sete de Setembro, 2775 - Batel, Curitiba - PR', '80240-000', 'Av. Sete de Setembro', '2775', 'Batel', 'Curitiba', 'PR', 'Brasil',
 ARRAY['Wi-Fi','Ar Condicionado','Estacionamento'], ARRAY['Hip Hop','Rock'], ARRAY['Premium','Moderno'], ARRAY['Adulto','Empresarial'], ARRAY['Descontraído','Acolhedor'],
 ARRAY['Moderno','Premium'], 'Adulto', 8, 0, 0),
('10000000-0000-4000-8000-000000000002', 'Studio Hair Bigorrilho', 'Salão de Beleza',
 'Cortes femininos e masculinos, coloração e tratamentos capilares.', 'Cabeleireiro unissex',
 '(41) 3333-1002', '(41) 99901-0002', 'bigorrilho.hair@proofly.demo',
 'Rua Padre Anchieta, 2045 - Bigorrilho, Curitiba - PR', '80730-000', 'Rua Padre Anchieta', '2045', 'Bigorrilho', 'Curitiba', 'PR', 'Brasil',
 ARRAY['Wi-Fi','Café','Ar Condicionado'], ARRAY['Pop','MPB'], ARRAY['Moderno','Popular'], ARRAY['Família','Todos'], ARRAY['Acolhedor','Calmo'],
 ARRAY['Moderno'], 'Todos', 12, 0, 0),
('10000000-0000-4000-8000-000000000003', 'Elegance Centro Salão', 'Salão de Beleza',
 'Salão completo: corte, mechas, manicure e maquiagem.', 'Beleza completa',
 '(41) 3333-1003', '(41) 99901-0003', 'elegance.centro@proofly.demo',
 'Rua Comendador Araújo, 143 - Centro, Curitiba - PR', '80420-000', 'Rua Comendador Araújo', '143', 'Centro', 'Curitiba', 'PR', 'Brasil',
 ARRAY['Wi-Fi','Ar Condicionado','Acessibilidade'], ARRAY['MPB','Jazz'], ARRAY['Tradicional','Premium'], ARRAY['Adulto','Empresarial'], ARRAY['Sério','Intimista'],
 ARRAY['Clássico','Elegante'], 'Adulto', 15, 0, 0),
('10000000-0000-4000-8000-000000000004', 'Barbearia XV Centro', 'Barbearia',
 'Barbearia clássica no coração de Curitiba, especialista em degradê.', 'Barbeiro clássico',
 '(41) 3333-1004', '(41) 99901-0004', 'xv.centro@proofly.demo',
 'Rua XV de Novembro, 478 - Centro, Curitiba - PR', '80020-310', 'Rua XV de Novembro', '478', 'Centro', 'Curitiba', 'PR', 'Brasil',
 ARRAY['Wi-Fi','TV'], ARRAY['Rock','Sertanejo'], ARRAY['Popular','Tradicional'], ARRAY['Todos'], ARRAY['Descontraído','Animado'],
 ARRAY['Tradicional'], 'Todos', 6, 0, 0),
('10000000-0000-4000-8000-000000000005', 'Espaço Beleza Água Verde', 'Espaço de Estética',
 'Estética facial, corporal, depilação e design de sobrancelhas.', 'Estética avançada',
 '(41) 3333-1005', '(41) 99901-0005', 'aguasverde@proofly.demo',
 'Rua Nunes Machado, 672 - Água Verde, Curitiba - PR', '80250-200', 'Rua Nunes Machado', '672', 'Água Verde', 'Curitiba', 'PR', 'Brasil',
 ARRAY['Wi-Fi','Ar Condicionado','Pet Friendly'], ARRAY['Eletrônico','Pop'], ARRAY['Moderno','Despojado'], ARRAY['LGBTQIA+','Adulto'], ARRAY['Calmo','Acolhedor'],
 ARRAY['Moderno','Despojado'], 'LGBTQIA+', 5, 0, 0),
('10000000-0000-4000-8000-000000000006', 'Salão Cristo Rei Style', 'Salão de Beleza',
 'Cortes modernos, progressiva e nail art em ambiente familiar.', 'Salão familiar',
 '(41) 3333-1006', '(41) 99901-0006', 'cristorei@proofly.demo',
 'Av. Presidente Affonso Camargo, 928 - Cristo Rei, Curitiba - PR', '80050-370', 'Av. Presidente Affonso Camargo', '928', 'Cristo Rei', 'Curitiba', 'PR', 'Brasil',
 ARRAY['Estacionamento','Café','Ar Condicionado'], ARRAY['Sertanejo','Pop'], ARRAY['Popular'], ARRAY['Família','Infantil'], ARRAY['Acolhedor','Animado'],
 ARRAY['Popular','Família'], 'Família', 9, 0, 0),
('10000000-0000-4000-8000-000000000007', 'Barbearia Paulista Prime', 'Barbearia',
 'Barbearia de alto padrão na Paulista com atendimento executivo.', 'Barbearia premium',
 '(11) 3333-2001', '(11) 99902-0001', 'paulista@proofly.demo',
 'Av. Paulista, 1578 - Bela Vista, São Paulo - SP', '01310-200', 'Av. Paulista', '1578', 'Bela Vista', 'São Paulo', 'SP', 'Brasil',
 ARRAY['Wi-Fi','Ar Condicionado','Bar'], ARRAY['Hip Hop','Jazz'], ARRAY['Luxo','Premium'], ARRAY['Empresarial','Adulto'], ARRAY['Sério','Intimista'],
 ARRAY['Premium','Elegante'], 'Empresarial', 10, 0, 0),
('10000000-0000-4000-8000-000000000008', 'Studio Oscar Freire Hair', 'Salão de Beleza',
 'Salão de luxo nos Jardins: coloração, tratamentos e styling.', 'Hair design premium',
 '(11) 3333-2002', '(11) 99902-0002', 'oscarfreire@proofly.demo',
 'Rua Oscar Freire, 379 - Jardins, São Paulo - SP', '01426-000', 'Rua Oscar Freire', '379', 'Jardins', 'São Paulo', 'SP', 'Brasil',
 ARRAY['Wi-Fi','Café','Ar Condicionado','Estacionamento'], ARRAY['Jazz','MPB'], ARRAY['Luxo','Premium'], ARRAY['Adulto'], ARRAY['Intimista','Calmo'],
 ARRAY['Luxo','Elegante'], 'Adulto', 14, 0, 0),
('10000000-0000-4000-8000-000000000009', 'Harmonia Beauty Lab', 'Salão de Beleza',
 'Salão criativo na Vila Madalena com foco em coloração artística.', 'Coloração criativa',
 '(11) 3333-2003', '(11) 99902-0003', 'harmonia@proofly.demo',
 'Rua Harmonia, 766 - Vila Madalena, São Paulo - SP', '05435-000', 'Rua Harmonia', '766', 'Vila Madalena', 'São Paulo', 'SP', 'Brasil',
 ARRAY['Wi-Fi','Pet Friendly'], ARRAY['Rock','Eletrônico'], ARRAY['Moderno','Despojado'], ARRAY['LGBTQIA+','Adulto'], ARRAY['Descontraído','Animado'],
 ARRAY['Alternativo','Moderno'], 'LGBTQIA+', 7, 0, 0),
('10000000-0000-4000-8000-00000000000a', 'Barbearia Pinheiros Urban', 'Barbearia',
 'Barbearia urbana em Pinheiros: fade, barba e produtos artesanais.', 'Barbeiro urbano',
 '(11) 3333-2004', '(11) 99902-0004', 'pinheiros@proofly.demo',
 'Rua Teodoro Sampaio, 2555 - Pinheiros, São Paulo - SP', '05406-200', 'Rua Teodoro Sampaio', '2555', 'Pinheiros', 'São Paulo', 'SP', 'Brasil',
 ARRAY['Wi-Fi','Ar Condicionado'], ARRAY['Hip Hop','Rock'], ARRAY['Moderno','Popular'], ARRAY['Adulto','Todos'], ARRAY['Descontraído'],
 ARRAY['Streetwear','Moderno'], 'Todos', 5, 0, 0),
('10000000-0000-4000-8000-00000000000b', 'Espaço Augusta Unissex', 'Salão de Beleza',
 'Salão unissex na Consolação com horário estendido.', 'Corte unissex',
 '(11) 3333-2005', '(11) 99902-0005', 'augusta@proofly.demo',
 'Rua Augusta, 1508 - Consolação, São Paulo - SP', '01305-100', 'Rua Augusta', '1508', 'Consolação', 'São Paulo', 'SP', 'Brasil',
 ARRAY['Wi-Fi','Ar Condicionado','Acessibilidade'], ARRAY['Pop','Eletrônico'], ARRAY['Popular','Moderno'], ARRAY['Todos'], ARRAY['Animado','Acolhedor'],
 ARRAY['Moderno'], 'Todos', 11, 0, 0),
('10000000-0000-4000-8000-00000000000c', 'Nail & Brow Aspicuelta', 'Studio de Unhas',
 'Manicure, pedicure, nail art e design de sobrancelhas.', 'Nail & brow studio',
 '(11) 3333-2006', '(11) 99902-0006', 'aspicuelta@proofly.demo',
 'Rua Aspicuelta, 345 - Vila Madalena, São Paulo - SP', '05433-010', 'Rua Aspicuelta', '345', 'Vila Madalena', 'São Paulo', 'SP', 'Brasil',
 ARRAY['Wi-Fi','Café'], ARRAY['Pop','Reggae'], ARRAY['Moderno'], ARRAY['Adulto','LGBTQIA+'], ARRAY['Descontraído','Calmo'],
 ARRAY['Moderno','Criativo'], 'Adulto', 4, 0, 0),
('10000000-0000-4000-8000-00000000000d', 'Haddock Grooming House', 'Barbearia',
 'Barbearia boutique em Cerqueira César com serviço de bar premium.', 'Grooming masculino',
 '(11) 3333-2007', '(11) 99902-0007', 'haddock@proofly.demo',
 'Rua Haddock Lobo, 595 - Cerqueira César, São Paulo - SP', '01414-001', 'Rua Haddock Lobo', '595', 'Cerqueira César', 'São Paulo', 'SP', 'Brasil',
 ARRAY['Wi-Fi','Ar Condicionado','Bar','Estacionamento'], ARRAY['Jazz','Blues'], ARRAY['Premium','Luxo'], ARRAY['Empresarial'], ARRAY['Sério','Intimista'],
 ARRAY['Elegante','Premium'], 'Empresarial', 8, 0, 0),
('10000000-0000-4000-8000-00000000000e', 'Bela Cintra Beauty House', 'Salão de Beleza',
 'Salão feminino com maquiagem, penteado e noivas.', 'Beleza feminina',
 '(11) 3333-2008', '(11) 99902-0008', 'belacintra@proofly.demo',
 'Rua Bela Cintra, 2160 - Consolação, São Paulo - SP', '01414-002', 'Rua Bela Cintra', '2160', 'Consolação', 'São Paulo', 'SP', 'Brasil',
 ARRAY['Wi-Fi','Ar Condicionado','Café'], ARRAY['MPB','Pop'], ARRAY['Premium'], ARRAY['Adulto','Empresarial'], ARRAY['Acolhedor','Calmo'],
 ARRAY['Elegante'], 'Adulto', 13, 0, 0),
('10000000-0000-4000-8000-00000000000f', 'Fradique Barber Social', 'Barbearia',
 'Barbearia social em Pinheiros com cerveja artesanal e jogos.', 'Barbearia social',
 '(11) 3333-2009', '(11) 99902-0009', 'fradique@proofly.demo',
 'Rua Fradique Coutinho, 915 - Pinheiros, São Paulo - SP', '05416-010', 'Rua Fradique Coutinho', '915', 'Pinheiros', 'São Paulo', 'SP', 'Brasil',
 ARRAY['Wi-Fi','Bar','TV','Pet Friendly'], ARRAY['Rock','Hip Hop'], ARRAY['Despojado','Popular'], ARRAY['Adulto','Todos'], ARRAY['Descontraído','Animado'],
 ARRAY['Despojado'], 'Todos', 6, 0, 0),
('10000000-0000-4000-8000-000000000010', 'Alameda Santos Glam', 'Salão de Beleza',
 'Salão glam no Jardim Paulista: mechas, botox capilar e eventos.', 'Hair glam',
 '(11) 3333-2010', '(11) 99902-0010', 'alameda@proofly.demo',
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
  state = EXCLUDED.state;

-- Fotos demo (barbearias / salões)
DO $est_img$
DECLARE
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
  FOR r IN SELECT id FROM public.establishments LOOP
    SELECT avatar_url INTO v_avatar FROM public.establishments WHERE id = r.id;
    IF v_avatar IS NOT NULL AND btrim(v_avatar) <> '' THEN CONTINUE; END IF;
    v_h := abs(hashtext(r.id::text));
    v_avatar := v_est_photos[1 + (v_h % array_length(v_est_photos, 1))];
    v_g1 := v_est_photos[1 + ((v_h + 1) % array_length(v_est_photos, 1))];
    v_g2 := v_est_photos[1 + ((v_h + 2) % array_length(v_est_photos, 1))];
    v_g3 := v_est_photos[1 + ((v_h + 3) % array_length(v_est_photos, 1))];
    UPDATE public.establishments
    SET avatar_url = v_avatar, gallery_urls = ARRAY[v_avatar, v_g1, v_g2, v_g3]
    WHERE id = r.id;
  END LOOP;
END $est_img$;

SELECT city, COUNT(*) AS qtd
FROM public.establishments
GROUP BY city
ORDER BY city;