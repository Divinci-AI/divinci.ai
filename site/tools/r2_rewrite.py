#!/usr/bin/env python3
"""Repoint every reference to a migrated raster at its R2 URL.

Only rewrites paths that resolve to a file we actually uploaded, so external
URLs (youtube thumbnails), placeholders that never existed (/images/foo.jpg),
and the three local icons are all left alone by construction rather than by a
blocklist.

OG cards resolve to their ORIGINAL-format R2 copy, not the WebP: LinkedIn and
several other unfurlers still fail to render a WebP og:image, and these files
exist to be unfurled.

Run with --apply to write; default is a dry run.
"""
import json
import re
import sys
from pathlib import Path

SITE = Path(__file__).resolve().parent.parent
MANIFEST = json.loads((SITE / "build" / "r2-manifest.json").read_text())

# local path (as referenced, without leading slash) -> replacement URL
URL = {}
for e in MANIFEST["entries"]:
    if e["kind"] == "ICON":
        continue
    URL[e["local"]] = e.get("orig_url") or e["url"]

# static/lab holds the dev-pipeline prototype, which references vendor logos
# directly; leaving it out stranded three /brand/vendors/*.png refs.
SEARCH_DIRS = ["content", "templates", "static/css", "static/js",
               "static/lab", "sass"]
SEARCH_FILES = ["config.toml"]
EXTS = {".md", ".html", ".css", ".js", ".toml", ".xml", ".json"}
SKIP_DIRS = {"node_modules", "public", ".git", "build", "src"}

# /images/x.png  or  images/x.png  (the latter inside Zola's get_url(path="..."))
#
# The leading (?<=...) is load-bearing. Without it this matched image paths that
# were already INSIDE a larger URL -- a pre-existing R2 link, or the source half
# of a /cdn-cgi/image/<opts>/<src> resizing URL -- and replaced them with a
# second absolute URL, producing "https://<r2>https://<r2>/x.webp" and
# "...quality=82https://<r2>/x.webp". 164 doubled hosts and 194 lost separators
# before this guard existed; see tools/r2_repair.py.
REF = re.compile(
    r'(?<=["\'(=\s])'                       # only at a real attribute/value edge
    r'(?P<slash>/?)'
    r'(?P<path>(?:images|brand)/[A-Za-z0-9._/-]+?\.(?:png|jpe?g|webp))')

# Zola's helper must be replaced WHOLE. Rewriting only the path inside it would
# leave get_url(path="https://...") behind, and Zola prefixes base_url onto that
# -- turning a working absolute URL into a broken doubled one.
GET_URL = re.compile(
    r'\{\{-?\s*get_url\(path="(?P<path>(?:images|brand)/[A-Za-z0-9._/-]+?'
    r'\.(?:png|jpe?g|webp))"\)\s*-?\}\}')


def targets():
    for d in SEARCH_DIRS:
        base = SITE / d
        if not base.exists():
            continue
        for p in base.rglob("*"):
            if p.is_file() and p.suffix.lower() in EXTS \
               and not SKIP_DIRS & set(p.relative_to(SITE).parts):
                yield p
    for f in SEARCH_FILES:
        if (SITE / f).exists():
            yield SITE / f


def main() -> int:
    apply = "--apply" in sys.argv
    changed_files = 0
    total = 0
    unresolved = {}

    for p in targets():
        try:
            text = p.read_text(encoding="utf-8")
        except (UnicodeDecodeError, OSError):
            continue

        hits = []

        def sub_geturl(m):
            path = m.group("path")
            if path not in URL:
                return m.group(0)          # icons keep their get_url() call
            hits.append(path)
            return URL[path]

        def sub(m):
            path = m.group("path")
            if path not in URL:
                unresolved.setdefault(path, 0)
                unresolved[path] += 1
                return m.group(0)          # untouched: icon, external, or absent
            hits.append(path)
            return URL[path]

        new = REF.sub(sub, GET_URL.sub(sub_geturl, text))
        if new != text:
            changed_files += 1
            total += len(hits)
            if apply:
                p.write_text(new, encoding="utf-8")
            else:
                rel = p.relative_to(SITE)
                print(f"{rel}: {len(hits)} ref(s)")

    print(f"\n{'APPLIED' if apply else 'DRY RUN'}: "
          f"{total} references across {changed_files} files")
    if unresolved:
        print(f"\nleft alone ({len(unresolved)} distinct paths not in the manifest):")
        for k, n in sorted(unresolved.items(), key=lambda kv: -kv[1])[:25]:
            print(f"  {n:>3}x {k}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
