#!/usr/bin/env python3
"""Stamp the Open Web Vector Initiative's measured figures into data/.

Runs ahead of `zola build`, alongside the other index generators (see the build
command in site/wrangler.jsonc).

────────────────────────────────────────────────────────────────────────────────
WHY THIS EXISTS
────────────────────────────────────────────────────────────────────────────────
/open-web-vectors/ leads with numbers and claims they are measured rather than
projected. static/js/open-web-vectors.js re-reads every one of them from the
public directory API on load, so a visitor with JavaScript always sees the
truth. The figures rendered into the HTML are the fallback for everyone else.

"Everyone else" is not a rounding error on this page in particular. Answer
engines and retrieval crawlers mostly do not execute JavaScript, and this is
the page arguing that the web should be legible to exactly those systems. When
it was first written the HTML carried a hand-typed snapshot; the corpus is
continuous and self-feeding and added 23 sites in the 24 hours after it was
typed, so the fallback was wrong within a day and would have drifted for as
long as nobody remembered to retype it.

So the fallback is generated. Every deploy re-measures and re-stamps it.

────────────────────────────────────────────────────────────────────────────────
THE DATE IS THE SAFETY MECHANISM
────────────────────────────────────────────────────────────────────────────────
The figures and the date they were taken come out of this one file, so they
cannot disagree, and the page prints the date next to them. That is what makes
staleness honest: if the API has been unreachable for a month, the page says
"Measured 18 August 2026" and that sentence is still true. It is never a silent
lie, only a disclosed one — which is the whole reason a dated fallback beats a
row of dashes.

A failed fetch therefore leaves the existing file exactly as it is. A marketing
build must not die because an API blipped, and last month's measurement
correctly labelled is worth more than nothing at all.

────────────────────────────────────────────────────────────────────────────────
FORMATTING IS DUPLICATED ON PURPOSE, AND PINNED BY TESTS
────────────────────────────────────────────────────────────────────────────────
Every string this writes is formatted exactly as static/js/open-web-vectors.js
formats it, so the numbers do not visibly change when the live refresh lands on
top of them. That is two implementations of one format, which is a drift risk;
both are asserted against tests/fixtures/www-rag-directory.json, so a change to
either one without the other fails a test rather than shipping two different
numbers for the same corpus.
"""

import datetime
import json
import math
import pathlib
import ssl
import sys
import urllib.request

API_URL = "https://api.divinci.app/api/v1/www-rag-directory"
TIMEOUT = 20

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT_PATH = ROOT / "data" / "open-web-vectors.json"

# Buckets shown in the composition bar, in bar order; everything else is
# "other". Deliberately shorter than the directory's filter list — this is a
# five-segment bar that has to read at a glance. See the same note in
# static/js/open-web-vectors.js.
BUCKETS = [
    ("org", ".org"),
    ("gov", ".gov"),
    ("edu", ".edu"),
    ("com", ".com"),
    ("other", "everything else"),
]
NAMED_TLDS = {"com", "org", "gov", "edu"}
PUBLIC_TLDS = ("org", "gov", "edu")

# The directory header omits the corpus size below this. Mirrors
# MIN_HEADER_BYTES in static/js/www-rag-directory.js, where the reasoning is.
MIN_HEADER_BYTES = 100 * 1024 * 1024 * 1024


def _certifi_context():
    """An SSL context backed by certifi's bundle, or None if unavailable.

    A python.org install on macOS ships with an EMPTY trust store until
    "Install Certificates.command" is run, and every HTTPS fetch fails with
    CERTIFICATE_VERIFY_FAILED. A generator whose entire job is to stop figures
    drifting silently must not itself become a silent no-op on a stock Python,
    so the verify failure is retried against certifi when it is importable.

    This is a safety net, not a fix: the machine-level repair is to run that
    installer once, which repairs every build script at the same time.
    """
    try:
        import certifi
    except ImportError:
        return None
    return ssl.create_default_context(cafile=certifi.where())


