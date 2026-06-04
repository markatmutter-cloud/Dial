#!/usr/bin/env python3
"""
Romain Réa scraper - Shopify public products API
Run: python3 romainrea_scraper.py
Requires: pip install requests
Output: romainrea_listings.csv

Paris vintage dealer + auction expert (Antiquorum CEO); storefront
prices are EUR (set in merge.py SOURCES — verified from the en-int
locale: Shopify.currency = {"active":"EUR","rate":"1.0"}).

Catalog quirk: the /collections/all-our-watches collection returns an
EMPTY products.json (hidden from the JSON API), so we walk the
store-wide /products.json instead — the store sells watches only
(product_type "Apparel & Accessories > Jewelry > Watches" on ~all of
its ~287 products), so no collection scoping is needed.

URLs are written with the /en-int locale prefix — that's the locale
users browse (per CLAUDE.md), and the bare /products/<handle> path
redirects to the French storefront.

Brand is left 'Other' so merge.py's detect_brand resolves it from the
title (see pascalkarp_scraper.py header for the full rationale —
titles here lead with the brand, e.g. "A. LANGE & SÖHNE SAXONIA …").
"""

import csv
import re
import time

from scraper_lib import fetch_json_with_retry

BASE = "https://romainrea.com"
LOCALE = "/en-int"
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
            f"{BASE}{LOCALE}/products.json",
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
    url = f"{BASE}{LOCALE}/products/{handle}"

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
        'source': 'Romain Réa',
        'date': published_at,
        'sold': not available
    }

def main():
    print("Fetching Romain Réa inventory...")
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

    output = 'romainrea_listings.csv'
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
