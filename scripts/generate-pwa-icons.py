#!/usr/bin/env python3
"""Gera ícones PWA 192/512 (stdlib — sem Pillow)."""

from __future__ import annotations

import struct
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets' / 'icons'


def _chunk(tag: bytes, data: bytes) -> bytes:
    return struct.pack('>I', len(data)) + tag + data + struct.pack('>I', zlib.crc32(tag + data) & 0xffffffff)


def write_png(path: Path, size: int, rgb: tuple[int, int, int]) -> None:
    r, g, b = rgb
    row = bytes([0, r, g, b] * size)
    raw = row * size
    compressed = zlib.compress(raw, 9)

    ihdr = struct.pack('>IIBBBBB', size, size, 8, 2, 0, 0, 0)
    png = b'\x89PNG\r\n\x1a\n'
    png += _chunk(b'IHDR', ihdr)
    png += _chunk(b'IDAT', compressed)
    png += _chunk(b'IEND', b'')

    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(png)


def write_svg(path: Path) -> None:
    svg = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-label="Ranking Pro">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6366f1"/>
      <stop offset="100%" stop-color="#8b5cf6"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="112" fill="#08080f"/>
  <circle cx="256" cy="256" r="168" fill="url(#g)" opacity="0.95"/>
  <path fill="#f8fafc" d="M256 148l28 72h78l-63 46 24 72-67-48-67 48 24-72-63-46h78z"/>
</svg>
"""
    path.write_text(svg.strip() + '\n', encoding='utf-8')


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    write_svg(OUT / 'icon.svg')
    # Indigo #6366f1 — substituir por arte final em produção
    write_png(OUT / 'icon-192.png', 192, (99, 102, 241))
    write_png(OUT / 'icon-512.png', 512, (99, 102, 241))
    print('PWA icons →', OUT)


if __name__ == '__main__':
    main()