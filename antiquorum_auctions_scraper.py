#!/usr/bin/env python3
"""
Antiquorum auction calendar scraper.
Run: python3 antiquorum_auctions_scraper.py
Requires: pip install requests
Output: antiquorum_auctions_listings.csv

Antiquorum's upcoming-auctions page is WordPress HTML. Each auction
appears as a block containing: location, date range (e.g. "May 9th
-10th, 2026" or a single day), and a title ("Important Modern &
Vintage Timepieces" is the standard watch sale).

URL resolution per sale (preference order):
  1. catalog.antiquorum.swiss/en/auctions/<slug>/lots — constructed
     from location + date by build_catalog_url(). HEAD-probed for 200.
  2. live.antiquorum.swiss/auctions/<short-id>/<slug> — discovered by
     matching the sale against the live-host upcoming index
     (fetch_live_upcoming_index). Used when (1) HEADs non-200, which
     typically means the catalog hasn't been published yet (Antiquorum
     publishes catalogs 3–5 days before the sale, but the live
     surface is up earlier).
  3. Generic upcoming-auctions landing page — final fallback when
     neither (1) nor (2) yields a real catalog. has_catalog=False so
     the comprehensive lot scraper skips this row.

Both catalog and live URLs are enumerable by the same
`enumerate_antiquorum` path in auction_lots_scraper.py.
"""
import requests
import csv
import json
import re
import sys
from datetime import datetime, date

URL = "https://www.antiquorum.swiss/en/auctions/upcoming"
UPCOMING_PAGE = "https://www.antiquorum.swiss/upcoming-auctions-and-viewings/"
CATALOG_BASE = "https://catalog.antiquorum.swiss/en/auctions"
LIVE_HOST = "https://live.antiquorum.swiss"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate",
}

MONTHS = {
    'january':1, 'february':2, 'march':3, 'april':4, 'may':5, 'june':6,
    'july':7, 'august':8, 'september':9, 'october':10, 'november':11, 'december':12,
}


def build_catalog_url(location, date_label):
    """Mirror Antiquorum's own URL pattern:
      https://catalog.antiquorum.swiss/en/auctions/{Location}_{Date}/lots
    where spaces become underscores and the date keeps its ordinal suffixes.
    Example: 'Geneva' + 'May 9th -10th, 2026' → 'Geneva_May_9th_10th_2026'.
    """
    loc_slug = re.sub(r'\s+', '_', location.strip())
    # Drop comma, collapse dashes and whitespace to single underscore.
    date_slug = date_label.replace(',', ' ')
    date_slug = re.sub(r'[\s\-]+', '_', date_slug).strip('_')
    return f"{CATALOG_BASE}/{loc_slug}_{date_slug}/lots"


def parse_date_range(date_str):
    """Parse strings like:
      'May 9th -10th, 2026'
      'May 31st, 2026'
      'November 7th -8th, 2026'
      'April 23, 2026'

    Returns (start_iso, end_iso) as YYYY-MM-DD strings, or (None, None).
    """
    s = date_str.strip()
    # Drop ordinal suffixes
    s = re.sub(r'(\d+)(st|nd|rd|th)', r'\1', s, flags=re.IGNORECASE)
    # "May 9 -10, 2026"  →  month=May, day_start=9, day_end=10, year=2026
    m = re.match(r'([A-Za-z]+)\s+(\d+)(?:\s*-\s*(\d+))?,?\s*(\d{4})', s)
    if not m:
        return (None, None)
    month_name, d1, d2, year = m.group(1).lower(), int(m.group(2)), m.group(3), int(m.group(4))
    month = MONTHS.get(month_name)
    if not month:
        return (None, None)
    try:
        start = datetime(year, month, d1).date().isoformat()
        end_day = int(d2) if d2 else d1
        end = datetime(year, month, end_day).date().isoformat()
    except ValueError:
        return (None, None)
    return (start, end)


