#!/usr/bin/env python3
"""Seed 100 profissionais (91–190): 60 autônomos + 40 vinculados — Proofly demo."""
import json
import urllib.request
import ssl

SUPABASE_URL = "https://pyywdhjstvhmarvzijji.supabase.co/rest/v1"
KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5eXdkaGpzdHZobWFydnppamppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzODE4NTEsImV4cCI6MjA5Njk1Nzg1MX0.uLu4Xhazrrrmf9MCp7BzZFUYLBR1J8QHQmqp0f3E1Yg"

EST_IDS = [
    "10000000-0000-4000-8000-000000000001",
    "10000000-0000-4000-8000-000000000002",
    "10000000-0000-4000-8000-000000000003",
    "10000000-0000-4000-8000-000000000004",
    "10000000-0000-4000-8000-000000000005",
    "10000000-0000-4000-8000-000000000006",
    "10000000-0000-4000-8000-000000000007",
    "10000000-0000-4000-8000-000000000008",
    "10000000-0000-4000-8000-000000000009",
    "10000000-0000-4000-8000-00000000000a",
    "10000000-0000-4000-8000-00000000000b",
    "10000000-0000-4000-8000-00000000000c",
    "10000000-0000-4000-8000-00000000000d",
    "10000000-0000-4000-8000-00000000000e",
    "10000000-0000-4000-8000-00000000000f",
    "10000000-0000-4000-8000-000000000010",
]

FIRST = [
    "Álvaro", "Beatriz", "Caio", "Débora", "Eduardo", "Fabiana", "Gustavo", "Helena",
    "Igor", "Juliana", "Kleber", "Larissa", "Marcos", "Natália", "Osvaldo", "Paula",
    "Rafael", "Sabrina", "Túlio", "Úrsula", "Vitor", "Wanessa", "Xavier", "Yara", "Zé",
    "Alice", "Bruno", "Camila", "Daniel", "Elisa", "Felipe", "Giovana", "Henrique", "Iara",
    "Jorge", "Karina", "Leandro", "Marina", "Nicolas", "Olívia", "Pietro", "Quésia", "Renato",
    "Sueli", "Tiago", "Vera", "William", "Amanda", "Breno", "Carla", "Diego", "Ester",
    "Fábio", "Gisele", "Hugo", "Ingrid", "Júlio", "Kelly", "Lucas", "Marta", "Nelson",
    "Otília", "Paulo", "Rita", "Sérgio", "Tatiana", "Ulisses", "Vanessa", "Wagner", "Ximena",
    "Yuri", "Zilda", "André", "Bianca", "César", "Diana", "Emanuel", "Fernanda", "Gilberto",
    "Hortência", "Ivan", "Joana", "Kevin", "Letícia", "Márcio", "Nádia", "Orlando", "Priscila",
    "Rogério", "Silvia", "Tomás", "Úrsula", "Vinícius", "Wanda", "Abel", "Cristiane", "Domingos",
    "Eva", "Flávio", "Glória", "Humberto", "Iolanda", "Jair", "Kátia", "Luiz", "Mônica",
]

LAST = [
    "Almeida", "Barbosa", "Carvalho", "Dias", "Esteves", "Ferreira", "Gomes", "Henrique",
    "Ibrahim", "Junqueira", "Klein", "Lacerda", "Macedo", "Nascimento", "Oliveira", "Pereira",
    "Queiroz", "Ribeiro", "Silva", "Teixeira", "Uchoa", "Vargas", "Xavier", "Zanetti", "Abreu",
    "Bittencourt", "Cavalcanti", "Duarte", "Espíndola", "Fonseca", "Guimarães", "Hoffmann",
    "Iglesias", "Jardim", "Kruger", "Lima", "Mello", "Neves", "Ornelas", "Pacheco", "Quintana",
    "Rocha", "Santos", "Torres", "Vieira", "Werneck", "Aguiar", "Braga", "Correia", "Dantas",
    "Farias", "Gonçalves", "Haddad", "Inácio", "Jorge", "Kawasaki", "Leite", "Monteiro", "Nogueira",
    "Paiva", "Rezende", "Siqueira", "Tavares", "Viana", "Azevedo", "Batista", "Coelho", "Drummond",
    "Escobar", "Freitas", "Galvão", "Holanda", "Ito", "Jansen", "Kowalski", "Lobato", "Matos",
    "Noronha", "Osório", "Prado", "Rangel", "Souza", "Tostes", "Urbano", "Valente", "Watanabe",
    "Yamamoto", "Zimmermann", "Amaral", "Borges", "Campos", "Domingues", "Evangelista", "Franco",
    "Godoy", "Heringer", "Ibiapina", "Jacomini", "Kuhn", "Lousada", "Magalhães", "Neri", "Oliveira",
]

