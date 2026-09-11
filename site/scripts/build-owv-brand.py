#!/usr/bin/env python3
"""Generate the Open Web Vector Initiative brand assets.

Writes static/brand/open-web-vectors/*.svg from one set of geometry, so the
nav thumb, the page eyebrows, the GitHub README and the Hugging Face dataset
cards all carry the SAME mark rather than four hand-drawn approximations of it.

The mark — "the retrieval layer over the web":
  a globe seen from the pole (outer ring = equator, six meridians, one
  latitude ring) with an indexed site sitting at every meridian/latitude
  crossing, and the pole itself. The six crossings sit at exactly the six
  seed-of-life circle centres the /open-web-vectors/ hero orbit is drawn
  from, so the icon is the hero's geometry at 22px.

Wordmark text is converted to outlines (Fraunces 600 / Source Sans 3 600), so
the lockups render identically on GitHub and Hugging Face, where neither font
is installed. Fonts are fetched to a scratch dir at build time:

    python3 scripts/build-owv-brand.py --fonts /path/to/fonts

needs  Fraunces.ttf  (variable, from github.com/undercasetype/Fraunces)  and
       SourceSans3-600.woff2  (Google Fonts latin subset)  in that dir, plus
`pip install fonttools brotli uharfbuzz` on PYTHONPATH.

PNG exports (for README/HF, where an SVG lockup cannot be styled per theme)
are rendered afterwards by scripts/render-owv-brand.mjs with Playwright.
"""
import argparse, math, os, pathlib, sys

# ── Palette ────────────────────────────────────────────────────────────────
# The OWV pages share the /www-rag/ palette: navy #0b0b14→#1f1f3a bands,
# indigo #6d6dbf linework, gold #d9c49a for the one accent (the same gold as
# the "Browse the directory" button and the ◆ that used to stand in for this
# mark). On light surfaces the indigo deepens and the gold darkens for contrast.
DARK = dict(line="#8d8de3", node="#d9c49a", text="#ffffff", sub="#b3b3d1")
LIGHT = dict(line="#4a45b8", node="#a8865a", text="#1f1f3a", sub="#5c5c7c")

# ── Mark geometry (64 × 64 box) ─────────────────────────────────────────────
C = 32.0
R_OUTER = 27.0
R_LAT = 14.5
R_NODE = 3.6
R_POLE = 4.0
# Meridians at 90° + 60°k: nodes at top and bottom, matching the hero orbit's
# circle centres (200,130), (260.6,165) … which are the same six angles.
ANGLES = [90 + 60 * k for k in range(6)]


def pt(r, deg):
    a = math.radians(deg)
    return (C + r * math.cos(a), C - r * math.sin(a))


def fmt(v):
    return f"{v:.2f}".rstrip("0").rstrip(".")


def mark_body(line, node, sw_outer=3.0, sw_inner=2.2):
    """The mark's drawing, in a 64×64 box, with explicit colours."""
    out = []
    out.append(f'<circle cx="{C}" cy="{C}" r="{R_OUTER}" fill="none" stroke="{line}" stroke-width="{sw_outer}"/>')
    out.append(f'<circle cx="{C}" cy="{C}" r="{R_LAT}" fill="none" stroke="{line}" stroke-width="{sw_inner}"/>')
    spokes = " ".join(f"M{C} {C}L{fmt(x)} {fmt(y)}" for x, y in (pt(R_OUTER, a) for a in ANGLES))
    out.append(f'<path d="{spokes}" fill="none" stroke="{line}" stroke-width="{sw_inner}" stroke-linecap="round"/>')
    for a in ANGLES:
        x, y = pt(R_LAT, a)
        out.append(f'<circle cx="{fmt(x)}" cy="{fmt(y)}" r="{R_NODE}" fill="{node}"/>')
    out.append(f'<circle cx="{C}" cy="{C}" r="{R_POLE}" fill="{node}"/>')
    return "\n  ".join(out)


def svg(width, height, body, viewbox=None, title="The Open Web Vector Initiative", extra_attrs=""):
    vb = viewbox or f"0 0 {width} {height}"
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" width="{width}" height="{height}" '
        f'role="img" aria-label="{title}"{extra_attrs}>\n  <title>{title}</title>\n  {body}\n</svg>\n'
    )


