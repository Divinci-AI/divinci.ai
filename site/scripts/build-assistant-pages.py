#!/usr/bin/env python3
"""Generate one indexable page per PUBLISHED assistant, under /a/<slug>/.

Experiment C of the embed-SEO work (see the server repo,
docs/experiments/embed-seo.md). The other three experiments try to earn
something from the widget on a customer's site. This one is the opposite bet:
first-party content on a domain we control, which can rank on its own and can
attract genuine inbound links rather than the `nofollow` attribution the embed
badge deliberately ships.

Runs ahead of `zola build`, alongside the other index generators (see the build
command in site/wrangler.jsonc). Generated pages are build output, not source.

────────────────────────────────────────────────────────────────────────────────
WHY THIS IS AN ALLOWLIST AND NOT "EVERY PUBLIC RELEASE"
────────────────────────────────────────────────────────────────────────────────
The obvious version of programmatic SEO is: read the public release catalog,
emit a page each. That was measured before writing this, and it is a trap.

    GET https://api.divinci.app/white-label-release/   ->  496 public releases
      383  auto-crawled `wwwrag-*` corpora  ("Chat with the WWW-RAG crawled
           corpus for sep.stanford.edu") — about THIRD-PARTY websites, near
           identical to each other, differing only by hostname
       ~90 sales demos ("Demo — LanceDB") and dated/test junk
           ("Release 7/23/2025", "FastEmbed Release 1786285761861")
       ~20 plausible candidates, of which a handful are genuinely substantial

Emitting 496 near-identical thin pages is scaled content abuse, and it would be
aimed squarely at the domain our marketing site ranks on. It is the same mistake
the staging harness avoids by being noindex — at much larger blast radius.

Heuristics on the title were tried and rejected too: "drop anything starting
`Demo —`" breaks the moment a real customer names their assistant that way, and
a false positive here means publishing someone's private assistant.

So eligibility is EXPLICIT and human-curated, in data/assistant-pages.toml. A
page exists because a person added a line to a file in a reviewable commit.

────────────────────────────────────────────────────────────────────────────────
AND EVEN THEN, EVERY PAGE MUST HAVE SUBSTANCE
────────────────────────────────────────────────────────────────────────────────
Being allowlisted is necessary, not sufficient. A page carrying a title, a
one-line description and an embed is a thin page, and a directory of them is
what a search engine is built to discount.

So a page is generated only when the release has PUBLISHED seo-content with at
least MIN_ENTRIES grounded Q&A — the same payload, and the same grounding gate,
that feeds the embed's host-page FAQ block. If the content is not there, the
script says so and emits nothing. Skipping is the correct outcome, not a
failure.
"""

import json
import pathlib
import re
import sys
import urllib.parse
import urllib.request

SITE = pathlib.Path(__file__).resolve().parent.parent
ALLOWLIST = SITE / "data" / "assistant-pages.toml"
OUT_DIR = SITE / "content" / "a"

DEFAULT_API = "https://api.divinci.app"
# A page needs real substance or it should not exist. Three is the floor at
# which the block reads as a FAQ rather than as filler.
MIN_ENTRIES = 3
TIMEOUT = 30

SLUG_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
OBJECTID_RE = re.compile(r"^[a-f0-9]{24}$")

# Marks every file this script owns, so stale pages can be removed without
# touching anything hand-written that happens to live in the same section.
GENERATED_MARKER = "generated_by = \"build-assistant-pages.py\""


