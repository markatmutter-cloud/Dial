#!/usr/bin/env python3
"""Romain Réa editorial scraper — Expert Files + Dating blogs.

Romain Réa (Paris dealer + Antiquorum CEO) is scraped at the listing
level by `romainrea_scraper.py`. This separate scraper captures the
two editorial blogs on the same Shopify store:

  • /en-int/blogs/expert-files — collector-grade reference essays
    (1675 vs 16750, Yema history, Paul Newman panda 6263, …)
  • /en-int/blogs/dating — press / interviews / "minute of the
    expert" video posts, with the occasional real essay

Content reality (probed 2026-06-04): both blogs mix real prose with
stub posts — video embeds and "Download" wrappers around PDFs hosted
on their OLD WordPress site (romainrea.com/wp-content/… now 301s to
the Shopify homepage, so the PDFs are dead — nothing to ingest there).
The standard `< 100 words → drop` corpus threshold cleanly separates
the two: real essays run 300–700 words, stubs run 0–20. Expect only
a handful of corpus entries (~5–8 of 31 posts) — that's the actual
prose available, not a scraper gap.

Same shape as `bulangandsons_watch_talks_scraper.py` (template), with
two differences:
  • Walks TWO blog paths into one corpus file / one source key.
  • JSON-LD here is `@type: Article` (not BlogPosting) and its
    `image` field is garbage ("https:ArticleDrop") — og:image is the
    reliable hero; author is the literal "Shopify API" → blanked.

Incremental: re-fetches only articles missing or >30 days since last
scrape. Set ROMAINREA_EDITORIAL_FULL_REFRESH=1 to force a full pass.

Run: python3 romainrea_editorial_scraper.py
Output: public/romainrea_editorial.json + public/romainrea_editorial_bodies.json
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

BASE = "https://romainrea.com"
BLOG_PATHS = ["/en-int/blogs/expert-files", "/en-int/blogs/dating"]
OUTPUT_JSON = "public/romainrea_editorial.json"
OUTPUT_BODIES = derive_bodies_path(OUTPUT_JSON)
SOURCE = "romainrea_editorial"
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
    """Walk every page of both blogs collecting article URLs.
    Standard Shopify ?page=N pagination (expert-files runs 2 pages,
    dating 1 — tiny blogs, but pagination-walked so growth is free)."""
    urls: list[str] = []
    seen: set[str] = set()

    for blog_path in BLOG_PATHS:
        first_page = fetch(f"{BASE}{blog_path}")
        if not first_page:
            print(f"  could not fetch blog index {blog_path}")
            continue
        page_nums = sorted(set(int(n) for n in re.findall(r'\?page=(\d+)', first_page)))
        last_page = page_nums[-1] if page_nums else 1
        print(f"  {blog_path}: {last_page} page(s)")

        def harvest(html: str) -> int:
            added = 0
            for m in re.finditer(rf'href="({re.escape(blog_path)}/[a-z0-9\-]+)"', html):
                u = BASE + m.group(1)
                if u not in seen:
                    seen.add(u)
                    urls.append(u)
                    added += 1
            return added

        n0 = harvest(first_page)
        print(f"    page 1: +{n0} (total {len(urls)})")
        for p in range(2, last_page + 1):
            time.sleep(INDEX_SLEEP)
            html = fetch(f"{BASE}{blog_path}?page={p}")
            if not html:
                continue
            n = harvest(html)
            print(f"    page {p}: +{n} (total {len(urls)})")
    return urls


def parse_article(html: str, url: str) -> dict | None:
    """Extract title, dates, image, body from a Romain Réa article.

    Body extraction: locate `itemprop="articleBody"`, window to the
    closing `</article`, strip scripts, then pull every <p>/<h2>/<h3>/
    <blockquote>/<li> block. Stub posts (video embeds, dead-PDF
    "Download" wrappers) yield <100 words and are dropped — see the
    module header; that's deliberate, not a parse failure.
    """
    if not html:
        return None

    # JSON-LD here is @type: Article; headline + datePublished are
    # trustworthy, image/author are not (see module header).
    meta: dict = {}
    for m in re.finditer(
        r'<script[^>]+type="application/ld\+json"[^>]*>(.*?)</script>',
        html, re.DOTALL,
    ):
        try:
            blob = json.loads(m.group(1).strip())
            if isinstance(blob, dict) and blob.get("@type") in ("Article", "BlogPosting"):
                meta = blob
                break
        except json.JSONDecodeError:
            pass

    title = unescape((meta.get("headline") or "").strip())
    if not title:
        m1 = re.search(r"<h1[^>]*>([^<]+)</h1>", html)
        if m1:
            title = unescape(m1.group(1).strip())
    if not title:
        return None

    # Author: the store publishes via API and stamps "Shopify API" —
    # noise, not a byline. Blank it.
    author = ""
    a = meta.get("author")
    if isinstance(a, dict):
        author = (a.get("name") or "").strip()
    elif isinstance(a, str):
        author = a.strip()
    if author == "Shopify API":
        author = ""

    published_at = (meta.get("datePublished") or "")[:10]
    updated_at   = (meta.get("dateModified") or "")[:10] or published_at

    # Hero image from og:image (JSON-LD image is malformed here).
    image = ""
    og = re.search(r'<meta property="og:image" content="([^"]+)"', html)
    if og:
        image = og.group(1).replace("http://", "https://")

    body_text = ""
    start = html.find('itemprop="articleBody"')
    if start >= 0:
        end = html.find("</article", start)
        window = html[start:end if end > 0 else start + 30000]
        window = re.sub(r"<script.*?</script>", "", window, flags=re.DOTALL)
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

    if not body_text or len(body_text.split()) < 100:
        return None

    resolved = _resolve_brand_and_ref(title)

    return {
        "url": url,
        "slug": url.rsplit("/", 1)[-1],
        "title": title,
        "author": author,
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
    full_refresh = os.environ.get("ROMAINREA_EDITORIAL_FULL_REFRESH") == "1"
    print(f"Romain Réa editorial scraper (full_refresh={full_refresh})")
    existing = _load_split(OUTPUT_JSON, OUTPUT_BODIES)
    print(f"  existing entries on disk: {len(existing)}")

    urls = discover_urls()
    print(f"\nDiscovered {len(urls)} article URLs")

    out = dict(existing)
    fetched = skipped = thin = 0
    for i, url in enumerate(urls, 1):
        if not should_refresh(existing.get(url), full_refresh):
            skipped += 1
            continue
        html = fetch(url)
        record = parse_article(html, url)
        if not record:
            thin += 1
            print(f"  [{i}/{len(urls)}] thin/stub (video or dead PDF), dropped: {url.rsplit('/', 1)[-1]}")
            time.sleep(DETAIL_SLEEP)
            continue
        out[url] = record
        fetched += 1
        print(f"  [{i}/{len(urls)}] {record['title'][:70]}  ({record['word_count']} words)")
        time.sleep(DETAIL_SLEEP)

    write_split(out, OUTPUT_JSON, OUTPUT_BODIES)
    print(f"\nFetched: {fetched}  Skipped (fresh): {skipped}  Thin/stub dropped: {thin}")
    print(f"Total entries on disk: {len(out)}")
    print(f"Wrote {OUTPUT_JSON} + {OUTPUT_BODIES}")


if __name__ == "__main__":
    main()
