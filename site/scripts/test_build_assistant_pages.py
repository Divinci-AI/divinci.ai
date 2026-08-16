#!/usr/bin/env python3
"""Tests for build-assistant-pages.py.

Run: python3 -m unittest discover -s scripts -p 'test_*.py'
(stdlib unittest — deliberately no new dependency for a build-time script.)

The generator decides what appears at divinci.ai/a/<slug>/, so the behaviour
worth pinning is mostly what it REFUSES to do: refuse to publish a thin page,
refuse to escape its own directory, and above all refuse to delete pages when it
could not verify them.
"""

import importlib.util
import pathlib
import sys
import tempfile
import unittest

HERE = pathlib.Path(__file__).resolve().parent


def load_module():
    """Import the hyphenated script by path."""
    spec = importlib.util.spec_from_file_location(
        "build_assistant_pages", HERE / "build-assistant-pages.py"
    )
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


M = load_module()


class TestAllowlistParsing(unittest.TestCase):
    def parse(self, text):
        with tempfile.TemporaryDirectory() as d:
            p = pathlib.Path(d) / "a.toml"
            p.write_text(text, encoding="utf-8")
            return M.parse_allowlist(p)

    def test_parses_blocks(self):
        entries = self.parse(
            '[[assistant]]\nslug = "one"\nrelease_id = "a" * 1\n'
            '[[assistant]]\nslug = "two"\n'
        )
        self.assertEqual(len(entries), 2)
        self.assertEqual(entries[0]["slug"], "one")
        self.assertEqual(entries[1]["slug"], "two")

    def test_ignores_comments_and_blank_lines(self):
        entries = self.parse('# a comment\n\n[[assistant]]\nslug = "one"\n# another\n')
        self.assertEqual(entries, [{"slug": "one"}])

    def test_ignores_keys_before_any_block(self):
        # A stray key with no [[assistant]] above it must not become an entry.
        self.assertEqual(self.parse('slug = "orphan"\n'), [])

    def test_missing_file_is_empty_not_an_error(self):
        # The shipped allowlist is empty on purpose; a missing one must not
        # fail the site build.
        self.assertEqual(M.parse_allowlist(pathlib.Path("/nope/absent.toml")), [])

    def test_strips_quotes_but_keeps_inner_spacing(self):
        entries = self.parse('[[assistant]]\ntitle = "Dr. Fuhrman AI"\n')
        self.assertEqual(entries[0]["title"], "Dr. Fuhrman AI")


class TestValidation(unittest.TestCase):
    """The slug becomes a filename and the id becomes a URL path segment."""

    def test_accepts_a_normal_slug(self):
        self.assertTrue(M.SLUG_RE.match("dr-fuhrman-ai"))

    def test_rejects_path_traversal_and_separators(self):
        # A slug is written as OUT_DIR/<slug>.md, so this is a containment
        # boundary, not a style rule.
        for bad in ["../escape", "a/b", "..", "with space", "Upper", "trailing-"]:
            with self.subTest(bad=bad):
                self.assertIsNone(M.SLUG_RE.match(bad))

    def test_release_id_must_be_an_objectid(self):
        self.assertTrue(M.OBJECTID_RE.match("694473da85a789851dfeead5"))
        for bad in ["", "abc", "694473da85a789851dfeead5x", "../../etc/passwd",
                    "694473DA85A789851DFEEAD5"]:
            with self.subTest(bad=bad):
                self.assertIsNone(M.OBJECTID_RE.match(bad))


class TestHtmlNeutralisation(unittest.TestCase):
    """Zola passes raw HTML in markdown straight through."""

    def test_escapes_the_payloads_that_survived_the_probe(self):
        self.assertEqual(
            M.neutralise_html("<img src=x onerror=alert(1)>"),
            "&lt;img src=x onerror=alert(1)&gt;",
        )
        self.assertEqual(
            M.neutralise_html("<script>alert(2)</script>"),
            "&lt;script&gt;alert(2)&lt;/script&gt;",
        )

    def test_is_a_no_op_on_text_the_api_already_escaped(self):
        # The API escapes at generation now; this layer exists for content
        # stored BEFORE that fix. Escaping "&" here would surface a visible
        # "&amp;lt;" on already-escaped text.
        already = "&lt;script&gt; and &amp; stay put"
        self.assertEqual(M.neutralise_html(already), already)

    def test_leaves_ordinary_prose_untouched(self):
        prose = "Nutrient density per calorie is the organising idea."
        self.assertEqual(M.neutralise_html(prose), prose)


class TestTomlEscaping(unittest.TestCase):
    def test_escapes_quotes_and_backslashes(self):
        self.assertEqual(M.escape_toml('say "hi"'), 'say \\"hi\\"')
        self.assertEqual(M.escape_toml("back\\slash"), "back\\\\slash")

    def test_flattens_newlines_so_front_matter_stays_valid(self):
        # A raw newline inside a TOML basic string breaks the whole file, which
        # would fail the site build rather than just this page.
        self.assertNotIn("\n", M.escape_toml("two\nlines"))


