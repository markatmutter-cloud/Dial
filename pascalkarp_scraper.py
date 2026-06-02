#!/usr/bin/env python3
"""
Pascal Karp Watches Expertise scraper - Shopify public products API
Run: python3 pascalkarp_scraper.py
Requires: pip install requests
Output: pascalkarp_listings.csv

Brussels vintage dealer; storefront prices are EUR (set in merge.py SOURCES).
Catalogue is French-language.

We deliberately do NOT detect the brand here — we leave it 'Other' and let
merge.py's load_csv resolve it from the title. Reasons:
  - The Shopify `vendor` field is the store name ("PASCAL KARP WATCHES
    EXPERTISE"), not a watch brand, so it's useless as a hint.
  - The title is the only brand signal, and that's exactly what merge.py's
    detect_brand already uses — with priority ordering (Tag Heuer before Heuer,
    Grand Seiko before Seiko) and accent/hyphen aliases ("Jaeger LeCoultre",
    "Universal Genève"). merge.py TRUSTS a scraper-supplied known brand over its
    own detection, so emitting a naive substring guess here (e.g. "Heuer" for a
    "TAG Heuer" title) would override and defeat that logic.
A third brand list in this file would also drift from the merge.py/utils.js
lockstep pair (see CLAUDE.md). 'Other' is the correct, drift-free choice.
"""

import csv
import re
import time

from scraper_lib import fetch_json_with_retry

BASE = "https://pascalkarpwatchesexpertise.com"
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
            f"{BASE}/products.json",
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
    published_at = p.get('published_at', '2026-06-02')[:10]
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
        'source': 'Pascal Karp',
        'date': published_at,
        'sold': not available
    }

def main():
    print("Fetching Pascal Karp inventory...")
    products = get_all_products()
    print(f"\nTotal products: {len(products)}")

    results = []
    skipped_sold = 0
    skipped_no_price = 0

    for p in products:
        parsed = parse_product(p)

        if parsed['price'] == 0:
            skipped_no_price += 1
            continue
        if parsed['sold']:
            skipped_sold += 1
            continue

        results.append(parsed)
        print(f"  ✓ {parsed['title'][:60]} — €{parsed['price']:,} ({parsed['date']})")

    print(f"\nSkipped: {skipped_sold} sold, {skipped_no_price} no price")

    output = 'pascalkarp_listings.csv'
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
