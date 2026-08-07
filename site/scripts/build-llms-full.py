#!/usr/bin/env python3
"""Generate static/llms-full.txt from the English search index.

llmstxt.org splits the two files by purpose: `/llms.txt` is a hand-curated map
of what matters, `/llms-full.txt` is the expanded body an agent reads when the
map is not enough. The curated one is hand-written and lives in
static/llms.txt; this one is generated, because a hand-maintained list of every
page is a list that silently goes stale.

Runs after scripts/build-search-index.py and before `zola build`
(see the build command in site/wrangler.jsonc).
"""

import json
import pathlib
import sys

SITE = pathlib.Path(__file__).resolve().parent.parent
INDEX = SITE / "static" / "search-index.en.json"
OUT = SITE / "static" / "llms-full.txt"
BASE = "https://divinci.ai"

HEADER = """# Divinci AI — full content index

> Expanded companion to https://divinci.ai/llms.txt. Every English page in the
> site search index, with its summary. Translations (es, fr, ar, de, it, pt,
> ru, ja, zh, ko, nl, hi) mirror this structure under their language prefix and
> are listed in https://divinci.ai/sitemap.xml.

"""


def main() -> int:
    if not INDEX.exists():
        print(f"[llms-full] ERROR: {INDEX} missing — run build-search-index.py first.")
        return 1

    entries = json.loads(INDEX.read_text())
    if not entries:
        print("[llms-full] ERROR: search index is empty.")
        return 1

    # Group by category so the file reads as a map rather than a dump. Pages
    # with no category land in "Other" rather than being dropped — a silently
    # omitted page is worse than an untidy heading.
    groups: dict[str, list[dict]] = {}
    for e in entries:
        cat = (e.get("categories") or "Other").strip() or "Other"
        groups.setdefault(cat, []).append(e)

    lines = [HEADER]
    for cat in sorted(groups):
        lines.append(f"## {cat}\n")
        for e in sorted(groups[cat], key=lambda x: x.get("title", "")):
            title = (e.get("title") or "").strip()
            url = e.get("url") or ""
            if not title or not url:
                continue
            if url.startswith("/"):
                url = BASE + url
            excerpt = " ".join((e.get("excerpt") or "").split())
            if len(excerpt) > 400:
                excerpt = excerpt[:397].rsplit(" ", 1)[0] + "…"
            lines.append(f"- [{title}]({url}): {excerpt}" if excerpt
                         else f"- [{title}]({url})")
        lines.append("")

    OUT.write_text("\n".join(lines).rstrip() + "\n")
    print(f"[llms-full] wrote {OUT.name}: {len(entries)} pages "
          f"across {len(groups)} categories")
    return 0


if __name__ == "__main__":
    sys.exit(main())