class TestStalePageRemoval(unittest.TestCase):
    """The bug that a network blip would otherwise cause.

    An SSL trust failure made every fetch return None, every entry "skip", and
    the sweep would have deleted every generated page — silently unpublishing
    the whole section with the build still green.
    """

    def setUp(self):
        self._tmp = tempfile.TemporaryDirectory()
        self.out = pathlib.Path(self._tmp.name)
        self._orig_out, M.OUT_DIR = M.OUT_DIR, self.out
        self._orig_fetch = M.fetch_json
        (self.out / "_index.md").write_text("+++\ntitle = \"x\"\n+++\n", encoding="utf-8")

    def tearDown(self):
        M.OUT_DIR = self._orig_out
        M.fetch_json = self._orig_fetch
        self._tmp.cleanup()

    def write_generated(self, slug):
        (self.out / f"{slug}.md").write_text(
            f"+++\ntitle = \"{slug}\"\n[extra]\n{M.GENERATED_MARKER}\n+++\n", encoding="utf-8"
        )

    def allowlist(self, text):
        p = self.out / "allow.toml"
        p.write_text(text, encoding="utf-8")
        return str(p)

    def run_main(self, argv):
        old = sys.argv
        sys.argv = ["build-assistant-pages.py"] + argv
        try:
            return M.main()
        finally:
            sys.argv = old

    def test_KEEPS_a_page_when_the_api_is_unreachable(self):
        self.write_generated("kept-one")
        M.fetch_json = lambda url: None  # every fetch fails
        entry = ('[[assistant]]\nslug = "kept-one"\n'
                 'release_id = "694473da85a789851dfeead5"\n')

        self.run_main(["--allowlist", self.allowlist(entry), "--api", "http://x.test"])

        self.assertTrue((self.out / "kept-one.md").exists(),
                        "an unverifiable page must never be unpublished")

    def test_REMOVES_a_page_that_is_no_longer_allowlisted(self):
        self.write_generated("dropped-one")
        M.fetch_json = lambda url: {"status": "available"}

        self.run_main(["--allowlist", self.allowlist(""), "--api", "http://x.test"])

        self.assertFalse((self.out / "dropped-one.md").exists())

    def test_never_touches_the_section_index(self):
        M.fetch_json = lambda url: {"status": "available"}

        self.run_main(["--allowlist", self.allowlist(""), "--api", "http://x.test"])

        self.assertTrue((self.out / "_index.md").exists())

    def test_never_touches_a_hand_written_page(self):
        # No generated marker => not ours to delete.
        (self.out / "hand-written.md").write_text("+++\ntitle = \"mine\"\n+++\n", encoding="utf-8")
        M.fetch_json = lambda url: {"status": "available"}

        self.run_main(["--allowlist", self.allowlist(""), "--api", "http://x.test"])

        self.assertTrue((self.out / "hand-written.md").exists())


class TestThinPageRefusal(unittest.TestCase):
    def setUp(self):
        self._tmp = tempfile.TemporaryDirectory()
        self.out = pathlib.Path(self._tmp.name)
        self._orig_out, M.OUT_DIR = M.OUT_DIR, self.out
        self._orig_fetch = M.fetch_json

    def tearDown(self):
        M.OUT_DIR = self._orig_out
        M.fetch_json = self._orig_fetch
        self._tmp.cleanup()

    def run_with(self, faq):
        def fetch(url):
            if url.endswith("/seo-content"):
                return {"heading": "H", "faq": faq}
            return {"status": "available"}
        M.fetch_json = fetch
        p = self.out / "allow.toml"
        p.write_text('[[assistant]]\nslug = "s"\n'
                     'release_id = "694473da85a789851dfeead5"\n', encoding="utf-8")
        old = sys.argv
        sys.argv = ["x", "--allowlist", str(p), "--api", "http://x.test"]
        try:
            M.main()
        finally:
            sys.argv = old
        return (self.out / "s.md").exists()

    def test_refuses_below_the_substance_floor(self):
        # A page carrying a title and one Q&A is a thin page, and a directory of
        # them is what a search engine is built to discount.
        pairs = [{"question": f"Q{i}", "answer": f"A{i}"} for i in range(M.MIN_ENTRIES - 1)]
        self.assertFalse(self.run_with(pairs))

    def test_writes_at_the_floor(self):
        pairs = [{"question": f"Q{i}", "answer": f"A{i}"} for i in range(M.MIN_ENTRIES)]
        self.assertTrue(self.run_with(pairs))

    def test_refuses_when_nothing_is_published(self):
        self.assertFalse(self.run_with([]))


if __name__ == "__main__":
    unittest.main()
