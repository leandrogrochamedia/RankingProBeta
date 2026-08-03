#!/usr/bin/env python3
"""Garante owner_user_id em todos os estabelecimentos — Proofly demo."""
import json
import re
import ssl
import urllib.request

SUPABASE_URL = "https://pyywdhjstvhmarvzijji.supabase.co/rest/v1"
KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5eXdkaGpzdHZobWFydnppamppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzODE4NTEsImV4cCI6MjA5Njk1Nzg1MX0.uLu4Xhazrrrmf9MCp7BzZFUYLBR1J8QHQmqp0f3E1Yg"

BATEL_ID = "10000000-0000-4000-8000-000000000001"
LEANDRO_EMAIL = "leandro@proofly.com"
CTX = ssl.create_default_context()


def api(method, path, body=None, prefer=None):
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
        with urllib.request.urlopen(req, context=CTX, timeout=60) as resp:
            raw = resp.read().decode()
            return resp.status, json.loads(raw) if raw else None
    except urllib.error.HTTPError as e:
        raw = e.read().decode()
        try:
            return e.code, json.loads(raw)
        except json.JSONDecodeError:
            return e.code, raw


def est_hex_suffix(est_id):
    return est_id.replace("-", "")[-12:].lower()


def owner_id_for_est(est_id):
    return f"40000000-0000-4000-8000-{est_hex_suffix(est_id)}"


def ensure_owner_column():
    # coluna via migration SQL; tentamos PATCH em um estab se falhar leitura
    st, res = api(
        "GET",
        "/establishments?select=id,owner_user_id&limit=1",
    )
    if st >= 400 and "owner_user_id" in str(res):
        print("AVISO: rode migrations/027_establishment_owners.sql no Supabase (coluna owner_user_id)")
        return False
    return st < 400


def link_leandro_batel():
    st, users = api("GET", f"/users?email=eq.{LEANDRO_EMAIL}&select=id,establishment_id")
    if st >= 400 or not users:
        print("Leandro não encontrado — pulando vínculo Batel")
        return
    leandro_id = users[0]["id"]
    api(
        "PATCH",
        f"/establishments?id=eq.{BATEL_ID}",
        {"owner_user_id": leandro_id},
        prefer="return=minimal",
    )
    if users[0].get("establishment_id") != BATEL_ID:
        api(
            "PATCH",
            f"/users?id=eq.{leandro_id}",
            {"establishment_id": BATEL_ID, "role": "estabelecimento"},
            prefer="return=minimal",
        )
    print("✓ Leandro → owner Batel Barber Club")


def seed_owners():
    st, ests = api(
        "GET",
        "/establishments?select=id,name,email,owner_user_id&order=name",
    )
    if st >= 400:
        print("Erro ao listar estabelecimentos:", st, ests)
        return

    created = 0
    linked = 0
    for est in ests:
        est_id = est["id"]
        if est_id == BATEL_ID:
            continue
        if est.get("owner_user_id"):
            linked += 1
            continue

        suffix = est_hex_suffix(est_id)
        oid = owner_id_for_est(est_id)
        email = f"owner.{suffix}@proofly.demo"
        name = f"{est['name']} — Owner"

        st_u, res_u = api(
            "POST",
            "/users",
            {
                "id": oid,
                "name": name,
                "email": email,
                "provider": "seed",
                "role": "estabelecimento",
                "establishment_id": est_id,
            },
            prefer="resolution=merge-duplicates,return=representation",
        )
        if st_u >= 400:
            st_g, res_g = api("GET", f"/users?email=eq.{email}&select=id")
            if st_g < 400 and res_g:
                oid = res_g[0]["id"]
            else:
                print("  FAIL user", est["name"], res_u)
                continue
        else:
            created += 1
            if isinstance(res_u, list) and res_u:
                oid = res_u[0].get("id", oid)

        st_e, res_e = api(
            "PATCH",
            f"/establishments?id=eq.{est_id}",
            {"owner_user_id": oid},
            prefer="return=minimal",
        )
        if st_e >= 400:
            print("  FAIL owner link", est["name"], res_e)
        else:
            linked += 1

    link_leandro_batel()

    st, ests2 = api("GET", "/establishments?select=id,owner_user_id")
    with_owner = sum(1 for e in (ests2 or []) if e.get("owner_user_id"))
    total = len(ests2 or [])
    print(f"✅ Owners: {with_owner}/{total} estabelecimentos ({created} usuários owner criados)")


if __name__ == "__main__":
    if ensure_owner_column():
        seed_owners()
    else:
        print("Execute a migration 027 antes de rodar este script.")