#!/usr/bin/env python3
"""Fratello Watches editorial scraper — WordPress REST API, scoped to
Mark's brand allowlist + collector-philosophy general content.

Fratello is a high-volume watch publication (10K+ articles dating
back to ~2011). Per Mark spec 2026-05-20, we DON'T ingest the full
corpus — instead apply an explicit brand allowlist + a small
collector-philosophy keyword allowlist + a hard exclusion list. The
filter runs at scrape time so the storage / body-load cost only
pays for content Mark will actually use.

INCLUDE if any:
  - Brand allowlist match (Rolex, Omega, Tag Heuer, IWC, Casio /
    G-Shock, A. Lange & Söhne, Longines, Zenith, Breitling)
  - "tbt" (Throwback Thursday) category — Fratello's vintage-focused
    weekly series, high-signal for Mark's taste cluster
  - General collector-philosophy keywords (collecting, etiquette,
    mistakes, fake detection, buying tips, market analysis, history)

EXCLUDE if any (overrides include):
  - AP / Audemars Piguet (per Mark earlier note)
  - Hublot
  - Seiko (yes — Mark explicitly excludes Seiko while including Casio)
  - Sub-$500 / budget / affordable signals
  - Gift guide / graduation gift content
  - Microbrand mentions

The filter operates on title + URL + WP categories text. The WP REST
API exposes a `watchbrands` taxonomy too — currently unused since
title/url match catches most of the signal; revisit if a notable
chunk leaks through.

Run: python3 fratello_scraper.py
Output: public/fratello.json + public/fratello_bodies.json
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

BASE = "https://www.fratellowatches.com"
API = f"{BASE}/wp-json/wp/v2/posts"
OUTPUT_JSON = "public/fratello.json"
OUTPUT_BODIES = derive_bodies_path(OUTPUT_JSON)
SOURCE = "fratello"
SOURCE_TYPE = "editorial_blog"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                  "AppleWebKit/537.36 (KHTML, like Gecko) "
                  "Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json, text/plain, */*",
}

PAGE_SIZE = 100
API_SLEEP = 0.5


# ── Filter rules ────────────────────────────────────────────────────

# Allowed brands. Each entry expands to a regex matching the brand
# name AND its common model-line aliases so titles like "Speedmaster"
# (no "Omega" in the title) still get caught.
ALLOWED_BRAND_PATTERNS = [
    re.compile(r"\b(rolex|datejust|submariner|explorer|gmt[- ]?master|daytona|day[- ]?date|oyster|sea[- ]?dweller|milgauss|cellini|air[- ]?king)\b", re.I),
    re.compile(r"\b(omega|speedmaster|seamaster|constellation|de\s?ville|railmaster)\b", re.I),
    re.compile(r"\b(tag[- ]?heuer|carrera|monaco|autavia|aquaracer|formula\s?1|tag heuer)\b", re.I),
    re.compile(r"\biwc\b", re.I),
    re.compile(r"\b(casio|g[- ]?shock)\b", re.I),
    re.compile(r"\b(a\.?\s*lange|lange.?s.?hne|lange\b|\b1815\b|\bdatograph\b|\bzeitwerk\b|\blange\s?1\b)", re.I),
    re.compile(r"\blongines\b", re.I),
    re.compile(r"\b(zenith|el\s?primero|defy)\b", re.I),
    re.compile(r"\b(breitling|navitimer|chronomat|superocean|premier|avenger|colt)\b", re.I),
]

# Throwback Thursday is Fratello's vintage-focused weekly series —
# Mark spec 2026-05-20: include all TBT regardless of brand.
TBT_PATTERNS = [
    re.compile(r"/category/tbt/", re.I),
    re.compile(r"\btbt\b|throwback[- ]?thursday", re.I),
]

# "Vintage" is the strongest taste signal Mark identified (2026-05-20:
# "anything on the site that comes up with vintage"). Any URL or
# title with `vintage` triggers inclusion regardless of brand and
# bypasses the soft-exclude list (e.g. multi-brand vintage roundups
# can name-drop Seiko alongside JLC/Gallet without getting rejected).
VINTAGE_PATTERN = re.compile(r"\bvintage\b|\bneo[- ]?vintage\b", re.I)

# Collector-philosophy / general-interest content with no specific
# brand. Mark explicitly included "13 mistakes in collecting watches"
# in his allowlist example, so the filter accepts a small set of
# high-signal collector-mentality keywords.
GENERAL_INCLUDE_PATTERNS = [
    re.compile(r"\b(collecting|etiquette|mistakes|authentic|fake|spotting|buying\s?guide|market|history|movement)\b", re.I),
]

# Hard excludes — override every include signal including vintage.
# Reserved for brand/content classes Mark wants completely off the
# corpus (Hublot, AP, microbrands, gift guides, sub-$500 / budget
# content).
HARD_EXCLUSION_PATTERNS = [
    re.compile(r"\b(audemars[- ]?piguet|\bap\b\s*royal|royal[- ]?oak)\b", re.I),
    re.compile(r"\bhublot\b", re.I),
    re.compile(r"\bunder[-\s]*\$?\s?500\b", re.I),
    re.compile(r"\b(budget|affordable|cheap)\b", re.I),
    re.compile(r"\bgift[- ]?guide\b|holiday[- ]?gift|graduation", re.I),
    re.compile(r"\bmicro[- ]?brand", re.I),
]

# Soft excludes — apply only when the article does NOT have a vintage
# or TBT signal. Lets multi-brand vintage roundups that name-drop
# Seiko alongside in-scope brands still get ingested (Mark's example:
# "Fratello Favorites: Best Vintage Watches Under €5K — Mike's picks
# from JLC, Seiko and Gallet" should land in the corpus).
SOFT_EXCLUSION_PATTERNS = [
    re.compile(r"\bseiko\b", re.I),
]


def is_included(title: str, url: str, categories_text: str = "") -> tuple[bool, str]:
    """Return (include?, reason) for a post. The reason string is for
    logging — useful when tuning the filter against scrape output.
    """
    haystack = " ".join([title or "", url or "", categories_text or ""]).lower()

    # Hard excludes first — short-circuit. Never overridden by vintage.
    for pat in HARD_EXCLUSION_PATTERNS:
        if pat.search(haystack):
            return False, f"hard:{pat.pattern[:40]}"

    has_vintage = bool(VINTAGE_PATTERN.search(haystack))
    is_tbt = any(p.search(haystack) for p in TBT_PATTERNS)

    # Soft excludes — bypassed when vintage / TBT signal is present.
    if not (has_vintage or is_tbt):
        for pat in SOFT_EXCLUSION_PATTERNS:
            if pat.search(haystack):
                return False, f"soft:{pat.pattern[:30]}"

    # Vintage wins outright — Mark's strongest taste signal.
    if has_vintage:
        return True, "vintage"

    # TBT category always wins (it's the vintage-Thursday series, but
    # the URL pattern is distinct from the bare word `vintage`).
    if is_tbt:
        return True, "tbt"

    # Brand allowlist.
    for pat in ALLOWED_BRAND_PATTERNS:
        if pat.search(haystack):
            return True, f"brand:{pat.pattern[:30]}"

    # General collector-philosophy fallback.
    for pat in GENERAL_INCLUDE_PATTERNS:
        if pat.search(haystack):
            return True, "general"

    return False, "no_match"


def fetch_categories_map() -> dict[int, str]:
    """Build {category_id: name} so we can match category names
    against the allowlist in the per-post filter. WP exposes
    /wp/v2/categories paginated like posts.
    """
    cats = {}
    page = 1
    while True:
        try:
            r = requests.get(
                f"{BASE}/wp-json/wp/v2/categories",
                params={"per_page": 100, "page": page},
                headers=HEADERS, timeout=20,
            )
            if r.status_code != 200:
                break
            data = r.json()
        except Exception as e:
            print(f"  categories fetch error: {e}")
            break
        if not data:
            break
        for c in data:
            cats[c["id"]] = c.get("name", "")
        if len(data) < 100:
            break
        page += 1
        time.sleep(0.3)
    return cats


def strip_html(html: str) -> str:
    if not html:
        return ""
    txt = re.sub(r"<[^>]+>", " ", html)
    txt = unescape(txt)
    txt = re.sub(r"\s+", " ", txt).strip()
    return txt


def parse_post(post: dict, cats_map: dict[int, str]) -> dict | None:
    title = unescape((post.get("title") or {}).get("rendered") or "")
    url = post.get("link") or ""
    if not title or not url:
        return None

    # Categories text — names joined for filter haystack
    cat_ids = post.get("categories") or []
    cat_names = [cats_map.get(cid, "") for cid in cat_ids]
    categories_text = " ".join(cat_names)

    included, reason = is_included(title, url, categories_text)
    if not included:
        return None

    body_html = (post.get("content") or {}).get("rendered") or ""
    body_text = strip_html(body_html)
    if len(body_text) < 200:
        return None  # Stub / no-content posts

    excerpt_html = (post.get("excerpt") or {}).get("rendered") or ""
    excerpt = strip_html(excerpt_html)[:240]

    image = post.get("jetpack_featured_media_url") or ""
    if not image:
        # Fallback — try og:image inside content
        m = re.search(r'<meta[^>]+property="og:image"[^>]+content="([^"]+)"', body_html)
        if m:
            image = m.group(1)

    published_at = (post.get("date") or "")[:10]
    updated_at   = (post.get("modified") or published_at)[:10]

    # Author — WP REST returns author as ID by default; with
    # ?_embed=author we'd get the object. Skip the extra fetch; "Fratello"
    # is the publication-level byline that's fine for now.
    author = "Fratello"

    resolved = _resolve_brand_and_ref(title)

    return {
        "url": url,
        "slug": post.get("slug") or "",
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
        "_include_reason": reason,  # diagnostic — strip from output if it becomes noise
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
    full_refresh = os.environ.get("FRATELLO_FULL_REFRESH") == "1"
    incremental_cap_pages = int(os.environ.get("FRATELLO_MAX_PAGES") or "0")
    print(f"Fratello Watches scraper (full_refresh={full_refresh})")

    existing = _load_split(OUTPUT_JSON, OUTPUT_BODIES)
    print(f"  existing entries on disk: {len(existing)}")

    print("  fetching categories map...")
    cats_map = fetch_categories_map()
    print(f"  category map: {len(cats_map)} categories")

    out = dict(existing)
    fetched = filtered = skipped = failed = 0
    page = 1
    while True:
        if incremental_cap_pages and page > incremental_cap_pages:
            print(f"  reached FRATELLO_MAX_PAGES={incremental_cap_pages}, stopping")
            break
        try:
            r = requests.get(
                API,
                params={"per_page": PAGE_SIZE, "page": page, "orderby": "date", "order": "desc"},
                headers=HEADERS, timeout=30,
            )
        except Exception as e:
            print(f"  page {page} fetch error: {e}")
            break
        if r.status_code == 400:
            # WP returns 400 past the last page
            break
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
            record = parse_post(post, cats_map)
            if not record:
                filtered += 1
                continue
            out[url] = record
            fetched += 1
            print(f"  [{fetched}] {record['title'][:70]}  ({record['_include_reason']}, {record['word_count']} words)")

        print(f"  page {page}: {len(posts)} posts ({fetched} kept, {filtered} filtered, {skipped} skipped)")
        if len(posts) < PAGE_SIZE:
            break
        page += 1
        time.sleep(API_SLEEP)

    # Strip the diagnostic field before writing so the output stays clean.
    # Keep it during the loop so the log line above can read it.
    for rec in out.values():
        rec.pop("_include_reason", None)

    write_split(out, OUTPUT_JSON, OUTPUT_BODIES)
    print(f"\nFetched: {fetched}  Filtered out: {filtered}  Skipped (fresh): {skipped}  Failed: {failed}")
    print(f"Total entries on disk: {len(out)}")
    print(f"Wrote {OUTPUT_JSON} + {OUTPUT_BODIES}")


if __name__ == "__main__":
    main()
