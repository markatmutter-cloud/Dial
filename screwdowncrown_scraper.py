#!/usr/bin/env python3
"""Screw Down Crown (kingflum) — Substack editorial corpus scraper.

ScrewDownCrown (https://www.screwdowncrown.com/) is a watch-collecting
publication on Substack covering taste, market commentary, etiquette,
and reference profiles. The publication is partially paywalled —
this scraper captures ONLY the publicly-accessible (`audience:
"everyone"`) posts. Paid posts are deliberately skipped here; Mark
ingests those separately into the personal corpus via the Substack
account export.

Discovery via Substack's public archive API:
  /api/v1/archive?sort=new&offset=N&limit=20

Each item carries an `audience` field — we filter `everyone` only.
Then fetch /p/<slug> for the body. Body wrapper is the standard
Substack `<div class="available-content">` (same shape as the
personal-export HTML files for parity).

Per Mark spec 2026-05-20: surface this as a regular editorial source
in the public corpus (same shelf as WOE / Hodinkee / Hairspring) —
the canonical card link drives traffic to screwdowncrown.com and
amplifies the publisher's subscription funnel. The `subscribe_url`
manifest entry on EditorialView's SOURCES powers an optional
"Subscribe to <publication>" CTA when filtering on this source.

Incremental: re-fetches only articles missing or >30 days since last
scrape. Set SCREWDOWNCROWN_FULL_REFRESH=1 to force a full pass.

Run: python3 screwdowncrown_scraper.py
Output: public/screwdowncrown.json + public/screwdowncrown_bodies.json
"""

from __future__ import annotations

import json
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
        "brand": "",
        "reference_no": None,
        "model": None,
        "sub_model": None,
        "model_line": None,
    }
    title = title or ""
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

BASE = "https://www.screwdowncrown.com"
ARCHIVE_API = f"{BASE}/api/v1/archive"
OUTPUT_JSON = "public/screwdowncrown.json"
OUTPUT_BODIES = derive_bodies_path(OUTPUT_JSON)
SOURCE = "screwdowncrown"
SOURCE_TYPE = "editorial_blog"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                  "AppleWebKit/537.36 (KHTML, like Gecko) "
                  "Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,application/json;q=0.8,*/*;q=0.7",
}

API_SLEEP = 0.4
DETAIL_SLEEP = 0.5
ARCHIVE_PAGE_SIZE = 20


def fetch(url: str, retries: int = 2) -> str:
    for attempt in range(retries + 1):
        try:
            r = requests.get(url, headers=HEADERS, timeout=25)
            if r.status_code == 200:
                return r.text
            print(f"  HTTP {r.status_code} on {url}")
        except requests.RequestException as e:
            print(f"  fetch error on {url}: {e}")
        if attempt < retries:
            time.sleep(2 ** attempt)
    return ""


def fetch_archive_page(offset: int) -> list[dict]:
    """One page of the public Substack archive API.

    Returns an empty list at end-of-archive — caller stops on empty.
    """
    url = f"{ARCHIVE_API}?sort=new&offset={offset}&limit={ARCHIVE_PAGE_SIZE}"
    body = fetch(url)
    if not body:
        return []
    try:
        data = json.loads(body)
    except json.JSONDecodeError:
        return []
    return data if isinstance(data, list) else []


def discover_free_posts() -> list[dict]:
    """Walk the archive API collecting metadata for `audience=everyone`
    posts only. Paid posts get a one-line log entry + are skipped.
    """
    free: list[dict] = []
    paid_count = 0
    offset = 0
    while True:
        page = fetch_archive_page(offset)
        if not page:
            break
        for post in page:
            audience = post.get("audience")
            if audience == "everyone":
                free.append(post)
            else:
                paid_count += 1
        offset += ARCHIVE_PAGE_SIZE
        time.sleep(API_SLEEP)
        if len(page) < ARCHIVE_PAGE_SIZE:
            break
    print(f"  archive walk: {len(free)} free, {paid_count} paid (skipped)")
    return free


def _walk_balanced_div(html: str, open_idx: int) -> str:
    """Given the position of an opening <div ...> tag, walk the HTML
    until the matching closing </div> at the same depth. Returns the
    inner HTML between the open tag and its balanced close.
    """
    end_of_open = html.find(">", open_idx)
    if end_of_open == -1:
        return ""
    pos = end_of_open + 1
    depth = 1
    i = pos
    while i < len(html) and depth > 0:
        nxt_open = html.find("<div", i)
        nxt_close = html.find("</div>", i)
        if nxt_close == -1:
            return html[pos:]
        if nxt_open != -1 and nxt_open < nxt_close:
            depth += 1
            i = nxt_open + 4
        else:
            depth -= 1
            i = nxt_close + 6
    return html[pos:i - 6]


