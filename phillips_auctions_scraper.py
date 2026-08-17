#!/usr/bin/env python3
"""
Phillips watch auctions calendar scraper.
Run: python3 phillips_auctions_scraper.py
Requires: pip install requests
Output: phillips_auctions_listings.csv

Parses the server-rendered sale cards on the /watches department page.

Phillips replatformed onto a React/Remix front end ("seldon" design
system) in 2026. The old markup this scraper keyed on — paired
<span class="atc_date_start"> / <span class="atc_date_end"> tags with
ISO datetimes — is gone entirely (zero occurrences), so the scraper
emitted nothing from ~2026-06-30 onward and Phillips silently dropped
out of the calendar. That also cost the lots: the enumerator only
visits sales present in auctions.json.

The new cards are <li class="pah-auction-item"> blocks, each with a
/auction/{CODE}/overview link and a text run of
    {Live|Online} Auction | {title} | [CTA] | {location} | {date label}
The optional CTA ("Accepting Consignments", "View results") is why
location is taken as the field immediately BEFORE the date rather than
by position.

Do NOT switch to /calendar/upcoming — it looks like the natural target
but renders its list client-side and server-returns zero sale links.

Dates come as display text in two shapes:
    "7 – 8 November 2026"                      (live sales)
    "4 September 12pm - 11 September 2pm CEST 2026"   (online sessions)
Both are parsed to ISO; the year is always the trailing token.

Emits past sales as well as upcoming ones, so an empty CSV
unambiguously means "broken" rather than "quiet season" — the
distinction auction_calendar_health.py gates on.
"""
import html as html_mod
import requests
import csv
import re
import sys

from scraper_lib import parse_auction_date_range
from datetime import datetime, date, timezone

URL = "https://www.phillips.com/watches"
BASE = "https://www.phillips.com"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate",
}


def strip_html(t):
    t = re.sub(r'<[^>]+>', ' ', t)
    t = re.sub(r'&amp;', '&', t)
    t = re.sub(r'&#[0-9]+;', '', t)
    t = re.sub(r'\s+', ' ', t)
    return t.strip()


def parse_date_label(label):
    """Phillips labels, incl. online sessions carrying times + timezones
    ("4 September 12pm - 11 September 2pm CEST 2026"). Grammar shared via
    scraper_lib; returns ("", "") rather than (None, None) because callers
    here compare against ISO strings."""
    start, end = parse_auction_date_range(label)
    return (start or "", end or "")


def _card_fields(card_html):
    """Visible text runs of a sale card, in document order."""
    txt = re.sub(r"<[^>]+>", "|", card_html)
    txt = re.sub(r"\|+", "|", txt)
    return [html_mod.unescape(f).strip() for f in txt.split("|")
            if f.strip() and "grid-item" not in f]


def scrape():
    print(f"Fetching {URL} ...")
    r = requests.get(URL, headers=HEADERS, timeout=30)
    r.raise_for_status()
    page = r.text

    cards = page.split('<li class="pah-auction-item')[1:]
    if not cards:
        return []

    today = date.today().isoformat()
    out = {}

    for card in cards:
        card = card[:card.find("</li>")] if "</li>" in card else card[:4000]
        hm = re.search(r'href="(/auction/([A-Z0-9]+)/overview)"', card)
        if not hm:
            continue
        path, code = hm.group(1), hm.group(2)
        if code in out:
            continue

        fields = _card_fields(card)
        # Locate the date field, then read location from just before it.
        di = next((i for i, f in enumerate(fields)
                   if re.search(r"\b(20\d{2})\b", f)
                   and re.search(r"[A-Za-z]{3,}", f)
                   and parse_date_label(f)[0]), None)
        if di is None:
            continue
        date_start, date_end = parse_date_label(fields[di])
        location = fields[di - 1] if di >= 1 else ""
        # Guard against the CTA sitting where a location should be.
        if location in ("Accepting Consignments", "View results"):
            location = ""
        title = fields[1] if len(fields) > 1 else ""
        if not title or not date_start:
            continue

        status = ("past" if date_end < today
                  else "live" if date_start <= today <= date_end
                  else "upcoming")

        out[code] = {
            "house":       "Phillips",
            "title":       title,
            "location":    location,
            "date_start":  date_start,
            "date_end":    date_end,
            "date_label":  (f"{date_start} – {date_end}"
                            if date_end != date_start else date_start),
            "url":         f"{BASE}{path}",
            "has_catalog": "True",
            "source":      "Phillips",
            "status_hint": status,
        }

    return list(out.values())


def main():
    print("Scraping Phillips watch auctions calendar...")
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
        print(f"  {a['date_start']:10s}  {a['location']:12s}  {a['title']}")

    output = 'phillips_auctions_listings.csv'
    with open(output, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=['house','title','location','date_start','date_end','date_label','url','has_catalog','source','status_hint'])
        writer.writeheader()
        writer.writerows(auctions)
    print(f"\nSaved {len(auctions)} auctions to {output}")


if __name__ == "__main__":
    main()
