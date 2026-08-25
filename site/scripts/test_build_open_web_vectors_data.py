#!/usr/bin/env python3
"""Tests for build-open-web-vectors-data.py.

The figures on /open-web-vectors/ are derived TWICE: here in Python at build
time, for the HTML that non-JavaScript readers and answer-engine crawlers get,
and again in static/js/open-web-vectors.js at runtime, for the live refresh.
If those two disagree the numbers visibly jump when the page finishes loading,
and the fallback stops being a fallback and starts being a second, wrong
answer.

So both are asserted against ONE fixture — tests/fixtures/www-rag-directory.json
— with the SAME expected strings. tests/unit/open-web-vectors.test.js pins the
JavaScript side to "9" / "3,634" / "196 MB" / "44%" / "7"; this pins Python to
exactly those. Changing either implementation without the other turns one of
the two suites red instead of shipping a mismatch.

Run with: npm run test:generators  (part of npm run test:guards)
"""

import datetime
import importlib.util
import json
import pathlib
import unittest

HERE = pathlib.Path(__file__).resolve().parent
FIXTURE = HERE.parent / "tests" / "fixtures" / "www-rag-directory.json"

_spec = importlib.util.spec_from_file_location(
    "build_open_web_vectors_data", HERE / "build-open-web-vectors-data.py"
)
owv = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(owv)

MEASURED_ON = datetime.date(2026, 8, 18)


def load_fixture():
    return json.loads(FIXTURE.read_text())


class FormattingMatchesTheBrowser(unittest.TestCase):
    """Every one of these has a mirror-image assertion in the jest suite."""

    def test_counts_are_grouped_like_toLocaleString(self):
        self.assertEqual(owv.format_count(3634), "3,634")
        self.assertEqual(owv.format_count(0), "0")
        self.assertEqual(owv.format_count(1107912), "1,107,912")

    def test_an_unmeasured_count_is_not_zero(self):
        # "unknown" and "zero" are different facts; the templates skip None.
        self.assertIsNone(owv.format_count(None))
        self.assertIsNone(owv.format_bytes(None))

    def test_bytes_use_binary_units_labelled_GB(self):
        # Binary so the same corpus is not quoted two sizes on two pages.
        self.assertEqual(owv.format_bytes(206003372), "196 MB")
        self.assertEqual(owv.format_bytes(200000000), "191 MB")
        self.assertEqual(owv.format_bytes(0), "0 B")
        self.assertEqual(owv.format_bytes(1024), "1 KB")

    def test_bytes_keep_one_decimal_only_below_ten(self):
        self.assertEqual(owv.format_bytes(1536), "1.5 KB")
        self.assertEqual(owv.format_bytes(15 * 1024), "15 KB")

    def test_a_negative_size_is_not_rendered(self):
        self.assertIsNone(owv.format_bytes(-1))


class BucketingMatchesTheBrowser(unittest.TestCase):
    def test_only_com_org_gov_edu_are_named(self):
        self.assertEqual(owv.tld_of("beta.org"), "org")
        self.assertEqual(owv.tld_of("ALPHA.GOV"), "gov")
        # .io is NOT a bucket on this page, unlike the directory's filter.
        self.assertEqual(owv.tld_of("epsilon.io"), "other")
        self.assertEqual(owv.tld_of("theta.example.museum"), "other")
        self.assertEqual(owv.tld_of("constructor"), "other")
        self.assertEqual(owv.tld_of(None), "other")


class MedianMatchesTheBrowser(unittest.TestCase):
    def test_odd_length_takes_the_middle(self):
        sites = load_fixture()["sites"]
        self.assertEqual(len(sites), 9)
        self.assertEqual(owv.median_pages(sites), 7)

    def test_even_length_averages_the_two_middles(self):
        # 2.5 must round to 3, as Math.round does. Python's built-in round()
        # is banker's rounding and returns 2, which would have put a different
        # median in the HTML than the live refresh writes over it.
        sites = [{"pageCount": n} for n in (1, 2, 3, 4)]
        self.assertEqual(owv.median_pages(sites), 3)

    def test_half_values_round_up_everywhere_not_to_even(self):
        self.assertEqual(owv.js_round(2.5), 3)
        self.assertEqual(owv.js_round(3.5), 4)   # round() would give 4 too
        self.assertEqual(owv.js_round(4.5), 5)   # …but round() gives 4 here
        self.assertEqual(owv.js_round(-2.5), -2)  # Math.round rounds toward +inf

    def test_sites_with_no_page_count_are_skipped_not_counted_as_zero(self):
        sites = [{"pageCount": 10}, {"pageCount": None}, {"pageCount": 20}]
        self.assertEqual(owv.median_pages(sites), 15)

    def test_an_empty_corpus_has_no_median(self):
        self.assertIsNone(owv.median_pages([]))


