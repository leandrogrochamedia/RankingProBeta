#!/usr/bin/env python3
"""Ranking Pro DevTool — servidor local (chat Grok CLI + preview)."""
from __future__ import annotations

import json
import os
import socket
import subprocess
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlparse

DEVTOOL_DIR = Path(__file__).resolve().parent
ROOT_DIR = DEVTOOL_DIR.parent
PORT = int(os.environ.get("DEVTOOL_PORT", "8790"))
GROK_BIN = os.environ.get(
    "GROK_BIN",
    str(Path.home() / ".grok" / "bin" / "grok"),
)
ONLINE_PREVIEW = os.environ.get(
    "DEVTOOL_ONLINE_URL",
    "https://leandrogrochamedia.github.io/RankingPro/",
)

SKIP_DIRS = {".git", "node_modules", "__pycache__", ".cursor", "terminals"}
PREVIEW_EXTS = {".html", ".htm"}
LAUNCHER_PORT = int(os.environ.get("DEVTOOL_LAUNCHER_PORT", "8789"))

AGENT_PROMPTS = {
    "supervisor": (
        "Você é a MASTER MEGA BLASTER — PROOFLY, Supervisor Estratégico Máximo do Ranking Pro, "
        "com forte habilidade de UX/UI Designer Premium com DNA Apple (minimalista, sofisticado, "
        "elegante, clean, espaçamento perfeito, sensação de qualidade premium).\n\n"
        "North Star fixo: Ser a infraestrutura de reputação profissional mais confiável do mercado da beleza.\n\n"
        "Quando o usuário te chamar de Máquina Mortífera, Master ou Mega Blaster, entre no modo completo.\n\n"
        "Foco: estratégia de produto, reputação, confiança, priorização. Respostas acionáveis, sem scope creep."
    ),
    "designer": (
        "Você é o Designer Premium do Ranking Pro — UX/UI com DNA Apple: minimalista, sofisticado, "
        "elegante, clean, espaçamento perfeito, sensação premium.\n\n"
        "North Star: infraestrutura de reputação profissional mais confiável do mercado da beleza.\n\n"
        "Foco exclusivo em hierarquia visual, tipografia, cores, espaçamento, componentes, microinterações."
    ),
    "developer": (
        "Você é o Desenvolvedor técnico do Ranking Pro — HTML, CSS, JavaScript vanilla.\n\n"
        "North Star: infraestrutura de reputação profissional mais confiável do mercado da beleza.\n\n"
        "Foco: implementação limpa, mínima e funcional. Reutilize padrões do projeto."
    ),
}

MIME = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".webp": "image/webp",
    ".ico": "image/x-icon",
}


def safe_path(base: Path, rel: str) -> Path | None:
    rel = unquote(rel.lstrip("/"))
    target = (base / rel).resolve()
    try:
        target.relative_to(base.resolve())
    except ValueError:
        return None
    return target


def list_project_files(rel_path: str = "") -> dict:
    base = safe_path(ROOT_DIR, rel_path or "")
    if not base or not base.is_dir():
        raise ValueError("Pasta inválida")

    rel_norm = rel_path.replace("\\", "/").strip("/")
    parent = "/".join(rel_norm.split("/")[:-1]) if rel_norm else ""

    entries = []
    for item in sorted(base.iterdir(), key=lambda p: (not p.is_dir(), p.name.lower())):
        name = item.name
        if name.startswith(".") and name not in {".nojekyll"}:
            continue
        if name in SKIP_DIRS:
            continue
        rel = str(item.relative_to(ROOT_DIR)).replace("\\", "/")
        if item.is_dir():
            entries.append({"name": name, "type": "dir", "path": rel, "previewable": False})
        else:
            ext = item.suffix.lower()
            entries.append({
                "name": name,
                "type": "file",
                "path": rel,
                "previewable": ext in PREVIEW_EXTS,
            })

    return {
        "path": rel_norm,
        "parent": parent,
        "root": str(ROOT_DIR),
        "entries": entries,
    }


def port_open(port: int, host: str = "127.0.0.1") -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.settimeout(0.4)
        return sock.connect_ex((host, port)) == 0


def git_env() -> dict:
    env = os.environ.copy()
    env["GIT_TERMINAL_PROMPT"] = "0"
    env["GCM_INTERACTIVE"] = "Never"
    return env


def run_git(args: list, timeout: int = 120) -> subprocess.CompletedProcess:
    return subprocess.run(
        ["git", *args],
        cwd=str(ROOT_DIR),
        capture_output=True,
        text=True,
        timeout=timeout,
        env=git_env(),
    )