# ── Text → outlines ─────────────────────────────────────────────────────────
def text_path(font_path, text, size, variations=None, letter_spacing_em=0.0, features=None):
    """Shape `text` with HarfBuzz and return (svg_path_d, advance_width) at `size` px,
    baseline at y=0, left edge at x=0. letter_spacing_em is added after every glyph."""
    import uharfbuzz as hb
    from fontTools.pens.svgPathPen import SVGPathPen
    from fontTools.pens.transformPen import TransformPen

    font_path = pathlib.Path(font_path)
    if font_path.suffix == ".woff2":
        # HarfBuzz reads raw sfnt only, so a woff2 is decompressed once beside itself.
        ttf = font_path.with_suffix(".ttf")
        if not ttf.exists():
            from fontTools.ttLib import TTFont
            t = TTFont(str(font_path)); t.flavor = None; t.save(str(ttf))
        font_path = ttf
    blob = hb.Blob.from_file_path(str(font_path))
    face = hb.Face(blob)
    font = hb.Font(face)
    if variations:
        font.set_variations(variations)
    upem = face.upem
    scale = size / upem
    buf = hb.Buffer()
    buf.add_str(text)
    buf.guess_segment_properties()
    hb.shape(font, buf, features or {"kern": True, "liga": True})
    x = 0.0
    parts = []
    spacing = letter_spacing_em * size
    for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
        pen = SVGPathPen(None, ntos=lambda v: fmt(v))
        tpen = TransformPen(pen, (scale, 0, 0, -scale, x + pos.x_offset * scale, -pos.y_offset * scale))
        font.draw_glyph_with_pen(info.codepoint, tpen)
        d = pen.getCommands()
        if d:
            parts.append(d)
        x += pos.x_advance * scale + spacing
    # Drop the trailing letter-spacing so the measured width is the ink+advance width.
    return " ".join(parts), x - spacing


def wordmark(fonts, pal, x0, y_base, title_size=34.0, sub_size=12.5, sub_gap=None):
    """'Open Web Vectors' (Fraunces) with 'INITIATIVE' (Source Sans 3, tracked caps)
    beneath. Returns (svg_fragment, width, top_y, bottom_y) — top is the title's
    cap height above the baseline, bottom the sub line's baseline."""
    fraunces = pathlib.Path(fonts) / "Fraunces.ttf"
    sans = pathlib.Path(fonts) / "SourceSans3-600.woff2"
    d1, w1 = text_path(fraunces, "Open Web Vectors", title_size,
                       variations={"wght": 600, "opsz": 48, "SOFT": 0, "WONK": 0})
    d2, w2 = text_path(sans, "INITIATIVE", sub_size, letter_spacing_em=0.22)
    cap = 0.70 * title_size           # Fraunces cap height ≈ 0.70 em
    gap = sub_gap if sub_gap is not None else 0.42 * title_size
    y_sub = y_base + gap
    frag = (
        f'<path transform="translate({fmt(x0)} {fmt(y_base)})" d="{d1}" fill="{pal["text"]}"/>\n'
        f'  <path transform="translate({fmt(x0 + 1.5)} {fmt(y_sub)})" d="{d2}" fill="{pal["sub"]}"/>'
    )
    return frag, max(w1, w2), y_base - cap, y_sub


