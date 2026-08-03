#!/usr/bin/env python3
"""Seed 40 profissionais (51–90): 25 autônomos + 15 vinculados — Proofly demo."""
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

NAMES = [
    ("Kaique", "Mendes"), ("Yasmin", "Teixeira"), ("Otávio", "Pacheco"), ("Lorena", "Vieira"),
    ("Benício", "Cardoso"), ("Heloísa", "Monteiro"), ("Davi", "Correia"), ("Mirela", "Farias"),
    ("Theo", "Campos"), ("Agatha", "Rezende"), ("Noah", "Lopes"), ("Cecília", "Moura"),
    ("Miguel", "Batista"), ("Lívia", "Peixoto"), ("Arthur", "Coelho"), ("Valentina", "Ramos"),
    ("Heitor", "Freitas"), ("Manuela", "Castro"), ("Bernardo", "Azevedo"), ("Clara", "Pinto"),
    ("Enzo", "Machado"), ("Sophia", "Barros"), ("Lorenzo", "Cunha"), ("Isadora", "Nogueira"),
    ("Gabriel", "Tavares"), ("Luna", "Miranda"), ("Ravi", "Sales"), ("Mel", "Antunes"),
    ("Ian", "Borges"), ("Nina", "Siqueira"), ("Joel", "Viana"), ("Zara", "Fonseca"),
    ("Bento", "Macedo"), ("Aurora", "Guimarães"), ("Cauã", "Dantas"), ("Eloá", "Braga"),
    ("Ryan", "Queiroz"), ("Stella", "Paiva"), ("Joaquim", "Leite"), ("Maya", "Cordeiro"),
]

SPECIALTIES = [
    "Barbeiro", "Cabeleireiro", "Colorista", "Manicure", "Esteticista", "Maquiador",
    "Designer de Sobrancelhas", "Barbeiro & Visagista", "Nail Artist", "Tricologista",
    "Depilador", "Hair Stylist", "Especialista em Mechas", "Barbeiro Clássico", "Visagista",
]

MUSIC = ["Hip Hop", "Rock", "Pop", "Sertanejo", "MPB", "Jazz", "Eletrônico", "Reggae"]
VISUAL = ["Streetwear", "Clássico", "Moderno", "Elegante", "Casual", "Despojado"]
PERSONALITY = ["Comunicativo", "Detalhista", "Criativo", "Extrovertido", "Perfeccionista", "Rápido"]
LIFESTYLE = ["Esportista", "Noturno", "Não fuma", "Bebe socialmente", "Vegano"]
WORK = ["Especialista", "Experiente", "Premium", "Popular", "Generalista"]
PRICES = ["Até R$50", "R$50 - R$100", "R$100 - R$200", "Acima de R$200"]
DAYS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"]
SALARIES = ["Comissão 40%", "R$ 3.800 + comissão", "R$ 4.500 fixo", "A combinar", "Comissão 45%"]

AVATARS_M = [32, 44, 52, 65, 71, 83, 12, 28, 36, 48]
AVATARS_F = [32, 44, 52, 65, 71, 83, 12, 28, 36, 48]

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
]

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
    for offset, (first, last) in enumerate(NAMES):
        i = 51 + offset
        is_autonomo = offset < 25
        name = f"{first} {last}"
        spec = SPECIALTIES[offset % len(SPECIALTIES)]
        years = 3 + (offset % 12)
        est_idx = offset % len(EST_IDS)
        est_id = None if is_autonomo else EST_IDS[est_idx]
        city = "Curitiba" if est_idx < 8 else "São Paulo"
        ddd = "41" if city == "Curitiba" else "11"
        female = last in ("Teixeira", "Vieira", "Farias", "Moura", "Ramos", "Pinto", "Castro",
                          "Nogueira", "Miranda", "Antunes", "Fonseca", "Braga", "Paiva", "Cordeiro") or first in (
            "Yasmin", "Lorena", "Heloísa", "Mirela", "Agatha", "Cecília", "Lívia", "Valentina",
            "Manuela", "Clara", "Sophia", "Isadora", "Luna", "Mel", "Nina", "Zara", "Aurora", "Eloá", "Stella", "Maya"
        )
        av_pool = AVATARS_F if female else AVATARS_M
        avatar = f"https://randomuser.me/api/portraits/{'women' if female else 'men'}/{av_pool[offset % len(av_pool)]}.jpg"
        g1, g2, g3 = GALLERY[offset % 6], GALLERY[(offset + 1) % 6], GALLERY[(offset + 2) % 6]
        reviews = 8 + (offset * 3) % 45
        rating = round(3.8 + (offset % 12) * 0.1, 2)
        carteira = 12 + (offset * 2) % 55
        igv = calc_igv(carteira, rating, years)
        avail_now = is_autonomo and (offset % 3 == 0 or igv >= 62)
        prev = None
        if is_autonomo:
            prev = " · ".join(PAST_SALONS[offset % 4:(offset % 4) + 2])

        pid = prof_uuid(i)
        profs.append({
            "id": pid,
            "name": name,
            "specialty": spec,
            "bio": f"{spec} autônomo em {city}." if is_autonomo else f"{spec} no time fixo em {city}.",
            "phone": f"({ddd}) 99{100000 + i:07d}",
            "email": f"prof.{i}@proofly.demo",
            "avatar_url": avatar,
            "gallery_urls": [avatar, g1, g2, g3],
            "music_tags": [MUSIC[offset % len(MUSIC)], MUSIC[(offset + 2) % len(MUSIC)]],
            "visual_tags": [VISUAL[offset % len(VISUAL)]],
            "personality_tags": [PERSONALITY[offset % len(PERSONALITY)], PERSONALITY[(offset + 1) % len(PERSONALITY)]],
            "lifestyle_tags": [LIFESTYLE[offset % len(LIFESTYLE)]],
            "work_tags": [WORK[offset % len(WORK)]],
            "style_tags": ["Streetwear"] if offset % 4 == 0 else ["Moderno"],
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
            "bio": f"Especialista em {spec.lower()} · {years} anos.",
            "instagram": f"@proofly_{first.lower().replace('í','i')}{i}",
        })
        if not is_autonomo:
            links.append({
                "professional_id": pid,
                "establishment_id": est_id,
                "is_current": True,
                "started_at": "2025-01-15",
            })
    return profs, profiles, links


def main():
    profs, profiles, links = build_professionals()
    autonomos = sum(1 for p in profs if p["current_establishment_id"] is None)
    print(f"Gerando {len(profs)} profissionais ({autonomos} autônomos)...")

    st, res = api("POST", "/professionals", profs, "resolution=merge-duplicates,return=representation")
    print("professionals", st, len(res) if isinstance(res, list) else res[:200])

    st, res = api("POST", "/professional_profiles", profiles, "resolution=merge-duplicates,return=minimal")
    print("professional_profiles", st, res if isinstance(res, str) else "ok")

    if links:
        st, res = api("POST", "/professional_establishments", links, "return=minimal")
        print("professional_establishments", st, res if isinstance(res, str) else "ok")
        if st >= 400:
            st2, res2 = api("POST", "/professional_establishment", links, "return=minimal")
            print("professional_establishment (view)", st2, res2 if isinstance(res2, str) else "ok")

    st, res = api("GET", "/professionals?select=id&current_establishment_id=is.null")
    print("total autônomos agora:", len(res) if isinstance(res, list) else res)
    st, res = api("GET", "/professionals?select=id")
    print("total profissionais:", len(res) if isinstance(res, list) else res)


if __name__ == "__main__":
    main()