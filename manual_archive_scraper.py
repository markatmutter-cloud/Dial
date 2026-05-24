#!/usr/bin/env python3
"""
Manual historical-auction scraper — Phase D (Epic 2).

Walks every sale listed in data/manual_archive_sales.json and writes
its lots to public/manual_archive_lots.json. Intended for one-shot
runs when adding a new historical sale to the registry; archive lots
are immutable so there's no recurring cron — once written, the entries
never need re-scraping.

Why a separate output file from public/auction_lots.json:
  - auction_lots.json is rebuilt from scratch by auction_lots_scraper.py
    on every cron run (it walks active sales from auctions.json). If we
    co-located, every cron would clobber the manual archive entries.
  - Keeping them in their own file lets the daily comprehensive sweep
    stay simple, while archive entries stay frozen.

App.js loads both files and merges them by URL key, identical shape,
so the projection into the Listings feed treats them the same way.

Usage:
    python3 manual_archive_scraper.py             # scrape every sale in the registry
    python3 manual_archive_scraper.py --url URL   # scrape one sale ad-hoc

Reuses auction_lots_scraper.enumerate_phillips for lot enumeration
and auctionlots_scraper.scrape_phillips_lot for per-lot detail. The
per-sale 60-lot cap from auction_lots_scraper.PHILLIPS_LOTS_PER_SALE
is overridden here — historical sales aren't time-pressured CI runs.
"""
import argparse
import json
import os
import re
import sys
import time

import requests

# Reach into the existing scraper for the per-house enumerators +
# per-lot fetchers. enumerate_phillips already pulls /detail/<slug>/<id>
# tile paths off the auction page; the cap there is a soft CI guard.
import auction_lots_scraper as als
import auctionlots_scraper as al

OUTPUT_PATH = "public/manual_archive_lots.json"
REGISTRY_PATH = "data/manual_archive_sales.json"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    ),
}