def git_worktree_status() -> dict:
    if not (ROOT_DIR / ".git").exists():
        return {"isRepo": False, "clean": True, "count": 0, "files": []}
    result = run_git(["status", "--porcelain"])
    if result.returncode != 0:
        raise RuntimeError(result.stderr.strip() or "git status falhou")
    lines = [ln for ln in result.stdout.splitlines() if ln.strip()]
    return {
        "isRepo": True,
        "clean": len(lines) == 0,
        "count": len(lines),
        "files": lines[:40],
    }


def git_sync_push(message: str = "push") -> dict:
    status = git_worktree_status()
    if not status.get("isRepo"):
        raise RuntimeError("Pasta não é um repositório git")
    if status["clean"]:
        return {
            "ok": True,
            "skipped": True,
            "message": "Nada para sincronizar — working tree limpo",
            "status": status,
        }

    add = run_git(["add", "-A"])
    if add.returncode != 0:
        raise RuntimeError(add.stderr.strip() or "git add falhou")

    commit = run_git(["commit", "-m", message])
    if commit.returncode != 0:
        out = (commit.stdout + commit.stderr).strip()
        if "nothing to commit" in out.lower():
            return {
                "ok": True,
                "skipped": True,
                "message": "Nada para commitar",
                "status": git_worktree_status(),
            }
        raise RuntimeError(out or "git commit falhou")

    push = run_git(["push", "origin", "main"], timeout=180)
    if push.returncode != 0:
        raise RuntimeError(push.stderr.strip() or push.stdout.strip() or "git push falhou")

    return {
        "ok": True,
        "skipped": False,
        "message": "Alterações enviadas para origin/main",
        "commit": commit.stdout.strip(),
        "push": push.stdout.strip() or push.stderr.strip(),
        "status": git_worktree_status(),
    }


def sse_event(event: str, data: dict) -> bytes:
    payload = json.dumps(data, ensure_ascii=False)
    return f"event: {event}\ndata: {payload}\n\n".encode("utf-8")


