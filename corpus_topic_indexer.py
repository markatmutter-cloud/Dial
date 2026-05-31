#!/usr/bin/env python3
"""Editorial corpus theme indexer — LLM-based topic tagging via Claude Haiku.

Reads every editorial-corpus meta JSON (8 sources, ~8,556 articles as of
2026-05-20), sends each article's title + excerpt + first ~1500 chars of
body to Claude Haiku 4.5, and writes back a `themes` field with 1-3 tags
from the curated theme taxonomy.

Idempotent: articles that already have a non-empty `themes` field are
skipped, so re-running on cron only spends tokens on newly-scraped
articles.

Prompt-cached: the system prompt + theme taxonomy are wrapped in
`cache_control: {type: "ephemeral"}` so subsequent articles within the
5-minute cache window pay ~$0.10/1M for the cached prefix instead of
~$1/1M. With ~830 input + 50 output tokens per article and prompt
caching warm, total cost is ~$5-9 for the full 8,556-article corpus.
Incremental cron runs (only new articles since last index) cost pennies.

Setup:
    pip install anthropic
    export ANTHROPIC_API_KEY=sk-ant-...

Run:
    python3 corpus_topic_indexer.py              # tag everything missing themes
    python3 corpus_topic_indexer.py --limit 50   # tag at most 50 articles (try-it-out)
    python3 corpus_topic_indexer.py --source hairspring_finds  # one source only
    python3 corpus_topic_indexer.py --retag       # re-tag everything (ignore existing themes)

Theme taxonomy is intentionally small (15 themes). Each represents a
recognisable editorial angle a collector might browse. Themes are
content-based, not brand-based — brand filtering happens on the existing
filter axes. See docs/RECOMMENDER_STRATEGY.md for the strategic shape.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
from pathlib import Path

try:
    import anthropic
except ImportError:
    print("ERROR: install the Anthropic SDK first: pip install anthropic", file=sys.stderr)
    sys.exit(1)


# ── Theme taxonomy ─────────────────────────────────────────────────
# Closed set — the model must return tags from this list. New themes
# require a one-shot retag (--retag) to apply across the existing
# corpus.
THEMES = [
    "reference_profile",   # deep dive on one specific watch reference
    "racing",              # motorsport / racing chronographs / F1 / Le Mans
    "military",            # MoD / MilSub / Type A-7 / issued tool watches
    "celebrity",           # celebrity provenance, ownership, connection
    "complications",       # perpetual calendar, tourbillon, repeater, etc.
    "market_commentary",   # prices, hype, restraint, investment angle
    "vintage_care",        # authentication, restoration, condition, what to look for
    "brand_history",       # archive material, maison founding, era evolution
    "design",              # case shape, dial art, design philosophy
    "aviation",            # pilot watches, navigation, aerospace
    "diving",              # dive watches, saturation diving, sea exploration
    "space",               # NASA, Moonwatch, space program
    "auction_results",     # specific auction wrap-up, hammer-price commentary
    "review",              # hands-on / wrist time / first impressions
    "news",                # new release announcement, brand news
    # ── Collector mentality / coaching (LUME_ROADMAP pillar 2). These power
    # Lumé's COACHING mode and stay behind the voice firewall: they describe the
    # COLLECTOR's mindset, never how a specific watch should be described. Mostly
    # opinion/essay, not fact. New → a one-shot --retag applies them corpus-wide.
    "collecting_philosophy",  # why we collect, meaning/journey, developing taste, identity, psychology
    "collector_mindset",      # buying discipline, patience, hype/FOMO, value mindset, regret, selling/letting-go
    "life_lessons",           # personal growth / reflections drawn THROUGH watches
    "community_ethics",       # collector community, etiquette, ethics, trust, dealer relationships
]

# Meta JSON files for the editorial corpus sources. Bodies are in parallel
# `_bodies.json` files (loaded separately). The bottom four were added with the
# collector-mentality themes — they're the richest mentality sources (Screwdown
# Crown, WOE) plus the big general feeds, previously untagged.
SOURCE_META_PATHS = [
    "public/hairspring_finds.json",
    "public/bring_a_loupe.json",
    "public/rolex_magazine.json",
    "public/onthedash.json",
    "public/bulang_watch_talks.json",
    "public/hodinkee_shop.json",
    "public/hodinkee_reference_points.json",
    "public/acollectedman_journal.json",
    "public/screwdowncrown.json",
    "public/woe_dispatch.json",
    "public/christies_stories.json",
    "public/fratello.json",
]


SYSTEM_PROMPT = f"""You tag vintage / collector watch editorial articles with theme tags.

