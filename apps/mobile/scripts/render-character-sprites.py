"""Copy Fidel's web character sprites to crisp native PNGs without new packages."""

from pathlib import Path
import struct
import xml.etree.ElementTree as ET
import zlib

root = Path(__file__).resolve().parents[3]
source = root / "apps" / "web" / "public" / "characters"
target = root / "apps" / "mobile" / "assets" / "characters"
scale = 6


def chunk(kind: bytes, content: bytes) -> bytes:
    return struct.pack(">I", len(content)) + kind + content + struct.pack(">I", zlib.crc32(kind + content) & 0xFFFFFFFF)


for svg in source.rglob("*.svg"):
    document = ET.parse(svg).getroot()
    _, _, width_text, height_text = document.attrib["viewBox"].split()
    width, height = int(width_text), int(height_text)
    pixels = bytearray(width * height * 4)
    for rect in document:
        if not rect.tag.endswith("rect"):
            continue
        x, y = int(rect.get("x", "0")), int(rect.get("y", "0"))
        w, h = int(rect.get("width", "0")), int(rect.get("height", "0"))
        fill = rect.attrib["fill"].lstrip("#")
        if len(fill) == 3:
            fill = "".join(value * 2 for value in fill)
        color = bytes.fromhex(fill[:6]) + bytes((int(fill[6:8], 16) if len(fill) == 8 else 255,))
        for py in range(max(0, y), min(height, y + h)):
            for px in range(max(0, x), min(width, x + w)):
                pixels[(py * width + px) * 4:(py * width + px + 1) * 4] = color

    output = target / svg.relative_to(source).with_suffix(".png")
    output.parent.mkdir(parents=True, exist_ok=True)
    rows = bytearray()
    for y in range(height):
        row = b"".join(pixels[(y * width + x) * 4:(y * width + x + 1) * 4] * scale for x in range(width))
        for _ in range(scale):
            rows.extend(b"\0" + row)
    png = b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", width * scale, height * scale, 8, 6, 0, 0, 0))
    png += chunk(b"IDAT", zlib.compress(bytes(rows), 9)) + chunk(b"IEND", b"")
    output.write_bytes(png)