def strip_tags(html):
    return re.sub(r'<[^>]+>', ' ', html)


def fetch_live_upcoming_index():
    """Pull the inline `upcomingAuctions.result_page` list from
    `live.antiquorum.swiss/`. Each entry is one upcoming live sale and
    carries `_detail_url` (the path under live.antiquorum.swiss),
    `title`, and `time_start` (ISO datetime).

    Used as a fallback when build_catalog_url's guess HEADs non-200 —
    typically because the catalog hasn't been published yet (Antiquorum
    publishes catalog pages 3–5 days before the sale, but the live
    surface is up earlier). Returns a list of dicts with the keys
    `detail_url`, `title`, `time_start`, or an empty list on failure.

    Memoize-by-caller: scrape() calls this once at the start.
    """
    try:
        r = requests.get(LIVE_HOST + "/", headers=HEADERS, timeout=30)
        r.raise_for_status()
    except Exception as e:
        print(f"  [Antiquorum] live-host index fetch failed: {e}")
        return []
    # The page embeds a Vue/React hydration blob; the upcomingAuctions
    # array is inside a much larger JSON object. Grep the array by
    # anchor token rather than trying to parse the whole envelope —
    # cheaper and resilient to envelope changes.
    m = re.search(r'"upcomingAuctions"\s*:\s*\{"result_page"\s*:\s*(\[)', r.text)
    if not m:
        return []
    # Walk forward from the opening bracket, balance bracket depth.
    start = m.end() - 1   # position of `[`
    depth = 0
    end = None
    in_str = False
    esc = False
    for i in range(start, len(r.text)):
        ch = r.text[i]
        if in_str:
            if esc:
                esc = False
            elif ch == "\\":
                esc = True
            elif ch == '"':
                in_str = False
            continue
        if ch == '"':
            in_str = True
            continue
        if ch == "[":
            depth += 1
        elif ch == "]":
            depth -= 1
            if depth == 0:
                end = i + 1
                break
    if end is None:
        return []
    try:
        arr = json.loads(r.text[start:end])
    except Exception as e:
        print(f"  [Antiquorum] live-host JSON parse failed: {e}")
        return []
    out = []
    for entry in arr:
        if not isinstance(entry, dict):
            continue
        detail = entry.get("_detail_url") or ""
        if not detail.startswith("/auctions/"):
            continue
        out.append({
            "detail_url":  LIVE_HOST + detail,
            "title":       entry.get("title") or "",
            "time_start":  entry.get("time_start") or "",
        })
    return out


def find_live_url_for_sale(live_index, location, date_start):
    """Match one of our calendar-scraper rows against the live-host
    index by (date_start, location-in-title). Returns the live URL
    string or None. ``location`` is the Antiquorum display name
    (e.g. ``"Hong Kong"``); the live blob's `title` contains
    ``"Antiquorum Hong Kong"`` so a case-insensitive contains check
    is sufficient.
    """
    if not (live_index and location and date_start):
        return None
    needle = location.lower()
    for entry in live_index:
        # Match the date prefix (YYYY-MM-DD) — Antiquorum's
        # `time_start` is a full ISO datetime in UTC.
        if not entry.get("time_start", "").startswith(date_start):
            continue
        if needle in entry.get("title", "").lower():
            return entry["detail_url"]
    return None


