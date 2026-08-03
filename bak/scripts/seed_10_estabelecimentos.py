#!/usr/bin/env python3
"""Seed 10 estabelecimentos (IDs 17–26) + vincula autônomos livres — Proofly demo."""
import json
import urllib.request
import ssl

SUPABASE_URL = "https://pyywdhjstvhmarvzijji.supabase.co/rest/v1"
KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5eXdkaGpzdHZobWFydnppamppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzODE4NTEsImV4cCI6MjA5Njk1Nzg1MX0.uLu4Xhazrrrmf9MCp7BzZFUYLBR1J8QHQmqp0f3E1Yg"

START_EST = 17
EST_COUNT = 10
STAFF_PER_EST = [3, 2, 3, 2, 3, 2, 3, 2, 3, 2]  # 25 total

ESTABLISHMENTS = [
    {
        "name": "Barbearia Mercês Vintage",
        "type": "Barbearia",
        "specialty": "Barbearia clássica",
        "description": "Barbearia de bairro no Mercês com fade, navalha e cerveja gelada.",
        "city": "Curitiba", "state": "PR", "neighborhood": "Mercês",
        "street": "Rua Bruno Filgueira", "number": "812", "zip_code": "80810-110",
        "phone": "(41) 3333-3017", "whatsapp": "(41) 99903-3017",
        "email": "merces.vintage@proofly.demo",
        "music": ["Rock", "Sertanejo"], "infra": ["Wi-Fi", "TV", "Café"],
        "positioning": ["Popular", "Tradicional"], "audience": ["Todos", "Adulto"],
        "vibe": ["Descontraído", "Acolhedor"], "style": ["Tradicional"],
        "rating": 4.6, "reviews": 38, "years": 7,
    },
    {
        "name": "Studio Champagnat Hair",
        "type": "Salão de Beleza",
        "specialty": "Cabeleireiro unissex",
        "description": "Cortes, coloração e tratamentos no Champagnat — ambiente moderno e acolhedor.",
        "city": "Curitiba", "state": "PR", "neighborhood": "Champagnat",
        "street": "Rua Nilo Peçanha", "number": "245", "zip_code": "80710-150",
        "phone": "(41) 3333-3018", "whatsapp": "(41) 99903-3018",
        "email": "champagnat.hair@proofly.demo",
        "music": ["Pop", "MPB"], "infra": ["Wi-Fi", "Ar Condicionado", "Café"],
        "positioning": ["Moderno", "Popular"], "audience": ["Família", "Todos"],
        "vibe": ["Acolhedor", "Calmo"], "style": ["Moderno"],
        "rating": 4.4, "reviews": 52, "years": 9,
    },
    {
        "name": "Corte & Arte Boqueirão",
        "type": "Barbearia",
        "specialty": "Barbeiro urbano",
        "description": "Barbearia urbana no Boqueirão — street style, barba design e produtos premium.",
        "city": "Curitiba", "state": "PR", "neighborhood": "Boqueirão",
        "street": "Rua Nicola Pellanda", "number": "1540", "zip_code": "81650-000",
        "phone": "(41) 3333-3019", "whatsapp": "(41) 99903-3019",
        "email": "boqueirao.corte@proofly.demo",
        "music": ["Hip Hop", "Rock"], "infra": ["Wi-Fi", "Ar Condicionado"],
        "positioning": ["Moderno", "Despojado"], "audience": ["Adulto", "Todos"],
        "vibe": ["Descontraído", "Animado"], "style": ["Streetwear"],
        "rating": 4.7, "reviews": 61, "years": 5,
    },
    {
        "name": "Glow Nail Studio Portão",
        "type": "Studio de Unhas",
        "specialty": "Nail art",
        "description": "Manicure, pedicure e nail art no Portão — agendamento rápido e alto padrão.",
        "city": "Curitiba", "state": "PR", "neighborhood": "Portão",
        "street": "Rua Augusto Staben", "number": "433", "zip_code": "81050-000",
        "phone": "(41) 3333-3020", "whatsapp": "(41) 99903-3020",
        "email": "glow.portao@proofly.demo",
        "music": ["Pop", "Eletrônico"], "infra": ["Wi-Fi", "Café"],
        "positioning": ["Moderno"], "audience": ["Adulto", "LGBTQIA+"],
        "vibe": ["Calmo", "Intimista"], "style": ["Moderno", "Criativo"],
        "rating": 4.8, "reviews": 44, "years": 4,
    },
    {
        "name": "Barbearia Itaim Executive",
        "type": "Barbearia",
        "specialty": "Grooming executivo",
        "description": "Barbearia premium no Itaim para público corporativo — visagismo e barba terapia.",
        "city": "São Paulo", "state": "SP", "neighborhood": "Itaim Bibi",
        "street": "Rua Joaquim Floriano", "number": "466", "zip_code": "04534-002",
        "phone": "(11) 3333-3021", "whatsapp": "(11) 99903-3021",
        "email": "itaim.exec@proofly.demo",
        "music": ["Jazz", "Hip Hop"], "infra": ["Wi-Fi", "Ar Condicionado", "Bar", "Estacionamento"],
        "positioning": ["Premium", "Luxo"], "audience": ["Empresarial", "Adulto"],
        "vibe": ["Sério", "Intimista"], "style": ["Premium", "Elegante"],
        "rating": 4.9, "reviews": 72, "years": 11,
    },
    {
        "name": "Salão Moema Glow",
        "type": "Salão de Beleza",
        "specialty": "Beleza completa",
        "description": "Salão completo em Moema: corte, mechas, manicure e maquiagem para eventos.",
        "city": "São Paulo", "state": "SP", "neighborhood": "Moema",
        "street": "Alameda dos Nhambiquaras", "number": "1280", "zip_code": "04090-001",
        "phone": "(11) 3333-3022", "whatsapp": "(11) 99903-3022",
        "email": "moema.glow@proofly.demo",
        "music": ["MPB", "Pop"], "infra": ["Wi-Fi", "Ar Condicionado", "Café", "Estacionamento"],
        "positioning": ["Premium", "Moderno"], "audience": ["Adulto", "Empresarial"],
        "vibe": ["Acolhedor", "Calmo"], "style": ["Elegante", "Moderno"],
        "rating": 4.5, "reviews": 89, "years": 12,
    },
    {
        "name": "Barber Lab Vila Olímpia",
        "type": "Barbearia",
        "specialty": "Barbeiro & visagista",
        "description": "Lab de barbearia na Vila Olímpia — fade, pigmentação e consultoria de imagem.",
        "city": "São Paulo", "state": "SP", "neighborhood": "Vila Olímpia",
        "street": "Rua Funchal", "number": "418", "zip_code": "04551-060",
        "phone": "(11) 3333-3023", "whatsapp": "(11) 99903-3023",
        "email": "barberlab.olimpia@proofly.demo",
        "music": ["Hip Hop", "Eletrônico"], "infra": ["Wi-Fi", "Ar Condicionado"],
        "positioning": ["Moderno", "Premium"], "audience": ["Adulto", "Empresarial"],
        "vibe": ["Descontraído"], "style": ["Streetwear", "Moderno"],
        "rating": 4.6, "reviews": 55, "years": 6,
    },
    {
        "name": "Estética Perdizes Care",
        "type": "Espaço de Estética",
        "specialty": "Estética avançada",
        "description": "Estética facial e corporal em Perdizes — depilação, design de sobrancelhas e skincare.",
        "city": "São Paulo", "state": "SP", "neighborhood": "Perdizes",
        "street": "Rua Turiassú", "number": "672", "zip_code": "05005-000",
        "phone": "(11) 3333-3024", "whatsapp": "(11) 99903-3024",
        "email": "perdizes.care@proofly.demo",
        "music": ["Pop", "Jazz"], "infra": ["Wi-Fi", "Ar Condicionado", "Acessibilidade"],
        "positioning": ["Moderno", "Premium"], "audience": ["Adulto", "LGBTQIA+"],
        "vibe": ["Calmo", "Acolhedor"], "style": ["Moderno"],
        "rating": 4.7, "reviews": 41, "years": 8,
    },
    {
        "name": "Hip Hop Cuts Santana",
        "type": "Barbearia",
        "specialty": "Barbeiro street",
        "description": "Barbearia com vibe hip hop em Santana — cortes ousados e ambiente jovem.",
        "city": "São Paulo", "state": "SP", "neighborhood": "Santana",
        "street": "Rua Voluntários da Pátria", "number": "4022", "zip_code": "02011-000",
        "phone": "(11) 3333-3025", "whatsapp": "(11) 99903-3025",
        "email": "hiphop.santana@proofly.demo",
        "music": ["Hip Hop", "Funk"], "infra": ["Wi-Fi", "TV"],
        "positioning": ["Popular", "Despojado"], "audience": ["Todos", "Adulto"],
        "vibe": ["Animado", "Descontraído"], "style": ["Streetwear", "Hip Hop"],
        "rating": 4.3, "reviews": 67, "years": 5,
    },
    {
        "name": "Proofly Tatuapé Unisex",
        "type": "Salão de Beleza",
        "specialty": "Corte unissex",
        "description": "Salão unissex no Tatuapé com horário estendido e preços justos.",
        "city": "São Paulo", "state": "SP", "neighborhood": "Tatuapé",
        "street": "Rua Serra de Bragança", "number": "890", "zip_code": "03318-000",
        "phone": "(11) 3333-3026", "whatsapp": "(11) 99903-3026",
        "email": "tatuape.unisex@proofly.demo",
        "music": ["Sertanejo", "Pop"], "infra": ["Wi-Fi", "Ar Condicionado", "Estacionamento"],
        "positioning": ["Popular", "Moderno"], "audience": ["Família", "Todos"],
        "vibe": ["Acolhedor", "Animado"], "style": ["Moderno"],
        "rating": 4.4, "reviews": 58, "years": 10,
    },
]