def fetch_json(url):
    """GET and parse JSON, or None on any failure.

    Never a bare parse: the endpoint sits behind Cloudflare, which answers with
    an HTML error page often enough that blind parsing turns a 502 into an
    unreadable traceback.
    """
    req = urllib.request.Request(url, headers={"User-Agent": "divinci-site-build/1.0"})
    body = None
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
            body = resp.read().decode("utf-8", "replace")
    except urllib.error.URLError as exc:
        if not isinstance(getattr(exc, "reason", None), ssl.SSLError):
            print(f"    ! fetch failed: {exc}", file=sys.stderr)
            return None
        context = _certifi_context()
        if context is None:
            print(f"    ! fetch failed: {exc}", file=sys.stderr)
            print("      (this Python trusts no CAs; run Install Certificates.command)", file=sys.stderr)
            return None
        print("    · system trust store rejected the certificate; retrying with certifi")
        try:
            with urllib.request.urlopen(req, timeout=TIMEOUT, context=context) as resp:
                body = resp.read().decode("utf-8", "replace")
        except Exception as retry_exc:  # noqa: BLE001 - keep the last measurement
            print(f"    ! fetch failed: {retry_exc}", file=sys.stderr)
            return None
    except Exception as exc:  # noqa: BLE001 - any failure means "keep the last measurement"
        print(f"    ! fetch failed: {exc}", file=sys.stderr)
        return None

    try:
        return json.loads(body)
    except json.JSONDecodeError:
        print(f"    ! non-JSON response ({body[:100]!r})", file=sys.stderr)
        return None


def js_round(x):
    """Round half UP, the way JavaScript's Math.round does.

    Python's built-in round() is banker's rounding: round(2.5) is 2, while
    Math.round(2.5) is 3. Every figure here is also computed in the browser by
    static/js/open-web-vectors.js, so using the built-in makes the HTML and the
    live refresh disagree by one whenever a value lands exactly on .5 — which
    for a median over an even-sized corpus is a coin flip, not an edge case.
    The visitor would watch the number change for no reason.
    """
    return math.floor(x + 0.5)


def format_count(n):
    """1234 -> "1,234". Mirrors Number#toLocaleString("en-US")."""
    if n is None or isinstance(n, bool) or not isinstance(n, (int, float)):
        return None
    return f"{int(n):,}"


def format_bytes(value):
    """Binary units labelled GB/MB, matching formatBytes() in both JS files.

    Binary and not decimal so the same corpus is not quoted two different sizes
    on two pages of the same site — the directory prints per-site figures this
    way already.
    """
    if value is None or isinstance(value, bool) or not isinstance(value, (int, float)):
        return None
    if value < 0:
        return None
    if value == 0:
        return "0 B"
    units = ["B", "KB", "MB", "GB", "TB"]
    unit = 0
    v = float(value)
    while v >= 1024 and unit < len(units) - 1:
        v /= 1024
        unit += 1
    rounded = js_round(v) if (v >= 10 or unit == 0) else js_round(v * 10) / 10
    if isinstance(rounded, float) and rounded.is_integer():
        rounded = int(rounded)
    return f"{rounded:,} {units[unit]}"


def tld_of(host):
    last = str(host or "").lower().split(".")[-1]
    return last if last in NAMED_TLDS else "other"


def median_pages(sites):
    """Same algorithm as median() in the JS: even length averages the two
    middles and rounds, so both sides agree on a corpus of even size."""
    values = sorted(
        s.get("pageCount") for s in sites
        if isinstance(s.get("pageCount"), (int, float)) and not isinstance(s.get("pageCount"), bool)
    )
    if not values:
        return None
    mid = len(values) // 2
    if len(values) % 2:
        return values[mid]
    return js_round((values[mid - 1] + values[mid]) / 2)


def join_hosts(hosts):
    """"a, b and c" — the copy reads as a sentence, not a comma list."""
    if len(hosts) <= 1:
        return hosts[0] if hosts else ""
    return ", ".join(hosts[:-1]) + " and " + hosts[-1]


def by_desc(sites, field):
    return sorted(sites, key=lambda s: s.get(field) or 0, reverse=True)


