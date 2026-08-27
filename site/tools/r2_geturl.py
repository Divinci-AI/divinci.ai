#!/usr/bin/env python3
"""Stop wrapping already-absolute image URLs in Zola's get_url().

After the R2 migration nearly every image value is an absolute URL, and
get_url() prefixes base_url onto those, yielding
"https://divinci.ai/https://<r2>/images/x.webp" -- 191 of them in the build.

Two shapes to fix:

  literal   {{ get_url(path='https://<r2>/...') }}  -> the URL itself.
            The first rewrite pass only recognised DOUBLE-quoted paths, so
            single-quoted calls kept their wrapper and broke this way.

  variable  {{ get_url(path=page.extra.featured_image) }} -> the variable.
            Safe because every such value is now absolute -- except five
            front-matter entries still pointing at LOCAL SVGs (kept local by
            design), which are normalised to root-relative first so they
            resolve without the helper.

--apply to write.
"""
import re
import sys
from pathlib import Path

SITE = Path(__file__).resolve().parent.parent
HOST = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev"

# image-ish front-matter values that get_url is called on
VARS = r"(?:page|post|featured_post|section)\.extra\.(?:featured_image|author_avatar|" \
       r"card_image|hero_background|hero_video|og_image|poster|thumbnail)"

LITERAL = re.compile(
    r"\{\{-?\s*get_url\(path=(['\"])(?P<url>https?://[^'\"]+)\1\)"
    r"(?P<filters>(?:\s*\|\s*safe)?)\s*-?\}\}")
VARIABLE = re.compile(
    r"\{\{-?\s*get_url\(path=(?P<var>" + VARS + r")\)"
    r"(?P<filters>(?:\s*\|\s*safe)?)\s*-?\}\}")

# bare-relative front-matter values that still need the helper's resolution
BARE = re.compile(r'^(?P<key>featured_image|card_image|og_image)\s*=\s*"(?P<v>(?!/|https?:)[^"]+)"',
                  re.M)


def main() -> int:
    apply = "--apply" in sys.argv
    lit = var = bare = 0
    touched = set()

    # 1. normalise bare-relative values to root-relative so dropping get_url is safe
    for f in SITE.joinpath("content").rglob("*.md"):
        t = f.read_text(encoding="utf-8", errors="ignore")
        new, n = BARE.subn(lambda m: f'{m.group("key")} = "/{m.group("v")}"', t)
        if n:
            bare += n
            touched.add(f)
            if apply:
                f.write_text(new, encoding="utf-8")

    # 2. unwrap get_url in templates
    for f in SITE.joinpath("templates").rglob("*.html"):
        t = f.read_text(encoding="utf-8", errors="ignore")
        orig = t
        t, a = LITERAL.subn(lambda m: m.group("url"), t)
        t, b = VARIABLE.subn(lambda m: "{{ " + m.group("var") + m.group("filters") + " }}", t)
        lit += a
        var += b
        if t != orig:
            touched.add(f)
            if apply:
                f.write_text(t, encoding="utf-8")

    print(f"{'APPLIED' if apply else 'DRY RUN'}: {len(touched)} files | "
          f"literal get_url unwrapped: {lit} | variable get_url unwrapped: {var} | "
          f"bare front-matter paths rooted: {bare}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