GALLERY = [
    "https://images.unsplash.com/photo-1503951914875-4621620610a6?w=640&h=800&fit=crop&q=80",
    "https://images.unsplash.com/photo-1585747860715-2b5b9c7f7d1e?w=640&h=800&fit=crop&q=80",
    "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=640&h=800&fit=crop&q=80",
]

ctx = ssl.create_default_context()


def api(method, path, body=None, prefer="return=minimal", extra_headers=None):
    url = f"{SUPABASE_URL}{path}"
    data = json.dumps(body).encode() if body is not None else None
    headers = {
        "apikey": KEY,
        "Authorization": f"Bearer {KEY}",
        "Content-Type": "application/json",
        "Prefer": prefer,
    }
    if extra_headers:
        headers.update(extra_headers)
    req = urllib.request.Request(url, data=data, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req, context=ctx) as resp:
            raw = resp.read().decode()
            return resp.status, json.loads(raw) if raw else None
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()


def est_uuid(n):
    return f"10000000-0000-4000-8000-{n:012x}"


def prof_uuid(n):
    return f"20000000-0000-4000-8000-{n:012x}"


def build_establishments():
    rows = []
    for i, meta in enumerate(ESTABLISHMENTS):
        n = START_EST + i
        eid = est_uuid(n)
        addr = f"{meta['street']}, {meta['number']} - {meta['neighborhood']}, {meta['city']} - {meta['state']}"
        avatar = GALLERY[i % len(GALLERY)]
        rows.append({
            "id": eid,
            "name": meta["name"],
            "type": meta["type"],
            "description": meta["description"],
            "specialty": meta["specialty"],
            "phone": meta["phone"],
            "whatsapp": meta["whatsapp"],
            "email": meta["email"],
            "address": addr,
            "zip_code": meta["zip_code"],
            "street": meta["street"],
            "number": meta["number"],
            "neighborhood": meta["neighborhood"],
            "city": meta["city"],
            "state": meta["state"],
            "country": "Brasil",
            "infra_tags": meta["infra"],
            "music_tags": meta["music"],
            "positioning_tags": meta["positioning"],
            "audience_tags": meta["audience"],
            "vibe_tags": meta["vibe"],
            "style_tags": meta["style"],
            "target_audience": meta["audience"][0],
            "years_active": meta["years"],
            "avg_rating": meta["rating"],
            "total_reviews": meta["reviews"],
            "avatar_url": avatar,
            "gallery_urls": [avatar, GALLERY[(i + 1) % len(GALLERY)]],
        })
    return rows


