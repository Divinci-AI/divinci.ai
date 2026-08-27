#!/usr/bin/env python3
"""Stage the pipeline narrative into the SDK docs site (sdk.divinci.ai/pipeline).

That site is Astro + Starlight, a different project from this Zola one. The page
goes into its `public/` directory rather than becoming an Astro page: Astro
copies public/ verbatim, so the full-bleed scroll narrative keeps its own layout
instead of fighting Starlight's docs chrome.

Asset policy, matching the R2 migration:
  * large binaries (brush video, robot bundle) are referenced on R2, so they are
    not duplicated into a second repo
  * page code and the small vendor SVGs travel with the page under /pipeline/

Paths are rewritten to ABSOLUTE /pipeline/... rather than relative, because the
route may be served with or without a trailing slash and a relative path
resolves differently in each case.

Idempotent. Run from site/.
"""
import re
import shutil
import sys
from pathlib import Path

SITE = Path(__file__).resolve().parent.parent
STATIC = SITE / "static"
DOCS = Path.home() / "Documents/server/workspace/sdk/docs"
DEST = DOCS / "public" / "pipeline"
R2 = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev"


def main() -> int:
    if not DOCS.exists():
        print(f"SDK docs site not found at {DOCS}", file=sys.stderr)
        return 1
    DEST.mkdir(parents=True, exist_ok=True)

    # ---- page ------------------------------------------------------------
    html = (STATIC / "lab" / "pipeline.html").read_text(encoding="utf-8")
    # published at a real URL now, so let it be indexed
    html = html.replace('<meta name="robots" content="noindex">\n', "")
    html = html.replace('<title>Lab — The document\'s journey</title>',
                        "<title>One document. The whole pipeline. — Divinci AI</title>\n"
                        '<meta name="description" content="Follow a single PDF through every '
                        'stage of the Divinci RAG pipeline — parsed, chunked, quizzed, '
                        'embedded, routed, attacked, guarded, and served.">')
    html = html.replace('src="/lab/pipeline.js"', 'src="/pipeline/pipeline.js"')
    # the agent list in the CTA carries its own vendor marks
    html = re.sub(r'"/brand/(vendors|companies)/', r'"/pipeline/brand/\1/', html)
    (DEST / "index.html").write_text(html, encoding="utf-8")

    # ---- page code -------------------------------------------------------
    js = (STATIC / "lab" / "pipeline.js").read_text(encoding="utf-8")
    js = js.replace('"/data/leonardo-brush-tips.json"',
                    '"/pipeline/leonardo-brush-tips.json"')
    js = js.replace('"/video/leonardo-brush"', f'"{R2}/video/leonardo-brush"')
    js = js.replace('"/js/pipeline-robot.js"', f'"{R2}/js/pipeline-robot.js"')
    # local SVG marks travel with the page
    js = re.sub(r'"/brand/(vendors|companies)/', r'"/pipeline/brand/\1/', js)
    (DEST / "pipeline.js").write_text(js, encoding="utf-8")

    # ---- small assets ----------------------------------------------------
    shutil.copy2(STATIC / "data" / "leonardo-brush-tips.json",
                 DEST / "leonardo-brush-tips.json")

    copied = 0
    for ref in sorted(set(re.findall(r'"/pipeline/brand/([a-z]+)/([A-Za-z0-9._-]+)"', js + html))):
        kind, name = ref
        src = STATIC / "brand" / kind / name
        if not src.exists():
            print(f"  MISSING {src}", file=sys.stderr)
            continue
        dst = DEST / "brand" / kind / name
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dst)
        copied += 1

    # every remaining absolute path must be one we deliberately kept
    stray = sorted(set(re.findall(
        r'"(/(?!pipeline/)[a-z][A-Za-z0-9._/-]*\.(?:svg|json|js|webp|png|jpe?g|webm|mp4))"', js + html)))
    print(f"staged -> {DEST}")
    print(f"  index.html, pipeline.js, tips json, {copied} vendor marks")
    print(f"  R2-hosted: brush video, robot bundle, all rasters")
    if stray:
        print("  ⚠ still site-relative (would 404 on the docs site):")
        for s in stray:
            print("     " + s)
        return 1
    print("  no stray site-relative asset paths")
    return 0


if __name__ == "__main__":
    sys.exit(main())
