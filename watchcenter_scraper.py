#!/usr/bin/env python3
"""
Watch Center scraper — WooCommerce Store API, CHF.

Swiss dealer (Mendrisio, Ticino) running WooCommerce on the standard
`/wp-json/wc/store/v1` endpoint. ~430 products today. Same pattern as
Maunder / Watchurbia / Menta / Grey & Patina but currency is CHF and
`currency_minor_unit` is 0 (whole-franc display, no cents). Multilingual
site (Italian default + `/en/` locale) — the Store API returns the
language-neutral permalink under `/prodotto/<slug>/`, which works for
both locales.

CI block (B-58, 2026-06-05): from 2026-05-30 onward the runner could no
longer reach `watchcenter.ch` — every scheduled run errored with
`[Errno 101] Network is unreachable` (the host responds 200 from
residential and unblocked datacenter IPs). `continue-on-error: true`
silently swallowed it. Probe: swap plain `requests` for `curl_cffi` with
`impersonate="chrome"` (same pattern as `chrono24_lots_scraper.py` +
`auction_lots_scraper._bonhams_get`) so the TLS/JA3 fingerprint matches
a real browser. If the block is fingerprint-driven (Cloudflare-style),
this gets through; if it's pure IP-range, we'll see the same errno and
escalate to the residential-host pattern.

Run: python3 watchcenter_scraper.py
Requires: pip install -r requirements-auctions.txt   (curl-cffi)
Output: watchcenter_listings.csv
"""
import csv
import re
import sys
import time
from html import unescape

try:
    from curl_cffi import requests as cc
except ImportError:
    sys.exit("curl-cffi not installed — `pip install -r requirements-auctions.txt`")

IMPERSONATE = "chrome"
BASE = "https://watchcenter.ch"
API = f"{BASE}/wp-json/wc/store/v1/products"
HEADERS = {
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": f"{BASE}/",
}
SESSION = cc.Session(impersonate=IMPERSONATE)
SESSION.headers.update(HEADERS)

BRANDS = [
    "Rolex", "Omega", "Patek Philippe", "Tudor", "Breitling", "IWC",
    "Cartier", "Jaeger-LeCoultre", "Panerai", "Audemars Piguet",
    "Vacheron Constantin", "A. Lange", "Tag Heuer", "Heuer",
    "Longines", "Universal Geneve", "Movado", "Zenith", "Breguet",
    "Blancpain", "Tissot", "Ebel", "Hamilton", "Seiko",
    "Grand Seiko", "Bulova", "Mido", "Oris", "Junghans", "Chopard",
    "Piaget", "Girard-Perregaux", "Eberhard", "Vianney Halter",
    "F.P. Journe", "Roger Dubuis", "Glashutte", "Glashütte",
    "Chronoswiss", "Doxa", "Aquastar", "Enicar", "Gallet", "Yema",
    "Lemania", "Czapek", "Urwerk", "Wempe", "Wittnauer", "Glycine",
]


def detect_brand(name, categories=None):
    lower = (name or "").lower()
    for b in BRANDS:
        if b.lower() in lower:
            return b
    for cat in categories or []:
        cname = (cat.get("name") or "").lower()
        for b in BRANDS:
            if b.lower() in cname:
                return b
    return "Other"


def strip_html(text):
    if not text:
        return ""
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"&amp;", "&", text)
    text = re.sub(r"&nbsp;", " ", text)
    text = re.sub(r"&#[0-9]+;", "", text)
    return re.sub(r"\s+", " ", text).strip()


def fetch_chunk(page, per_page):
    last_err = None
    for attempt in range(3):
        try:
            r = SESSION.get(API, params={
                "per_page": per_page,
                "page": page,
            }, timeout=30)
            if r.status_code == 200:
                return r.json()
            last_err = f"HTTP {r.status_code}"
            time.sleep(2 ** attempt)
        except Exception as e:  # curl_cffi raises curl_cffi.requests.errors.RequestsError
            last_err = str(e)
            time.sleep(2 ** attempt)
    raise RuntimeError(f"page {page} failed after 3 attempts: {last_err}")


def get_all_listings():
    all_items = []
    page = 1
    per_page = 50
    while True:
        print(f"Fetching page {page}...")
        items = fetch_chunk(page, per_page)
        if not items:
            break
        all_items.extend(items)
        print(f"  Got {len(items)} items (total: {len(all_items)})")
        if len(items) < per_page:
            break
        page += 1
        time.sleep(0.5)
    return all_items


def parse_item(item):
    prices = item.get("prices") or {}
    price_raw = prices.get("price", "0")
    minor = int(prices.get("currency_minor_unit", 0) or 0)
    try:
        price = int(price_raw) // (10 ** minor) if minor else int(price_raw)
    except (ValueError, TypeError):
        price = 0

    images = item.get("images") or []
    img = images[0].get("src", "") if images else ""

    title = unescape(item.get("name", ""))

    return {
        "title": title,
        "brand": detect_brand(title, item.get("categories")),
        "price": price,
        "url": item.get("permalink", ""),
        "img": img,
        "description": strip_html(item.get("description") or item.get("short_description") or "")[:2500],
        "source": "Watch Center",
        "sold": not item.get("is_in_stock", True),
    }


def main():
    print("Fetching Watch Center inventory (WooCommerce Store API)...")
    raw = get_all_listings()
    print(f"\nTotal raw items: {len(raw)}")

    results = [parse_item(it) for it in raw]
    results = [r for r in results if r["price"] > 0]
    skipped = len(raw) - len(results)
    if skipped:
        print(f"Skipped {skipped} items with no price")

    out_file = "watchcenter_listings.csv"
    with open(out_file, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=["title", "brand", "price", "url", "img", "description", "source", "sold"],
        )
        writer.writeheader()
        writer.writerows(results)

    if results:
        prices = [r["price"] for r in results]
        print(f"\n✓ Saved {len(results)} listings to {out_file} (CHF)")
        print(f"  Min: CHF {min(prices):,} | Max: CHF {max(prices):,} | Avg: CHF {sum(prices)//len(prices):,}")
        from collections import Counter
        for b, c in Counter(r["brand"] for r in results).most_common():
            print(f"  {b}: {c}")


if __name__ == "__main__":
    main()
