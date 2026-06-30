#!/usr/bin/env python3
"""Preenche professional_private_data com endereços fictícios (CEP/bairro reais) — Curitiba e SP."""
import json
import ssl
import urllib.request

SUPABASE_URL = "https://pyywdhjstvhmarvzijji.supabase.co/rest/v1"
KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5eXdkaGpzdHZobWFydnppamppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzODE4NTEsImV4cCI6MjA5Njk1Nzg1MX0.uLu4Xhazrrrmf9MCp7BzZFUYLBR1J8QHQmqp0f3E1Yg"
CTX = ssl.create_default_context()

CTB = [
    ("Av. Sete de Setembro", "Batel", "80240-000"),
    ("Rua Padre Anchieta", "Bigorrilho", "80730-000"),
    ("Rua Comendador Araújo", "Centro", "80420-000"),
    ("Rua XV de Novembro", "Centro", "80020-310"),
    ("Rua Nunes Machado", "Água Verde", "80250-200"),
    ("Av. Presidente Affonso Camargo", "Cristo Rei", "80050-370"),
    ("Rua Bruno Filgueira", "Mercês", "80810-110"),
    ("Rua Nilo Peçanha", "Champagnat", "80710-150"),
    ("Rua Nicola Pellanda", "Boqueirão", "81650-000"),
    ("Rua Augusto Staben", "Portão", "81050-000"),
    ("Rua Nilo Cairo", "Cabral", "80060-050"),
    ("Rua Deputado Heitor Alencar Furtado", "Juvevê", "80030-150"),
    ("Rua Pasteur", "Ahú", "80250-080"),
    ("Rua Prof. Pedro Viriato Parigot de Souza", "Seminário", "80440-080"),
    ("Rua Manoel Ribas", "Santa Felicidade", "82020-000"),
]

SP = [
    ("Av. Paulista", "Bela Vista", "01310-200"),
    ("Rua Oscar Freire", "Jardins", "01426-000"),
    ("Rua Harmonia", "Vila Madalena", "05435-000"),
    ("Rua Teodoro Sampaio", "Pinheiros", "05406-200"),
    ("Rua Augusta", "Consolação", "01305-100"),
    ("Rua Joaquim Floriano", "Itaim Bibi", "04534-002"),
    ("Alameda dos Nhambiquaras", "Moema", "04090-001"),
    ("Rua Funchal", "Vila Olímpia", "04551-060"),
    ("Rua José Carlos Pace", "Brooklin", "04578-910"),
    ("Rua Aimberê", "Perdizes", "05038-040"),
    ("Rua Serra de Japi", "Tatuapé", "03309-000"),
    ("Rua Voluntários da Pátria", "Santana", "02011-000"),
    ("Rua Bom Pastor", "Ipiranga", "04203-000"),
    ("Rua da Mooca", "Mooca", "03163-030"),
    ("Rua Maranhão", "Higienópolis", "01240-000"),
]


def api(method, path, body=None, prefer="return=minimal"):
    url = SUPABASE_URL + path
    headers = {
        "apikey": KEY,
        "Authorization": f"Bearer {KEY}",
        "Content-Type": "application/json",
    }
    if prefer:
        headers["Prefer"] = prefer
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, context=CTX, timeout=90) as resp:
            raw = resp.read().decode()
            return resp.status, json.loads(raw) if raw else None
    except urllib.error.HTTPError as e:
        raw = e.read().decode()
        try:
            return e.code, json.loads(raw)
        except json.JSONDecodeError:
            return e.code, raw


def pick_city(est_city, idx):
    if est_city in ("São Paulo", "Sao Paulo"):
        return "São Paulo", "SP", SP
    if est_city == "Curitiba":
        return "Curitiba", "PR", CTB
    if idx % 2 == 0:
        return "São Paulo", "SP", SP
    return "Curitiba", "PR", CTB


def build_rows(profs):
    rows = []
    for idx, p in enumerate(profs, start=1):
        est = (p.get("current_establishment") or {}) if isinstance(p.get("current_establishment"), dict) else {}
        city, state, pool = pick_city(est.get("city"), idx)
        street, hood, cep = pool[(idx - 1) % len(pool)]
        number = str(80 + ((idx * 47 + 13) % 1950))
        rows.append({
            "professional_id": p["id"],
            "full_name": p.get("name"),
            "email": p.get("email"),
            "phone": p.get("phone"),
            "zip_code": cep,
            "street": street,
            "number": number,
            "neighborhood": hood,
            "city": city,
            "state": state,
            "country": "Brasil",
        })
    return rows


def main():
    st, profs = api(
        "GET",
        "/professionals?select=id,name,email,phone,current_establishment:establishments!professionals_current_establishment_id_fkey(city)&is_active=eq.true&order=id",
        prefer=None,
    )
    if st >= 400 or not isinstance(profs, list):
        print("Erro ao listar profissionais:", st, profs)
        return 1

    rows = build_rows(profs)
    print(f"Gerando {len(rows)} endereços…")

    ok = 0
    batch = 25
    for i in range(0, len(rows), batch):
        chunk = rows[i : i + batch]
        st, res = api(
            "POST",
            "/professional_private_data?on_conflict=professional_id",
            chunk,
            prefer="resolution=merge-duplicates,return=minimal",
        )
        if st >= 400:
            print(f"Erro lote {i // batch + 1}:", st, res)
            return 1
        ok += len(chunk)
        print(f"  ✓ {ok}/{len(rows)}")

    st, summary = api(
        "GET",
        "/professional_private_data?select=city",
        prefer=None,
    )
    if isinstance(summary, list):
        counts = {}
        for r in summary:
            c = r.get("city") or "?"
            counts[c] = counts.get(c, 0) + 1
        print("Resumo:", counts)
    print("✅ Concluído")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())