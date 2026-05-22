#!/usr/bin/env python3
"""Christie's Stories scraper — editorial corpus.

Christie's publishes long-form editorial under christies.com/en/stories/
— collecting guides, "X reasons" listicles, deconstructed series,
celebrity-watch features, market commentary. Substantive (typical
article: ~1,500–2,500 words, 40+ paragraphs, clear subheadings) and
ungated.

Discovery is via a curated URL list at `data/christies_stories_urls.json`
because Christie's stories index (`christies.com/en/stories`) is a
client-rendered SPA (302 redirect on direct fetch) and the main
sitemap.xml is just a lot-finder redirector. URLs added manually by
Mark — paste a new URL into the JSON file and it's picked up on the
next cron run.

Page-structure notes:
  - Title          → og:title (clean) + <h1>
  - Description    → <meta name="description">
  - Image          → og:image (full-res CDN URL)
  - Date           → `"datePublished":"..."` in the inline Sitecore
                     JSS payload
  - Body           → all <p> tags with substantive text (>80 chars,
                     not matching common footer/nav patterns). Christie's
                     doesn't use a single body-wrapper class; the inline
                     <main> contains the article paragraphs interspersed
                     with image/embed markup. Concatenated in source
                     order.
  - Subheadings    → <h2> within main, useful structural signal but
                     we fold them into body_text by default.

Run: python3 christies_stories_scraper.py
Env:
  CHRISTIES_STORIES_FULL_REFRESH=1   force re-fetch every URL (default
                                     skips entries scraped <30 days ago)
Output: public/christies_stories.json
      + public/christies_stories_bodies.json
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

# Best-effort brand + reference resolution (same import shape every
# other editorial scraper uses; falls through if optional deps missing).
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


URL_LIST_PATH = Path(__file__).parent / "data" / "christies_stories_urls.json"
OUTPUT_JSON = "public/christies_stories.json"
OUTPUT_BODIES = derive_bodies_path(OUTPUT_JSON)
SOURCE = "christies_stories"
SOURCE_TYPE = "editorial_publisher"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                  "AppleWebKit/537.36 (KHTML, like Gecko) "
                  "Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}

DETAIL_SLEEP = 0.6


def _resolve_brand_and_ref(title: str) -> dict:
    out = {
        "brand": "",
        "reference_no": None,
        "model": None,
        "sub_model": None,
        "model_line": None,
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


def fetch(url: str, retries: int = 2) -> str:
    for attempt in range(retries + 1):
        try:
            r = requests.get(url, headers=HEADERS, timeout=30)
            if r.status_code == 200:
                return r.text
            print(f"  HTTP {r.status_code} on {url}")
        except requests.RequestException as e:
            print(f"  fetch error on {url}: {e}")
        if attempt < retries:
            time.sleep(2 ** attempt)
    return ""


def discover_urls() -> list[str]:
    """Load the curated URL list from data/christies_stories_urls.json."""
    if not URL_LIST_PATH.exists():
        print(f"  URL list not found at {URL_LIST_PATH}")
        return []
    try:
        blob = json.loads(URL_LIST_PATH.read_text())
    except Exception as e:
        print(f"  URL list unreadable: {e}")
        return []
    urls = blob.get("urls") or []
    urls = [u for u in urls if isinstance(u, str) and u.startswith("https://www.christies.com/en/stories/")]
    print(f"  curated URL list → {len(urls)} stories")
    return urls


# Heuristics for body-paragraph quality. Christie's wraps article paragraphs
# in plain <p> tags interspersed with image/embed markup, but the same
# template is used for site-wide footers, "Related stories" callouts, and
# "Sign up to our newsletter" copy. Filter those out by exact text match
# or substring on common footer chrome.
_FOOTER_PATTERNS = (
    "sign up",
    "subscribe to our newsletter",
    "browse current and upcoming",
    "all rights reserved",
    "discover christie",
    "©",
    "cookie",
    "privacy",
    "find out more about",
    "more from christie",
    "related articles",
    "related stories",
    "related departments",
    "related lots",
    "related auctions",
    "related content",
)


def _is_footer_paragraph(text: str) -> bool:
    low = text.lower()
    return any(p in low for p in _FOOTER_PATTERNS)


def _extract_paragraphs(html: str) -> list[str]:
    """Pull substantive paragraphs from an HTML doc. Shared between the
    direct Christie's story HTML extraction and the Shorthand fallback."""
    out: list[str] = []
    for m in re.finditer(r"<p(?:\s[^>]*)?>(.+?)</p>", html, re.S):
        text = re.sub(r"<[^>]+>", " ", m.group(1))
        text = unescape(text)
        text = re.sub(r"\s+", " ", text).strip()
        if len(text) < 80:
            continue
        if _is_footer_paragraph(text):
            continue
        out.append(text)
    return out


