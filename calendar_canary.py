#!/usr/bin/env python3
"""
Live calendar canary — fetch every house for real and fail fast on zero.

WHY THIS EXISTS ALONGSIDE THE GATE

auction_calendar_health.py inspects the COMMITTED CSVs and is debounced
three consecutive runs before it pages. That debounce is correct for its
job (it must not page on a transient block) but it means a redesign takes
three days to surface, and only after it has already emptied the data.

Monaco Legend and Phillips were each broken for six weeks. Three days
would have been a rounding error on that, but the point of a canary is to
turn "we noticed eventually" into "we noticed the day it shipped".

So this is the complementary check:

  auction_calendar_health.py   artifact-based, debounced, in the scrape
                              workflow, decides whether to PAGE
  calendar_canary.py          network-based, no debounce, its own
                              schedule, decides whether the parsers
                              still UNDERSTAND the sites

It calls each scraper's own scrape() rather than re-implementing any
parsing, so it exercises the real code path. Nothing is written and
nothing is committed — it is a pure read.

A house returning zero is the signal. Every one of these scrapers returns
past sales as well as upcoming, so zero cannot mean "quiet season" (the
one house that violated that, Monaco Legend, was fixed to conform). Zero
means the parser no longer understands the page.

Bonhams is excluded: its calendar 403s datacenter IPs by design (B-72)
and is scraped from the residential agent, so failing here would be
noise CI cannot act on.

Usage:
    python3 calendar_canary.py          # exit 1 if any house returns 0
    python3 calendar_canary.py --warn   # always exit 0, just report
"""
from __future__ import annotations

import importlib
import sys
import traceback

# house label -> module providing scrape() -> list[dict]
HOUSES = {
    "Antiquorum": "antiquorum_auctions_scraper",
    "Monaco Legend": "monacolegend_auctions_scraper",
    "Phillips": "phillips_auctions_scraper",
    "Christie's": "christies_auctions_scraper",
    "Sotheby's": "sothebys_auctions_scraper",
    "Watches of Knightsbridge": "watchesofknightsbridge_auctions_scraper",
    "Marteau & Co": "marteauandco_auctions_scraper",
}

# Minimum sales a healthy house should yield. Deliberately 1, not a
# per-house floor: a floor would need maintaining as catalogs roll off,
# and the failure this catches (a redesign) takes the count to exactly 0.
MIN_SALES = 1


def check_house(label: str, module_name: str) -> tuple[int, str]:
    """(count, note). count -1 means the scraper raised."""
    try:
        mod = importlib.import_module(module_name)
    except Exception as e:
        return -1, f"import failed: {type(e).__name__}: {e}"
    scrape = getattr(mod, "scrape", None)
    if not callable(scrape):
        return -1, "module exposes no scrape()"
    try:
        sales = scrape() or []
    except Exception as e:
        return -1, f"{type(e).__name__}: {str(e)[:120]}"
    return len(sales), ""


def main(argv: list[str]) -> int:
    warn_only = "--warn" in argv
    failures = []

    print("Live calendar canary — fetching every house for real\n")
    for label, module_name in HOUSES.items():
        count, note = check_house(label, module_name)
        if count < 0:
            print(f"  ✗ {label:26} ERROR  {note}")
            failures.append(f"{label}: {note}")
        elif count < MIN_SALES:
            print(f"  ✗ {label:26} 0 sales parsed — the page shape has "
                  f"probably changed")
            failures.append(f"{label}: 0 sales parsed")
        else:
            print(f"  ✓ {label:26} {count} sales")

    if not failures:
        print(f"\nAll {len(HOUSES)} houses parsed. ✓")
        return 0

    print(f"\n::error::Calendar canary: {len(failures)} house(s) returned "
          f"nothing — their parsers no longer match the live site")
    for f in failures:
        print(f"  - {f}")
    return 0 if warn_only else 1


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
