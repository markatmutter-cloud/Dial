#!/usr/bin/env python3
"""
Chrono24 per-reference scraper — RESIDENTIAL HOST ONLY (not CI).

Chrono24 is Cloudflare-fronted: datacenter IPs (GitHub Actions) get a 403
challenge, and even a residential plain `requests`/curl is blocked. The one
thing that gets through is curl-cffi impersonating Chrome's TLS/JA3 fingerprint
from a residential IP — the SAME mechanism the Bonhams lot scraper uses
(auction_lots_scraper._bonhams_get). So this runs on Mark's laptop, like
bonhams_lots_scraper.py, and writes a SEPARATE public/chrono24_lots.json the
frontend folds in by URL (the daily CI listings sweep never touches this file).

Scope is deliberately NARROW: Chrono24 has too much inventory to mirror, so we
scrape only the specific references in REFERENCES below (seeded with the
watches we have reference guides for). The results land in the Listings feed
alongside every other scraped watch; the reference-guide page filters them by
its `market` spec to highlight the relevant ones.

Data path (robust — no fragile HTML scraping): the search results page embeds a
JSON-LD `AggregateOffer` block with one Offer per listing (name, price, url,
image) and an authoritative `priceCurrency`. We parse that.

Two URL tricks that matter:
  - `&dosearch=true` — without it the page is an empty JS landing (no results).
  - curl-cffi `impersonate="chrome"` — without it, 403.

Run: python3 chrono24_lots_scraper.py
Requires: pip install -r requirements-auctions.txt   (curl-cffi)
Output: public/chrono24_lots.json   (keyed by listing URL)
"""

import json
import os
import re
import sys
import time
from datetime import date

try:
    from curl_cffi import requests as cc
except ImportError:
    sys.exit("curl-cffi not installed — `pip install -r requirements-auctions.txt`")

# Reference-index matcher (same one merge.py + every scraper uses) so each lot
# carries reference_no / model / model_line and lands on the right guide page.
from pathlib import Path
from reference_index_match import (
    parse_index,
    build_ref_index,
    build_model_name_index,
    match_or_extract,
)
# Central FX table — reuse merge.py's so a USD value is always recorded even if
# Chrono24 ever serves a non-USD locale (don't duplicate the rates here).
from merge import FX

IMPERSONATE = "chrome"
TIMEOUT = 30
OUT_PATH = "public/chrono24_lots.json"

# The references to track. Start narrow (one reference, as a test) and grow this
# list as we add reference guides. `query` is what we type into Chrono24 search;
# `brand` is the canonical brand we stamp + hand the matcher.
REFERENCES = [
    {"brand": "Jaeger-LeCoultre", "query": "Jaeger-LeCoultre E2643"},
    {"brand": "Omega", "query": "Omega Seamaster 145.006"},
]


def _ref_indices():
    brands = parse_index((Path(__file__).parent / "docs" / "watch_references.md").read_text())
    return brands, build_ref_index(brands), build_model_name_index(brands)


def _fetch(query):
    """Fetch a Chrono24 search results page (Chrome-impersonated, residential)."""
    url = (
        "https://www.chrono24.com/search/index.htm"
        f"?query={query.replace(' ', '%20')}&dosearch=true"
    )
    r = cc.get(url, impersonate=IMPERSONATE, timeout=TIMEOUT)
    r.raise_for_status()
    return r.text


def _extract_offers(html):
    """Pull (currency, [offers]) out of the JSON-LD AggregateOffer block.

    Returns (currency, offers) or (None, []) when the page has no results
    block (e.g. a soft block or an empty query landing).
    """
    for blk in re.findall(r'<script type="application/ld\+json"[^>]*>(.*?)</script>', html, re.S):
        try:
            data = json.loads(blk)
        except json.JSONDecodeError:
            continue
        graph = data.get("@graph", []) if isinstance(data, dict) else []
        for node in graph:
            if isinstance(node, dict) and node.get("@type") == "AggregateOffer":
                return node.get("priceCurrency") or "USD", node.get("offers", []) or []
    return None, []


def _offer_to_row(offer, cfg, indices):
    brands, ref_index, model_name_index = indices
    title = (offer.get("name") or "").strip()
    url = offer.get("url") or ""
    if not title or not url:
        return None
    # image is a list of {contentUrl} (sometimes a bare string).
    img = ""
    image = offer.get("image")
    if isinstance(image, list) and image:
        first = image[0]
        img = first.get("contentUrl", "") if isinstance(first, dict) else str(first)
    elif isinstance(image, str):
        img = image
    try:
        price = int(float(offer.get("price") or 0))
    except (ValueError, TypeError):
        price = 0

    # Reference match — fills reference_no / model / model_line so the lot
    # lands on the right reference-guide page and reads consistently in
    # Listings. Brand from config (the search is brand-scoped).
    hit = match_or_extract(
        title, ref_index,
        brand=cfg["brand"],
        brands_in_index=set(brands.keys()),
        model_name_index=model_name_index,
    ) or {}

    return url, {
        "title": title,
        "brand": cfg["brand"],
        "price": price,
        "currency": "USD",  # JSON-LD priceCurrency, recorded per fetch below
        "price_usd": round(price * FX.get("USD", 1.0)),
        "image": img,
        "reference_no": hit.get("reference_no"),
        "model": hit.get("model"),
        "sub_model": hit.get("sub_model"),
        "model_line": hit.get("model_line"),
        "scraped_at": date.today().isoformat(),
    }


def main():
    indices = _ref_indices()
    out = {}
    for cfg in REFERENCES:
        print(f"Fetching Chrono24: {cfg['query']} ...")
        try:
            html = _fetch(cfg["query"])
        except Exception as e:
            print(f"  ERROR fetching {cfg['query']}: {e}")
            continue
        currency, offers = _extract_offers(html)
        if not offers:
            print(f"  no offers parsed for {cfg['query']} (blocked or empty?)")
            continue
        print(f"  {len(offers)} offers, currency={currency}")
        for offer in offers:
            row = _offer_to_row(offer, cfg, indices)
            if not row:
                continue
            url, data = row
            # Record the page's authoritative currency + a USD figure.
            data["currency"] = currency or "USD"
            data["price_usd"] = round(data["price"] * FX.get(currency or "USD", 1.0))
            out[url] = data
            print(f"    ${data['price']:,} {data['currency']} | ref={data['reference_no']} | {data['title'][:50]}")
        time.sleep(1.0)  # be gentle — Chrono24 fights bots

    os.makedirs("public", exist_ok=True)
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
    print(f"\n✓ Wrote {len(out)} listings to {OUT_PATH}")


if __name__ == "__main__":
    main()