def load_registry():
    with open(REGISTRY_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def load_existing_output():
    if not os.path.exists(OUTPUT_PATH):
        return {}
    try:
        with open(OUTPUT_PATH, "r", encoding="utf-8") as f:
            d = json.load(f)
            return d if isinstance(d, dict) else {}
    except (OSError, json.JSONDecodeError):
        return {}


def enumerate_phillips_uncapped(sale_url):
    """Same as auction_lots_scraper.enumerate_phillips but without the
    PHILLIPS_LOTS_PER_SALE cap. Archive sales aren't a CI-time concern.
    """
    r = requests.get(sale_url, headers=HEADERS, timeout=30)
    r.raise_for_status()
    paths = sorted(set(re.findall(r"/detail/[a-z0-9-]+/\d+", r.text)))
    return [f"https://www.phillips.com{p}" for p in paths]


def scrape_sale(sale):
    """Walk one historical sale and return {url: lot_dict} for every lot.

    Dispatches by URL — same routing rule as the live comprehensive
    scrape's ENUMERATORS map. The orchestrator's per-house enumerators
    already handle archive sales correctly (they read realised prices
    from the catalog page just like they do for live sales), so we
    re-use them rather than maintaining a parallel archive path.
    """
    sale_url = sale["url"]
    house = sale.get("house", "")
    sale_date = sale.get("date")  # YYYY-MM-DD or None
    sale_title = sale.get("title")

    print(f"\n[{house}] {sale_url}")
    if sale_title:
        print(f"  {sale_title}")

    out: dict = {}

    if "phillips.com/auctions/auction/" in sale_url or "phillips.com/auction/" in sale_url:
        # Phillips per-lot detail path — pre-existing archive route.
        # WAF-safe because we're going through per-lot fetches on
        # archive sales (the comprehensive Turbo-Stream path is for
        # active sales). The 0.4s sleep below polices it.
        urls = enumerate_phillips_uncapped(sale_url)
        print(f"  {len(urls)} lot URL(s) found")
        for i, url in enumerate(urls, 1):
            try:
                data = al.scrape_phillips_lot(url)
            except Exception as e:
                print(f"    [{i}/{len(urls)}] FAIL {url}: {e}")
                continue
            if als.is_excluded_title(data.get("title")):
                print(f"    [{i}/{len(urls)}] skip excluded {url}")
                continue
            if sale_date and not data.get("auction_end"):
                data["auction_end"] = sale_date
            if sale_title and not data.get("auction_title"):
                data["auction_title"] = sale_title
            out[url] = data
            sold = data.get("sold_price")
            cur = data.get("currency", "")
            title = (data.get("title") or "")[:60]
            print(f"    [{i}/{len(urls)}] {sold or '—':>7} {cur}  {title}")
            time.sleep(0.4)
        return out

    if "live.antiquorum.swiss/auctions/" in sale_url or "catalog.antiquorum.swiss/" in sale_url:
        # Antiquorum archive: re-use the live enumerator. Live URLs go
        # straight through (?limit=1000 added if missing); catalog URLs
        # bridge to live via the helper, same as the comprehensive
        # scrape. enumerate_antiquorum already routes post-sale URLs
        # through the catalog enumerator when needed, so this works
        # for sales whose live page has archived.
        tuples = als.enumerate_antiquorum(sale_url, {
            "url": sale_url,
            "title": sale_title,
            "dateEnd": sale_date,
        })
        print(f"  {len(tuples)} lot(s) from Antiquorum enumerator")
        for url, data in tuples:
            if als.is_excluded_title(data.get("title")):
                continue
            if sale_date and not data.get("auction_end"):
                data["auction_end"] = sale_date
            if sale_title and not data.get("auction_title"):
                data["auction_title"] = sale_title
            # Antiquorum lot statuses sometimes come back as "sold" /
            # "passed" / "withdrawn" rather than "ended"/"active".
            # Normalize past-sale lots to "ended" for the frontend
            # filter, matching how the comprehensive scraper would
            # have classified them.
            raw = (data.get("status") or "").lower()
            if raw in {"sold", "passed", "withdrawn", "unsold", "bi"}:
                data["status"] = "ended"
            out[url] = data
            sold = data.get("sold_price")
            cur = data.get("currency", "")
            title = (data.get("title") or "")[:60]
            print(f"    {sold or '—':>9} {cur}  {title}")
        return out

    if "christies.com/en/auction/" in sale_url:
        # Christie's archive: re-use the live enumerator. The
        # window.chrComponents.lots blob carries realised prices on
        # ended sales the same way it does on live ones; the pagina-
        # tion-via-?page=N trick handles sales of any size.
        tuples = als.enumerate_christies(sale_url, {
            "url": sale_url,
            "title": sale_title,
            "dateEnd": sale_date,
        })
        print(f"  {len(tuples)} lot(s) from Christie's enumerator")
        # Force status="ended" on past-sale lots — Christie's archive
        # blob keeps `status="active"` indefinitely for some lots even
        # 2+ years post-sale (the per-lot status field isn't flipped
        # in their catalog template). The registry date is the
        # source of truth for "is this auction over?".
        from datetime import date as _date
        sale_is_past = False
        try:
            if sale_date:
                sale_is_past = _date.fromisoformat(sale_date) < _date.today()
        except (ValueError, TypeError):
            pass
        for url, data in tuples:
            if als.is_excluded_title(data.get("title")):
                continue
            if sale_date and not data.get("auction_end"):
                data["auction_end"] = sale_date
            if sale_title and not data.get("auction_title"):
                data["auction_title"] = sale_title
            if sale_is_past:
                data["status"] = "ended"
            out[url] = data
            sold = data.get("sold_price")
            cur = data.get("currency", "")
            title = (data.get("title") or "")[:60]
            print(f"    {sold or '—':>9} {cur}  {title}")
        return out

    if "sothebys.com/en/buy/auction/" in sale_url:
        # Sotheby's archive: re-use the live enumerator. algoliaJson
        # + lotCards (apolloCache) both stay populated on past sales;
        # for SOLD lots `hit.price` is the realised hammer (the live
        # enumerator already gates this on `lotState == "sold"`).
        # Per-lot fetches grab og:image + estimate + LotV2 description
        # the same way they do for active sales.
        #
        # Why this matters: Sotheby's calendar scraper only exposes
        # upcoming sales, so the comprehensive cron never visits past
        # Sotheby's sales — leaving 0 ended Sotheby's lots in
        # auction_lots.json (vs 200-550 for the other houses). Manual
        # archive entries fill the gap on demand: drop a past sale
        # URL into data/manual_archive_sales.json and the lots land
        # in manual_archive_lots.json + flow through to the Sold
        # archive view.
        tuples = als.enumerate_sothebys(sale_url, {
            "url": sale_url,
            "title": sale_title,
            "dateEnd": sale_date,
        })
        print(f"  {len(tuples)} lot(s) from Sotheby's enumerator")
        from datetime import date as _date
        sale_is_past = False
        try:
            if sale_date:
                sale_is_past = _date.fromisoformat(sale_date) < _date.today()
        except (ValueError, TypeError):
            pass
        for url, data in tuples:
            if als.is_excluded_title(data.get("title")):
                continue
            if sale_date and not data.get("auction_end"):
                data["auction_end"] = sale_date
            if sale_title and not data.get("auction_title"):
                data["auction_title"] = sale_title
            # Same status normalization as the Christie's branch. The
            # registry date is the source of truth.
            if sale_is_past:
                data["status"] = "ended"
            out[url] = data
            sold = data.get("sold_price")
            cur = data.get("currency", "")
            title = (data.get("title") or "")[:60]
            print(f"    {sold or '—':>9} {cur}  {title}")
        return out

    print(f"[skip] no archive route for {sale_url}")
    return out


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--url", help="Scrape one sale URL ad-hoc instead of the registry")
    parser.add_argument("--house", default="Phillips", help="House name (only used with --url)")
    parser.add_argument("--date", help="Sale date YYYY-MM-DD (only used with --url)")
    parser.add_argument("--title", help="Sale title (only used with --url)")
    args = parser.parse_args()

    if args.url:
        sales = [{
            "url": args.url, "house": args.house,
            "date": args.date, "title": args.title,
        }]
    else:
        sales = load_registry()

    out = load_existing_output()
    print(f"Loaded {len(out)} existing lot(s) from {OUTPUT_PATH}")

    for sale in sales:
        new_lots = scrape_sale(sale)
        out.update(new_lots)

    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(out, f, indent=2, ensure_ascii=False, sort_keys=True)
    print(f"\n✓ Wrote {len(out)} lot(s) to {OUTPUT_PATH}")
    sold_count = sum(1 for d in out.values() if d.get("status") == "ended")
    print(f"  ({sold_count} ended)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