def build(out, fonts):
    out = pathlib.Path(out)
    out.mkdir(parents=True, exist_ok=True)
    files = {}

    # 1. Monochrome mark: currentColor, for inline use (nav thumb, eyebrows).
    files["owv-mark.svg"] = svg(64, 64, mark_body("currentColor", "currentColor"), extra_attrs=' fill="currentColor"')
    # 2. Two-tone marks for dark and light surfaces.
    files["owv-mark-dark.svg"] = svg(64, 64, mark_body(DARK["line"], DARK["node"]))
    files["owv-mark-light.svg"] = svg(64, 64, mark_body(LIGHT["line"], LIGHT["node"]))

    if fonts:
        for name, pal in (("dark", DARK), ("light", LIGHT)):
            # Horizontal lockup: mark at left, two text lines to its right,
            # the text block centred on the mark's vertical axis.
            mark_size = 64.0
            gap = 18.0
            title_size = 34.0
            # First pass to measure, then place the text block centred on the mark.
            frag, w, top, bottom = wordmark(fonts, pal, mark_size + gap, 0, title_size)
            block_h = bottom - top
            y_base = (mark_size - block_h) / 2 - top
            frag, w, top, bottom = wordmark(fonts, pal, mark_size + gap, y_base, title_size)
            width = mark_size + gap + w + 2
            body = f'<g>\n  {mark_body(pal["line"], pal["node"])}\n  </g>\n  {frag}'
            files[f"owv-logo-{name}.svg"] = svg(fmt(width), 64, body, viewbox=f"0 0 {fmt(width)} 64")

            # Stacked lockup: mark above centred text, for square placements.
            mark_size = 96.0
            title_size = 30.0
            frag, w, top, bottom = wordmark(fonts, pal, 0, 0, title_size, sub_size=11.5)
            width = max(w, mark_size) + 8
            x_text = (width - w) / 2
            y_base = mark_size + 14 - top + 0  # 14 units of air under the mark
            frag, w, top, bottom = wordmark(fonts, pal, x_text, y_base, title_size, sub_size=11.5)
            height = bottom + 4
            mark_x = (width - mark_size) / 2
            body = (
                f'<g transform="translate({fmt(mark_x)} 0) scale({fmt(mark_size / 64)})">\n  '
                f'{mark_body(pal["line"], pal["node"])}\n  </g>\n  {frag}'
            )
            files[f"owv-logo-stacked-{name}.svg"] = svg(fmt(width), fmt(height), body, viewbox=f"0 0 {fmt(width)} {fmt(height)}")

    # 3. Tera partial: the mono mark with class hooks, so a page can colour the
    #    nodes separately (gold) while the linework follows currentColor.
    partial = (
        "{#- Generated by scripts/build-owv-brand.py — edit the geometry there, not here. -#}\n"
        '<svg class="owv-mark" viewBox="0 0 64 64" aria-hidden="true" focusable="false">\n  '
        + mark_body("currentColor", "currentColor").replace('fill="currentColor"/>', 'fill="currentColor" class="owv-mark-node"/>')
        + "\n</svg>\n"
    )
    partial_path = out.parent.parent.parent / "templates/partials/owv-mark.html"
    partial_path.write_text(partial)
    print(f"wrote {partial_path}")

    # 4. Banner: the dark lockup on its own navy plate, for READMEs and dataset
    #    cards where the page theme is unknown and <picture> may be stripped.
    if fonts:
        lock = files["owv-logo-dark.svg"]
        import re
        vb = re.search(r'viewBox="0 0 ([\d.]+) 64"', lock).group(1)
        inner = lock.split("</title>\n", 1)[1].rsplit("</svg>", 1)[0]
        pad_x, pad_y = 36, 28
        W, H = float(vb) + 2 * pad_x, 64 + 2 * pad_y
        body = (
            f'<rect width="{fmt(W)}" height="{fmt(H)}" rx="18" fill="url(#owv-plate)"/>\n  '
            f'<defs><linearGradient id="owv-plate" x1="0" y1="0" x2="1" y2="1">'
            f'<stop offset="0" stop-color="#0b0b14"/><stop offset="1" stop-color="#1f1f3a"/></linearGradient></defs>\n  '
            f'<g transform="translate({pad_x} {pad_y})">{inner}</g>'
        )
        files["owv-banner.svg"] = svg(fmt(W), fmt(H), body, viewbox=f"0 0 {fmt(W)} {fmt(H)}")

    for name, content in files.items():
        (out / name).write_text(content)
        print(f"wrote {out / name}  ({len(content)} bytes)")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=str(pathlib.Path(__file__).resolve().parent.parent / "static/brand/open-web-vectors"))
    ap.add_argument("--fonts", help="dir holding Fraunces.ttf and SourceSans3-600.woff2 (omit to write marks only)")
    args = ap.parse_args()
    build(args.out, args.fonts)