SPECIALTIES = [
    "Barbeiro", "Cabeleireiro", "Colorista", "Manicure", "Esteticista", "Maquiador",
    "Designer de Sobrancelhas", "Barbeiro & Visagista", "Nail Artist", "Tricologista",
    "Depilador", "Hair Stylist", "Especialista em Mechas", "Barbeiro Clássico", "Visagista",
    "Micropigmentador", "Massagista", "Podólogo", "Extensionista", "Bronzeamento",
]

MUSIC = ["Hip Hop", "Rock", "Pop", "Sertanejo", "MPB", "Jazz", "Eletrônico", "Reggae", "Funk", "Indie"]
VISUAL = ["Streetwear", "Clássico", "Moderno", "Elegante", "Casual", "Despojado", "Minimalista"]
PERSONALITY = ["Comunicativo", "Detalhista", "Criativo", "Extrovertido", "Perfeccionista", "Rápido", "Calmo"]
LIFESTYLE = ["Esportista", "Noturno", "Não fuma", "Bebe socialmente", "Vegano", "Família"]
WORK = ["Especialista", "Experiente", "Premium", "Popular", "Generalista", "Inovador"]
PRICES = ["Até R$50", "R$50 - R$100", "R$100 - R$200", "Acima de R$200"]
DAYS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"]
SALARIES = ["Comissão 40%", "R$ 3.800 + comissão", "R$ 4.500 fixo", "A combinar", "Comissão 45%", "R$ 5.200 fixo"]

GALLERY = [
    "https://images.unsplash.com/photo-1621605815977-fbc98d665033?w=640&h=800&fit=crop&q=80",
    "https://images.unsplash.com/photo-1593702275177-f8160f4a18a5?w=640&h=800&fit=crop&q=80",
    "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=640&h=800&fit=crop&q=80",
    "https://images.unsplash.com/photo-1562322560-ab81ecf0a088?w=640&h=800&fit=crop&q=80",
    "https://images.unsplash.com/photo-1634449571010-02389ed0f9b0?w=640&h=800&fit=crop&q=80",
    "https://images.unsplash.com/photo-1503951914875-4621620610a6?w=640&h=800&fit=crop&q=80",
]

PAST_SALONS = [
    "Barbearia Old School", "Studio Glow Hair", "Espaço Beleza Água Verde", "Barbearia XV Centro",
    "Elegance Centro Salão", "Proofly Batel Barber Club", "Nail House SP", "Corte & Arte",
    "Visage Studio", "Barber Lab Pinheiros", "Studio Cabelo & Cia", "Espaço Urban Cut",
]

FEMALE_FIRST = {
    "Beatriz", "Débora", "Fabiana", "Helena", "Juliana", "Larissa", "Natália", "Paula", "Sabrina",
    "Úrsula", "Wanessa", "Yara", "Alice", "Camila", "Elisa", "Giovana", "Iara", "Karina", "Marina",
    "Olívia", "Quésia", "Sueli", "Vera", "Amanda", "Carla", "Ester", "Gisele", "Ingrid", "Kelly",
    "Marta", "Otília", "Rita", "Tatiana", "Vanessa", "Ximena", "Zilda", "Bianca", "Diana", "Fernanda",
    "Hortência", "Joana", "Letícia", "Nádia", "Priscila", "Silvia", "Úrsula", "Wanda", "Cristiane",
    "Eva", "Glória", "Iolanda", "Kátia", "Mônica",
}

AUTONOMO_COUNT = 60
START_ID = 91
COUNT = 100

ctx = ssl.create_default_context()


def api(method, path, body=None, prefer="return=minimal"):
    url = f"{SUPABASE_URL}{path}"
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(
        url, data=data, method=method,
        headers={
            "apikey": KEY,
            "Authorization": f"Bearer {KEY}",
            "Content-Type": "application/json",
            "Prefer": prefer,
        },
    )
    try:
        with urllib.request.urlopen(req, context=ctx) as resp:
            raw = resp.read().decode()
            return resp.status, json.loads(raw) if raw else None
    except urllib.error.HTTPError as e:
        err = e.read().decode()
        return e.code, err


def prof_uuid(n):
    return f"20000000-0000-4000-8000-{n:012x}"


def calc_igv(carteira, rating, years):
    return round(min(100, max(0, carteira * 0.45 + rating * 7 + years * 4 + 0.35 * 5)), 2)