def scrape():
    print(f"Fetching {URL} ...")
    r = requests.get(URL, headers=HEADERS, timeout=30)
    r.raise_for_status()
    html = r.text

    # Flatten HTML to text so we can pattern-match across tag boundaries.
    text = strip_tags(html)
    text = re.sub(r'&amp;', '&', text)
    text = re.sub(r'&#[0-9]+;', '', text)
    text = re.sub(r'&nbsp;', ' ', text)
    text = re.sub(r'\s+', ' ', text)

    # Match "<Location> <Date> Important Modern & Vintage Timepieces". Location
    # is 1–3 Titlecase words (handles "New York", "Hong Kong"). Title is
    # currently always "Important Modern & Vintage Timepieces" for watches.
    pattern = re.compile(
        r'([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})\s+'
        r'([A-Z][a-z]+\s+\d+(?:st|nd|rd|th)?(?:\s*-\s*\d+(?:st|nd|rd|th)?)?,?\s*\d{4})\s+'
        r'(Important Modern\s*&\s*Vintage Timepieces)'
    )

    # Live-host index — used as a fallback when the catalog URL guess
    # HEADs non-200. Fetched ONCE per scrape run; matched per-sale by
    # (date_start, location-in-title).
    live_index = fetch_live_upcoming_index()
    print(f"  live-host index: {len(live_index)} upcoming sale(s)")

    results = []
    seen = set()
    for m in pattern.finditer(text):
        location = m.group(1).strip()
        date_str = m.group(2).strip()
        title = m.group(3).strip()
        start, end = parse_date_range(date_str)
        if not start:
            print(f"  ? skipped (unparseable date): {date_str!r}")
            continue

        key = (location, start, title)
        if key in seen:
            continue
        seen.add(key)

        # Catalog URL guess via the URL-template. Catalog pages stay up
        # for years post-sale, so a 200 here is good both pre- and
        # post-sale. Non-200 typically means the catalog hasn't been
        # published yet — Antiquorum tends to publish catalogs 3–5 days
        # before the sale, but the live surface goes up much earlier.
        candidate = build_catalog_url(location, date_str)
        has_catalog = False
        url = UPCOMING_PAGE
        try:
            hr = requests.head(candidate, headers=HEADERS, timeout=15, allow_redirects=True)
            # Some catalogs return 200 with a redirect to /lots; both are fine.
            if hr.status_code == 200:
                url = candidate
                has_catalog = True
            else:
                print(f"    catalog check {hr.status_code} for {candidate}")
        except Exception as e:
            print(f"    catalog check failed: {e}")

        # Fallback: when catalog URL didn't resolve, look the sale up in
        # the live-host upcoming index. The live URL is enumerable by
        # the same `enumerate_antiquorum` path (it already accepts
        # live.antiquorum.swiss/auctions/ — see auction_lots_scraper
        # ENUMERATORS), so we can promote has_catalog=True and let the
        # comprehensive scrape walk lots on the next cron run.
        if not has_catalog:
            live_url = find_live_url_for_sale(live_index, location, start)
            if live_url:
                url = live_url
                has_catalog = True
                print(f"    live-host fallback: {live_url}")

        results.append({
            'house':       'Antiquorum',
            'title':       title,
            'location':    location,
            'date_start':  start,
            'date_end':    end,
            'date_label':  date_str,
            'url':         url,
            'has_catalog': 'True' if has_catalog else 'False',
            'source':      'Antiquorum',
        })

    return results


def main():
    print("Scraping Antiquorum upcoming auctions calendar...")
    auctions = scrape()
    if not auctions:
        print("No auctions parsed. Dumping page signature for debugging:")
        # Print a 200-char window around "Timepieces" so future edits to the
        # page template can be diagnosed without grabbing the whole HTML.
        r = requests.get(URL, headers=HEADERS, timeout=30)
        text = re.sub(r'\s+', ' ', strip_tags(r.text))
        idx = text.find('Timepieces')
        if idx >= 0:
            print(f"  Context around 'Timepieces': {text[max(0,idx-150):idx+50]!r}")
        sys.exit(0)

    print(f"\nFound {len(auctions)} upcoming auction(s):")
    for a in auctions:
        print(f"  {a['date_start']}  {a['location']:20s}  {a['title']}")

    output = 'antiquorum_auctions_listings.csv'
    with open(output, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=['house','title','location','date_start','date_end','date_label','url','has_catalog','source'])
        writer.writeheader()
        writer.writerows(auctions)
    print(f"\nSaved {len(auctions)} auctions to {output}")


if __name__ == "__main__":
    main()
