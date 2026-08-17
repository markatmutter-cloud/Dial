"""
Opt-in helpers shared across per-source scrapers.

Per CLAUDE.md: the per-dealer scraper file model is intentional — each
site has its own quirks (Bulang collection-scoping, Falco's
nonstandard fields, etc.) and a one-driver-fits-all model has been
explicitly rejected. These helpers exist for the boilerplate that
genuinely IS identical across sources (retrying transient 5xx, etc.)
without coercing scrapers into a uniform shape.

Use directly; don't subclass.
"""
from __future__ import annotations

import datetime as _dt
import html
import re
import time

import requests


def fetch_json_with_retry(
    url: str,
    *,
    params: dict | None = None,
    headers: dict | None = None,
    timeout: int = 20,
    retries: int = 3,
    backoff_base: int = 2,
) -> dict | list:
    """
    GET a URL and return parsed JSON. Retries on 5xx responses and
    network errors with exponential backoff (`backoff_base ** attempt`
    seconds between attempts). 4xx responses raise immediately — those
    are permanent and retrying won't help.

    Reference call site that originally motivated this: Falco Watches'
    products.json pagination (PR #530 hotfix). Apply at high-blast-
    radius fetch sites — pagination loops, full-catalog endpoints —
    where a single transient failure would otherwise zero out the
    source's data for the run and mark every previously-tracked item
    as sold via merge.py's disappearance logic.
    """
    last_exc: Exception | None = None
    for attempt in range(retries + 1):
        try:
            r = requests.get(url, params=params, headers=headers, timeout=timeout)
            # 4xx (auth / not-found / rate-limit) is permanent — raise now
            # so we don't waste retries. 5xx falls through to retry path.
            if 400 <= r.status_code < 500:
                r.raise_for_status()
            r.raise_for_status()
            return r.json()
        except requests.HTTPError as e:
            last_exc = e
            status = e.response.status_code if e.response is not None else 0
            if status and status < 500:
                raise
            print(f"  retry {attempt + 1}/{retries} after HTTP {status} on {url}")
        except requests.RequestException as e:
            last_exc = e
            print(f"  retry {attempt + 1}/{retries} after network error on {url}: {e}")
        if attempt < retries:
            time.sleep(backoff_base ** attempt)
    raise last_exc  # type: ignore[misc]


# ---------------------------------------------------------------------------
# Auction date-label parsing
# ---------------------------------------------------------------------------
# Five auction-calendar scrapers each grew their own MONTHS dict and their
# own parse_date_range(). That duplication is not harmless: the shapes
# overlap just enough to look interchangeable while differing in exactly
# the places that break. The bug that prompted this — "7 - 8 November
# 2026" parsed as a ONE-day sale, because the leading day carries no month
# of its own and a naive day+month scan sees only "8 November".
#
# This qualifies under the CLAUDE.md rule for scraper_lib: genuinely
# identical boilerplate, not a config-driven driver. Per-house quirks stay
# in the per-house files; only the date grammar is shared.
#
# The union of shapes actually observed across the houses:
#
#   Antiquorum     "May 9th -10th, 2026"   month-first, ordinals, comma
#                  "April 23, 2026"
#   Bonhams        "28 April - 5 May"      day-first, NO year, can wrap
#                  "18 - 28 May" / "20 May"     Dec->Jan
#   Sotheby's      "9 - 10 May 2026"       day-first with year
#   Monaco Legend  "25 - 26 April 2026"    day-first with year
#   Phillips       "7 - 8 November 2026"   day-first with year
#                  "4 September 12pm - 11 September 2pm CEST 2026"

MONTH_NAMES = {
    "january": 1, "february": 2, "march": 3, "april": 4, "may": 5,
    "june": 6, "july": 7, "august": 8, "september": 9, "october": 10,
    "november": 11, "december": 12,
    # Abbreviations — Bonhams and Marteau both emit them in places.
    "jan": 1, "feb": 2, "mar": 3, "apr": 4, "jun": 6, "jul": 7,
    "aug": 8, "sep": 9, "sept": 9, "oct": 10, "nov": 11, "dec": 12,
}

