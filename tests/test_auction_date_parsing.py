"""Shared auction date-label parsing.

Five calendar scrapers each grew their own MONTHS dict and
parse_date_range(). The shapes overlap just enough to look
interchangeable while differing exactly where they break — so this
pins the real label text from every house against one parser before
any of them migrate onto it.

Every string below is copied from live markup, not invented.
"""
import datetime as dt

import pytest

from scraper_lib import parse_auction_date_range as p


# --- Antiquorum: month-first, ordinal suffixes, comma before year ---------

@pytest.mark.parametrize("label,expected", [
    ("May 9th -10th, 2026",     ("2026-05-09", "2026-05-10")),
    ("November 7th -8th, 2026", ("2026-11-07", "2026-11-08")),
    ("May 31st, 2026",          ("2026-05-31", "2026-05-31")),
    ("April 23, 2026",          ("2026-04-23", "2026-04-23")),
])
def test_antiquorum_shapes(label, expected):
    assert p(label) == expected


# --- Bonhams: day-first, NO year printed anywhere on the page ------------

@pytest.mark.parametrize("label,expected", [
    ("18 - 28 May",     ("2026-05-18", "2026-05-28")),
    ("20 May",          ("2026-05-20", "2026-05-20")),
    ("28 April - 5 May", ("2026-04-28", "2026-05-05")),
    ("26 June - 8 July", ("2026-06-26", "2026-07-08")),
])
def test_bonhams_shapes_with_fallback_year(label, expected):
    assert p(label, fallback_year=2026) == expected


def test_year_falls_back_to_today_when_absent():
    got = p("20 May", today=dt.date(2027, 3, 1))
    assert got == ("2027-05-20", "2027-05-20")


def test_range_crossing_december_rolls_into_next_year():
    """Bonhams prints no year, so a Dec->Jan range must not end before
    it starts."""
    assert p("26 December - 8 January", fallback_year=2026) == (
        "2026-12-26", "2027-01-08")


# --- Phillips: day-first with year; online sales embed times + tz --------

@pytest.mark.parametrize("label,expected", [
    ("7 – 8 November 2026", ("2026-11-07", "2026-11-08")),
    ("5 - 6 December 2026", ("2026-12-05", "2026-12-06")),
    ("4 September 12pm - 11 September 2pm CEST 2026",
     ("2026-09-04", "2026-09-11")),
    ("1 October 12pm - 9 October 12pm ET 2026",
     ("2026-10-01", "2026-10-09")),
    ("17 September 12pm - 24 September 2pm HKT 2026",
     ("2026-09-17", "2026-09-24")),
])
def test_phillips_shapes(label, expected):
    assert p(label) == expected


def test_leading_bare_day_is_not_dropped():
    """The regression that prompted the extraction.

    "7 - 8 November" attaches no month to the leading day. A naive
    day+month scan sees only "8 November" and reports a one-day sale,
    silently halving every Phillips live auction.
    """
    start, end = p("7 - 8 November 2026")
    assert (start, end) == ("2026-11-07", "2026-11-08")
    assert start != end


# --- Monaco Legend: entity soup in a single real cell --------------------

def test_monaco_entity_and_nbsp_soup():
    """Real markup: en-dash entity + word-joiner + two nbsp, one cell."""
    assert p("25 &#8211;&#8288;\xa026\xa0April 2026") == (
        "2026-04-25", "2026-04-26")


def test_monaco_single_day_with_nbsp():
    assert p("25\xa0July 2026") == ("2026-07-25", "2026-07-25")


# --- Sotheby's: day-first, explicit year, cross-month ---------------------

@pytest.mark.parametrize("label,expected", [
    ("9 - 10 May 2026",       ("2026-05-09", "2026-05-10")),
    ("27 October - 10 November 2026", ("2026-10-27", "2026-11-10")),
    ("8 November 2026",       ("2026-11-08", "2026-11-08")),
])
def test_sothebys_shapes(label, expected):
    assert p(label) == expected


# --- abbreviations + separators ------------------------------------------

@pytest.mark.parametrize("label", ["10 Sept 2026", "10 Sep 2026"])
def test_month_abbreviations(label):
    assert p(label) == ("2026-09-10", "2026-09-10")


@pytest.mark.parametrize("dash", ["-", "–", "—", "‑"])
def test_all_dash_variants(dash):
    assert p(f"7 {dash} 8 November 2026") == ("2026-11-07", "2026-11-08")


# --- rejection: must return (None, None), never a wrong date -------------

@pytest.mark.parametrize("label", [
    "", "   ", None,
    "Our next auction is being curated",
    "Coming soon",
    "November",                 # month with no day
    "32 November 2026",         # impossible day
    "30 February 2026",         # impossible date
])
def test_unparseable_returns_none(label):
    assert p(label) == (None, None)


def test_never_returns_end_before_start():
    """Guard the whole grammar: any label that parses must be ordered."""
    labels = [
        "18 - 28 May", "28 April - 5 May", "26 December - 8 January",
        "May 9th -10th, 2026", "7 – 8 November 2026",
        "4 September 12pm - 11 September 2pm CEST 2026",
        "27 October - 10 November 2026", "25\xa0July 2026",
    ]
    for label in labels:
        start, end = p(label, fallback_year=2026)
        assert start and end, label
        assert start <= end, f"{label} -> {start}..{end}"
