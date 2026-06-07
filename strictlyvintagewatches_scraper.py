#!/usr/bin/env python3
"""Strictly Vintage Watches editorial scraper — sitemap-based discovery
over a Squarespace site (Mark spec 2026-06-06).

Charlie Dunne's collector-scholarship site: Collector's Guides (in-depth
single-reference essays — heavily JLC: Memovox E851 / 875.42 / 2983 /
3157 Travalarm / Memodate, plus Seamaster 300 ST165024, Rolex 1018,
fuchsia-bezel 1675), the long-form "The Collectibles of Jaeger-LeCoultre"
feature, Inside The Museum, vintage-catalog scans and the
Winding Down The Weekend column. Mark flagged the collector's guides and
the JLC Collectibles page specifically as reference-guide fuel.

Discovery is sitemap.xml (the category pages are Squarespace "page"
collections whose JSON API exposes no item list, so per-category APIs
are a dead end — same reason acollectedman went sitemap). The shop
(/vintagewatches/...) and nav/utility pages are excluded; everything
else is treated as an article and kept if its <main> body extracts to
>=200 words.

`published_at` is the sitemap <lastmod> — Squarespace pages don't expose
a publish date; last-modified is the honest approximation we have.

Run: python3 strictlyvintagewatches_scraper.py
Output: public/strictlyvintagewatches.json + public/strictlyvintagewatches_bodies.json
"""

from __future__ import annotations

import os
import re
import time
from datetime import datetime, timezone
from html import unescape
from pathlib import Path

import requests

try:
    from auction_lot_parsers import infer_brand
except ImportError:
    infer_brand = lambda _t: ""  # noqa: E731

try:
    from reference_index_match import (
        parse_index as _parse_index,
        build_ref_index as _build_ref_index,
        match_against_index as _match_against_index,
    )
    _INDEX_PATH = Path(__file__).parent / "docs" / "watch_references.md"
    _REF_INDEX_CACHE = None

    def _ref_index():
        global _REF_INDEX_CACHE
        if _REF_INDEX_CACHE is None and _INDEX_PATH.exists():
            _REF_INDEX_CACHE = _build_ref_index(_parse_index(_INDEX_PATH.read_text()))
        return _REF_INDEX_CACHE
except ImportError:
    _match_against_index = None
    def _ref_index():
        return None


def _resolve_brand_and_ref(title: str) -> dict:
    out = {
        "brand": "", "reference_no": None,
        "model": None, "sub_model": None, "model_line": None,
    }
    if not title:
        return out
    out["brand"] = infer_brand(title) or ""
    ref_idx = _ref_index()
    if _match_against_index and ref_idx is not None:
        hit = _match_against_index(title, ref_idx)
        if hit:
            if not out["brand"]:
                out["brand"] = hit.get("brand", "") or ""
            out["reference_no"] = hit.get("raw_ref")
            out["model"] = hit.get("model")
            out["sub_model"] = hit.get("sub_model")
            out["model_line"] = hit.get("model_line")
    return out


from editorial_corpus_io import load_existing as _load_split, write_split, derive_bodies_path

BASE = "https://www.strictlyvintagewatches.com"
SITEMAP = f"{BASE}/sitemap.xml"
OUTPUT_JSON = "public/strictlyvintagewatches.json"
OUTPUT_BODIES = derive_bodies_path(OUTPUT_JSON)
SOURCE = "strictlyvintagewatches"
SOURCE_TYPE = "editorial_blog"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                  "AppleWebKit/537.36 (KHTML, like Gecko) "
                  "Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,*/*",
}

FETCH_SLEEP = 0.4

# Shop + nav/utility paths that aren't articles. The shop's product pages
# all live under /vintagewatches/; the rest are section indexes or forms.
EXCLUDED_PATH_PREFIXES = (
    "/vintagewatches",
    "/cart", "/search", "/about", "/newsletter", "/outgoing-newsletter",
    "/sell-your-watch", "/articles", "/columns", "/collectors-guides",
    "/inside-the-museum", "/home", "/significant-watches-podcast",
)


def is_article_url(url: str) -> bool:
    path = url.replace(BASE, "") or "/"
    if path == "/":
        return False
    return not any(path == p or path.startswith(p + "/") or path.startswith(p + "?")
                   for p in EXCLUDED_PATH_PREFIXES)