def _extract_shorthand_src(html: str) -> str:
    """Return the bare Shorthand Social URL for a Shorthand-templated
    story, or empty string if this isn't one. Christie's offloads long-
    form scrollytelling articles to christies.shorthandstories.com — the
    static HTML on christies.com is just an embed shell with no article
    paragraphs. The embed script URL appears as
    `<script src="https://christies.shorthandstories.com/<slug>/embed.js">`;
    strip the `/embed.js` suffix to get the renderable bare URL.
    """
    m = re.search(
        r'(https?://[a-z0-9-]+\.shorthandstories\.com/[a-z0-9-]+)/embed\.js',
        html, re.I,
    )
    if not m:
        return ""
    return m.group(1) + "/"


def parse_article(html: str, url: str) -> dict | None:
    """Pull title / author / date / image / body from a Christie's story.

    Christie's exposes the key metadata via standard og: + article:
    meta tags (we don't need to parse the inline Sitecore JSS blob for
    those). Body extraction has two paths:

      1. Default: <p> tags within the Christie's story HTML.
      2. Shorthand fallback: a subset of stories use the "Shorthand
         Story Page" template — Christie's offloads them to
         christies.shorthandstories.com and the static HTML on
         christies.com contains only the embed shell with no article
         paragraphs. When the direct extraction yields <300 chars,
         we detect the Shorthand src in the HTML and re-fetch the
         bare URL to extract from there.
    """
    if not html:
        return None

    def _meta(prop_name, attr="property"):
        m = re.search(
            rf'<meta[^>]+{attr}=["\']({re.escape(prop_name)})["\'][^>]+content=["\']([^"\']+)["\']',
            html, re.I,
        )
        if m:
            return unescape(m.group(2)).strip()
        # Try the reversed attribute order
        m = re.search(
            rf'<meta[^>]+content=["\']([^"\']+)["\'][^>]+{attr}=["\']({re.escape(prop_name)})["\']',
            html, re.I,
        )
        if m:
            return unescape(m.group(1)).strip()
        return ""

    title = _meta("og:title")
    if not title:
        m = re.search(r"<h1[^>]*>(.*?)</h1>", html, re.S)
        if m:
            title = unescape(re.sub(r"<[^>]+>", " ", m.group(1))).strip()
    if not title:
        m = re.search(r"<title[^>]*>([^<]+)</title>", html)
        if m:
            title = re.sub(r"\s*\|\s*Christie'?s\s*$", "", unescape(m.group(1)).strip())
    if not title:
        return None

    description = _meta("description", attr="name") or _meta("og:description")
    image = _meta("og:image")
    # Strip Christie's image-handler query string trailing bits for a
    # cleaner stored URL — but only the encoded ones, keep ?h= sizing.
    if image:
        image = unescape(image)

    # Date from inline Sitecore payload
    published_at = ""
    m = re.search(r'"datePublished"\s*:\s*"([^"]+)"', html)
    if m:
        published_at = m.group(1)[:10]
    if not published_at:
        published_at = _meta("article:published_time")[:10] or ""

    # Body — direct extraction first; Shorthand fallback if it's a
    # Shorthand-templated story (christies.com page is just the embed
    # shell + the real text is on christies.shorthandstories.com).
    blocks = _extract_paragraphs(html)
    body_text = "\n\n".join(blocks)
    shorthand_url = ""
    if len(body_text) < 300:
        shorthand_url = _extract_shorthand_src(html)
        if shorthand_url:
            print(f"    Shorthand fallback → {shorthand_url}")
            time.sleep(DETAIL_SLEEP)
            shorthand_html = fetch(shorthand_url)
            if shorthand_html:
                blocks = _extract_paragraphs(shorthand_html)
                body_text = "\n\n".join(blocks)
    if len(body_text) < 300:
        return None

    # Optionally fold in <h2> subheadings between paragraphs — improves
    # navigability for readers. Skip the standard "Related..." headings.
    # (Disabled for v1 — the simple body_text join is cleaner; revisit
    # if Mark wants subheadings visible.)

    resolved = _resolve_brand_and_ref(title + " " + description)

    return {
        "url": url,
        "slug": url.rsplit("/", 1)[-1],
        "title": title,
        "author": "",
        "published_at": published_at,
        "updated_at": published_at,
        "image": image,
        "description": description,
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
    full_refresh = os.environ.get("CHRISTIES_STORIES_FULL_REFRESH") == "1"
    print(f"Christie's Stories scraper (full_refresh={full_refresh})")
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
        print(f"  [{i}/{len(urls)}] {record['title'][:78]}  ({record['word_count']} words)")
        time.sleep(DETAIL_SLEEP)

    write_split(out, OUTPUT_JSON, OUTPUT_BODIES)
    print(f"\nFetched: {fetched}  Skipped (fresh): {skipped}  Failed: {failed}")
    print(f"Total entries on disk: {len(out)}")
    print(f"Wrote {OUTPUT_JSON} + {OUTPUT_BODIES}")


if __name__ == "__main__":
    main()