class FactsMatchTheBrowser(unittest.TestCase):
    def test_deepest_names_the_three_deepest(self):
        derived = owv.derive(load_fixture(), MEASURED_ON)
        self.assertIn("epsilon.io, alpha.gov and beta.org", derived["facts"]["deepest"])

    def test_deepest_never_claims_past_zero_pages(self):
        # The fixture's third-deepest has 100 pages, which floors to zero.
        derived = owv.derive(load_fixture(), MEASURED_ON)
        self.assertNotIn("past 0 pages", derived["facts"]["deepest"])
        self.assertTrue(derived["facts"]["deepest"].endswith("are the deepest crawls in the index."))

    def test_deepest_uses_the_round_number_once_it_is_earned(self):
        payload = load_fixture()
        for site in payload["sites"]:
            if site["host"] in ("epsilon.io", "alpha.gov", "beta.org"):
                site["pageCount"] = 4200
        derived = owv.derive(payload, MEASURED_ON)
        self.assertIn("run past 4,000 pages each.", derived["facts"]["deepest"])

    def test_largest_is_ranked_by_text_not_by_pages(self):
        derived = owv.derive(load_fixture(), MEASURED_ON)
        largest = derived["facts"]["largest"]
        self.assertIn("epsilon.io", largest)
        self.assertIn("3,000 pages", largest)
        self.assertIn("191 MB", largest)

    def test_a_corpus_with_no_measured_bytes_has_no_largest(self):
        payload = load_fixture()
        for site in payload["sites"]:
            site["totalBytes"] = None
        self.assertIsNone(owv.derive(payload, MEASURED_ON)["facts"]["largest"])


class DerivedPayload(unittest.TestCase):
    def setUp(self):
        self.derived = owv.derive(load_fixture(), MEASURED_ON)

    def test_headline_stats_match_the_jest_expectations(self):
        self.assertEqual(self.derived["stats"], {
            "sites": "9",
            "pages": "3,634",
            "chunks": "54,975",
            "bytes": "196 MB",
            "endpoints": "8",   # delta.com has no releaseId
            "median": "7",
        })

    def test_composition_matches_the_jest_expectations(self):
        buckets = {b["key"]: b for b in self.derived["composition"]["buckets"]}
        self.assertEqual(buckets["org"]["count"], "2")
        self.assertEqual(buckets["com"]["count"], "2")
        self.assertEqual(buckets["gov"]["count"], "1")
        self.assertEqual(buckets["edu"]["count"], "1")
        self.assertEqual(buckets["other"]["count"], "3")
        self.assertEqual(buckets["org"]["width"], "22.2")
        self.assertEqual(buckets["gov"]["width"], "11.1")
        self.assertEqual(self.derived["composition"]["public_share"], "44%")

    def test_bucket_widths_total_one_hundred_percent(self):
        total = sum(float(b["width"]) for b in self.derived["composition"]["buckets"])
        self.assertEqual(round(total), 100)

    def test_buckets_are_emitted_in_bar_order(self):
        keys = [b["key"] for b in self.derived["composition"]["buckets"]]
        self.assertEqual(keys, ["org", "gov", "edu", "com", "other"])

    def test_the_measurement_carries_its_own_date(self):
        # The date is what makes a stale fallback honest rather than a lie, so
        # it ships in the same object as the numbers and cannot drift from them.
        self.assertEqual(self.derived["measured_at"], "2026-08-18")
        self.assertEqual(self.derived["measured_label"], "18 August 2026")

    def test_directory_headline_mirrors_the_widget(self):
        self.assertEqual(
            self.derived["directory_headline"],
            "9 curated sites · 3,634 pages · 16 files · 54,975 searchable chunks",
        )

    def test_directory_counts_carry_the_same_figures_as_the_headline(self):
        # The translated locales assemble their own sentence from these, so a
        # count that drifts from the headline would show a different corpus
        # depending on which language you read the page in.
        counts = self.derived["directory_counts"]
        self.assertEqual(counts["sites"], "9")
        self.assertEqual(counts["pages"], "3,634")
        self.assertEqual(counts["files"], "16")
        self.assertEqual(counts["chunks"], "54,975")
        for figure in counts.values():
            if figure:
                self.assertIn(figure, self.derived["directory_headline"])

    def test_directory_counts_leave_size_empty_below_the_floor(self):
        # "" and not None: the template tests it for truthiness to decide
        # whether the "N GB indexed" clause exists at all.
        self.assertEqual(self.derived["directory_counts"]["size"], "")

    def test_directory_counts_name_a_size_once_it_is_large(self):
        payload = load_fixture()
        payload["totalBytes"] = 200 * 1024 * 1024 * 1024
        derived = owv.derive(payload, MEASURED_ON)
        self.assertEqual(derived["directory_counts"]["size"], "200 GB")

    def test_directory_headline_omits_a_corpus_size_below_the_floor(self):
        # Same display threshold as the widget: ~1 GB undersells 1.1M chunks.
        self.assertNotIn("indexed", self.derived["directory_headline"])

    def test_directory_headline_names_a_size_once_it_is_large(self):
        payload = load_fixture()
        payload["totalBytes"] = 200 * 1024 * 1024 * 1024
        self.assertIn("200 GB indexed", owv.derive(payload, MEASURED_ON)["directory_headline"])

    def test_an_empty_corpus_does_not_divide_by_zero(self):
        empty = {"sites": [], "totalSites": 0, "totalPages": 0, "totalChunks": 0, "totalBytes": 0}
        derived = owv.derive(empty, MEASURED_ON)
        self.assertIsNone(derived["composition"]["public_share"])
        self.assertIsNone(derived["facts"]["deepest"])


class Resilience(unittest.TestCase):
    def test_a_failed_fetch_returns_none_rather_than_raising(self):
        # main() treats None as "keep the last measurement"; the build must not
        # die, and the page will still be correctly dated.
        self.assertIsNone(owv.fetch_json("https://127.0.0.1:9/nope"))


if __name__ == "__main__":
    unittest.main()
