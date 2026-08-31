#!/usr/bin/env python3
"""Watchfid editorial scraper — WordPress REST API.

Watchfid is the same site the dealer scraper already covers
(`watchfid_scraper.py`), but that one reads the custom `/watch/<slug>/`
post type — the inventory. This reads the OTHER half: the blog posts,
which live at root-level slugs like

    https://www.watchfid.com/the-speedmaster-radial-dials/

(Mark's example, 2026-08-30). Because inventory is a separate custom
post type, `/wp-json/wp/v2/posts` returns editorial only — the post type
IS the filter, so there is no category allowlist here. Same shape as
le_monde_edmond_scraper.py otherwise.

CI reachability: verified 2026-08-30 via source-probe —
`/wp-json/wp/v2/posts?per_page=2` returns HTTP 200, 91,746 bytes, no
Cloudflare challenge markers. Plain `requests` is enough; no curl_cffi.

ELEMENTOR CAVEAT (read this first if the corpus comes back thin).
The site is WordPress + Elementor. Elementor keeps its layout in post
meta and *usually* still renders into `content.rendered` when the REST
API is hit — but on some installs `content.rendered` comes back as bare
shortcodes or near-empty. `parse_post` therefore: strips leftover
`[shortcode]` tags, falls back to `excerpt.rendered` when the body is
too thin, and counts what it dropped so the run log says plainly how
many posts failed the body floor. If a run reports a large
`thin` count, the fix is to fetch the article HTML and parse the
rendered Elementor container, not to lower MIN_BODY_CHARS.

Run: python3 watchfid_editorial_scraper.py
Output: public/watchfid_editorial.json + public/watchfid_editorial_bodies.json
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


from editorial_corpus_io import load_existing as _load_split, write_split, derive_bodies_path

BASE = "https://www.watchfid.com"
API = f"{BASE}/wp-json/wp/v2/posts"
OUTPUT_JSON = "public/watchfid_editorial.json"
OUTPUT_BODIES = derive_bodies_path(OUTPUT_JSON)
SOURCE = "watchfid_editorial"
SOURCE_TYPE = "editorial_blog"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                  "AppleWebKit/537.36 (KHTML, like Gecko) "
                  "Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json, text/plain, */*",
}

PAGE_SIZE = 100
API_SLEEP = 0.5
# Same floor every other editorial scraper uses: filters gallery-only and
# stub posts. Do NOT lower this to paper over an Elementor body problem —
# see the caveat in the module docstring.
MIN_BODY_CHARS = 200


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


def strip_html(html: str) -> str:
    """HTML → plain text, with Elementor's leftover shortcodes removed.

    Elementor and its add-ons leave `[elementor-template id="123"]`-style
    tags in `content.rendered`; they are markup noise, not prose, and
    would otherwise inflate word_count and pollute body search.
    """
    if not html:
        return ""
    txt = re.sub(r"<[^>]+>", " ", html)
    txt = re.sub(r"\[/?[^\]\[]{1,120}\]", " ", txt)
    txt = unescape(txt)
    txt = re.sub(r"\s+", " ", txt).strip()
    return txt


def featured_image(post: dict) -> str:
    """Featured image from the _embedded media object; fall back to the
    first <img> in the body for posts with no featured image set."""
    emb = (post.get("_embedded") or {}).get("wp:featuredmedia") or []
    if emb and isinstance(emb[0], dict):
        src = emb[0].get("source_url") or ""
        if src:
            return src
    body_html = (post.get("content") or {}).get("rendered") or ""
    m = re.search(r'<img[^>]+src="([^"]+)"', body_html)
    return m.group(1) if m else ""


def author_name(post: dict) -> str:
    """Byline from the _embedded author, falling back to the publication
    name — Watchfid posts are house-written and some carry no byline."""
    emb = (post.get("_embedded") or {}).get("author") or []
    if emb and isinstance(emb[0], dict):
        name = (emb[0].get("name") or "").strip()
        if name and name.lower() not in {"admin", "administrator"}:
            return name
    return "Watchfid"


def parse_post(post: dict) -> dict | None:
    title = unescape((post.get("title") or {}).get("rendered") or "")
    url = post.get("link") or ""
    if not title or not url:
        return None

    body_text = strip_html((post.get("content") or {}).get("rendered") or "")
    if len(body_text) < MIN_BODY_CHARS:
        # Elementor fallback: the excerpt is generated from the rendered
        # page, so it survives when content.rendered is shortcode-only.
        body_text = strip_html((post.get("excerpt") or {}).get("rendered") or "")
    if len(body_text) < MIN_BODY_CHARS:
        return None

    published_at = (post.get("date") or "")[:10]
    updated_at = (post.get("modified") or published_at)[:10]
    resolved = _resolve_brand_and_ref(title)

    return {
        "url": url,
        "slug": post.get("slug") or "",
        "title": title,
        "author": author_name(post),
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
    """30-day rolling refresh, same as the other editorial scrapers."""
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
    full_refresh = os.environ.get("WATCHFID_FULL_REFRESH") == "1"
    print(f"Watchfid editorial scraper (full_refresh={full_refresh})")

    existing = _load_split(OUTPUT_JSON, OUTPUT_BODIES)
    print(f"  existing entries on disk: {len(existing)}")

    out = dict(existing)
    fetched = skipped = thin = 0
    page = 1
    while True:
        try:
            r = requests.get(
                API,
                params={
                    "per_page": PAGE_SIZE, "page": page,
                    "orderby": "date", "order": "desc",
                    "_embed": "wp:featuredmedia,author",
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
        try:
            posts = r.json()
        except ValueError:
            print(f"  page {page}: response was not JSON")
            break
        if not posts:
            break

        for post in posts:
            url = post.get("link") or ""
            if url in out and not should_refresh(out.get(url), full_refresh):
                skipped += 1
                continue
            record = parse_post(post)
            if not record:
                thin += 1
                continue
            out[url] = record
            fetched += 1
            print(f"  [{fetched}] {record['published_at']}  {record['title'][:70]}  ({record['word_count']} words)")

        print(f"  page {page}: {len(posts)} posts ({fetched} kept, {thin} thin, {skipped} skipped-fresh)")
        if len(posts) < PAGE_SIZE:
            break
        page += 1
        time.sleep(API_SLEEP)

    write_split(out, OUTPUT_JSON, OUTPUT_BODIES)
    print(f"\nFetched: {fetched}  Thin (below {MIN_BODY_CHARS} chars): {thin}  Skipped (fresh): {skipped}")
    if thin and thin >= fetched:
        print(
            "  ⚠ More posts were dropped as thin than were kept. That is the "
            "Elementor-body failure mode described in this file's docstring — "
            "parse the rendered article HTML instead of lowering MIN_BODY_CHARS."
        )
    print(f"Total entries on disk: {len(out)}")
    print(f"Wrote {OUTPUT_JSON} + {OUTPUT_BODIES}")


if __name__ == "__main__":
    main()
