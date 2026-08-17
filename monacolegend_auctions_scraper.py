#!/usr/bin/env python3
"""
Monaco Legend Auctions calendar scraper.
Run: python3 monacolegend_auctions_scraper.py
Requires: pip install requests
Output: monacolegend_auctions_listings.csv

Reads the /auction index, which is the site's real calendar. The
homepage used to carry a "Bidding Open" card grid and this scraper
parsed that; Monaco Legend restructured in 2026 and the homepage now
shows only the most recent result, so the old anchor matched nothing
and the scraper emitted zero sales from ~2026-07-04 onward.

/auction renders every sale — past and upcoming — as
<article data-auction-id="NN"> cards inside two Alpine tab panels
(upcoming / past). NB attributes there are SINGLE-quoted
(class='auction-name', href='/auction/...'), which is why
double-quoted patterns find nothing.

Emits past sales as well as upcoming ones. That is deliberate on two
counts: merge.py derives status from the dates anyway, and a scraper
whose output legitimately drops to zero cannot be distinguished from a
broken one — which is exactly the hole auction_calendar_health.py
gates on. With past sales included, an empty CSV always means broken.

That distinction is real here, not theoretical: Monaco Legend has no
sale scheduled as of 2026-08-17. The upcoming panel renders a
"no-upcoming" placeholder ("Our next auction is being curated"). That
is a quiet season, NOT a parse failure, and is reported as such.
"""
import html as html_mod
import json
import requests
import csv
import re
import sys

from scraper_lib import parse_auction_date_range
from datetime import datetime, date

BASE = "https://www.monacolegendauctions.com"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate",
}


def parse_date_range(text):
    """Monaco Legend labels ("25 - 26 April 2026"), entity soup already
    normalised by the caller. Grammar shared via scraper_lib."""
    return parse_auction_date_range(text)


# --- structured data ------------------------------------------------------
# Monaco Legend publishes an schema.org EventSeries whose subEvent[] lists
# every sale with REAL ISO datetimes. Prefer it over scraping the rendered
# cards: JSON-LD is emitted for search engines and survives visual
# redesigns, which is exactly the class of change that silently killed
# this scraper for six weeks. The HTML card path is kept as a fallback for
# when the block is absent or incomplete — belt and braces, since a
# structured source that quietly disappears would otherwise take the whole
# house down again.

LD_RE = re.compile(
    r'<script[^>]+type=["\']application/ld\+json["\'][^>]*>(.*?)</script>',
    re.S,
)


def _ld_blocks(page):
    for raw in LD_RE.findall(page):
        try:
            yield json.loads(raw.strip())
        except (json.JSONDecodeError, ValueError):
            continue


def _sale_events(page):
    """Every subEvent from any EventSeries in the page's JSON-LD."""
    out = []
    for doc in _ld_blocks(page):
        nodes = doc.get("@graph", [doc]) if isinstance(doc, dict) else doc
        for node in (nodes if isinstance(nodes, list) else [nodes]):
            if not isinstance(node, dict) or node.get("@type") != "EventSeries":
                continue
            for sub in node.get("subEvent") or []:
                if isinstance(sub, dict) and sub.get("url"):
                    out.append(sub)
    return out


def _event_city(sub):
    """addressLocality of the sale's Place, if it carries one.

    The location array holds a VirtualLocation (the sale page) alongside
    a Place (the room). It IS per-sale, not the head office — two of the
    19 sales correctly report Lugano — but one sale omits the Place
    entirely, which is why the caller falls back to the card text.
    """
    loc = sub.get("location")
    for item in (loc if isinstance(loc, list) else [loc] if loc else []):
        if isinstance(item, dict) and item.get("@type") == "Place":
            addr = item.get("address")
            if isinstance(addr, dict):
                return (addr.get("addressLocality") or "").strip()
            if isinstance(addr, str):
                return addr.strip()
    return ""


