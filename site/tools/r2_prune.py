#!/usr/bin/env python3
"""Delete the local copies of everything now served from R2.

Every deletion is gated on that exact object answering 200 over the PUBLIC url
with a matching Content-Length, checked immediately before the unlink. A file
whose remote copy cannot be confirmed is kept, and reported.

Icons are never in the manifest with a key, so they are never considered.
SVGs were never migrated at all.

--apply to actually delete.
"""
import json
import sys
import urllib.request
from pathlib import Path

SITE = Path(__file__).resolve().parent.parent
STATIC = SITE / "static"
MANIFEST = json.loads((SITE / "build" / "r2-manifest.json").read_text())


def remote_ok(url: str, want: int) -> bool:
    req = urllib.request.Request(url, method="HEAD")
    # R2's public endpoint answers 403 to urllib's default User-Agent, which
    # made every single check "fail" while curl got a clean 200.
    req.add_header("User-Agent", "Mozilla/5.0 (divinci-site-migration)")
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            return r.status == 200 and int(r.headers.get("Content-Length", -1)) == want
    except Exception:
        return False


def main() -> int:
    apply = "--apply" in sys.argv
    deleted = kept = freed = 0
    problems = []

    for e in MANIFEST["entries"]:
        if not e.get("key"):
            continue                      # ICON: stays local by design
        local = STATIC / e["local"]
        if not local.exists():
            continue                      # already pruned

        # the URL the site will actually request for this asset
        url = e.get("orig_url") or e["url"]
        # Compare against what was STAGED for this key, not against this
        # source's own converted size. Twelve keys are shared -- a hand-made
        # x.webp alongside its x.png source is the same image twice -- so only
        # one source's byte count can ever match the single uploaded object.
        staged = SITE / "build" / "r2" / (e["orig_key"] if e.get("orig_url") else e["key"])
        if not staged.exists():
            kept += 1
            problems.append(f"{e['local']}  ->  staged file missing: {staged}")
            continue
        want = staged.stat().st_size
        if not remote_ok(url, want):
            kept += 1
            problems.append(f"{e['local']}  ->  {url}")
            continue

        freed += local.stat().st_size
        if apply:
            local.unlink()
        deleted += 1

    print(f"{'DELETED' if apply else 'WOULD DELETE'}: {deleted} files, "
          f"{freed/1048576:.1f}MB freed")
    if problems:
        print(f"\nKEPT -- remote copy not confirmed ({len(problems)}):")
        for p in problems[:20]:
            print("  " + p)
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
