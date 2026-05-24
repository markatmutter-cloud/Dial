#!/usr/bin/env python3
"""
Watch Club scraper — TaffyDB JSON file, GBP.

Watch Club (Cardiff, UK) loads its entire catalogue client-side from
a single JavaScript file at /upload/js/watches2018_bis.js (~5MB). The
file wraps a JSON array in `var Watches = TAFFY([...]);` — once
extracted, every product is available with no pagination needed.

The HTML /the-collection page only renders the first 20 cards; the
"View more" button paginates against the in-memory TaffyDB. This is
why naive page-walks (?n=2, ?p=2, /page/2) all return the same 20
items — pagination is purely client-side.

Run: python3 watchclub_scraper.py
Output: watchclub_listings.csv
"""
import csv
import json
import os
import re
import sys

import requests

BASE = "https://www.watchclub.com"
PRIOR_CSV_PATH = "data/watchclub.csv"
# If today's parsed result is below MIN_HEALTHY_RATIO of the prior good
# run's count, treat it as a corrupted-catalog snapshot and skip writing.
# Watch Club's catalog JS occasionally serves a truncated subset (~15
# items vs the usual ~55) — seems to be a Cloudflare cache state on
# specific runner IPs. The bimodal pattern shows up cleanly in
# verification_history; root cause is upstream and not fixable client-
# side. Skipping the write keeps merge.py from marking the missing
# items as sold. Threshold tuned to catch the 15↔55 flap while
# allowing real organic drops to pass through (a real 50% drop would
# need two consecutive low counts to land).
MIN_HEALTHY_RATIO = 0.5
ABSOLUTE_FLOOR = 25
DATA_URL = "https://watchclub.com/upload/js/watches2018_bis.js"
IMG_BASE = "https://www.watchclub.com/upload/watches/wb"
HEADERS = {
    "User-Agent": "Mozilla/5.0",
    "Accept": "text/javascript,application/javascript,*/*;q=0.8",
}


def fetch_catalog():
    print(f"Fetching {DATA_URL} (~5 MB)...")
    r = requests.get(DATA_URL, headers=HEADERS, timeout=60)
    r.raise_for_status()
    js = r.text
    # Locate the array literal.
    start = js.find("TAFFY(")
    if start < 0:
        raise RuntimeError("TAFFY(...) not found in catalog JS")
    i = js.index("[", start)
    depth = 1
    in_str = False
    esc = False
    j = i + 1
    while j < len(js) and depth > 0:
        ch = js[j]
        if esc:
            esc = False
        elif ch == "\\":
            esc = True
        elif in_str:
            if ch == '"':
                in_str = False
        elif ch == '"':
            in_str = True
        elif ch == "[":
            depth += 1
        elif ch == "]":
            depth -= 1
        j += 1
    raw = js[i:j]
    # The TAFFY string values include literal newlines / tabs / control
    # chars inside descriptions, which strict JSON forbids. Strip them
    # before parsing — we don't need the formatting whitespace inside
    # description strings, and a permissive json5 dependency would be
    # overkill for one source.
    cleaned = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f]", " ", raw)
    cleaned = cleaned.replace("\t", " ").replace("\r", " ").replace("\n", " ")
    return json.loads(cleaned)


def clean(s):
    if not s:
        return ""
    s = re.sub(r"&#?\w+;", " ", s)
    s = re.sub(r"<[^>]+>", " ", s)
    return re.sub(r"\s+", " ", s).strip()


def parse_item(p):
    # Status "1" appears to be the active sentinel; anything else
    # (sold / archived) we treat as inactive. We can refine when
    # we see what other statuses Watch Club uses.
    status = str(p.get("status", "1"))
    sold = status != "1"

    brand = clean(p.get("brand", "")) or "Other"
    model = clean(p.get("model", ""))
    year = (p.get("year") or "").strip()
    nick = clean(p.get("nick", ""))
    title_parts = [brand, model]
    if nick:
        title_parts.append(nick)
    if year:
        title_parts.append(year)
    title = " ".join(p for p in title_parts if p)

    try:
        price = int(p.get("price") or 0)
    except (ValueError, TypeError):
        price = 0

    url_part = (p.get("url") or "").lstrip("/")
    url = f"{BASE}/{url_part}" if url_part else BASE

    img_filename = (p.get("chiave") or "").strip()
    img = f"{IMG_BASE}/{img_filename}" if img_filename else ""

    desc = clean(p.get("description", ""))[:400]

    return {
        "title": title,
        "brand": brand,
        "price": price,
        "url": url,
        "img": img,
        "description": desc,
        "source": "Watch Club",
        "sold": sold,
    }


def prior_count():
    """Count rows in the previous-run CSV; 0 if unreadable / missing."""
    if not os.path.exists(PRIOR_CSV_PATH):
        return 0
    try:
        with open(PRIOR_CSV_PATH, encoding="utf-8") as f:
            return sum(1 for _ in csv.DictReader(f))
    except (OSError, csv.Error):
        return 0


def main():
    raw = fetch_catalog()
    print(f"Loaded {len(raw)} products from TaffyDB")

    parsed = [parse_item(p) for p in raw]
    # Drop $0 placeholders and inactive entries from the live feed.
    # Sold ones merge.py picks up via state tracking once they were
    # previously active; for a brand-new source we just emit the
    # currently-listed items.
    results = [r for r in parsed if r["price"] > 0 and not r["sold"]]
    skipped = len(parsed) - len(results)
    if skipped:
        print(f"Skipped {skipped} items (no price or marked sold/archived)")

    prev = prior_count()
    if prev and len(results) < ABSOLUTE_FLOOR and len(results) < prev * MIN_HEALTHY_RATIO:
        print(
            f"\n⚠ Aborting write: {len(results)} active items is below "
            f"{int(MIN_HEALTHY_RATIO * 100)}% of prior {prev}. Catalog snapshot "
            f"likely truncated upstream — keeping previous {PRIOR_CSV_PATH} "
            f"so merge.py doesn't false-flag the missing items as sold."
        )
        sys.exit(0)

    out_file = "watchclub_listings.csv"
    with open(out_file, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=["title", "brand", "price", "url", "img", "description", "source", "sold"],
        )
        writer.writeheader()
        writer.writerows(results)

    if results:
        prices = [r["price"] for r in results]
        print(f"\n✓ Saved {len(results)} listings to {out_file} (GBP)")
        print(f"  Min: £{min(prices):,} | Max: £{max(prices):,} | Avg: £{sum(prices)//len(prices):,}")
        from collections import Counter
        for b, c in Counter(r["brand"] for r in results).most_common():
            print(f"  {b}: {c}")


if __name__ == "__main__":
    main()