def fetch_autonomous_profs(limit=30):
    st, res = api(
        "GET",
        f"/professionals?select=id,name&current_establishment_id=is.null&is_active=eq.true&order=igv_score.desc&limit={limit}",
    )
    if st >= 400 or not isinstance(res, list):
        return []
    return res


def assign_staff(est_id, prof_ids):
    ok = 0
    for pid in prof_ids:
        st, res = api(
            "PATCH",
            f"/professionals?id=eq.{pid}",
            {
                "current_establishment_id": est_id,
                "seeking_work": False,
                "available_now": False,
            },
            prefer="return=minimal",
        )
        if st >= 400:
            print("  PATCH prof fail", pid, res[:200] if isinstance(res, str) else res)
            continue
        link = {
            "professional_id": pid,
            "establishment_id": est_id,
            "is_current": True,
            "started_at": "2025-03-01",
        }
        st2, res2 = api("POST", "/professional_establishments", link)
        if st2 >= 400:
            st3, res3 = api("POST", "/professional_establishment", link)
            if st3 >= 400:
                print("  LINK fail", pid, res2[:120] if isinstance(res2, str) else res2)
                continue
        ok += 1
    return ok


def main():
    ests = build_establishments()
    print(f"Criando {len(ests)} estabelecimentos (IDs {START_EST}–{START_EST + EST_COUNT - 1})...")

    st, res = api("POST", "/establishments", ests, "resolution=merge-duplicates,return=representation")
    print("establishments", st, len(res) if isinstance(res, list) else res[:300])

    total_staff = sum(STAFF_PER_EST)
    autonomos = fetch_autonomous_profs(total_staff + 5)
    if len(autonomos) < total_staff:
        print(f"Aviso: só {len(autonomos)} autônomos livres (precisava {total_staff})")
    prof_idx = 0
    hired = 0

    for i, est in enumerate(ests):
        need = STAFF_PER_EST[i]
        start = prof_idx
        batch = []
        while len(batch) < need and prof_idx < len(autonomos):
            batch.append(autonomos[prof_idx]["id"])
            prof_idx += 1
        if not batch:
            break
        n = assign_staff(est["id"], batch)
        hired += n
        names = [autonomos[start + j]["name"] for j in range(len(batch))]
        print(f"  {est['name']}: +{n} profs — {', '.join(names)}")

    st, res = api("GET", "/establishments?select=id,name")
    print("total estabelecimentos:", len(res) if isinstance(res, list) else res)
    st, res = api("GET", "/professionals?select=id&current_establishment_id=is.null&is_active=eq.true")
    print("autônomos livres agora:", len(res) if isinstance(res, list) else res)
    st, res = api("GET", "/professionals?select=id&current_establishment_id=not.is.null&is_active=eq.true")
    print("profissionais vinculados:", len(res) if isinstance(res, list) else res)
    print(f"vinculados neste seed: {hired}")


if __name__ == "__main__":
    main()