#!/usr/bin/env python3
"""
Bonhams watches auction calendar scraper.
Run: python3 bonhams_auctions_scraper.py
Requires: pip install requests
Output: bonhams_auctions_listings.csv

Bonhams' /department/WCH/watches/ page is Next.js but server-renders
each upcoming sale into an <article data-be="AM"> element. That tag
anchors each auction card cleanly — inside we find an h3 title, a p
with "date-range | location[ | Live auction]", and a status span
("Open for bidding" / "Coming soon" / "Live auction" / etc).

Only upcoming + live sales are emitted. Past sales are not included
on this landing page; merge.py derives past from dateEnd < today just
in case.
"""
import requests
import csv
import re

from scraper_lib import parse_auction_date_range
import sys
from datetime import datetime, date

URL = "https://www.bonhams.com/department/WCH/watches/"
BASE = "https://www.bonhams.com"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate",
}


def parse_date_range(label, fallback_year=None):
    """Bonhams labels ("28 April - 5 May"). Their landing page prints no
    year anywhere, hence fallback_year; a Dec->Jan range rolls the end
    into the next year. Grammar shared via scraper_lib."""
    return parse_auction_date_range(label, fallback_year=fallback_year)

def scrape():
    print(f"Fetching {URL} ...")
    r = requests.get(URL, headers=HEADERS, timeout=30)
    r.raise_for_status()
    html = r.text

    # Find every upcoming-sale card
    articles = list(re.finditer(r'<article[^>]*data-be="AM"[^>]*>', html))
    print(f"Found {len(articles)} article blocks")

    results = []
    today = date.today().isoformat()

    for i, m in enumerate(articles):
        next_start = articles[i + 1].start() if i + 1 < len(articles) else len(html)
        chunk = html[m.start():next_start]

        href_m = re.search(r'href="(/auction/\d+/[^"]*)"', chunk)
        h3_m = re.search(r'<h3[^>]*>([^<]+)</h3>', chunk)
        p_m  = re.search(r'<p[^>]*>([^<]+)</p>', chunk)
        # NOTE: deliberately NOT matching "Live auction" — at Bonhams
        # that phrase is a *venue type* (live in-room sale, vs Online
        # auction), not a bidding-state. It appears on upcoming sales
        # too. Earlier versions confused it with "live now" and
        # incorrectly chipped future London sales as LIVE. Bidding
        # state lives in the actual state phrases below.
        status_m = re.search(
            r'(Open for bidding|Coming soon|Bidding closed|Register to bid|Bid now)',
            chunk,
        )
        if not (href_m and h3_m and p_m):
            continue

        title = h3_m.group(1).strip()
        href = href_m.group(1)
        url = f"{BASE}{href}"
        meta = p_m.group(1).strip()
        meta = meta.replace('–', '-').replace('—', '-')

        # meta looks like "28 April - 5 May | Online, Los Angeles"
        # or                "20 May | London, Knightsbridge | Live auction"
        pieces = [p.strip() for p in meta.split('|')]
        date_label = pieces[0] if pieces else ''
        location   = pieces[1] if len(pieces) > 1 else ''
        date_start, date_end = parse_date_range(date_label)

        # Derive status. Bonhams uses its own phrases which we normalize.
        raw_status = status_m.group(1) if status_m else ''
        if raw_status in ('Open for bidding', 'Bid now', 'Live auction'):
            status_hint = 'live'
        elif raw_status in ('Coming soon', 'Register to bid'):
            status_hint = 'upcoming'
        elif raw_status == 'Bidding closed':
            status_hint = 'past'
        else:
            status_hint = ''

        # Has catalog: Bonhams auction-landing pages always exist once
        # the sale has a sale number (so URL alone isn't a signal).
        # The card explicitly shows "View lots" / "View catalogue" /
        # "Browse lots" only when the catalog is actually published.
        # Cards that just say "Coming soon" / "Register to bid" omit
        # those phrases — those upcoming sales don't have a catalog
        # yet despite having a sale URL.
        # Strip tags first: the CTA renders the lot count in its own span,
        # e.g. `View <span>41</span> lots`, which split the "View … lots"
        # phrase and made this read False for every published catalog
        # (B-72, 2026-06-13). After stripping, allow an optional count token
        # between the verb and "lots".
        chunk_text = re.sub(r"<[^>]+>", " ", chunk)
        has_catalog = bool(re.search(
            r'(?:View|Browse|See)\s+(?:[\d,]+\s+)?(?:lots|catalogue|catalog)',
            chunk_text,
            re.IGNORECASE,
        ))

        # Skip past sales (shouldn't appear on this page anyway)
        if status_hint == 'past':
            continue
        if date_end and date_end < today and status_hint != 'live':
            continue

        results.append({
            'house':       'Bonhams',
            'title':       title,
            'location':    location,
            'date_start':  date_start or '',
            'date_end':    date_end or date_start or '',
            'date_label':  date_label,
            'url':         url,
            'has_catalog': 'True' if has_catalog else 'False',
            'source':      'Bonhams',
            'status_hint': status_hint,
        })

    return results


def main():
    print("Scraping Bonhams watch auctions calendar...")
    auctions = scrape()
    if not auctions:
        print("No auctions parsed — site template may have changed.")
        # Exit non-zero: parsing nothing is a broken selector, not a
        # quiet season (these scrapers return past sales too). Exiting 0
        # here reported success while the calendar silently rotted for
        # six weeks. The step is continue-on-error, so the batch still
        # completes; auction_calendar_health.py decides whether to page.
        sys.exit(1)

    print(f"\nFound {len(auctions)} auction(s):")
    for a in auctions:
        print(f"  [{a['status_hint'] or '?':8s}] {a['date_start']:10s}  {a['location']:30s}  {a['title']}")

    output = 'bonhams_auctions_listings.csv'
    with open(output, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(
            f,
            fieldnames=['house','title','location','date_start','date_end','date_label','url','has_catalog','source','status_hint'],
        )
        writer.writeheader()
        writer.writerows(auctions)
    print(f"\nSaved {len(auctions)} auctions to {output}")


if __name__ == "__main__":
    main()