def deepest_fact(sites):
    top = by_desc(sites, "pageCount")[:3]
    if len(top) < 3:
        return None
    hosts = join_hosts([s.get("host", "") for s in top])
    # "run past N" is only worth saying once N is a round number the third site
    # actually clears; early in a crawl it floors to 0 and reads as nonsense.
    floor_k = int((top[2].get("pageCount") or 0) // 1000) * 1000
    if floor_k >= 1000:
        return f"{hosts} run past {format_count(floor_k)} pages each."
    return f"{hosts} are the deepest crawls in the index."


def largest_fact(sites):
    ranked = by_desc(sites, "totalBytes")
    if not ranked:
        return None
    top = ranked[0]
    if not top.get("totalBytes"):
        return None
    return (
        f"{top.get('host', '')} — {format_count(top.get('pageCount'))} pages, and "
        f"{format_bytes(top.get('totalBytes'))} of extracted text: "
        "the densest corpus in the index."
    )


def directory_counts(data):
    """The figures behind the headline, kept separately from the sentence.

    /www-rag/ is published in thirteen languages, and a translated summary
    line puts these numbers in its own word order — so the template needs the
    parts, not just the assembled English sentence. Display-ready strings, for
    the same reason derive() returns strings everywhere else: the template must
    never re-format a figure. `size` is "" when the corpus is too small to be
    worth naming, which is the template's cue to drop that clause entirely.
    """
    total_bytes = data.get("totalBytes")
    size = (
        format_bytes(total_bytes)
        if isinstance(total_bytes, (int, float)) and not isinstance(total_bytes, bool)
        and total_bytes >= MIN_HEADER_BYTES
        else None
    )
    return {
        "sites": format_count(data.get("totalSites")),
        "pages": format_count(data.get("totalPages")),
        "files": format_count(data.get("totalFiles")),
        "chunks": format_count(data.get("totalChunks")),
        "size": size or "",
    }


def directory_headline(data, sites):
    """The one-line summary above the directory grid on /www-rag/, in English.

    Mirrors the string www-rag-directory.js writes into #www-rag-stats,
    including its rule for when the corpus size is worth naming at all. Other
    locales assemble the same figures from directory_counts() through their own
    pattern; this stays the English wording every test pins.
    """
    counts = directory_counts(data)
    line = (
        f"{counts['sites']} curated sites · "
        f"{counts['pages']} pages · "
        f"{counts['files']} files · "
        f"{counts['chunks']} searchable chunks"
    )
    return line + (f" · {counts['size']} indexed" if counts["size"] else "")


def derive(data, measured_on):
    """Everything the templates render, as display-ready strings.

    Strings and not numbers: the template must not re-format anything, or the
    figures would shift under the visitor the moment the live refresh lands.
    """
    sites = data.get("sites") or []
    total = len(sites)

    counts = {key: 0 for key, _ in BUCKETS}
    for site in sites:
        counts[tld_of(site.get("host"))] += 1

    buckets = [
        {
            "key": key,
            "label": label,
            "count": format_count(counts[key]),
            # One decimal, as the JS writes it, so the bar does not visibly
            # twitch when the live refresh re-sets the same widths.
            "width": f"{js_round(counts[key] / total * 1000) / 10:.1f}" if total else "0.0",
        }
        for key, label in BUCKETS
    ]

    public = sum(counts[k] for k in PUBLIC_TLDS)
    endpoints = sum(1 for s in sites if s.get("releaseId"))

    return {
        "measured_at": measured_on.isoformat(),
        "measured_label": f"{measured_on.day} {measured_on.strftime('%B %Y')}",
        "stats": {
            "sites": format_count(data.get("totalSites")),
            "pages": format_count(data.get("totalPages")),
            "chunks": format_count(data.get("totalChunks")),
            "bytes": format_bytes(data.get("totalBytes")),
            "endpoints": format_count(endpoints),
            "median": format_count(median_pages(sites)),
        },
        "composition": {
            "public_share": f"{js_round(public / total * 100)}%" if total else None,
            "buckets": buckets,
        },
        "facts": {
            "deepest": deepest_fact(sites),
            "largest": largest_fact(sites),
        },
        "directory_headline": directory_headline(data, sites),
        "directory_counts": directory_counts(data),
    }


def main():
    print("[open-web-vectors] api:", API_URL)
    data = fetch_json(API_URL)

    if not data or not data.get("sites"):
        # Deliberately not an error exit: the committed measurement is still
        # correctly dated, and the page will say so.
        previous = "none yet"
        if OUT_PATH.exists():
            try:
                previous = json.loads(OUT_PATH.read_text()).get("measured_at", "unknown")
            except (json.JSONDecodeError, OSError):
                previous = "unreadable"
        print(f"  · no usable response — keeping the measurement from {previous}")
        return 0

    derived = derive(data, datetime.date.today())

    before = None
    if OUT_PATH.exists():
        try:
            before = json.loads(OUT_PATH.read_text()).get("stats", {}).get("sites")
        except (json.JSONDecodeError, OSError):
            before = None

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(json.dumps(derived, indent=2, ensure_ascii=False) + "\n")

    moved = f" (was {before})" if before and before != derived["stats"]["sites"] else ""
    print(
        f"  + {derived['stats']['sites']} sites{moved}, "
        f"{derived['stats']['pages']} pages, {derived['stats']['chunks']} chunks, "
        f"{derived['stats']['bytes']} — measured {derived['measured_label']}"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
