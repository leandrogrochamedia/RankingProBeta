#!/usr/bin/env python3
"""Launcher do Ranking Pro DevTool — inicia e supervisiona server.py na porta 8790."""
from __future__ import annotations

import json
import os
import socket
import subprocess
import sys
import threading
import time
import webbrowser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse
from urllib.request import urlopen

DEVTOOL_DIR = Path(__file__).resolve().parent
ROOT_DIR = DEVTOOL_DIR.parent
LAUNCHER_PORT = int(os.environ.get("DEVTOOL_LAUNCHER_PORT", "8789"))
SERVER_PORT = int(os.environ.get("DEVTOOL_PORT", "8790"))
SERVER_SCRIPT = DEVTOOL_DIR / "server.py"
LOG_FILE = Path("/tmp/ranking-pro-devtool.log")

_start_lock = threading.Lock()


def port_open(port: int, host: str = "127.0.0.1") -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.settimeout(0.4)
        return sock.connect_ex((host, port)) == 0


def launcher_running() -> bool:
    if not port_open(LAUNCHER_PORT):
        return False
    try:
        with urlopen(f"http://127.0.0.1:{LAUNCHER_PORT}/api/health", timeout=1.5) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return data.get("role") == "launcher"
    except Exception:
        return port_open(LAUNCHER_PORT)


def wait_for_port(port: int, timeout: float = 12.0) -> bool:
    deadline = time.time() + timeout
    while time.time() < deadline:
        if port_open(port):
            return True
        time.sleep(0.25)
    return False


def spawn_main_server() -> dict:
    with _start_lock:
        if port_open(SERVER_PORT):
            return {
                "ok": True,
                "started": False,
                "alreadyRunning": True,
                "message": "Servidor já está ativo",
                "url": f"http://127.0.0.1:{SERVER_PORT}",
                "port": SERVER_PORT,
            }

        if not SERVER_SCRIPT.is_file():
            raise RuntimeError(f"Arquivo não encontrado: {SERVER_SCRIPT}")

        LOG_FILE.parent.mkdir(parents=True, exist_ok=True)
        log_handle = LOG_FILE.open("a", encoding="utf-8")
        log_handle.write(f"\n--- launcher start {time.strftime('%Y-%m-%d %H:%M:%S')} ---\n")
        log_handle.flush()

        subprocess.Popen(
            [sys.executable, str(SERVER_SCRIPT)],
            cwd=str(DEVTOOL_DIR),
            stdout=log_handle,
            stderr=subprocess.STDOUT,
            start_new_session=True,
            close_fds=True,
            env={**os.environ, "DEVTOOL_PORT": str(SERVER_PORT)},
        )

        if wait_for_port(SERVER_PORT):
            return {
                "ok": True,
                "started": True,
                "alreadyRunning": False,
                "message": "Servidor iniciado com sucesso",
                "url": f"http://127.0.0.1:{SERVER_PORT}",
                "port": SERVER_PORT,
            }

        return {
            "ok": True,
            "started": True,
            "alreadyRunning": False,
            "message": "Processo iniciado — aguardando porta",
            "url": f"http://127.0.0.1:{SERVER_PORT}",
            "port": SERVER_PORT,
            "pending": True,
        }


class ReuseHTTPServer(ThreadingHTTPServer):
    allow_reuse_address = True


class LauncherHandler(BaseHTTPRequestHandler):
    server_version = "RankingProDevToolLauncher/1.0"

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

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_GET(self):
        path = urlparse(self.path).path
        if path == "/api/health":
            self._json(200, {
                "ok": True,
                "role": "launcher",
                "launcherPort": LAUNCHER_PORT,
                "serverPort": SERVER_PORT,
                "serverOnline": port_open(SERVER_PORT),
            })
            return
        if path == "/api/server/status":
            self._json(200, {
                "ok": True,
                "serverOnline": port_open(SERVER_PORT),
                "url": f"http://127.0.0.1:{SERVER_PORT}",
            })
            return
        self.send_error(404)

    def do_POST(self):
        path = urlparse(self.path).path
        if path == "/api/server/start":
            try:
                self._json(200, spawn_main_server())
            except RuntimeError as exc:
                self._json(500, {"ok": False, "error": str(exc)})
            return
        self.send_error(404)


def report_already_running(url: str) -> None:
    spawn_main_server()
    try:
        webbrowser.open(url)
    except Exception:
        pass
    print("")
    print("  🏆 Ranking Pro DevTool")
    print(f"  → Launcher já ativo na porta {LAUNCHER_PORT}")
    print(f"  → DevTool: {url}")
    print("")


def main():
    url = f"http://127.0.0.1:{SERVER_PORT}"

    if launcher_running():
        report_already_running(url)
        return

    spawn_main_server()
    try:
        webbrowser.open(url)
    except Exception:
        pass

    try:
        httpd = ReuseHTTPServer(("127.0.0.1", LAUNCHER_PORT), LauncherHandler)
    except OSError as exc:
        if getattr(exc, "errno", None) == 48:
            report_already_running(url)
            return
        raise

    print("")
    print("  🏆 Ranking Pro DevTool — Launcher")
    print(f"  → DevTool: {url}")
    print(f"  → Launcher API: http://127.0.0.1:{LAUNCHER_PORT}")
    print(f"  → Log: {LOG_FILE}")
    print("")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nLauncher encerrado.")


if __name__ == "__main__":
    main()