# Timezone tokens that appear mid-label and must not be mistaken for
# month names or stray numbers.
_TZ_RE = re.compile(
    r"\b(CEST|CET|BST|GMT|UTC|HKT|JST|SGT|EST|EDT|ET|PST|PDT|PT|CST|CDT)\b",
    re.IGNORECASE,
)
_TIME_RE = re.compile(r"\b\d{1,2}(?::\d{2})?\s*(?:am|pm)\b", re.IGNORECASE)
_ORDINAL_RE = re.compile(r"(\d{1,2})(?:st|nd|rd|th)\b", re.IGNORECASE)
_YEAR_RE = re.compile(r"\b((?:19|20)\d{2})\b")


def normalise_date_label(label: str) -> str:
    """Strip the noise every house wraps its dates in.

    Entities and exotic spaces are load-bearing here: Monaco Legend's
    real markup contains "25 &#8211;&#8288;\xa026\xa0April 2026" — an
    en-dash entity, a word-joiner, and two non-breaking spaces in one
    cell. Phillips embeds times and timezones mid-range.
    """
    t = html.unescape(label or "")
    for dash in ("‐", "‑", "‒", "–", "—", "―"):
        t = t.replace(dash, "-")
    t = t.replace("⁠", " ").replace("\xa0", " ").replace("​", " ")
    t = _TIME_RE.sub(" ", t)
    t = _TZ_RE.sub(" ", t)
    t = _ORDINAL_RE.sub(r"\1", t)
    t = t.replace(",", " ")
    return re.sub(r"\s+", " ", t).strip()


def parse_auction_date_range(label, fallback_year=None, today=None):
    """Parse an auction date label -> (start_iso, end_iso), or (None, None).

    `fallback_year` covers Bonhams, whose landing page prints no year at
    all. When a range crosses a month boundary backwards (e.g.
    "26 December - 8 January") the end is rolled into the next year.
    """
    t = normalise_date_label(label)
    if not t:
        return (None, None)

    ym = _YEAR_RE.search(t)
    if ym:
        year = int(ym.group(1))
        t = (t[: ym.start()] + " " + t[ym.end():]).strip()
    else:
        year = fallback_year or (today or _dt.date.today()).year

    def _month(word):
        return MONTH_NAMES.get(word.lower())

    def _build(y1, mo1, d1, y2, mo2, d2):
        try:
            return (_dt.date(y1, mo1, d1).isoformat(),
                    _dt.date(y2, mo2, d2).isoformat())
        except ValueError:
            return (None, None)

    # Shape 1: "D - D Month" — one month shared by both days. Must be
    # tried FIRST; the leading day has no month attached, so the generic
    # scan below would see only the second pair and collapse the range.
    m = re.match(r"^(\d{1,2})\s*-\s*(\d{1,2})\s+([A-Za-z]+)\b", t)
    if m and _month(m.group(3)):
        mo = _month(m.group(3))
        return _build(year, mo, int(m.group(1)), year, mo, int(m.group(2)))

    # Shape 2: "Month D - D" — Antiquorum's order, same idea mirrored.
    m = re.match(r"^([A-Za-z]+)\s+(\d{1,2})\s*-\s*(\d{1,2})\b", t)
    if m and _month(m.group(1)):
        mo = _month(m.group(1))
        return _build(year, mo, int(m.group(2)), year, mo, int(m.group(3)))

    # Shape 3: general scan for (day, month) pairs in either order. Covers
    # single days and cross-month ranges, including Phillips' labels that
    # repeat the month on both sides.
    pairs = []
    for pm in re.finditer(r"\b(\d{1,2})\s+([A-Za-z]+)\b|\b([A-Za-z]+)\s+(\d{1,2})\b", t):
        if pm.group(1):
            day, mo = int(pm.group(1)), _month(pm.group(2))
        else:
            day, mo = int(pm.group(4)), _month(pm.group(3))
        if mo:
            pairs.append((day, mo))
    if not pairs:
        return (None, None)

    d1, mo1 = pairs[0]
    d2, mo2 = pairs[-1]
    # A backwards month boundary means the range crosses into next year
    # (Bonhams' "26 December - 8 January").
    y2 = year if mo2 >= mo1 else year + 1
    return _build(year, mo1, d1, y2, mo2, d2)
