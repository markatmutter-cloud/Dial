#!/usr/bin/env python3
"""Watches of Espionage "WOE Dispatch" blog scraper — editorial corpus.

Watches of Espionage (https://www.watchesofespionage.com) is a watch
publication focused on the intersection of horology and special
operations / intelligence / exploration communities. Their blog at
`/blogs/woe-dispatch` covers reference profiles, military issue
watches, astronaut timepieces, and field-use stories.

Shopify blog, same shape as Bulang's `/blogs/watch-talks`. Schema is
the standard editorial-corpus shape (url / slug / title / author /
published_at / updated_at / image / body_text / word_count / brand /
reference_no / model / sub_model / model_line / source /
source_type / scraped_at).

Key differences from `bulangandsons_watch_talks_scraper.py`:
  • BLOG_PATH = /blogs/woe-dispatch
  • Body wrapper anchors on `itemprop="articleBody"` (WOE uses a
    custom theme without the Shopify-default `rte` class — the
    schema.org marker is the most stable selector across articles).
  • Author is usually the byline literal "Watches of Espionage"
    (no per-article bylines), pulled from JSON-LD when present.
  • Single blog with multiple tag views (specialoperations /
    intelligence / explore / featured / video) — we scrape the
    unified `/blogs/woe-dispatch` index, NOT the per-tag pages.

Incremental: re-fetches only articles missing or >30 days since last
scrape. Set WOE_DISPATCH_FULL_REFRESH=1 to force a full pass.

Run: python3 woe_dispatch_scraper.py
Output: public/woe_dispatch.json + public/woe_dispatch_bodies.json
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

BASE = "https://www.watchesofespionage.com"
BLOG_PATH = "/blogs/woe-dispatch"
OUTPUT_JSON = "public/woe_dispatch.json"
OUTPUT_BODIES = derive_bodies_path(OUTPUT_JSON)
SOURCE = "woe_dispatch"
SOURCE_TYPE = "editorial_blog"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                  "AppleWebKit/537.36 (KHTML, like Gecko) "
                  "Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}

INDEX_SLEEP = 0.6
DETAIL_SLEEP = 0.5


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


def discover_urls() -> list[str]:
    """Walk every page of /blogs/woe-dispatch collecting article URLs.
    Standard Shopify ?page=N pagination."""
    urls: list[str] = []
    seen: set[str] = set()
    first_page = fetch(f"{BASE}{BLOG_PATH}")
    if not first_page:
        print("  could not fetch blog index page 1")
        return urls
    page_nums = sorted(set(int(n) for n in re.findall(rf'\?page=(\d+)', first_page)))
    last_page = page_nums[-1] if page_nums else 1
    print(f"  blog has {last_page} pages")

    def harvest(html: str) -> int:
        added = 0
        for m in re.finditer(rf'href="({re.escape(BLOG_PATH)}/[a-z0-9\-]+)"', html):
            u = BASE + m.group(1)
            if u not in seen:
                seen.add(u)
                urls.append(u)
                added += 1
        return added

    n0 = harvest(first_page)
    print(f"  page 1: +{n0} (total {len(urls)})")
    for p in range(2, last_page + 1):
        time.sleep(INDEX_SLEEP)
        html = fetch(f"{BASE}{BLOG_PATH}?page={p}")
        if not html:
            continue
        n = harvest(html)
        print(f"  page {p}: +{n} (total {len(urls)})")
    return urls


def parse_article(html: str, url: str) -> dict | None:
    """Extract title, author, dates, image, body from a WOE Dispatch
    article page.

    Body extraction: locate the schema.org `itemprop="articleBody"`
    container, grab a generous window, terminate at the next major
    structural break, then pull every <p>/<h2>/<h3>/<blockquote>/<li>
    inside.
    """
    if not html:
        return None

    # JSON-LD BlogPosting carries canonical metadata.
    meta: dict = {}
    for m in re.finditer(
        r'<script[^>]+type="application/ld\+json"[^>]*>(.*?)</script>',
        html, re.DOTALL,
    ):
        try:
            blob = json.loads(m.group(1).strip())
        except json.JSONDecodeError:
            continue
        # Sometimes wrapped in @graph
        candidates = []
        if isinstance(blob, dict):
            if "@graph" in blob and isinstance(blob["@graph"], list):
                candidates.extend(blob["@graph"])
            else:
                candidates.append(blob)
        elif isinstance(blob, list):
            candidates.extend(blob)
        for c in candidates:
            if isinstance(c, dict) and c.get("@type") in ("BlogPosting", "Article", "NewsArticle"):
                meta = c
                break
        if meta:
            break

    title = unescape((meta.get("headline") or "").strip())
    if not title:
        m1 = re.search(r'<meta\s+property="og:title"\s+content="([^"]+)"', html)
        if m1:
            title = unescape(m1.group(1).strip())
    if not title:
        m2 = re.search(r"<h1[^>]*>([^<]+)</h1>", html)
        if m2:
            title = unescape(m2.group(1).strip())
    if not title:
        return None

    author = ""
    a = meta.get("author")
    if isinstance(a, dict):
        author = (a.get("name") or "").strip()
    elif isinstance(a, str):
        author = a.strip()
    elif isinstance(a, list) and a:
        first = a[0]
        if isinstance(first, dict):
            author = (first.get("name") or "").strip()
        elif isinstance(first, str):
            author = first.strip()
    if not author:
        # Fallback: look for "By <name>" inside itemprop="author"
        m_au = re.search(
            r'itemprop="author"[^>]*>.*?itemprop="name"[^>]*>(?:By\s*)?([^<]+)</',
            html, re.DOTALL,
        )
        if m_au:
            author = unescape(m_au.group(1)).strip().rstrip(".")

    published_at = (meta.get("datePublished") or "")[:10]
    updated_at   = (meta.get("dateModified") or "")[:10] or published_at
    if not published_at:
        m_dt = re.search(r'<time[^>]+datetime="(\d{4}-\d{2}-\d{2})', html)
        if m_dt:
            published_at = m_dt.group(1)
            updated_at = updated_at or published_at

    image = meta.get("image") or ""
    if isinstance(image, dict):
        image = image.get("url") or image.get("contentUrl") or ""
    if isinstance(image, list) and image:
        first = image[0]
        if isinstance(first, dict):
            image = first.get("url") or first.get("contentUrl") or ""
        elif isinstance(first, str):
            image = first
    if not isinstance(image, str):
        image = ""
    if not image:
        m_og = re.search(r'<meta\s+property="og:image"\s+content="([^"]+)"', html)
        if m_og:
            image = m_og.group(1)

    # Body — anchor on schema.org marker.
    body_text = ""
    m_body = re.search(r'<div[^>]+itemprop="articleBody"[^>]*>', html)
    if m_body:
        start = m_body.end()
        window = html[start:start + 80000]
        end_markers = [
            window.find("<aside", 1),
            window.find("<footer", 1),
            window.find("</article", 1),
            # Article-level tag list typically marks the end of prose.
            window.find('class="article__tags', 1),
            window.find('article-template__bottom', 1),
        ]
        ends = [e for e in end_markers if e > 0]
        if ends:
            window = window[: min(ends)]
        blocks = re.findall(
            r"<(?:p|h2|h3|h4|blockquote|li)(?:\s[^>]*)?>(.*?)</(?:p|h2|h3|h4|blockquote|li)>",
            window, re.DOTALL | re.IGNORECASE,
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
        "slug": url.rsplit("/", 1)[-1],
        "title": title,
        "author": author or "Watches of Espionage",
        "published_at": published_at,
        "updated_at":   updated_at,
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
    full_refresh = os.environ.get("WOE_DISPATCH_FULL_REFRESH") == "1"
    print(f"WOE Dispatch scraper (full_refresh={full_refresh})")
    existing = _load_split(OUTPUT_JSON, OUTPUT_BODIES)
    print(f"  existing entries on disk: {len(existing)}")

    urls = discover_urls()
    print(f"\nDiscovered {len(urls)} article URLs")

    out = dict(existing)
    fetched = skipped = failed = 0
    for i, url in enumerate(urls, 1):
        if not should_refresh(existing.get(url), full_refresh):
            skipped += 1
            continue
        html = fetch(url)
        record = parse_article(html, url)
        if not record:
            failed += 1
            print(f"  [{i}/{len(urls)}] FAILED: {url}")
            time.sleep(DETAIL_SLEEP)
            continue
        out[url] = record
        fetched += 1
        print(f"  [{i}/{len(urls)}] {record['title'][:70]}  ({record['word_count']} words)")
        time.sleep(DETAIL_SLEEP)

    write_split(out, OUTPUT_JSON, OUTPUT_BODIES)
    print(f"\nFetched: {fetched}  Skipped (fresh): {skipped}  Failed: {failed}")
    print(f"Total entries on disk: {len(out)}")
    print(f"Wrote {OUTPUT_JSON} + {OUTPUT_BODIES}")


if __name__ == "__main__":
    main()
