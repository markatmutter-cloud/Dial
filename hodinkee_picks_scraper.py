#!/usr/bin/env python3
"""
Hodinkee Picks scraper — curated one-off articles.

Hodinkee mostly covers new-watch releases. Occasionally they publish a
vintage-relevant feature Mark wants in the editorial corpus (e.g. a
Tudor-collector meet-up Photo Report), and those don't fit either of
our two column-specific Hodinkee scrapers:
  - bring_a_loupe_scraper.py  (only `/articles/bring-a-loupe*`)
  - hodinkee_reference_points_scraper.py  (only Reference Points)

So this scraper takes a hand-curated URL list — same pattern as
christies_stories_scraper.py — fetches each, parses with the EXACT
Hodinkee article extractor that BAL already uses (JSON-LD NewsArticle
for metadata + concatenated `<div class="body-copy">` for prose), and
emits the editorial-corpus split files.

To add an article: paste a URL into data/hodinkee_picks_urls.json.
The scraper picks it up on the next cron run. URLs scraped <30 days
ago are skipped unless `HODINKEE_PICKS_FULL_REFRESH=1` is set.

Mark's framing (2026-06-06):
  "I don't want to capture general articles from hodinkee just the
  occasional one that I'd like to add — this about tudor vintage
  watches that is rare from them (normally new watches)"

Run: python3 hodinkee_picks_scraper.py
Env:
  HODINKEE_PICKS_FULL_REFRESH=1   force re-fetch every URL (default
                                  skips entries scraped <30 days ago)
Output: public/hodinkee_picks.json  + public/hodinkee_picks_bodies.json
"""

from __future__ import annotations

import json
import os
import time
from datetime import datetime, timezone
from pathlib import Path

import requests

# Reuse the BAL extractor — same site, same JSON-LD shape, same
# `<div class="body-copy">` body structure. Importing keeps the
# Hodinkee-specific parsing in one place (any future template tweak
# fixes both scrapers).
from bring_a_loupe_scraper import parse_article as _hodinkee_parse_article

from editorial_corpus_io import load_existing as _load_split, write_split, derive_bodies_path


URL_LIST_PATH = Path(__file__).parent / "data" / "hodinkee_picks_urls.json"
OUTPUT_JSON = "public/hodinkee_picks.json"
OUTPUT_BODIES = derive_bodies_path(OUTPUT_JSON)
SCRAPE_AGE_DAYS = 30  # re-fetch articles older than this in case author edits

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                  "AppleWebKit/537.36 (KHTML, like Gecko) "
                  "Chrome/132.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}

DETAIL_SLEEP = 0.6


def fetch(url: str, retries: int = 2) -> str:
    for attempt in range(retries + 1):
        try:
            r = requests.get(url, headers=HEADERS, timeout=30)
            if r.status_code == 200:
                return r.text
            print(f"  HTTP {r.status_code} on {url}")
        except requests.RequestException as e:
            print(f"  fetch error on {url}: {e}")
        if attempt < retries:
            time.sleep(2 ** attempt)
    return ""


def discover_urls() -> list[str]:
    """Load the curated URL list from data/hodinkee_picks_urls.json."""
    if not URL_LIST_PATH.exists():
        print(f"  URL list not found at {URL_LIST_PATH}")
        return []
    try:
        blob = json.loads(URL_LIST_PATH.read_text())
    except Exception as e:
        print(f"  URL list unreadable: {e}")
        return []
    urls = blob.get("urls") or []
    urls = [
        u for u in urls
        if isinstance(u, str) and u.startswith("https://www.hodinkee.com/")
    ]
    print(f"  curated URL list → {len(urls)} article(s)")
    return urls


def should_refresh(existing_record: dict | None, full_refresh: bool) -> bool:
    if full_refresh or not existing_record:
        return True
    scraped_at = existing_record.get("scraped_at") or ""
    try:
        dt = datetime.strptime(scraped_at[:10], "%Y-%m-%d").replace(tzinfo=timezone.utc)
    except ValueError:
        return True
    age = (datetime.now(timezone.utc) - dt).days
    return age >= SCRAPE_AGE_DAYS


def main():
    full_refresh = os.environ.get("HODINKEE_PICKS_FULL_REFRESH") == "1"
    print(f"Hodinkee Picks scraper (full_refresh={full_refresh})")
    existing = _load_split(OUTPUT_JSON, OUTPUT_BODIES)
    print(f"  existing entries on disk: {len(existing)}")

    urls = discover_urls()
    print(f"\nDiscovered {len(urls)} curated URLs")

    out = dict(existing)
    fetched = skipped = failed = 0
    for i, url in enumerate(urls, 1):
        if not should_refresh(existing.get(url), full_refresh):
            skipped += 1
            continue
        html = fetch(url)
        record = _hodinkee_parse_article(html, url)
        if not record:
            failed += 1
            print(f"  [{i}/{len(urls)}] FAILED: {url}")
            time.sleep(DETAIL_SLEEP)
            continue
        # BAL's parser stamps `source: hodinkee_bring_a_loupe` for its
        # own column-based corpus. Override so the curated picks live
        # under their own source key — the EditorialView filter chip
        # + brand facets resolve cleanly per source.
        record["source"] = "hodinkee_picks"
        record["source_type"] = "editorial_curated"
        out[url] = record
        fetched += 1
        print(f"  [{i}/{len(urls)}] {record['title'][:78]}  ({record['word_count']} words)")
        time.sleep(DETAIL_SLEEP)

    write_split(out, OUTPUT_JSON, OUTPUT_BODIES)
    print(f"\nFetched: {fetched}  Skipped (fresh): {skipped}  Failed: {failed}")
    print(f"Total entries on disk: {len(out)}")
    print(f"Wrote {OUTPUT_JSON} + {OUTPUT_BODIES}")


if __name__ == "__main__":
    main()
