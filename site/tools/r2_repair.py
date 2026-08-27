#!/usr/bin/env python3
"""Repair the two ways r2_rewrite.py's first pass mangled URLs.

Both come from one root cause: the REF pattern matched an image path even when
that path was already part of a LARGER url, and it swallowed the leading "/"
without putting one back.

  1. Doubled host. A pre-existing "https://<r2>/images/x.png" had its
     "images/x.png" replaced by a whole absolute URL, yielding
     "https://<r2>https://<r2>/images/x.webp".

  2. Missing separator. "/cdn-cgi/image/<opts>/images/x.webp" lost the slash
     that divided the resizing options from the source, giving
     "...quality=82https://<r2>/...". Cloudflare Image Resizing does accept an
     absolute source URL, so restoring the slash is the correct repair -- the
     R2 origin is kept, only the separator comes back.

Idempotent: running it twice changes nothing. --apply to write.
"""
import re
import sys
from pathlib import Path

SITE = Path(__file__).resolve().parent.parent
HOST = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev"
EXTS = {".md", ".html", ".css", ".js", ".toml", ".xml", ".json"}
ROOTS = ["content", "templates", "static", "config.toml"]
SKIP = {"node_modules", "public", ".git", "build", "src"}

# option segment of a /cdn-cgi/image/ URL, immediately followed by the host
NEEDS_SLASH = re.compile(r'(fit=(?:cover|contain)|quality=\d+)(?=' + re.escape(HOST) + ')')


def files():
    for root in ROOTS:
        p = SITE / root
        if p.is_file():
            yield p
            continue
        for f in p.rglob("*"):
            if f.is_file() and f.suffix in EXTS and not SKIP & set(f.parts):
                yield f


def main() -> int:
    apply = "--apply" in sys.argv
    fixed_dupe = fixed_slash = touched = 0
    for f in files():
        try:
            t = f.read_text(encoding="utf-8")
        except (UnicodeDecodeError, OSError):
            continue
        orig = t

        # Loop to a fixed point: some URLs were rewritten three times, and a
        # single collapse of HOST+HOST leaves another HOST+HOST behind.
        while HOST + HOST in t:
            n = t.count(HOST + HOST)
            t = t.replace(HOST + HOST, HOST)
            fixed_dupe += n

        t, k = NEEDS_SLASH.subn(r"\1/", t)
        fixed_slash += k

        if t != orig:
            touched += 1
            if apply:
                f.write_text(t, encoding="utf-8")

    print(f"{'APPLIED' if apply else 'DRY RUN'}: {touched} files | "
          f"doubled hosts collapsed: {fixed_dupe} | slashes restored: {fixed_slash}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
