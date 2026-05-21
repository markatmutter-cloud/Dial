#!/usr/bin/env python3
"""Screw Down Crown personal-corpus loader.

Ingests Mark's locally-saved Substack export of Screw Down Crown
articles — both free and paid — into a SEPARATE personal corpus
that NEVER goes to the public site. Free posts also live in the
public corpus via `screwdowncrown_scraper.py`; paid posts ONLY
live here.

The output files are intentionally gitignored — paid Substack
content shouldn't ship to a public GitHub repo, and the personal
corpus is a recommender input, not an editorial surface.

Records are tagged:
- `personal_only: true`     — recommender input only, never user-facing
- `do_not_quote: true`      — projection layer must enforce no verbatim output
- `source: screwdowncrown_personal` — distinct from the public `screwdowncrown`
- `audience: 'everyone' | 'only_paid' | 'founding' | null` — cross-referenced
  with the public archive API where possible so each record carries its
  free-or-paid origin

Run: python3 screwdowncrown_personal_loader.py [--source-dir PATH]

Defaults to `~/Desktop/Screwdowncrown Articles/`. Outputs land in
`personal_corpus/` at the repo root (gitignored).

Per CLAUDE.md spec: MIN_PUBLISHED_DATE = '2019-01-01' is the cutoff —
the publication only pivoted to watches in 2019, and the older
archive is off-topic. Articles from before that date are skipped at
ingestion time.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import time
from datetime import datetime, timezone
from html import unescape
from pathlib import Path
from urllib.parse import urlparse

try:
    import requests
except ImportError:
    requests = None

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


# --- Constants ---------------------------------------------------------------

PUBLICATION_HOST = "screwdowncrown.com"
MIN_PUBLISHED_DATE = "2019-01-01"
ARCHIVE_API = "https://www.screwdowncrown.com/api/v1/archive"
ARCHIVE_PAGE_SIZE = 20

DEFAULT_SOURCE_DIR = Path.home() / "Desktop" / "Screwdowncrown Articles"
OUT_DIR = Path(__file__).parent / "personal_corpus"
OUT_META = OUT_DIR / "screwdowncrown_personal.json"
OUT_BODIES = OUT_DIR / "screwdowncrown_personal_bodies.json"

SOURCE_KEY = "screwdowncrown_personal"
SOURCE_TYPE = "editorial_blog_personal"

HEADERS = {
    "User-Agent": "Mozilla/5.0 personal-loader",
    "Accept": "application/json",
}


# --- Audience map (best-effort enrichment) ----------------------------------

def fetch_audience_map() -> dict[str, str]:
    """Walk the public archive API to capture each post's `audience`
    so the loader can stamp records with their free-or-paid origin.
    Returns {slug: audience}. Empty dict when the network call fails —
    audience field on records becomes None.
    """
    if requests is None:
        return {}
    out: dict[str, str] = {}
    offset = 0
    while True:
        try:
            r = requests.get(
                ARCHIVE_API,
                params={"sort": "new", "offset": offset, "limit": ARCHIVE_PAGE_SIZE},
                headers=HEADERS, timeout=20,
            )
            if r.status_code != 200:
                break
            page = r.json()
        except Exception:
            break
        if not page or not isinstance(page, list):
            break
        for post in page:
            slug = post.get("slug")
            if slug:
                out[slug] = post.get("audience") or ""
        offset += ARCHIVE_PAGE_SIZE
        time.sleep(0.3)
        if len(page) < ARCHIVE_PAGE_SIZE:
            break
    return out


# --- Parser -----------------------------------------------------------------

def _walk_balanced_div(html: str, open_idx: int) -> str:
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


def _strip_title_suffix(t: str) -> str:
    """Substack <title> tags carry "- by author - publication" suffix.
    Strip everything from the first " - by " onward.
    """
    if not t:
        return ""
    idx = t.find(" - by ")
    return t[:idx].strip() if idx > 0 else t.strip()


def parse_exported_html(html: str) -> dict | None:
    # Canonical URL — gates publication-host filter.
    m = re.search(r'<link rel="canonical" href="([^"]+)"', html)
    if not m:
        return None
    canonical = m.group(1)
    parsed = urlparse(canonical)
    if PUBLICATION_HOST not in (parsed.netloc or ""):
        return None  # cross-publication re-share, skip

    # Slug
    slug = ""
    slug_m = re.search(r'/p/([a-z0-9\-]+)', canonical)
    if slug_m:
        slug = slug_m.group(1)

    # Title — <title> tag preferred (strip suffix), h1 fallback.
    title = ""
    m = re.search(r'<title[^>]*>(.*?)</title>', html, re.DOTALL)
    if m:
        title = _strip_title_suffix(unescape(re.sub(r'<[^>]+>', ' ', m.group(1))).strip())
    if not title:
        m = re.search(r'<h1[^>]*class="[^"]*post-title[^"]*"[^>]*>(.*?)</h1>', html, re.DOTALL)
        if m:
            title = unescape(re.sub(r'<[^>]+>', ' ', m.group(1))).strip()
    if not title:
        m = re.search(r'<meta property="og:title" content="([^"]+)"', html)
        if m:
            title = _strip_title_suffix(unescape(m.group(1)).strip())
    if not title:
        return None

    # Date — try meta tags first, then any 4-2-2 in the head.
    published_at = ""
    m = re.search(r'<meta property="article:published_time" content="([^"]+)"', html)
    if m:
        published_at = m.group(1)[:10]
    if not published_at:
        m = re.search(r'(20\d{2}-\d{2}-\d{2})', html[:50000])
        if m:
            published_at = m.group(1)

    # Author — JSON-LD or meta.
    author = ""
    m = re.search(r'<meta name="author" content="([^"]+)"', html)
    if m:
        author = unescape(m.group(1)).strip()
    if not author:
        for m_ld in re.finditer(
            r'<script[^>]+type="application/ld\+json"[^>]*>(.*?)</script>',
            html, re.DOTALL,
        ):
            try:
                blob = json.loads(m_ld.group(1).strip())
            except json.JSONDecodeError:
                continue
            candidates = [blob] if isinstance(blob, dict) else (blob if isinstance(blob, list) else [])
            for c in candidates:
                if isinstance(c, dict):
                    a = c.get("author")
                    if isinstance(a, dict):
                        author = (a.get("name") or "").strip()
                    elif isinstance(a, str):
                        author = a.strip()
                    if author:
                        break
            if author:
                break
    if not author:
        author = "Screw Down Crown"

    # Image
    image = ""
    m = re.search(r'<meta property="og:image" content="([^"]+)"', html)
    if m:
        image = unescape(m.group(1))

    # Body
    body_text = ""
    m_body = re.search(r'<div class="available-content"[^>]*>', html)
    if m_body:
        inner = _walk_balanced_div(html, m_body.start())
        blocks = re.findall(
            r"<(?:p|h2|h3|h4|blockquote|li)(?:\s[^>]*)?>(.*?)</(?:p|h2|h3|h4|blockquote|li)>",
            inner, re.DOTALL | re.IGNORECASE,
        )
        cleaned = []
        for b in blocks:
            t = re.sub(r"<[^>]+>", " ", b)
            t = unescape(t)
            t = re.sub(r"\s+", " ", t).strip()
            if t:
                cleaned.append(t)
        body_text = "\n\n".join(cleaned)

    if not body_text or len(body_text) < 200:
        return None

    return {
        "canonical_url": canonical,
        "slug": slug,
        "title": title,
        "author": author,
        "published_at": published_at,
        "image": image,
        "body_text": body_text,
        "word_count": len(body_text.split()),
    }


# --- Main ------------------------------------------------------------------

def write_split_personal(records: dict, meta_path: Path, bodies_path: Path) -> None:
    meta_path.parent.mkdir(parents=True, exist_ok=True)
    meta_records = {}
    bodies = {}
    for url, rec in records.items():
        body = rec.get("body_text") or ""
        meta = {k: v for k, v in rec.items() if k != "body_text"}
        # Excerpt for the meta record (recommender doesn't need the body
        # to know what an article is about at the index level).
        meta["excerpt"] = (body[:240] + "…") if len(body) > 240 else body
        meta_records[url] = meta
        bodies[url] = body
    meta_path.write_text(json.dumps(meta_records, indent=2, ensure_ascii=False))
    bodies_path.write_text(json.dumps(bodies, ensure_ascii=False))


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--source-dir", type=Path, default=DEFAULT_SOURCE_DIR,
                   help=f"Folder of exported HTML files (default: {DEFAULT_SOURCE_DIR})")
    args = p.parse_args()

    if not args.source_dir.exists():
        print(f"Source dir not found: {args.source_dir}", file=sys.stderr)
        return 1

    html_files = sorted(args.source_dir.glob("*.html"))
    print(f"Found {len(html_files)} HTML files in {args.source_dir}")

    print("Fetching audience map from public archive API...")
    audience_map = fetch_audience_map()
    print(f"  audience map: {len(audience_map)} entries")

    out: dict[str, dict] = {}
    skipped = {"cross_publication": 0, "pre_2019": 0, "parse_fail": 0, "duplicate": 0}

    for f in html_files:
        try:
            html = f.read_text(errors="ignore")
        except Exception as e:
            print(f"  read error on {f.name}: {e}")
            skipped["parse_fail"] += 1
            continue
        rec = parse_exported_html(html)
        if not rec:
            # Could be cross-publication, missing canonical, or body-too-short.
            if PUBLICATION_HOST not in html[:100000]:
                skipped["cross_publication"] += 1
            else:
                skipped["parse_fail"] += 1
            continue
        if rec["published_at"] and rec["published_at"] < MIN_PUBLISHED_DATE:
            skipped["pre_2019"] += 1
            continue
        url = rec["canonical_url"]
        if url in out:
            skipped["duplicate"] += 1
            continue

        audience = audience_map.get(rec["slug"]) or None
        resolved = _resolve_brand_and_ref(rec["title"])
        out[url] = {
            "url": url,
            "slug": rec["slug"],
            "title": rec["title"],
            "author": rec["author"],
            "published_at": rec["published_at"],
            "updated_at": rec["published_at"],
            "image": rec["image"],
            "body_text": rec["body_text"],
            "word_count": rec["word_count"],
            "brand": resolved["brand"],
            "reference_no": resolved["reference_no"],
            "model": resolved["model"],
            "sub_model": resolved["sub_model"],
            "model_line": resolved["model_line"],
            "source": SOURCE_KEY,
            "source_type": SOURCE_TYPE,
            "audience": audience,
            "personal_only": True,
            "do_not_quote": True,
            "loaded_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        }

    write_split_personal(out, OUT_META, OUT_BODIES)

    total_words = sum(r["word_count"] for r in out.values())
    free = sum(1 for r in out.values() if r["audience"] == "everyone")
    paid = sum(1 for r in out.values() if r["audience"] in ("only_paid", "founding"))
    unknown = sum(1 for r in out.values() if not r["audience"])

    print()
    print(f"Ingested: {len(out)} records ({total_words:,} words)")
    print(f"  free (public archive):       {free}")
    print(f"  paid (only_paid / founding): {paid}")
    print(f"  audience unknown:            {unknown}")
    print(f"Skipped: cross_publication={skipped['cross_publication']}, "
          f"pre_2019={skipped['pre_2019']}, "
          f"parse_fail={skipped['parse_fail']}, "
          f"duplicate={skipped['duplicate']}")
    print()
    print(f"Wrote {OUT_META}")
    print(f"Wrote {OUT_BODIES}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