Available themes (you MUST use ONLY these — never invent new tags):

- reference_profile: Deep dive on ONE specific watch reference (e.g. "the 1675 GMT-Master story", "anatomy of the Daytona 6263")
- racing: Motorsport, racing chronographs, F1 / Le Mans / Daytona 500 / Brabham
- military: Military-issued tool watches, MoD, MilSub, Type A-7, Bund straps, "issued"
- celebrity: Celebrity provenance or connection (Paul Newman, Steve McQueen, John Mayer, Eric Clapton, etc.)
- complications: Perpetual calendar, minute repeater, tourbillon, chronograph mechanisms, GMT
- market_commentary: Market prices, hype cycles, investment angle, restraint, market trends
- vintage_care: Authentication, restoration, condition, "things to look for", buyers' guides
- brand_history: Archive material, maison founding stories, decade-by-decade evolution
- design: Case shape, dial art, design philosophy, decorative arts, integrated bracelets
- aviation: Pilot watches, navigation, aerospace, B-Uhr, Type 20
- diving: Dive watches, saturation diving, sea exploration, ISO 6425
- space: NASA, Moonwatch, space program, lunar missions
- auction_results: Specific auction wrap-up / hammer-price commentary
- review: Hands-on / wrist time / first impressions of a specific watch
- news: New release announcement, brand news
- collecting_philosophy: WHY we collect, the meaning/journey of collecting, developing taste, identity — the philosophy of collecting (NOT a watch's history)
- collector_mindset: The collector's MINDSET — buying discipline, patience, dealing with hype/FOMO, a healthy value mindset, regret, selling and letting go
- life_lessons: Personal growth or life reflections drawn THROUGH watches ("what collecting taught me about…")
- community_ethics: The collector community, etiquette, ethics, trust, dealer relationships

Rules:
1. Pick 1-3 themes that BEST describe what the article is PRIMARILY about.
2. Don't include themes that are only tangentially mentioned (e.g. a Daytona review that mentions Paul Newman in passing is `review` + `racing`, NOT `celebrity`).
3. The four mentality themes (collecting_philosophy, collector_mindset, life_lessons, community_ethics) apply ONLY when the article is PRIMARILY about the collector's mindset/psychology — a watch history or review with one reflective line is NOT one of these.
4. If no theme clearly applies, return an empty list.
5. Return ONLY valid JSON in this exact shape: {{"themes": ["theme1", "theme2"]}}
6. Never invent new themes. Pick from the list above.

Valid themes: {", ".join(THEMES)}"""


def build_user_prompt(article: dict) -> str:
    """Compose the user message for one article — title + excerpt + body slice."""
    title = (article.get("title") or "").strip()[:200]
    excerpt = (article.get("excerpt") or "").strip()[:500]
    body = (article.get("body_text") or "").strip()[:1500]
    parts = [f"Title: {title}"]
    if excerpt:
        parts.append(f"Excerpt: {excerpt}")
    if body:
        parts.append(f"Body (first 1500 chars):\n{body}")
    parts.append("\nReturn the theme tags as JSON.")
    return "\n\n".join(parts)


def extract_themes(response_text: str) -> list[str]:
    """Parse the model response. Tolerant of stray prose around the JSON
    (Haiku occasionally adds a one-line explanation despite the
    'return ONLY JSON' instruction). Validates each tag against the
    closed taxonomy."""
    import re
    m = re.search(r"\{[^{}]*\"themes\"[^{}]*\}", response_text, re.DOTALL)
    if not m:
        return []
    try:
        data = json.loads(m.group(0))
    except json.JSONDecodeError:
        return []
    raw = data.get("themes", [])
    if not isinstance(raw, list):
        return []
    # Filter to known taxonomy — silently drop hallucinated themes.
    return [t for t in raw if isinstance(t, str) and t in THEMES]


def load_bodies(meta_path: str) -> dict:
    """Bodies live in a parallel `*_bodies.json` file (URL → body_text).
    Returns empty dict when the bodies file isn't present (defensive —
    older corpus snapshots inline body_text on the meta record)."""
    bodies_path = Path(meta_path.replace(".json", "_bodies.json"))
    if not bodies_path.exists():
        return {}
    with open(bodies_path) as f:
        return json.load(f)


def tag_article(client: anthropic.Anthropic, article: dict) -> list[str]:
    """Single API call. System prompt is prompt-cached so warm-cache
    calls within the 5-minute window cost ~10% of cold-cache."""
    msg = client.messages.create(
        model="claude-haiku-4-5",
        max_tokens=120,
        system=[{
            "type": "text",
            "text": SYSTEM_PROMPT,
            "cache_control": {"type": "ephemeral"},
        }],
        messages=[{"role": "user", "content": build_user_prompt(article)}],
    )
    text = next((b.text for b in msg.content if b.type == "text"), "")
    return extract_themes(text)


def main():
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("--limit", type=int, default=0,
                        help="Stop after tagging N articles (0 = no limit).")
    parser.add_argument("--source", default="",
                        help="Restrict to ONE source (filename prefix, e.g. 'hairspring_finds').")
    parser.add_argument("--retag", action="store_true",
                        help="Re-tag every article, even ones already tagged.")
    parser.add_argument("--save-every", type=int, default=50,
                        help="Persist progress after every N articles (default 50).")
    parser.add_argument("--sleep", type=float, default=0.0,
                        help="Sleep N seconds between articles (rate-limit safety).")
    args = parser.parse_args()

    if not os.environ.get("ANTHROPIC_API_KEY"):
        print("ERROR: set ANTHROPIC_API_KEY in your environment first.", file=sys.stderr)
        print("       https://console.anthropic.com/settings/keys", file=sys.stderr)
        sys.exit(1)

    client = anthropic.Anthropic()
    total_tagged = 0
    start_time = time.time()

    for meta_path in SOURCE_META_PATHS:
        if args.source and args.source not in meta_path:
            continue
        path = Path(meta_path)
        if not path.exists():
            print(f"  [skip] {meta_path} — file not present")
            continue
        with open(path) as f:
            meta = json.load(f)
        bodies = load_bodies(meta_path)
        source_tagged = 0
        changed = False
        urls = list(meta.keys())

        for url in urls:
            rec = meta[url]
            if not isinstance(rec, dict):
                continue
            if not args.retag and rec.get("themes"):
                continue
            article = {
                "title":     rec.get("title", ""),
                "excerpt":   rec.get("excerpt", ""),
                "body_text": bodies.get(url, ""),
            }
            try:
                themes = tag_article(client, article)
            except anthropic.RateLimitError as e:
                retry_after = int(e.response.headers.get("retry-after", "30"))
                print(f"  [rate-limited] sleeping {retry_after}s …")
                time.sleep(retry_after)
                themes = tag_article(client, article)
            except Exception as e:
                print(f"  [error] {url}: {e}")
                continue
            rec["themes"] = themes
            changed = True
            source_tagged += 1
            total_tagged += 1
            # Persist progress periodically so a crash doesn't lose work.
            if source_tagged % args.save_every == 0:
                with open(path, "w") as f:
                    json.dump(meta, f, indent=2, sort_keys=True, ensure_ascii=False)
                    f.write("\n")
                elapsed = time.time() - start_time
                rate = total_tagged / elapsed if elapsed > 0 else 0
                print(f"  [{meta_path}] tagged {source_tagged} (running total {total_tagged}, {rate:.1f}/sec) — saved.")
            if args.limit and total_tagged >= args.limit:
                break
            if args.sleep > 0:
                time.sleep(args.sleep)
        if changed:
            with open(path, "w") as f:
                json.dump(meta, f, indent=2, sort_keys=True, ensure_ascii=False)
                f.write("\n")
            print(f"  [{meta_path}] FINAL: tagged {source_tagged} articles.")
        else:
            print(f"  [{meta_path}] nothing to tag (all already have themes).")
        if args.limit and total_tagged >= args.limit:
            print(f"\nHit --limit {args.limit}; stopping.")
            break

    elapsed = time.time() - start_time
    print(f"\nDone. Tagged {total_tagged} articles in {elapsed:.0f}s.")
    if total_tagged > 0:
        print(f"     Average: {total_tagged / elapsed:.1f} articles/sec.")


if __name__ == "__main__":
    main()
