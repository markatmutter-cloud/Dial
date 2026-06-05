#!/usr/bin/env python3
"""
Watches of Knightsbridge auctions calendar scraper.

WoK is a UK auction house (London) running on the Metropress / ab-initio
auction platform (`portal-assets.azureedge.net/platform/ab-initio/`),
served from `auctions.watchesofknightsbridge.com`. They run an occasional
"Modern, Vintage & Military Timepieces" sale — roughly every couple of
months, all watches/jewellery.

Both the upcoming-auctions page (`/auctions`) and the past-auctions page
(`/past-auctions`) are server-rendered HTML, so this scraper parses card
blocks with plain regex — no JS execution needed. We pull recent past
sales too so the comprehensive lot enumerator can backfill sold prices
right after a sale ends (matches the Antiquorum/Christie's pattern).

Each card carries:
  - `data-auction-ref="srwatcNNNNN"` — unique sale slug
  - `<div class="sale-date">06 Jun 2026 14:00 BST</div>` — auction date
  - `<a href="/auctions/<saleID>/srwatcNNNNN?primaryCategoryCode=...">` —
    canonical live URL (sale ID + slug). We strip the category param
    because WoK's sales are all watches/jewellery; the bare URL renders
    every lot in one page (~60 lots, fully inline HTML).
  - `<a alt="Modern, Vintage & Military Timepieces" href="/past-auctions/...">`
    — title via the alt attribute (consistent across cards).
  - `<img src="https://cdn.globalauctionplatform.com/auctions-YYYY/...">`
    — sale cover image (Azure CDN, no proxy needed).
  - `<span>London</span>` — location (sometimes absent).

Output: watchesofknightsbridge_auctions_listings.csv  (moved to
data/watchesofknightsbridge_auctions.csv by the workflow)

Run: python3 watchesofknightsbridge_auctions_scraper.py
"""

import csv
import re
import sys
from datetime import datetime, date, timedelta
from html import unescape

import requests

BASE = "https://auctions.watchesofknightsbridge.com"
UPCOMING_URL = f"{BASE}/auctions"
PAST_URL = f"{BASE}/past-auctions"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                  "AppleWebKit/537.36 (KHTML, like Gecko) "
                  "Chrome/132.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-GB,en;q=0.9",
}
# Past sales older than this many days don't need re-enumeration — the
# lots scraper's active window will skip them anyway. WoK runs roughly
# every 5-6 months, so 365 days keeps the last two past sales in the
# calendar so just-closed sales still backfill realized prices reliably.
PAST_DAYS_TO_INCLUDE = 365

# Each card opens with `<div id="auction-list-item-..."` and carries
# `data-auction-ref="..."`. We split on that header so each segment is
# one card we can parse field-by-field.
_CARD_SPLIT_RE = re.compile(
    r'<div\s+id="auction-list-item-[^"]+"[^>]*data-auction-ref="(?P<slug>[^"]+)"[^>]*data-auction-type="(?P<type>[^"]*)"',
    re.S,
)
_SALE_DATE_RE = re.compile(r'<div class="sale-date">\s*([^<]+?)\s*</div>')
_TITLE_ALT_RE = re.compile(r'<a[^>]+alt="(?P<alt>[^"]+)"[^>]+href="/past-auctions/[^"]+"', re.S)
_LIVE_HREF_RE = re.compile(r'href="/auctions/(?P<id>\d+)/(?P<slug>[a-zA-Z0-9_-]+)(?:\?[^"]*)?"')
_IMAGE_RE = re.compile(r'<img[^>]+src="(?P<src>https://cdn\.globalauctionplatform\.com/[^"]+)"')
_LOCATION_RE = re.compile(r'class="item auction-type".*?<span>\s*([^<]+?)\s*</span>', re.S)


def _parse_sale_date(text):
    """'06 Jun 2026 14:00 BST' → ('2026-06-06', '14:00 BST') or ('', '')."""
    if not text:
        return "", ""
    text = unescape(text).strip()
    # Date prefix: "DD Mon YYYY"
    m = re.match(r'(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})', text)
    if not m:
        return "", text
    try:
        dt = datetime.strptime(f"{m.group(1)} {m.group(2)} {m.group(3)}", "%d %b %Y")
    except ValueError:
        return "", text
    iso = dt.date().isoformat()
    tail = text[m.end():].strip()
    return iso, tail