def fetch_json(url: str):
    """GET and parse JSON.

    Never a bare .json() equivalent: these endpoints sit behind Cloudflare,
    which answers with an HTML error page often enough that blind parsing turns
    a 502 into an unreadable traceback. Returns None on any failure — a build
    must not die because one assistant's endpoint blipped.
    """
    req = urllib.request.Request(url, headers={"User-Agent": "divinci-site-build/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
            body = resp.read().decode("utf-8", "replace")
    except Exception as exc:  # noqa: BLE001 - any failure is "skip this one"
        print(f"    ! fetch failed: {exc}", file=sys.stderr)
        return None
    try:
        return json.loads(body)
    except json.JSONDecodeError:
        print(f"    ! non-JSON response ({body[:100]!r})", file=sys.stderr)
        return None


def parse_allowlist(path: pathlib.Path):
    """Read the curated allowlist.

    Deliberately a hand-rolled parser for `[[assistant]]` blocks of flat
    key = "value" pairs, matching build-agent-skills.py's reasoning: pulling a
    TOML dependency into the build for three keys is not worth it, and Python
    3.11's tomllib would tie the build to an interpreter version the deploy
    image does not pin.
    """
    if not path.exists():
        return []
    entries, current = [], None
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        if line == "[[assistant]]":
            current = {}
            entries.append(current)
            continue
        if current is None or "=" not in line:
            continue
        key, _, value = line.partition("=")
        current[key.strip()] = value.strip().strip('"').strip("'")
    return entries


def escape_toml(value: str) -> str:
    """Escape a value for a TOML basic string in generated front matter."""
    return value.replace("\\", "\\\\").replace('"', '\\"').replace("\n", " ").strip()


def render_page(entry, release, content) -> str:
    """Build the Zola page.

    The Q&A is emitted as visible Markdown, NOT as a JSON-LD blob with hidden
    prose. Same rule the embed's FAQ block enforces: structured data may only
    describe what a reader can actually see. Zola renders this to real headings
    and paragraphs, and the FAQPage graph is derived from the same list by the
    template.
    """
    title = entry.get("title") or release.get("title") or entry["slug"]
    description = entry.get("description") or release.get("description") or ""

    lines = [
        "+++",
        f'title = "{escape_toml(title)}"',
        f'description = "{escape_toml(description)}"',
        'template = "assistant.html"',
        "[extra]",
        f"{GENERATED_MARKER}",
        f'release_id = "{escape_toml(entry["release_id"])}"',
    ]
    if entry.get("site"):
        lines.append(f'assistant_site = "{escape_toml(entry["site"])}"')
    if content.get("heading"):
        lines.append(f'faq_heading = "{escape_toml(content["heading"])}"')

    # The FAQ travels in front matter as well as in the body: the template
    # builds the FAQPage graph from this, so the graph can never describe a pair
    # the body does not also render.
    lines.append("faq = [")
    for pair in content["faq"]:
        lines.append("  { question = \"%s\", answer = \"%s\" }," % (
            escape_toml(pair["question"]), escape_toml(pair["answer"]),
        ))
    lines.append("]")
    lines.append("+++")
    lines.append("")

    if description:
        lines.append(description)
        lines.append("")

    lines.append(f"## {content.get('heading') or 'Common questions'}")
    lines.append("")
    for pair in content["faq"]:
        lines.append(f"### {pair['question'].strip()}")
        lines.append("")
        lines.append(pair["answer"].strip())
        lines.append("")

    return "\n".join(lines)


def main() -> int:
    api = DEFAULT_API
    allowlist = ALLOWLIST
    argv = sys.argv[1:]
    for i, arg in enumerate(argv):
        if arg == "--api" and i + 1 < len(argv):
            api = argv[i + 1].rstrip("/")
        # Lets the pipeline be exercised against a staging release without
        # committing a staging id to the real allowlist.
        elif arg == "--allowlist" and i + 1 < len(argv):
            allowlist = pathlib.Path(argv[i + 1])

    entries = parse_allowlist(allowlist)
    print(f"[assistant-pages] allowlist: {len(entries)} entry(s) from {allowlist.name}")
    print(f"[assistant-pages] api: {api}")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    written, skipped = set(), []
    # Slugs whose evaluation was INCONCLUSIVE because a fetch failed, as
    # opposed to conclusively not qualifying. See the stale-removal guard.
    unreachable = set()

    for entry in entries:
        slug = entry.get("slug", "")
        release_id = entry.get("release_id", "")

        # Validate before any network call. A bad slug would write outside the
        # section; a bad id would build a nonsense URL.
        if not SLUG_RE.match(slug):
            skipped.append((slug or "<no slug>", "invalid slug"))
            continue
        if not OBJECTID_RE.match(release_id):
            skipped.append((slug, "invalid release_id"))
            continue

        quoted = urllib.parse.quote(release_id, safe="")
        release = fetch_json(f"{api}/white-label-release/{quoted}")
        if not release:
            unreachable.add(f"{slug}.md")
            skipped.append((slug, "release not reachable"))
            continue
        if release.get("status") == "draft":
            skipped.append((slug, "release is a draft"))
            continue

        content = fetch_json(f"{api}/white-label-release/{quoted}/seo-content")
        # A 404 here is a legitimate "nothing published yet" and fetch_json
        # cannot distinguish it from a transport failure, so treat an absent
        # payload as inconclusive too. Erring toward keeping a page costs a
        # stale page; erring the other way silently unpublishes the site.
        if content is None:
            unreachable.add(f"{slug}.md")
        faq = (content or {}).get("faq") or []
        if len(faq) < MIN_ENTRIES:
            # The expected outcome for most releases, and not an error: nothing
            # has been generated and published for them yet.
            skipped.append((slug, f"only {len(faq)} published Q&A, need {MIN_ENTRIES}"))
            continue

        path = OUT_DIR / f"{slug}.md"
        path.write_text(render_page(entry, release, content), encoding="utf-8")
        written.add(path.name)
        print(f"  + /a/{slug}/  ({len(faq)} Q&A)")

    # Remove pages this script previously generated whose entry is gone or no
    # longer qualifies. Without this, de-listing an assistant would leave its
    # page live forever — the failure mode nobody notices, because it looks
    # exactly like a page that is still supposed to be there.
    # NEVER delete on an inconclusive result. Found the hard way: an SSL trust
    # failure made every fetch return None, every entry "skip", and the sweep
    # below would then have deleted every generated page — a transient network
    # problem silently unpublishing the whole section, with the build still
    # green. A page is removed only when its entry is gone from the allowlist,
    # or when we successfully determined it no longer qualifies.
    for stale in OUT_DIR.glob("*.md"):
        if stale.name == "_index.md" or stale.name in written:
            continue
        if stale.name in unreachable:
            print(f"  ~ kept /a/{stale.stem}/ — could not verify it, refusing to unpublish")
            continue
        if GENERATED_MARKER in stale.read_text(encoding="utf-8"):
            stale.unlink()
            print(f"  - removed stale /a/{stale.stem}/")

    for slug, why in skipped:
        print(f"  · skipped {slug}: {why}")

    print(f"[assistant-pages] wrote {len(written)}, skipped {len(skipped)}")
    # Skipping is a normal outcome, never a build failure: a page that cannot
    # be given substance must not be published, and the site must still deploy.
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