def build_professionals():
    profs = []
    profiles = []
    links = []
    for offset in range(COUNT):
        i = START_ID + offset
        is_autonomo = offset < AUTONOMO_COUNT
        first = FIRST[offset % len(FIRST)]
        last = LAST[(offset * 2) % len(LAST)]
        name = f"{first} {last}"
        spec = SPECIALTIES[offset % len(SPECIALTIES)]
        years = 2 + (offset % 15)
        est_idx = offset % len(EST_IDS)
        est_id = None if is_autonomo else EST_IDS[est_idx]
        city = "Curitiba" if est_idx < 8 else "São Paulo"
        ddd = "41" if city == "Curitiba" else "11"
        female = first in FEMALE_FIRST
        avatar = (
            f"https://randomuser.me/api/portraits/"
            f"{'women' if female else 'men'}/{(12 + (offset % 68))}.jpg"
        )
        g1, g2, g3 = GALLERY[offset % 6], GALLERY[(offset + 1) % 6], GALLERY[(offset + 2) % 6]
        reviews = 5 + (offset * 2) % 60
        rating = round(3.6 + (offset % 14) * 0.1, 2)
        carteira = 8 + (offset * 3) % 70
        igv = calc_igv(carteira, rating, years)
        avail_now = is_autonomo and (offset % 4 == 0 or igv >= 58)
        prev = None
        if is_autonomo:
            prev = " · ".join(PAST_SALONS[offset % 5:(offset % 5) + 2])

        pid = prof_uuid(i)
        profs.append({
            "id": pid,
            "name": name,
            "specialty": spec,
            "bio": f"{spec} autônomo em {city} — mercado de talentos Proofly." if is_autonomo
            else f"{spec} no time fixo em {city}.",
            "phone": f"({ddd}) 99{100000 + i:07d}",
            "email": f"prof.{i}@proofly.demo",
            "avatar_url": avatar,
            "gallery_urls": [avatar, g1, g2, g3],
            "music_tags": [MUSIC[offset % len(MUSIC)], MUSIC[(offset + 3) % len(MUSIC)]],
            "visual_tags": [VISUAL[offset % len(VISUAL)]],
            "personality_tags": [
                PERSONALITY[offset % len(PERSONALITY)],
                PERSONALITY[(offset + 2) % len(PERSONALITY)],
            ],
            "lifestyle_tags": [LIFESTYLE[offset % len(LIFESTYLE)]],
            "work_tags": [WORK[offset % len(WORK)]],
            "style_tags": ["Streetwear", "Hip Hop"] if offset % 5 == 0 else ["Moderno"],
            "price_range": PRICES[offset % len(PRICES)],
            "availability": [DAYS[offset % 6], DAYS[(offset + 2) % 6], DAYS[(offset + 4) % 6]],
            "salary_expectation": SALARIES[offset % len(SALARIES)],
            "available_now": avail_now,
            "seeking_work": True,
            "client_portfolio_count": carteira,
            "igv_score": igv,
            "current_establishment_id": est_id,
            "previous_workplaces": prev,
            "avg_rating": rating,
            "total_reviews": reviews,
            "is_active": True,
        })
        profiles.append({
            "professional_id": pid,
            "specialty": spec,
            "years_experience": years,
            "bio": f"Especialista em {spec.lower()} · {years} anos de experiência.",
            "instagram": f"@proofly_{first.lower().replace('á','a').replace('é','e').replace('í','i').replace('ó','o').replace('ú','u')}{i}",
        })
        if not is_autonomo:
            links.append({
                "professional_id": pid,
                "establishment_id": est_id,
                "is_current": True,
                "started_at": "2025-02-01",
            })
    return profs, profiles, links


def post_batch(path, rows, prefer="resolution=merge-duplicates,return=minimal", size=25):
    ok = 0
    for i in range(0, len(rows), size):
        chunk = rows[i:i + size]
        st, res = api("POST", path, chunk, prefer)
        if st >= 400:
            return st, res, ok
        ok += len(chunk)
    return 201, "ok", ok


def main():
    profs, profiles, links = build_professionals()
    autonomos = sum(1 for p in profs if p["current_establishment_id"] is None)
    print(f"Gerando {len(profs)} profissionais ({autonomos} autônomos, IDs {START_ID}–{START_ID + COUNT - 1})...")

    st, res, n = post_batch("/professionals", profs, "resolution=merge-duplicates,return=representation")
    print("professionals", st, n, res[:300] if isinstance(res, str) else f"{len(res)} rows")

    st, res, n = post_batch("/professional_profiles", profiles)
    print("professional_profiles", st, n)

    if links:
        st, res, n = post_batch("/professional_establishments", links)
        print("professional_establishments", st, n, res[:200] if isinstance(res, str) else "ok")
        if st >= 400:
            st2, res2, n2 = post_batch("/professional_establishment", links)
            print("professional_establishment (alt)", st2, n2, res2[:200] if isinstance(res2, str) else "ok")

    st, res = api("GET", "/professionals?select=id&current_establishment_id=is.null&is_active=eq.true")
    print("total autônomos ativos:", len(res) if isinstance(res, list) else res)
    st, res = api("GET", "/professionals?select=id&is_active=eq.true")
    print("total profissionais ativos:", len(res) if isinstance(res, list) else res)


if __name__ == "__main__":
    main()