class DevToolHandler(BaseHTTPRequestHandler):
    server_version = "RankingProDevTool/1.0"

    def log_message(self, fmt, *args):
        sys.stderr.write("%s - %s\n" % (self.address_string(), fmt % args))

    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def _json(self, status: int, data: dict):
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self._cors()
        self.end_headers()
        self.wfile.write(body)

    def _file(self, path: Path):
        if not path.is_file():
            self.send_error(404, "Not found")
            return
        ext = path.suffix.lower()
        body = path.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", MIME.get(ext, "application/octet-stream"))
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path

        if path == "/api/health":
            self._json(200, {
                "ok": True,
                "grok": Path(GROK_BIN).is_file(),
                "grokBin": GROK_BIN,
                "root": str(ROOT_DIR),
                "onlinePreview": ONLINE_PREVIEW,
                "port": PORT,
                "launcherPort": LAUNCHER_PORT,
            })
            return

        if path == "/api/server/status":
            self._json(200, {
                "ok": True,
                "serverOnline": port_open(PORT),
                "url": f"http://127.0.0.1:{PORT}",
            })
            return

        if path == "/api/config":
            cliente_path = ROOT_DIR / "cliente.html"
            self._json(200, {
                "localPreview": "/app/cliente.html",
                "onlinePreview": ONLINE_PREVIEW,
                "rootPath": str(ROOT_DIR),
                "localFilePath": str(cliente_path),
                "startCommand": f'cd "{DEVTOOL_DIR}" && python3 launcher.py',
                "launcherUrl": f"http://127.0.0.1:{LAUNCHER_PORT}",
                "serverUrl": f"http://127.0.0.1:{PORT}",
            })
            return

        if path == "/api/files":
            query = parse_qs(parsed.query)
            rel = (query.get("path") or [""])[0]
            try:
                data = list_project_files(rel)
                self._json(200, data)
            except ValueError as exc:
                self._json(400, {"error": str(exc)})
            return

        if path == "/api/git/status":
            try:
                self._json(200, git_worktree_status())
            except RuntimeError as exc:
                self._json(500, {"error": str(exc)})
            return

        if path.startswith("/app/"):
            rel = path[len("/app/"):]
            if not rel or rel.endswith("/"):
                rel = (rel or "") + "index.html"
            target = safe_path(ROOT_DIR, rel)
            if not target:
                self.send_error(403)
                return
            self._file(target)
            return

        rel = path.lstrip("/") or "index.html"
        target = safe_path(DEVTOOL_DIR, rel)
        if not target:
            self.send_error(403)
            return
        self._file(target)

    def _read_json_body(self) -> dict:
        length = int(self.headers.get("Content-Length", 0))
        raw = self.rfile.read(length).decode("utf-8") if length else "{}"
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            raise ValueError("JSON inválido")

    def handle_server_start(self):
        self._json(200, {
            "ok": True,
            "started": False,
            "alreadyRunning": True,
            "message": "Servidor já está ativo",
            "url": f"http://127.0.0.1:{PORT}",
            "port": PORT,
        })

    def handle_git_push(self):
        try:
            payload = self._read_json_body()
        except ValueError as exc:
            self._json(400, {"error": str(exc)})
            return
        message = str(payload.get("message") or "push").strip() or "push"
        try:
            result = git_sync_push(message)
            self._json(200, result)
        except RuntimeError as exc:
            self._json(500, {"error": str(exc)})

    def handle_chat(self):
        try:
            payload = self._read_json_body()
        except ValueError as exc:
            self._json(400, {"error": str(exc)})
            return

        message = str(payload.get("message", "")).strip()
        if not message:
            self._json(400, {"error": "Mensagem vazia"})
            return

        agent = str(payload.get("agent") or "supervisor").strip()
        system_prompt = AGENT_PROMPTS.get(agent)
        if system_prompt:
            message = (
                f"[AGENTE: {agent}]\n{system_prompt}\n\n"
                f"[MENSAGEM DO USUÁRIO]\n{message}"
            )

        if not Path(GROK_BIN).is_file():
            self._json(500, {
                "error": "Grok CLI não encontrado",
                "hint": f"Defina GROK_BIN ou instale em {GROK_BIN}",
            })
            return

        args = [
            GROK_BIN, "-p", message,
            "--output-format", "streaming-json",
            "--cwd", str(ROOT_DIR),
            "--always-approve",
        ]
        session_id = payload.get("sessionId")
        if session_id:
            args.extend(["--resume", str(session_id)])

        self.send_response(200)
        self.send_header("Content-Type", "text/event-stream; charset=utf-8")
        self.send_header("Cache-Control", "no-cache")
        self.send_header("Connection", "keep-alive")
        self._cors()
        self.end_headers()

        proc = subprocess.Popen(
            args,
            cwd=str(ROOT_DIR),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            bufsize=1,
        )

        self.wfile.write(sse_event("status", {"state": "running"}))
        self.wfile.flush()

        try:
            assert proc.stdout is not None
            for line in proc.stdout:
                trimmed = line.strip()
                if not trimmed:
                    continue
                try:
                    evt = json.loads(trimmed)
                    self.wfile.write(sse_event("grok", evt))
                    self.wfile.flush()
                    if evt.get("type") == "end" and evt.get("sessionId"):
                        self.wfile.write(sse_event("session", {"sessionId": evt["sessionId"]}))
                        self.wfile.flush()
                    if evt.get("type") == "error":
                        self.wfile.write(sse_event("error", {"message": evt.get("message", "Erro")}))
                        self.wfile.flush()
                except json.JSONDecodeError:
                    self.wfile.write(sse_event("log", {"line": trimmed}))
                    self.wfile.flush()

            if proc.stderr:
                err = proc.stderr.read()
                if err.strip():
                    self.wfile.write(sse_event("stderr", {"line": err}))
                    self.wfile.flush()

            code = proc.wait()
            self.wfile.write(sse_event("done", {"code": code}))
            self.wfile.flush()
        except (BrokenPipeError, ConnectionResetError):
            proc.kill()
        except Exception as exc:
            self.wfile.write(sse_event("error", {"message": str(exc)}))
            self.wfile.flush()

    def do_POST(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/server/start":
            self.handle_server_start()
            return
        if parsed.path == "/api/git/push":
            self.handle_git_push()
            return
        if parsed.path == "/api/chat":
            self.handle_chat()
            return
        self.send_error(404)


def main():
    httpd = ThreadingHTTPServer(("127.0.0.1", PORT), DevToolHandler)
    print("")
    print("  🏆 Ranking Pro DevTool")
    print(f"  → http://127.0.0.1:{PORT}")
    print(f"  → Preview local: http://127.0.0.1:{PORT}/app/cliente.html")
    print(f"  → Grok CLI: {GROK_BIN}")
    print("")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nEncerrado.")


if __name__ == "__main__":
    main()