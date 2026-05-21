#!/usr/bin/env python3
"""Editorial corpus enrichment — step 5 of the editorial corpus plan.

Reads every public/<source>.json file produced by the editorial
scrapers, runs four classifiers across each article's body_text,
and writes the results back into the same record:

  • references_mentioned — [{brand, model, model_line, ref, count}]
    via reference_index_match against body sentences.
  • tags                 — closed vocabulary, keyword-pattern firing.
    diving / military / celebrities / space / brand_story / books /
    anti_magnetic / racing. Multiple tags per article when patterns
    fire. Precision over recall — patterns only fire on
    high-confidence signals.
  • audience             — collector-archetype tags. Weighted-keyword
    profiles per archetype; archetype fires when accumulated score
    crosses threshold. brand_specialist_<brand> is computed from the
    refs_mentioned concentration (75%+ + ≥4 refs).
  • dates_referenced     — year regex + decade language extracted
    from body. Distinct from `published_at` — captures the historical
    period the article discusses.

Decoupled from scrapers — when a new tag / archetype / pattern lands,
re-run this script to re-classify the whole corpus in seconds. No
re-scraping required.

Idempotent. Two runs over an unchanged corpus produce the same output.

Usage:
    python3 editorial_index.py            # enrich all corpus files
    python3 editorial_index.py --dry-run  # report what would change, write nothing

Add a new corpus: append its path to CORPUS_FILES. The script
sorts/handles missing files gracefully — running on a partial set
is fine.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import time
from pathlib import Path

from reference_index_match import (
    build_ref_index,
    build_model_name_index,
    match_against_index,
    match_by_model_name,
    parse_index,
)

ROOT = Path(__file__).parent
WATCH_REFS_PATH = ROOT / "docs" / "watch_references.md"

CORPUS_FILES = [
    ROOT / "public" / "hairspring_finds.json",
    ROOT / "public" / "bring_a_loupe.json",
    # Future sources land here as their scrapers ship.
]

# ─────────────────────────────────────────────────────────────────────
# Tag patterns (closed vocabulary).
#
# A pattern fires when *any* of its regexes matches the body text
# (case-insensitive). Article gets every tag whose patterns fire.
# Precision-first: prefer false negatives over false positives.
# ─────────────────────────────────────────────────────────────────────

TAG_PATTERNS = {
    "diving": [
        r"\bdivers?\b",
        r"\bdiving\b",
        r"\bsea[- ]?dweller\b",
        r"\bsubmariner\b",
        r"\bhelium (?:escape )?valve\b",
        r"\bdepth (?:rated|rating|gauge)\b",
        r"\bscuba\b",
        r"\bsaturation diving\b",
        r"\bunderwater\b",
        r"\bmilsub\b",
    ],
    "military": [
        r"\bmilitary\b",
        r"\b(?:military[- ])?issued\b",
        r"\bRAF\b",
        r"\bUSN\b",
        r"\bPAF\b",
        r"\bMilSub\b",
        r"\bregimental\b",
        r"\barmed forces\b",
        r"\bdecommissioned\b",
        r"\b(?:navy|army|air force) issue\b",
        r"\bbroad arrow\b",
        r"\bMOD issue\b",
    ],
    "celebrities": [
        # Named celebrity list — extend as patterns emerge in the corpus.
        r"\b(?:Paul Newman|Steve McQueen|Marlon Brando|Princess Diana|"
        r"Elvis Presley|John Lennon|Frank Sinatra|Muhammad Ali|"
        r"Paul McCartney|Bob Dylan|Andy Warhol|James Dean|"
        r"Buzz Aldrin|Neil Armstrong|Jacques Cousteau|Jean[- ]Claude Killy)\b",
        r"\bworn by [A-Z]",
        r"\bowned by [A-Z]",
    ],
    "space": [
        r"\bapollo (?:\d|mission|program)\b",
        r"\bnasa\b",
        r"\bastronauts?\b",
        r"\bmoonwatch\b",
        r"\bmoon (?:mission|landing|walk)\b",
        r"\bgemini (?:\d|mission|program)\b",
        r"\bspacewalk\b",
        r"\bmercury (?:program|capsule|mission)\b",
    ],
    "brand_story": [
        r"\bfounded in \d{4}\b",
        r"\bthe maison\b",
        r"\bearly days of\b",
        r"\bthe origins? of\b",
        r"\bheritage of\b",
        r"\b(?:brand|maison) history\b",
        r"\bfounded by\b",
    ],
    "books": [
        r"\bISBN\b",
        r"\bin (?:his|her|the) book\b",
        r"\bpublished by [A-Z]",
        # known watch authors / historians
        r"\b(?:Goldberger|Patrizzi|Cernia|Dowling|John Goldberger|"
        r"Pucci Papaleo|James Dowling)\b",
    ],
    "anti_magnetic": [
        r"\banti[- ]?magnetic\b",
        r"\b1000[- ]?gauss\b",
        r"\b\d+ gauss\b",
        r"\bferromagnetic\b",
        r"\bfaraday (?:cage|shield)\b",
    ],
    "racing": [
        r"\bmotorsports?\b",
        r"\brally driver\b",
        r"\bLe Mans\b",
        r"\bFormula (?:1|One)\b",
        r"\bracing chronograph\b",
        r"\btachymeter\b",
        r"\bautavia\b",
    ],
}

TAG_PATTERNS_COMPILED = {
    tag: [re.compile(p, re.IGNORECASE) for p in patterns]
    for tag, patterns in TAG_PATTERNS.items()
}

# ─────────────────────────────────────────────────────────────────────
# Audience archetypes (weighted keyword profiles + threshold).
#
# Audience tags identify the kind of reader an article is *written
# for*. Distinct from "collector arcs" which are inferred from user
# behavior (saves, rejects) — those live in a different layer entirely.
#
# Score: number of regex MATCHES in body_text (not number of patterns
# that fire — repeated mentions matter). Archetype fires when score
# >= threshold.
#
# `brand_specialist_<brand>` is NOT a profile — it's computed from the
# refs_mentioned concentration after the matcher runs.
# ─────────────────────────────────────────────────────────────────────

AUDIENCE_PROFILES = {
    "vintage_purist": {
        "patterns": [
            r"\bunpolished\b",
            r"\btropical (?:dial|lume|hands?)\b",
            r"\bpatina\b",
            r"\bhonest dial\b",
            r"\bmatching numbers\b",
            r"\buntouched\b",
            r"\boriginal dial\b",
            r"\bnever polished\b",
            r"\bsharp lugs?\b",
            r"\bfat case\b",
        ],
        "threshold": 2,
    },
    "military_collector": {
        "patterns": [
            r"\bmilitary\b",
            r"\bissued\b",
            r"\bRAF\b",
            r"\bUSN\b",
            r"\bPAF\b",
            r"\bMilSub\b",
            r"\bregimental\b",
            r"\bservice (?:issue|history)\b",
            r"\bcaseback engrav",
            r"\bgovernment contract\b",
        ],
        "threshold": 2,
    },
    "tool_watch": {
        "patterns": [
            r"\bdivers?\b",
            r"\bchronographs?\b",
            r"\bdepth rated\b",
            r"\brotating bezel\b",
            r"\blume\b",
            r"\bprofessional\b",
            r"\bpilots? watch\b",
            r"\binstrument watch\b",
            r"\bcockpit\b",
            r"\bworld timer\b",
        ],
        "threshold": 3,  # higher — common words; need accumulated signal
    },
    "dress_watch": {
        "patterns": [
            r"\bcalatrava\b",
            r"\btime[- ]only\b",
            r"\bslim case\b",
            r"\bformal\b",
            r"\bevening watch\b",
            r"\bgentleman[''']s? watch\b",
            r"\belegant\b",
            r"\bclassical\b",
            r"\bleather strap\b",
        ],
        "threshold": 2,
    },
    "independent": {
        "patterns": [
            r"\bDufour\b",
            r"\bVoutilainen\b",
            r"\bF\.?P\.? Journe\b",
            r"\bDaniel Roth\b",
            r"\bMB&F\b",
            r"\bRoger Smith\b",
            r"\bGeorge Daniels\b",
            r"\bAkrivia\b",
            r"\bRomain Gauthier\b",
            r"\bindependent watchmaker\b",
        ],
        "threshold": 1,
    },
    "movement_nerd": {
        "patterns": [
            r"\banglage\b",
            r"\bperlage\b",
            r"\bC[oô]tes de Gen[eè]ve\b",
            r"\bescapement\b",
            r"\bfree[- ]sprung\b",
            r"\bbalance wheel\b",
            r"\bbridge\b",
            r"\bcaliber finishing\b",
            r"\bblack[- ]polished\b",
            r"\bhand[- ]finished\b",
        ],
        "threshold": 2,
    },
    "bargain_hunter": {
        "patterns": [
            r"\bundervalued\b",
            r"\bsleeper\b",
            r"\boverlooked\b",
            r"\battainable\b",
            r"\bentry[- ]?level\b",
            r"\bvalue play\b",
            r"\bbargain\b",
        ],
        "threshold": 1,
    },
    "auction_watcher": {
        "patterns": [
            r"\bhammer (?:price|down|fell)\b",
            r"\bChristie's\b",
            r"\bSotheby's\b",
            r"\bPhillips\b",
            r"\bAntiquorum\b",
            r"\bauction estimate\b",
            r"\brealised\b",
            r"\brealized\b",
        ],
        "threshold": 2,
    },
}

AUDIENCE_PROFILES_COMPILED = {
    name: {
        "patterns": [re.compile(p, re.IGNORECASE) for p in prof["patterns"]],
        "threshold": prof["threshold"],
    }
    for name, prof in AUDIENCE_PROFILES.items()
}

# ─────────────────────────────────────────────────────────────────────
# Date extraction.
# ─────────────────────────────────────────────────────────────────────

YEAR_RE = re.compile(r"\b(?:19[0-9]{2}|20[0-2][0-9])\b")
DECADE_RE = re.compile(
    r"\b(late|early|mid)[\s\-'']?"
    r"(?:'?(\d0s)|"
    r"(fifties|sixties|seventies|eighties|nineties|twenties|thirties|forties))\b",
    re.IGNORECASE,
)
DECADE_WORD_TO_NUM = {
    "twenties": "20s", "thirties": "30s", "forties": "40s",
    "fifties":  "50s", "sixties":  "60s", "seventies":"70s",
    "eighties": "80s", "nineties": "90s",
}

# Sentence splitter — paragraph-aware. Articles run paragraphs delimited
# by "\n\n" in body_text; within paragraphs we split on sentence-ending
# punctuation followed by space + capital letter. Not perfect, but the
# matcher is tolerant of fragment input so over-splitting is harmless.
SENTENCE_SPLIT_RE = re.compile(r"(?<=[.!?])\s+(?=[A-Z\"'])")

# Words common in dealer essays that the matcher will try to interpret
# as references; suppress them.
SAFE_TEXT_TRIM = 4000  # match each sentence; don't blow up on outliers


def split_into_passes(text: str) -> list[str]:
    """Split body into matcher-sized chunks: paragraphs, then sentences
    within long paragraphs. Returns a flat list of non-empty strings."""
    if not text:
        return []
    out: list[str] = []
    for para in text.split("\n\n"):
        para = para.strip()
        if not para:
            continue
        if len(para) <= SAFE_TEXT_TRIM:
            for sent in SENTENCE_SPLIT_RE.split(para):
                s = sent.strip()
                if s:
                    out.append(s)
        else:
            # Pathologically long para — chunk by SAFE_TEXT_TRIM.
            for i in range(0, len(para), SAFE_TEXT_TRIM):
                out.append(para[i:i + SAFE_TEXT_TRIM])
    return out


# ─────────────────────────────────────────────────────────────────────
# Classifiers.
# ─────────────────────────────────────────────────────────────────────


def extract_references(
    body: str,
    title_brand: str,
    ref_index: dict,
    model_name_index: dict,
) -> list[dict]:
    """Walk body paragraph/sentence-by-sentence, accumulate ref hits.

    For each chunk: try the full ref-number matcher first; if no hit,
    fall back to model-name matching with the article's title-brand
    as a hint. Returns list of dicts sorted by count desc, then brand.
    """
    hits: dict[tuple, dict] = {}
    for chunk in split_into_passes(body):
        m = match_against_index(chunk, ref_index)
        if not m:
            m = match_by_model_name(chunk, model_name_index, brand=title_brand or None)
        if not m:
            continue
        key = (m.get("brand", ""), m.get("model_line", ""), m.get("raw_ref") or m.get("reference_no") or "")
        if key in hits:
            hits[key]["count"] += 1
        else:
            hits[key] = {
                "brand": m.get("brand", ""),
                "model": m.get("model"),
                "model_line": m.get("model_line"),
                "ref": m.get("raw_ref") or m.get("reference_no"),
                "count": 1,
            }
    return sorted(
        hits.values(),
        key=lambda h: (-h["count"], h["brand"] or "", h["model_line"] or "", h["ref"] or ""),
    )


def classify_tags(body: str) -> list[str]:
    """Return every tag whose patterns find at least one match."""
    if not body:
        return []
    out = []
    for tag, patterns in TAG_PATTERNS_COMPILED.items():
        if any(p.search(body) for p in patterns):
            out.append(tag)
    return out


def classify_audience(body: str) -> list[str]:
    """Score each archetype profile against body_text; fire archetypes
    whose score crosses their threshold."""
    if not body:
        return []
    out = []
    for name, prof in AUDIENCE_PROFILES_COMPILED.items():
        score = sum(len(p.findall(body)) for p in prof["patterns"])
        if score >= prof["threshold"]:
            out.append(name)
    return out


def classify_brand_specialist(references_mentioned: list[dict]) -> list[str]:
    """Article is a brand-specialist read when ≥75% of its ref
    mentions concentrate on a single brand AND total refs ≥4.
    Returns a list (typically 0 or 1 entries)."""
    if not references_mentioned:
        return []
    total = sum(r["count"] for r in references_mentioned)
    if total < 4:
        return []
    by_brand: dict[str, int] = {}
    for r in references_mentioned:
        b = (r.get("brand") or "").strip()
        if b:
            by_brand[b] = by_brand.get(b, 0) + r["count"]
    out = []
    for brand, count in by_brand.items():
        if count / total >= 0.75:
            slug = re.sub(r"[^a-z0-9]+", "_", brand.lower()).strip("_")
            if slug:
                out.append(f"brand_specialist_{slug}")
    return out


def extract_dates(body: str) -> list[str]:
    """Year regex + decade-language extraction."""
    if not body:
        return []
    years = set(YEAR_RE.findall(body))
    decades = set()
    for m in DECADE_RE.finditer(body):
        prefix = m.group(1).lower()
        decade = (m.group(2) or "").lower()
        word = (m.group(3) or "").lower()
        if word and word in DECADE_WORD_TO_NUM:
            decade = DECADE_WORD_TO_NUM[word]
        if decade:
            decades.add(f"{prefix}_{decade}")
    return sorted(years | decades)


# ─────────────────────────────────────────────────────────────────────
# Pipeline.
# ─────────────────────────────────────────────────────────────────────


def enrich_record(rec: dict, ref_index: dict, model_name_index: dict) -> dict:
    """Return a new record with the four enrichment fields populated."""
    body = rec.get("body_text", "") or ""
    title_brand = (rec.get("brand") or "").strip()

    refs = extract_references(body, title_brand, ref_index, model_name_index)
    tags = classify_tags(body)
    audience = classify_audience(body)
    audience.extend(classify_brand_specialist(refs))
    dates = extract_dates(body)

    out = dict(rec)
    out["references_mentioned"] = refs
    out["tags"] = tags
    out["audience"] = audience
    out["dates_referenced"] = dates
    return out


def enrich_corpus(path: Path, ref_index: dict, model_name_index: dict, dry_run: bool) -> dict:
    """Read, enrich, and write back one corpus file. Returns stats."""
    if not path.exists():
        return {"path": str(path), "error": "missing"}
    raw = json.loads(path.read_text())
    enriched = {}
    counts = {"tags": 0, "audience": 0, "refs": 0, "dates": 0}
    for url, rec in raw.items():
        new_rec = enrich_record(rec, ref_index, model_name_index)
        enriched[url] = new_rec
        if new_rec["tags"]:                 counts["tags"]     += 1
        if new_rec["audience"]:             counts["audience"] += 1
        if new_rec["references_mentioned"]: counts["refs"]     += 1
        if new_rec["dates_referenced"]:     counts["dates"]    += 1
    stats = {
        "path": str(path.relative_to(ROOT)),
        "articles": len(raw),
        "with_tags": counts["tags"],
        "with_audience": counts["audience"],
        "with_refs": counts["refs"],
        "with_dates": counts["dates"],
    }
    if not dry_run:
        path.write_text(json.dumps(enriched, indent=2, ensure_ascii=False, sort_keys=True))
    return stats


def main():
    ap = argparse.ArgumentParser(description="Enrich editorial corpus JSONs in place.")
    ap.add_argument("--dry-run", action="store_true",
                    help="Compute and report enrichment without writing files.")
    args = ap.parse_args()

    if not WATCH_REFS_PATH.exists():
        print(f"ERROR: {WATCH_REFS_PATH} not found", file=sys.stderr)
        sys.exit(1)

    print(f"Building reference + model-name indices from {WATCH_REFS_PATH.relative_to(ROOT)}...")
    t0 = time.time()
    brands = parse_index(WATCH_REFS_PATH.read_text())
    ref_index = build_ref_index(brands)
    model_name_index = build_model_name_index(brands)
    print(f"  built in {time.time() - t0:.1f}s — {len(ref_index)} refs, {len(model_name_index)} model names")

    mode = "DRY RUN" if args.dry_run else "WRITING"
    print(f"\n{mode} — enriching {len(CORPUS_FILES)} corpus file(s)...")

    total = {"articles": 0, "with_tags": 0, "with_audience": 0, "with_refs": 0, "with_dates": 0}
    for path in CORPUS_FILES:
        t1 = time.time()
        stats = enrich_corpus(path, ref_index, model_name_index, args.dry_run)
        if "error" in stats:
            print(f"  {stats['path']}: SKIPPED ({stats['error']})")
            continue
        elapsed = time.time() - t1
        print(f"  {stats['path']}: {stats['articles']} articles in {elapsed:.1f}s")
        print(f"    tags     : {stats['with_tags']:>5} ({100*stats['with_tags']/max(1,stats['articles']):.0f}%)")
        print(f"    audience : {stats['with_audience']:>5} ({100*stats['with_audience']/max(1,stats['articles']):.0f}%)")
        print(f"    refs     : {stats['with_refs']:>5} ({100*stats['with_refs']/max(1,stats['articles']):.0f}%)")
        print(f"    dates    : {stats['with_dates']:>5} ({100*stats['with_dates']/max(1,stats['articles']):.0f}%)")
        for k in total:
            total[k] += stats.get(k, 0)

    print(f"\nTotal: {total['articles']} articles")
    print(f"  with tags     : {total['with_tags']:>5}")
    print(f"  with audience : {total['with_audience']:>5}")
    print(f"  with refs     : {total['with_refs']:>5}")
    print(f"  with dates    : {total['with_dates']:>5}")
    if args.dry_run:
        print("\n(no files written — pass without --dry-run to persist)")


if __name__ == "__main__":
    main()
