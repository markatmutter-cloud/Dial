#!/usr/bin/env python3
"""
Tokant Paris scraper - Shopify public products API
Run: python3 tokant_scraper.py
Requires: pip install requests
Output: tokant_listings.csv

Paris vintage dealer; storefront prices are EUR (set in merge.py SOURCES).

Scoped to the /collections/watches-2 collection (Mark's request) — the
collection-level products.json works here, and it keeps any non-watch
inventory out without title heuristics. The collection includes sold
pieces (available=false); we skip those like every other Shopify dealer.

Brand is left 'Other' so merge.py's detect_brand resolves it from the
title — the Shopify `vendor` field here is junk ("watches"), and a local
brand list would drift from the merge.py/utils.js lockstep pair (see
pascalkarp_scraper.py header for the full rationale).
"""

import csv
import re
import time

from scraper_lib import fetch_json_with_retry

BASE = "https://tokant-paris.com"
COLLECTION = "watches-2"
HEADERS = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"}

def strip_html(text):
    if not text:
        return ''
    text = re.sub(r'\\u[0-9a-fA-F]{4}', lambda m: chr(int(m.group(0)[2:], 16)), text)
    text = re.sub(r'<[^>]+>', ' ', text)
    text = re.sub(r'&amp;', '&', text)
    text = re.sub(r'&nbsp;', ' ', text)
    text = re.sub(r'&#[0-9]+;', '', text)
    return re.sub(r'\s+', ' ', text).strip()

def get_all_products():
    all_products = []
    page = 1

    while True:
        print(f"Fetching page {page}...")
        data = fetch_json_with_retry(
            f"{BASE}/collections/{COLLECTION}/products.json",
            headers=HEADERS,
            params={'limit': 250, 'page': page},
        )
        products = data.get('products', [])

        if not products:
            break

        all_products.extend(products)
        print(f"  Got {len(products)} (total: {len(all_products)})")

        if len(products) < 250:
            break

        page += 1
        time.sleep(0.3)

    return all_products

def parse_product(p):
    title = p.get('title', '')
    body = strip_html(p.get('body_html', ''))[:2500]
    published_at = p.get('published_at', '2026-06-04')[:10]
    handle = p.get('handle', '')
    url = f"{BASE}/products/{handle}"

    variants = p.get('variants', [])
    price = 0
    available = False
    if variants:
        v = variants[0]
        try:
            price = int(float(v.get('price', '0')))
        except (ValueError, TypeError):
            price = 0
        available = v.get('available', False)

    images = p.get('images', [])
    img = images[0]['src'] if images else ''

    return {
        'title': title,
        'brand': 'Other',  # merge.py resolves brand from the title (see header)
        'price': price,
        'url': url,
        'img': img,
        'description': body,
        'source': 'Tokant',
        'date': published_at,
        'sold': not available
    }

def main():
    print("Fetching Tokant Paris inventory...")
    products = get_all_products()
    print(f"\nTotal products: {len(products)}")

    results = []
    skipped_sold = 0
    skipped_no_price = 0

    for p in products:
        parsed = parse_product(p)

        # The collection carries one non-watch gimmick product
        # ("TOKANT X BITCOIN", €1M — a we-take-crypto banner). Skip it.
        if 'bitcoin' in parsed['title'].lower():
            continue

        if parsed['price'] == 0:
            skipped_no_price += 1
            continue
        if parsed['sold']:
            skipped_sold += 1
            continue

        results.append(parsed)
        print(f"  ✓ {parsed['title'][:60]} — €{parsed['price']:,} ({parsed['date']})")

    print(f"\nSkipped: {skipped_sold} sold, {skipped_no_price} no price")

    output = 'tokant_listings.csv'
    with open(output, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=['title','brand','price','url','img','description','source','date','sold'])
        writer.writeheader()
        writer.writerows(results)

    if results:
        prices = [r['price'] for r in results]
        print(f"\n✓ Saved {len(results)} listings to {output}")
        print(f"  Min: €{min(prices):,} | Max: €{max(prices):,} | Avg: €{sum(prices)//len(prices):,}")

if __name__ == "__main__":
    main()