def parse_post(html: str, meta: dict) -> dict | None:
    """Parse a Substack post page. `meta` is the archive-API entry
    (carries slug, post_date, audience, etc.) used as the source of
    truth where the HTML page is ambiguous.
    """
    if not html:
        return None

    slug = meta.get("slug") or ""
    url = meta.get("canonical_url") or f"{BASE}/p/{slug}"

    # Title — og:title is reliable; fall back to <h1>.
    title = (meta.get("title") or "").strip()
    if not title:
        m = re.search(r'<meta property="og:title" content="([^"]+)"', html)
        if m:
            title = unescape(m.group(1)).strip()
    if not title:
        m = re.search(r'<h1[^>]*>(.*?)</h1>', html, re.DOTALL)
        if m:
            title = unescape(re.sub(r'<[^>]+>', ' ', m.group(1))).strip()
    if not title:
        return None

    # Author — Substack JSON-LD or og:article:author.
    author = ""
    for m_ld in re.finditer(
        r'<script[^>]+type="application/ld\+json"[^>]*>(.*?)</script>',
        html, re.DOTALL,
    ):
        try:
            blob = json.loads(m_ld.group(1).strip())
        except json.JSONDecodeError:
            continue
        candidates = []
        if isinstance(blob, dict):
            if "@graph" in blob and isinstance(blob["@graph"], list):
                candidates.extend(blob["@graph"])
            else:
                candidates.append(blob)
        for c in candidates:
            if isinstance(c, dict) and c.get("@type") in ("NewsArticle", "Article", "BlogPosting"):
                a = c.get("author")
                if isinstance(a, dict):
                    author = (a.get("name") or "").strip()
                elif isinstance(a, list) and a:
                    first = a[0]
                    if isinstance(first, dict):
                        author = (first.get("name") or "").strip()
                if author:
                    break
        if author:
            break
    if not author:
        # publishedBylines from archive API as last resort
        bylines = meta.get("publishedBylines") or []
        if isinstance(bylines, list) and bylines:
            first = bylines[0]
            if isinstance(first, dict):
                author = (first.get("name") or "").strip()
    if not author:
        author = "Screw Down Crown"

    # Dates
    published_at = (meta.get("post_date") or "")[:10]
    if not published_at:
        m = re.search(r'<meta property="article:published_time" content="([^"]+)"', html)
        if m:
            published_at = m.group(1)[:10]
    updated_at = published_at

    # Image — og:image preferred, archive cover_image fallback
    image = ""
    m = re.search(r'<meta property="og:image" content="([^"]+)"', html)
    if m:
        image = unescape(m.group(1))
    if not image:
        image = meta.get("cover_image") or ""

    # Body — walk the `available-content` div with depth balancing.
    body_text = ""
    m_body = re.search(r'<div class="available-content"[^>]*>', html)
    if m_body:
        inner = _walk_balanced_div(html, m_body.start())
        blocks = re.findall(
            r"<(?:p|h2|h3|h4|blockquote|li)(?:\s[^>]*)?>(.*?)</(?:p|h2|h3|h4|blockquote|li)>",
            inner, re.DOTALL | re.IGNORECASE,
        )
        cleaned: list[str] = []
        for b in blocks:
            t = re.sub(r"<[^>]+>", " ", b)
            t = unescape(t)
            t = re.sub(r"\s+", " ", t).strip()
            if t:
                cleaned.append(t)
        body_text = "\n\n".join(cleaned)

    if not body_text or len(body_text) < 200:
        return None

    resolved = _resolve_brand_and_ref(title)

    return {
        "url": url,
        "slug": slug,
        "title": title,
        "author": author,
        "published_at": published_at,
        "updated_at": updated_at,
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
    full_refresh = os.environ.get("SCREWDOWNCROWN_FULL_REFRESH") == "1"
    print(f"Screw Down Crown scraper (full_refresh={full_refresh})")
    existing = _load_split(OUTPUT_JSON, OUTPUT_BODIES)
    print(f"  existing entries on disk: {len(existing)}")

    free_posts = discover_free_posts()
    print(f"\nDiscovered {len(free_posts)} free posts")

    out = dict(existing)
    fetched = skipped = failed = 0
    for i, post in enumerate(free_posts, 1):
        slug = post.get("slug") or ""
        url = post.get("canonical_url") or f"{BASE}/p/{slug}"
        if not should_refresh(existing.get(url), full_refresh):
            skipped += 1
            continue
        html = fetch(url)
        record = parse_post(html, post)
        if not record:
            failed += 1
            print(f"  [{i}/{len(free_posts)}] FAILED: {url}")
            time.sleep(DETAIL_SLEEP)
            continue
        out[url] = record
        fetched += 1
        print(f"  [{i}/{len(free_posts)}] {record['title'][:70]}  ({record['word_count']} words)")
        time.sleep(DETAIL_SLEEP)

    write_split(out, OUTPUT_JSON, OUTPUT_BODIES)
    print(f"\nFetched: {fetched}  Skipped (fresh): {skipped}  Failed: {failed}")
    print(f"Total entries on disk: {len(out)}")
    print(f"Wrote {OUTPUT_JSON} + {OUTPUT_BODIES}")


if __name__ == "__main__":
    main()