def _extract_cards(html):
    """Split the page HTML at each card header and yield the card body
    for each. Trailing card runs to end-of-page; safe because anything
    we extract is structured + non-greedy.
    """
    matches = list(_CARD_SPLIT_RE.finditer(html))
    for i, m in enumerate(matches):
        body_start = m.start()
        body_end = matches[i + 1].start() if i + 1 < len(matches) else len(html)
        yield {
            "slug": m.group("slug"),
            "type": m.group("type") or "Live",
            "body": html[body_start:body_end],
        }


def _parse_card(card):
    """Pull title / date / location / image / sale-id out of one card."""
    body = card["body"]
    slug = card["slug"]

    title = ""
    tm = _TITLE_ALT_RE.search(body)
    if tm:
        title = unescape(tm.group("alt")).strip()

    # Sale date (sometimes the card just says viewing dates; tolerate).
    date_start, time_tail = "", ""
    dm = _SALE_DATE_RE.search(body)
    if dm:
        date_start, time_tail = _parse_sale_date(dm.group(1))

    location = ""
    lm = _LOCATION_RE.search(body)
    if lm:
        location = unescape(lm.group(1)).strip()

    image = ""
    im = _IMAGE_RE.search(body)
    if im:
        # The CDN serves resized variants via `?w=N` — drop the query so
        # downstream image proxy can apply its own size policy.
        image = im.group("src").split("?")[0]

    # Sale ID: extract from the first `/auctions/<id>/<slug>` link in the
    # card. WoK pages 9+ months ago sometimes only link `/past-auctions/<slug>`
    # (no numeric sale ID) — in that case we fall back to the past URL.
    sale_id = ""
    live_href = None
    for hm in _LIVE_HREF_RE.finditer(body):
        if hm.group("slug") == slug:
            sale_id = hm.group("id")
            live_href = f"{BASE}/auctions/{sale_id}/{slug}"
            break
    url = live_href or f"{BASE}/past-auctions/{slug}"

    return {
        "slug": slug,
        "title": title,
        "date_start": date_start,
        "date_end": date_start,  # WoK sales are single-day events
        "time_tail": time_tail,
        "location": location,
        "image": image,
        "sale_id": sale_id,
        "url": url,
        "type": card["type"],
    }


def _fetch(url):
    r = requests.get(url, headers=HEADERS, timeout=30)
    r.raise_for_status()
    return r.text


def scrape():
    today = date.today()
    cutoff = today - timedelta(days=PAST_DAYS_TO_INCLUDE)

    rows = []
    seen_slugs = set()

    for page_url, label in [(UPCOMING_URL, "upcoming"), (PAST_URL, "past")]:
        print(f"Fetching {label}: {page_url}")
        try:
            html = _fetch(page_url)
        except Exception as e:
            print(f"  ERROR: {e}", file=sys.stderr)
            continue
        for card in _extract_cards(html):
            parsed = _parse_card(card)
            slug = parsed["slug"]
            if not slug or slug in seen_slugs:
                continue
            if not parsed["date_start"]:
                # Skip cards without a parseable sale date (shouldn't
                # happen for live or recent past sales).
                continue
            try:
                d = date.fromisoformat(parsed["date_start"])
            except ValueError:
                continue
            if d < cutoff:
                continue  # too old to bother enumerating

            seen_slugs.add(slug)
            date_label = parsed["date_start"]
            if parsed.get("time_tail"):
                date_label = f"{parsed['date_start']} {parsed['time_tail']}"

            rows.append({
                "house":       "Watches of Knightsbridge",
                "title":       parsed["title"] or "Modern, Vintage & Military Timepieces",
                "location":    parsed["location"] or "London",
                "date_start":  parsed["date_start"],
                "date_end":    parsed["date_end"],
                "date_label":  date_label,
                "url":         parsed["url"],
                "has_catalog": "True",  # WoK lots render fully inline on every sale page
                "source":      "Watches of Knightsbridge",
                "image":       parsed["image"],
            })

    rows.sort(key=lambda r: r["date_start"])
    return rows


def main():
    print("Scraping Watches of Knightsbridge auctions calendar...")
    rows = scrape()
    if not rows:
        print("\n⚠ No auctions parsed; writing empty CSV with header so the "
              "merge step doesn't choke.")

    out_file = "watchesofknightsbridge_auctions_listings.csv"
    with open(out_file, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=[
            "house", "title", "location", "date_start", "date_end",
            "date_label", "url", "has_catalog", "source", "image",
        ])
        writer.writeheader()
        writer.writerows(rows)

    print(f"\n✓ Saved {len(rows)} auction(s) to {out_file}")
    for r in rows:
        print(f"  {r['date_label']:30s}  {r['location']:10s}  {r['title'][:60]}")


if __name__ == "__main__":
    main()
