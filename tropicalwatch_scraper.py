#!/usr/bin/env python3
"""
Tropical Watch scraper - direct HTML fetch (no Browse AI).

Replaces the old Browse AI integration (retired 2026-05-26, see BUGS.md B-23).
tropicalwatch.com server-renders its listing index at https://tropicalwatch.com/
with everything we need inline per card — title, price, URL, image, and
sold-status — so a plain `requests` fetch is all it takes. No JS app, no auth,
no Cloudflare challenge. Confirmed reachable from a GitHub datacenter IP via the
source-probe workflow (200, full body, 0 challenge markers), so this runs in
normal CI — it does NOT need the residential host (B-25).

Index structure (the reason the walk works):
  The index lists ALL live (for-sale) listings first, newest-first, then the
  ENTIRE sold archive (hundreds of pages deep). The live->sold boundary is
  sharp: a sold card carries `<h3 class="watch-main-price ... color-red">Sold`
  instead of a `$price`. We walk pages 1..N collecting live cards and STOP at
  the first page that contains a sold card (after taking that page's live
  cards). We never descend into the sold archive.

Sold transitions are intentionally NOT written here. When an item sells it
leaves the live set, so it disappears from this CSV; merge.py's disappearance
debounce (B-15, DISAPPEARANCE_MISS_THRESHOLD consecutive misses) then flips it
sold using its cached last *asking* price. That's more correct than scraping
the index's price-less "Sold" badge (which would archive it at $0).

Run: python3 tropicalwatch_scraper.py
Requires: pip install requests
Output: tropicalwatch_listings.csv
"""

import csv
import html as html_lib
import re
import sys
import time
from datetime import date

import requests

BASE = "https://tropicalwatch.com"
REQUEST_DELAY = 0.3   # polite gap between page fetches
RETRIES = 3
# Safety cap. Live inventory is ~100 (≈7 pages of 15). If we walk this many
# pages without hitting the live->sold boundary, the page markup almost
# certainly changed and our sold-detection broke — refuse to write rather than
# flood the CSV with hundreds of archive items mislabelled live. 20 pages = 300
# live, far above any plausible real inventory for a vintage dealer.
MAX_PAGES = 20

HEADERS = {
    "User-Agent": ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                   "AppleWebKit/605.1.15 (KHTML, like Gecko) "
                   "Version/17.0 Safari/605.1.15"),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}

# Small brand list for early labelling; merge.py reassigns brand from title.
BRANDS = [
    'Rolex', 'Omega', 'Patek Philippe', 'Tudor', 'Breitling', 'IWC', 'Cartier',
    'Jaeger-LeCoultre', 'Panerai', 'Audemars Piguet', 'Vacheron Constantin',
    'A. Lange', 'Heuer', 'Zenith', 'Longines', 'Universal Geneve',
    'Movado', 'Aquastar', 'Czapek', 'Urwerk', 'Breguet', 'Seiko', 'Blancpain'
]


def detect_brand(name):
    for b in BRANDS:
        if b.lower() in name.lower():
            return b
    return 'Other'


# Each listing on the index is one <li class="watch ...">...</li> block.
CARD_RE = re.compile(r'<li class="watch\b.*?</li>', re.S | re.I)
HREF_RE = re.compile(r'href="(/watches/[^"]+)"')
TITLE_RE = re.compile(r'<h2[^>]*>(.*?)</h2>', re.S | re.I)
# The card's photo <img>; grab its src (the 1x url), not the srcset 2x url.
IMG_RE = re.compile(r'<img\b[^>]*?\bsrc="([^"]+)"', re.I)
PRICE_RE = re.compile(
    r'<h3[^>]*class="watch-main-price[^"]*"[^>]*>(.*?)</h3>', re.S | re.I)
# A sold card styles the price h3 with color-red and reads "Sold".
SOLD_CLASS_RE = re.compile(r'class="watch-main-price[^"]*\bcolor-red\b', re.I)


def _strip_tags(s):
    return html_lib.unescape(re.sub(r'<[^>]+>', '', s)).strip()


def parse_price(raw):
    """'$22,850' -> 22850. Returns 0 for non-numeric (e.g. 'Sold')."""
    try:
        return int(float(str(raw).replace('$', '').replace(',', '').strip()))
    except (ValueError, TypeError):
        m = re.search(r'[\d,]+', str(raw))
        if m:
            try:
                return int(m.group(0).replace(',', ''))
            except ValueError:
                pass
    return 0


