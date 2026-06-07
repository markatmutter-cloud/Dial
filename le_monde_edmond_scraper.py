#!/usr/bin/env python3
"""Le Monde Edmond editorial scraper — WordPress REST API, scoped to
the watch-side categories (Mark spec 2026-06-06).

Le Monde Edmond is a collector-essay site (Edmond / "Mr. A") covering
fine watches AND classic cars. We ingest ONLY the watch + collecting
categories Mark specified — the two public category pages:

  /category/collecting-investing/   → term 7
  /category/fine-watches/           → terms 2 (parent) + its children:
                                       12 fine-watches-collectors-insight
                                       10 fine-watches-interviews
                                        9 fine-watches-events

The classic-cars tree (terms 3/4/5/6) is deliberately excluded. The
category page for `fine-watches` renders parent+children, so the API
filter lists every child term explicitly (WP `categories=` matches
exact term IDs, not the tree).

Low-volume site (~335 posts in scope, posts back to ~2012), so no
brand filtering — the categories ARE the filter. ~30-day rolling
refresh like the other editorial scrapers; LME_FULL_REFRESH=1 forces
a full re-fetch.

Run: python3 le_monde_edmond_scraper.py
Output: public/le_monde_edmond.json + public/le_monde_edmond_bodies.json
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

BASE = "https://le-monde-edmond.com"
API = f"{BASE}/wp-json/wp/v2/posts"
OUTPUT_JSON = "public/le_monde_edmond.json"
OUTPUT_BODIES = derive_bodies_path(OUTPUT_JSON)
SOURCE = "le_monde_edmond"
SOURCE_TYPE = "editorial_blog"

# Watch-side category term IDs (see module docstring). Verified against
# /wp-json/wp/v2/categories 2026-06-06.
CATEGORY_IDS = "2,7,9,10,12"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                  "AppleWebKit/537.36 (KHTML, like Gecko) "
                  "Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json, text/plain, */*",
}

PAGE_SIZE = 100
API_SLEEP = 0.5


def strip_html(html: str) -> str:
    if not html:
        return ""
    txt = re.sub(r"<[^>]+>", " ", html)
    txt = unescape(txt)
    txt = re.sub(r"\s+", " ", txt).strip()
    return txt


def featured_image(post: dict) -> str:
    """Featured image from the _embedded media object (the site doesn't
    expose jetpack_featured_media_url); fall back to the first content
    <img> for the handful of older posts without one set."""
    emb = (post.get("_embedded") or {}).get("wp:featuredmedia") or []
    if emb and isinstance(emb[0], dict):
        src = emb[0].get("source_url") or ""
        if src:
            return src
    body_html = (post.get("content") or {}).get("rendered") or ""
    m = re.search(r'<img[^>]+src="([^"]+)"', body_html)
    return m.group(1) if m else ""


def parse_post(post: dict) -> dict | None:
    title = unescape((post.get("title") or {}).get("rendered") or "")
    url = post.get("link") or ""
    if not title or not url:
        return None

    body_html = (post.get("content") or {}).get("rendered") or ""
    body_text = strip_html(body_html)
    if len(body_text) < 200:
        return None  # stub / no-content posts

    published_at = (post.get("date") or "")[:10]
    updated_at = (post.get("modified") or published_at)[:10]

    resolved = _resolve_brand_and_ref(title)

    return {
        "url": url,
        "slug": post.get("slug") or "",
        "title": title,
        "author": "Le Monde Edmond",
        "published_at": published_at,
        "updated_at": updated_at,
        "image": featured_image(post),
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
    full_refresh = os.environ.get("LME_FULL_REFRESH") == "1"
    print(f"Le Monde Edmond scraper (full_refresh={full_refresh})")

    existing = _load_split(OUTPUT_JSON, OUTPUT_BODIES)
    print(f"  existing entries on disk: {len(existing)}")

    out = dict(existing)
    fetched = skipped = stubs = 0
    page = 1
    while True:
        try:
            r = requests.get(
                API,
                params={
                    "per_page": PAGE_SIZE, "page": page,
                    "categories": CATEGORY_IDS,
                    "orderby": "date", "order": "desc",
                    "_embed": "wp:featuredmedia",
                },
                headers=HEADERS, timeout=30,
            )
        except Exception as e:
            print(f"  page {page} fetch error: {e}")
            break
        if r.status_code == 400:
            break  # WP returns 400 past the last page
        if r.status_code != 200:
            print(f"  page {page} HTTP {r.status_code}")
            break
        posts = r.json()
        if not posts:
            break

        for post in posts:
            url = post.get("link") or ""
            if url in out and not should_refresh(out.get(url), full_refresh):
                skipped += 1
                continue
            record = parse_post(post)
            if not record:
                stubs += 1
                continue
            out[url] = record
            fetched += 1
            print(f"  [{fetched}] {record['published_at']}  {record['title'][:70]}  ({record['word_count']} words)")

        print(f"  page {page}: {len(posts)} posts ({fetched} kept, {stubs} stubs, {skipped} skipped-fresh)")
        if len(posts) < PAGE_SIZE:
            break
        page += 1
        time.sleep(API_SLEEP)

    write_split(out, OUTPUT_JSON, OUTPUT_BODIES)
    print(f"\nFetched: {fetched}  Stubs: {stubs}  Skipped (fresh): {skipped}")
    print(f"Total entries on disk: {len(out)}")
    print(f"Wrote {OUTPUT_JSON} + {OUTPUT_BODIES}")


if __name__ == "__main__":
    main()