def scrape():
    url = f"{BASE}/auction"
    print(f"Fetching {url} ...")
    r = requests.get(url, headers=HEADERS, timeout=30)
    r.raise_for_status()
    html = r.text

    # Sale cards carry a stable data-auction-id. Splitting on it is more
    # robust than anchoring on section headings, which is what broke last
    # time — headings are copy, ids are structure.
    # Card text keyed by sale path, used both as the fallback parser and
    # to fill a location the structured data happens to omit.
    cards = re.split(r"<article data-auction-id=", html)[1:]

    card_city = {}
    for card in cards:
        href = re.search(r"href='(/auction/[^']+)'", card)
        dtag = re.search(r"<p class='auction-date'>([^<]+)</p>", card)
        if href and dtag and "|" in dtag.group(1):
            city = dtag.group(1).split("|", 1)[1]
            card_city[href.group(1)] = re.sub(
                r"\s+", " ", city.replace("\xa0", " ").replace("&#8288;", " ")
            ).strip()

    # Preferred path: schema.org EventSeries -> subEvent[] with ISO dates.
    events = _sale_events(html)
    if events:
        out = {}
        today_iso = date.today().isoformat()
        for sub in events:
            url = sub.get("url") or ""
            path = url.replace(BASE, "") or url
            if path in out:
                continue
            start = (sub.get("startDate") or "")[:10]
            end = (sub.get("endDate") or "")[:10] or start
            if not start:
                continue
            title = html_mod.unescape(sub.get("name") or "").strip()
            location = _event_city(sub) or card_city.get(path, "")
            status = ("live" if start <= today_iso <= end
                      else "upcoming" if start > today_iso else "past")
            out[path] = {
                "house":       "Monaco Legend",
                "title":       title,
                "location":    location,
                "date_start":  start,
                "date_end":    end,
                "date_label":  (f"{start} - {end}" if end != start else start),
                "url":         url if url.startswith("http") else f"{BASE}{path}",
                "has_catalog": "True" if status in ("live", "past") else "False",
                "source":      "Monaco Legend",
                "status_hint": status,
            }
        if out:
            print(f"  parsed {len(out)} sale(s) from schema.org EventSeries")
            return list(out.values())
        print("  EventSeries present but yielded no usable sales; "
              "falling back to card markup")

    if not cards:
        # No cards at all. Distinguish "site says nothing is scheduled"
        # (fine) from "we no longer understand this page" (broken).
        if "no-upcoming" in html or "next auction is being curated" in html:
            print("Monaco Legend has no scheduled sale right now "
                  "(site shows the 'next auction is being curated' notice).")
        return []

    out = {}
    today_iso = date.today().isoformat()

    for card in cards:
        href = re.search(r"href='(/auction/[^']+)'", card)
        name = re.search(r"<h2 class='auction-name'>\s*(?:<a[^>]*>)?\s*([^<]+)", card)
        dtag = re.search(r"<p class='auction-date'>([^<]+)</p>", card)
        if not (href and name and dtag):
            continue
        path = href.group(1)
        if path in out:
            continue

        # The date cell reads "25 July 2026 | Monaco". Entities and
        # non-breaking / word-joiner spaces are load-bearing noise here:
        # &#8211; en-dash, &#8288; word-joiner, \xa0 nbsp.
        text = dtag.group(1)
        text = text.replace("&#8211;", "-").replace("&#8212;", "-")
        text = text.replace("&#8288;", " ").replace("&nbsp;", " ")
        text = text.replace("\u2013", "-").replace("\u2014", "-")
        text = text.replace("\xa0", " ").replace("&amp;", "&")
        text = re.sub(r"\s+", " ", text).strip()

        if "|" in text:
            date_label, location = [p.strip() for p in text.split("|", 1)]
        else:
            date_label, location = text, ""

        date_start, date_end = parse_date_range(date_label)
        if not date_start:
            continue

        # Titles carry entities ("Exclusive Timepieces &amp; Jewels").
        title = html_mod.unescape(name.group(1)).strip()
        is_live = date_start <= today_iso <= (date_end or date_start)
        status = "live" if is_live else (
            "upcoming" if date_start > today_iso else "past")

        out[path] = {
            "house":       "Monaco Legend",
            "title":       title,
            "location":    location,
            "date_start":  date_start,
            "date_end":    date_end or date_start,
            "date_label":  date_label,
            "url":         f"{BASE}{path}",
            "has_catalog": "True" if status in ("live", "past") else "False",
            "source":      "Monaco Legend",
            "status_hint": status,
        }

    return list(out.values())


def main():
    print("Scraping Monaco Legend Auctions calendar...")
    auctions = scrape()
    if not auctions:
        print("No auctions parsed from the /auction index.")
        # Exit non-zero: parsing nothing is a broken selector, not a
        # quiet season (these scrapers return past sales too). Exiting 0
        # here reported success while the calendar silently rotted for
        # six weeks. The step is continue-on-error, so the batch still
        # completes; auction_calendar_health.py decides whether to page.
        sys.exit(1)

    print(f"\nFound {len(auctions)} auction(s):")
    for a in auctions:
        print(f"  [{a['status_hint']:8s}] {a['date_start']:10s}  {a['location']:15s}  {a['title']}")

    output = 'monacolegend_auctions_listings.csv'
    with open(output, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=['house','title','location','date_start','date_end','date_label','url','has_catalog','source','status_hint'])
        writer.writeheader()
        writer.writerows(auctions)
    print(f"\nSaved {len(auctions)} auctions to {output}")


if __name__ == "__main__":
    main()