def fetch_sitemap() -> list[dict]:
    """Sitemap entries: url + lastmod + the first image (loc) when present."""
    r = requests.get(SITEMAP, headers=HEADERS, timeout=30)
    r.raise_for_status()
    entries = []
    for block in re.findall(r"<url>(.*?)</url>", r.text, re.DOTALL):
        loc = re.search(r"<loc>([^<]+)</loc>", block)
        if not loc:
            continue
        lastmod = re.search(r"<lastmod>([^<]+)</lastmod>", block)
        img = re.search(r"<image:loc>([^<]+)</image:loc>", block)
        entries.append({
            "url": loc.group(1).strip(),
            "lastmod": (lastmod.group(1).strip()[:10] if lastmod else ""),
            "image": (img.group(1).strip() if img else ""),
        })
    return entries


def strip_html(html: str) -> str:
    if not html:
        return ""
    txt = re.sub(r"<[^>]+>", " ", html)
    txt = unescape(txt)
    txt = re.sub(r"\s+", " ", txt).strip()
    return txt


def parse_article(url: str, html: str, sitemap_entry: dict) -> dict | None:
    tm = re.search(r"<title>([^<]*)</title>", html)
    title = unescape(tm.group(1)).strip() if tm else ""
    title = re.sub(r"\s*[—|-]+\s*Strictly Vintage Watches\s*$", "", title).strip()
    if not title:
        return None

    # Body: <p> blocks scoped to <main> — Squarespace keeps nav/footer
    # outside it, so this avoids the menu/CSS junk a whole-page pass picks up.
    mm = re.search(r"<main[^>]*>(.*)</main>", html, re.DOTALL)
    scope = mm.group(1) if mm else html
    ps = re.findall(r"<p[^>]*>(.*?)</p>", scope, re.DOTALL)
    body_text = strip_html(" ".join(ps))
    if len(body_text.split()) < 200:
        return None  # section stubs, image-only pages

    om = (re.search(r'property="og:image"[^>]+content="([^"]+)"', html)
          or re.search(r'content="([^"]+)"[^>]+property="og:image"', html))
    image = om.group(1) if om else (sitemap_entry.get("image") or "")

    published_at = sitemap_entry.get("lastmod") or ""

    resolved = _resolve_brand_and_ref(title)

    return {
        "url": url,
        "slug": url.rstrip("/").rsplit("/", 1)[-1],
        "title": title,
        "author": "Strictly Vintage Watches",
        "published_at": published_at,
        "updated_at": published_at,
        "image": image,
        "body_text": body_text,
        "word_count": len(body_text.split()),
        "brand": resolved["brand"],
        "reference_no": resolved["reference_no"],
        "model": resolved["model"],
        "sub_model": resolved["sub_model"],
        "model_line": resolved["model_line"],
        "source": SOURCE,
        "source_type": SOURCE_TYPE,
        "scraped_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    }


def should_refresh(existing_entry: dict | None, full: bool) -> bool:
    if full or not existing_entry:
        return True
    try:
        s = existing_entry.get("scraped_at")
        if not s:
            return True
        dt = datetime.fromisoformat(s.replace("Z", "+00:00"))
        return (datetime.now(timezone.utc) - dt).days >= 30
    except Exception:
        return True


def main():
    full_refresh = os.environ.get("SVW_FULL_REFRESH") == "1"
    print(f"Strictly Vintage Watches scraper (full_refresh={full_refresh})")

    existing = _load_split(OUTPUT_JSON, OUTPUT_BODIES)
    print(f"  existing entries on disk: {len(existing)}")

    entries = [e for e in fetch_sitemap() if is_article_url(e["url"])]
    print(f"  sitemap article candidates: {len(entries)}")

    out = dict(existing)
    fetched = skipped = stubs = failed = 0
    for e in entries:
        url = e["url"]
        if url in out and not should_refresh(out.get(url), full_refresh):
            skipped += 1
            continue
        try:
            r = requests.get(url, headers=HEADERS, timeout=30)
            if r.status_code != 200:
                print(f"  HTTP {r.status_code}  {url}")
                failed += 1
                continue
        except Exception as ex:
            print(f"  FAIL {url}: {ex}")
            failed += 1
            continue
        record = parse_article(url, r.text, e)
        if not record:
            stubs += 1
            continue
        out[url] = record
        fetched += 1
        print(f"  [{fetched}] {record['published_at']}  {record['title'][:70]}  ({record['word_count']} words)")
        time.sleep(FETCH_SLEEP)

    write_split(out, OUTPUT_JSON, OUTPUT_BODIES)
    print(f"\nFetched: {fetched}  Stubs: {stubs}  Skipped (fresh): {skipped}  Failed: {failed}")
    print(f"Total entries on disk: {len(out)}")
    print(f"Wrote {OUTPUT_JSON} + {OUTPUT_BODIES}")


if __name__ == "__main__":
    main()
