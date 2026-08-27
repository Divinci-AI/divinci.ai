#!/usr/bin/env python3
"""Convert every raster under static/ to WebP and stage it for Cloudflare R2.

Three classes, because "all images" is not actually uniform:

  ICON   favicons and apple-touch-icon. Left completely alone, local and PNG.
         Safari does not accept a WebP favicon or apple-touch-icon, and browsers
         fetch these from the origin -- an R2 URL is the wrong shape for them.

  OG     social/unfurl cards. Converted to WebP like everything else, but the
         ORIGINAL format is uploaded alongside, because LinkedIn and several
         other unfurlers still do not render a WebP og:image. The og: tags keep
         pointing at the original-format R2 copy; everything else uses the WebP.

  NORMAL everything else. WebP only.

SVGs are deliberately untouched: 185 files totalling 1.4MB that stay crisp at
any DPI, and rasterising them would make them both larger and blurrier.

Writes build/r2/ plus a manifest the upload and rewrite steps consume. Pure
staging -- this script uploads nothing and deletes nothing.
"""
import json
import os
import re
import subprocess
import sys
from pathlib import Path

SITE = Path(__file__).resolve().parent.parent
STATIC = SITE / "static"
STAGE = SITE / "build" / "r2"
MANIFEST = SITE / "build" / "r2-manifest.json"
PUBLIC = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev"

RASTER = {".png", ".jpg", ".jpeg"}
# Files already in WebP still have to reach R2 -- "converted AND hosted" is two
# requirements, and these only ever satisfied the first. Copied verbatim rather
# than re-encoded, since re-encoding WebP is generation loss for no gain.
PASSTHROUGH = {".webp"}
ICON_RE = re.compile(r"(favicon|apple-touch-icon|android-chrome|mstile|maskable)", re.I)
OG_RE = re.compile(r"(^images/og/|social-preview|social-unfurl|-social-|og-card)", re.I)


def classify(rel: str) -> str:
    if ICON_RE.search(Path(rel).name):
        return "ICON"
    if OG_RE.search(rel):
        return "OG"
    return "NORMAL"


def cwebp(src: Path, dst: Path, quality: int) -> None:
    dst.parent.mkdir(parents=True, exist_ok=True)
    # -alpha_q 100 keeps transparency lossless even when the colour is lossy;
    # logos with soft edges fringe badly otherwise.
    cmd = ["cwebp", "-quiet", "-q", str(quality), "-m", "6", "-alpha_q", "100",
           str(src), "-o", str(dst)]
    subprocess.run(cmd, check=True)


def main() -> int:
    if STAGE.exists():
        subprocess.run(["rm", "-rf", str(STAGE)], check=True)
    entries = []
    for path in sorted(STATIC.rglob("*")):
        if not path.is_file():
            continue
        ext = path.suffix.lower()
        if ext not in RASTER and ext not in PASSTHROUGH:
            continue
        rel = path.relative_to(STATIC).as_posix()
        kind = classify(rel)

        if ext in PASSTHROUGH:
            dst = STAGE / rel
            dst.parent.mkdir(parents=True, exist_ok=True)
            dst.write_bytes(path.read_bytes())
            entries.append({"local": rel, "kind": "WEBP", "key": rel,
                            "url": f"{PUBLIC}/{rel}",
                            "src_bytes": path.stat().st_size,
                            "webp_bytes": dst.stat().st_size})
            continue

        if kind == "ICON":
            entries.append({"local": rel, "kind": kind, "action": "kept-local"})
            continue

        # OG cards carry text and gradients; give them a little more headroom.
        q = 88 if kind == "OG" else 85
        webp_rel = str(Path(rel).with_suffix(".webp"))
        cwebp(path, STAGE / webp_rel, q)

        e = {
            "local": rel,
            "kind": kind,
            "key": webp_rel,
            "url": f"{PUBLIC}/{webp_rel}",
            "src_bytes": path.stat().st_size,
            "webp_bytes": (STAGE / webp_rel).stat().st_size,
        }
        if kind == "OG":
            # keep a byte-identical original next to the WebP for the og: tags
            orig = STAGE / rel
            orig.parent.mkdir(parents=True, exist_ok=True)
            orig.write_bytes(path.read_bytes())
            e["orig_key"] = rel
            e["orig_url"] = f"{PUBLIC}/{rel}"
        entries.append(e)

    MANIFEST.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST.write_text(json.dumps({"public": PUBLIC, "entries": entries}, indent=2))

    conv = [e for e in entries if e.get("key")]
    src = sum(e["src_bytes"] for e in conv)
    out = sum(e["webp_bytes"] for e in conv)
    kept = [e for e in entries if e["kind"] == "ICON"]
    og = [e for e in conv if e["kind"] == "OG"]
    print(f"converted : {len(conv)} files  ({len(og)} of them OG, dual-format)")
    print(f"kept local: {len(kept)} icons  ({[e['local'] for e in kept]})")
    print(f"bytes     : {src/1048576:.1f}MB -> {out/1048576:.1f}MB "
          f"({100*(1-out/src):.0f}% smaller)")
    print(f"manifest  : {MANIFEST}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