def parse_page(html):
    """Parse one index page into a list of card dicts.
    Each: {url, title, img, price, sold}. sold is True when the price h3
    carries color-red OR the price text isn't a usable number ('Sold')."""
    cards = []
    for m in CARD_RE.finditer(html):
        block = m.group(0)
        href = HREF_RE.search(block)
        if not href:
            continue
        url = BASE + href.group(1)

        title_m = TITLE_RE.search(block)
        title = _strip_tags(title_m.group(1)) if title_m else ''
        if not title:
            continue

        img_m = IMG_RE.search(block)
        img = img_m.group(1) if img_m else ''

        price_m = PRICE_RE.search(block)
        price_raw = price_m.group(1).strip() if price_m else ''
        price = parse_price(price_raw)
        # Two independent sold signals: the color-red class, or a price cell
        # that isn't a number. Either alone is enough — robust to one changing.
        sold = bool(SOLD_CLASS_RE.search(block)) or price == 0

        cards.append({'url': url, 'title': title, 'img': img,
                      'price': price, 'sold': sold})
    return cards


def fetch(url):
    last_err = None
    for attempt in range(1, RETRIES + 1):
        try:
            r = requests.get(url, headers=HEADERS, timeout=30)
            if r.status_code == 200:
                return r.text
            # Retry transient 5xx; bail on others (4xx won't fix on retry).
            if r.status_code >= 500:
                last_err = f"HTTP {r.status_code}"
            else:
                print(f"ERROR: {url} returned HTTP {r.status_code}")
                return None
        except requests.RequestException as e:
            last_err = str(e)
        if attempt < RETRIES:
            time.sleep(attempt)  # 1s, 2s backoff
    print(f"ERROR: {url} failed after {RETRIES} attempts: {last_err}")
    return None


def scrape():
    """Walk the index, collecting live listings, stopping at the sold archive
    boundary. Returns (results, boundary_found)."""
    results = []
    boundary_found = False
    for page in range(1, MAX_PAGES + 1):
        url = BASE + ("/" if page == 1 else f"/?page={page}")
        html = fetch(url)
        if html is None:
            # Network/5xx failure mid-walk. Bail without a partial write so
            # merge keeps prior state (a half-walk would look like a sellout).
            print(f"Aborting: failed to fetch page {page}.")
            return [], False
        cards = parse_page(html)
        if not cards:
            # Ran off the end of the catalog (shouldn't happen before the
            # boundary, but treat as a clean stop).
            boundary_found = True
            break

        live = [c for c in cards if not c['sold']]
        results.extend(live)
        print(f"  page {page}: {len(live)} live / {len(cards)} cards")

        if len(live) < len(cards):
            # This page contains a sold card -> we've reached the live/sold
            # boundary. We already took its live cards; stop here.
            boundary_found = True
            break

        time.sleep(REQUEST_DELAY)

    return results, boundary_found


def main():
    print("Fetching Tropical Watch index (direct, no Browse AI)...")
    results, boundary_found = scrape()

    if not boundary_found:
        # Hit MAX_PAGES without ever seeing a sold card. Almost certainly the
        # markup changed and sold-detection silently failed. Refuse to write so
        # merge.py keeps the prior good state (same philosophy as the truncation
        # guard) and the next failure is loud, not a corrupted archive.
        print(f"ERROR: walked {MAX_PAGES} pages without finding the live/sold "
              "boundary — sold-detection likely broke. Not writing CSV.")
        sys.exit(1)

    if not results:
        print("ERROR: no live listings parsed. Not writing CSV.")
        sys.exit(1)

    rows = []
    for c in results:
        if c['price'] == 0:
            continue  # a live card with no parseable price — skip, don't $0 it
        rows.append({
            'title': c['title'], 'brand': detect_brand(c['title']),
            'price': c['price'], 'url': c['url'], 'img': c['img'],
            'description': '', 'source': 'Tropical Watch',
            'date': str(date.today()), 'sold': False,
        })

    output = 'tropicalwatch_listings.csv'
    with open(output, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=[
            'title', 'brand', 'price', 'url', 'img',
            'description', 'source', 'date', 'sold'
        ])
        writer.writeheader()
        writer.writerows(rows)

    prices = [r['price'] for r in rows]
    print(f"\n✓ {len(rows)} live listings saved to {output}")
    print(f"  Min: ${min(prices):,} | Max: ${max(prices):,} | "
          f"Avg: ${sum(prices) // len(prices):,}")
    from collections import Counter
    for b, c in Counter(r['brand'] for r in rows).most_common(5):
        print(f"  {b}: {c}")


if __name__ == "__main__":
    main()
