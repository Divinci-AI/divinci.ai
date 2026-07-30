#!/usr/bin/env python3
"""Build per-language client-side search indexes from site/content.

Outputs site/static/search-index.<lang>.json. Run BEFORE `zola build`
(also wired into wrangler.jsonc / package.json prebuild).

Each record: {title, url, section, tags, categories, date, excerpt}.
Frontmatter is TOML delimited by +++ (Zola convention); we parse it with
tomllib so arrays ([taxonomies] tags/categories) and datetime `date`
fields are read correctly.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

# `tomllib` is stdlib only on Python 3.11+. Both `npm run build` and
# wrangler.jsonc's custom build command invoke a bare `python3`, which on macOS
# resolves to Apple's /usr/bin/python3 (3.9) — so a hard `import tomllib` made
# BOTH the local build and `wrangler deploy` fail with ModuleNotFoundError,
# regardless of any newer python installed alongside. Fall back to the `tomli`
# backport (identical API) so the build works on whatever python3 it lands on.
try:
    import tomllib
except ModuleNotFoundError:  # Python < 3.11
    try:
        import tomli as tomllib  # type: ignore[no-redef]
    except ModuleNotFoundError as exc:  # pragma: no cover
        raise SystemExit(
            "build-search-index.py needs TOML parsing: either run it with "
            "Python 3.11+ (which has stdlib tomllib) or install the backport:\n"
            "    python3 -m pip install --user tomli"
        ) from exc

ROOT = Path(__file__).resolve().parents[1]          # site/
CONTENT = ROOT / "content"
STATIC = ROOT / "static"

# Pages/dirs to exclude from the index.
SKIP_PAGES = {"sitemap", "_index"}
# Top-level content dirs that are NOT languages.
SKIP_DIRS = {"blog", "static", "preview", "_index"}

MD_IMG = re.compile(r"!\[[^\]]*\]\([^)]*\)")
MD_CODE = re.compile(r"```.*?```", re.S)
MD_LINK = re.compile(r"\[([^\]]+)\]\([^)]*\)")
MD_HTML = re.compile(r"<[^>]+>")
WS = re.compile(r"\s+")


def strip_fm(text: str) -> str:
    """Return the markdown body after the +++ frontmatter block."""
    if not text.startswith("+++"):
        return text
    i = text.find("\n+++", 3)
    if i == -1:
        return ""
    return text[i + 4:]


def parse_fm(text: str) -> dict:
    """Parse the +++ TOML frontmatter block into a dict (best-effort)."""
    if not text.startswith("+++"):
        return {}
    i = text.find("\n+++", 3)
    if i == -1:
        return {}
    block = text[3:i]
    try:
        return tomllib.loads(block)
    except Exception:
        return {}


def plain(body: str) -> str:
    body = MD_IMG.sub("", body)
    body = MD_CODE.sub("", body)
    body = MD_LINK.sub(r"\1", body)
    body = MD_HTML.sub("", body)
    body = re.sub(r"[#>_*`~=]+", " ", body)
    return WS.sub(" ", body).strip()


def join_list(v) -> str:
    if isinstance(v, (list, tuple)):
        return ", ".join(str(x) for x in v)
    return str(v) if v else ""


def collect(lang_dir: Path, lang: str, out: list) -> None:
    md_files: list[Path] = []
    blog_dir = lang_dir / "blog"
    if blog_dir.is_dir():
        md_files.extend(sorted(blog_dir.glob("*.md")))
    md_files.extend(sorted(lang_dir.glob("*.md")))  # top-level pages

    for p in md_files:
        slug = p.stem
        if slug in SKIP_PAGES:
            continue
        text = p.read_text(encoding="utf-8")
        fm = parse_fm(text)
        if not fm:
            continue

        # `extra.hidden = true` opts a page out of search.
        extra = fm.get("extra", {})
        if isinstance(extra, dict) and str(extra.get("hidden", "")).lower() == "true":
            continue

        body = strip_fm(text)
        summary = fm.get("description") or fm.get("summary") or ""
        excerpt = (summary + " " + plain(body))[:300].strip()

        is_blog = p.parent.name == "blog"
        # Always root-absolute so results don't resolve relative to the
        # current path (e.g. /blog/foo/ + blog/bar/ → /blog/foo/blog/bar/).
        prefix = f"/{lang}/" if lang != "en" else "/"
        url = prefix + (f"blog/{slug}/" if is_blog else f"{slug}/")

        taxonomies = fm.get("taxonomies", {})
        if not isinstance(taxonomies, dict):
            taxonomies = {}

        date_val = fm.get("date", "")
        if hasattr(date_val, "isoformat"):
            date_val = date_val.isoformat()

        out.append({
            "title": str(fm.get("title", slug)),
            "url": url,
            "section": "blog" if is_blog else "page",
            "tags": join_list(taxonomies.get("tags", [])),
            "categories": join_list(taxonomies.get("categories", [])),
            "date": str(date_val),
            "excerpt": excerpt,
        })


def main() -> None:
    STATIC.mkdir(parents=True, exist_ok=True)

    # EN (root content) + each translated language dir that has content.
    langs = ["en"]
    for d in sorted(CONTENT.iterdir()):
        if not d.is_dir():
            continue
        if d.name.startswith("_") or d.name in SKIP_DIRS:
            continue
        # Only treat as a language dir if it has pages or a blog subdir.
        has_pages = any(d.glob("*.md"))
        has_blog = (d / "blog").is_dir()
        if has_pages or has_blog:
            langs.append(d.name)

    for lang in langs:
        out: list[dict] = []
        base = CONTENT if lang == "en" else CONTENT / lang
        if not base.exists():
            continue
        collect(base, lang, out)
        path = STATIC / f"search-index.{lang}.json"
        path.write_text(
            json.dumps(out, ensure_ascii=False, sort_keys=True),
            encoding="utf-8",
        )
        print(f"wrote {path} ({len(out)} records)")


if __name__ == "__main__":
    main()
