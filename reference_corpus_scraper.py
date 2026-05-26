#!/usr/bin/env python3
"""Reference-corpus builder — Stage 1 of the reference-intelligence pipeline
(scrape → synthesis → RAG).

Reads a per-node manifest (reference_sources/<node>.json), assembles an
attributed body-text corpus, and writes it split via editorial_corpus_io:

    public/reference_corpus_<node>.json         (meta + excerpt)
    public/reference_corpus_<node>_bodies.json  (url -> body_text)

Sources we ALREADY hold (Hodinkee, Fratello, Bring a Loupe, Christie's Stories,
Rolex Magazine, Perezcope-if-indexed, etc.) are reused from the existing
editorial corpus rather than re-fetched. New sources (5513mattedial, Wind
Vintage, Monochrome, Speedmaster101, …) are fetched and main-text-extracted with
trafilatura (regex fallback). Bot-blocked sources (WatchTime, rolexforums,
Mondani) are kept as link-only records — we still cite them, we just can't pull
their body.

Run:  python3 reference_corpus_scraper.py [submariner speedmaster]
Deps: requirements-pipeline.txt (requests, trafilatura).
"""
from __future__ import annotations

import json
import re
import sys
import time
from pathlib import Path

import requests

try:
    import trafilatura
except ImportError:  # fallback extractor still works
    trafilatura = None

from editorial_corpus_io import write_split, derive_bodies_path

PUBLIC = Path("public")
SOURCES_DIR = Path("reference_sources")
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}


def load_reuse_map() -> dict:
    """url -> body_text from every existing editorial *_bodies.json so we don't
    re-fetch sources the app already holds."""
    m: dict = {}
    for f in PUBLIC.glob("*_bodies.json"):
        if f.name.startswith("reference_corpus_"):
            continue
        try:
            d = json.loads(f.read_text())
        except (json.JSONDecodeError, OSError):
            continue
        for url, body in d.items():
            if isinstance(body, str) and body:
                m.setdefault(url, body)
    return m


def fetch_html(url: str, retries: int = 2) -> str | None:
    for i in range(retries + 1):
        try:
            r = requests.get(url, headers=HEADERS, timeout=30)
            if r.status_code == 200:
                return r.text
            if r.status_code in (403, 429, 500, 502, 503) and i < retries:
                time.sleep(1.5 * (i + 1))
                continue
            return None
        except requests.RequestException:
            if i < retries:
                time.sleep(1.5 * (i + 1))
                continue
            return None
    return None


def og_image(html: str) -> str:
    if not html:
        return ""
    m = (re.search(r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)', html)
         or re.search(r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:image', html))
    return m.group(1) if m else ""


def extract_body(html: str, url: str) -> str:
    if not html:
        return ""
    if trafilatura:
        txt = trafilatura.extract(
            html, include_comments=False, include_tables=False, favor_recall=True, url=url
        )
        if txt:
            return txt.strip()
    # regex fallback — join <p> blocks, strip tags
    ps = re.findall(r"<p[^>]*>(.*?)</p>", html, re.DOTALL | re.I)
    txt = "\n\n".join(re.sub(r"<[^>]+>", " ", p) for p in ps)
    return re.sub(r"[ \t]+", " ", txt).strip()


def build(node: str) -> dict:
    manifest = json.loads((SOURCES_DIR / f"{node}.json").read_text())
    reuse = load_reuse_map()
    records: dict = {}
    stats = {"reused": 0, "fetched": 0, "skipped": 0, "failed": 0}

    print(f"\n=== {node}: {len(manifest['sources'])} sources ===")
    for s in manifest["sources"]:
        url = s["url"]
        flags = s.get("flags", {})
        rec = {k: s.get(k) for k in ("title", "publication", "author", "type", "focus")}
        rec["source"] = s.get("publication")
        rec["node"] = node
        rec["flags"] = flags

        if url in reuse:
            rec.update(body_text=reuse[url], origin="corpus-reuse",
                       word_count=len(reuse[url].split()))
            stats["reused"] += 1
            print(f"  reuse  {url}")
        elif flags.get("bot_blocked"):
            rec.update(body_text="", origin="bot-blocked-linkonly")
            stats["skipped"] += 1
            print(f"  skip   (bot-blocked) {url}")
        else:
            html = fetch_html(url)
            if not html:
                rec.update(body_text="", origin="fetch-failed")
                stats["failed"] += 1
                print(f"  FAIL   {url}")
            else:
                body = extract_body(html, url)
                rec.update(body_text=body, image=og_image(html), origin="scraped",
                           word_count=len(body.split()))
                stats["fetched"] += 1
                print(f"  fetch  ({rec['word_count']}w) {url}")
                time.sleep(0.4)
        records[url] = rec

    meta_path = PUBLIC / f"reference_corpus_{node}.json"
    write_split(records, meta_path, derive_bodies_path(meta_path))
    print(f"--- {node}: {stats} → {meta_path}")
    return stats


if __name__ == "__main__":
    nodes = sys.argv[1:] or ["submariner", "speedmaster"]
    for n in nodes:
        build(n)
