"""Tag editorial articles as 'collector mentality' content for Lumé.

Lumé's coaching pillar (LUME_ROADMAP.md pillar 2) needs to know which articles in
the corpus are about HOW TO BE A BETTER COLLECTOR and the PSYCHOLOGY/PHILOSOPHY of
collecting — as opposed to watch reference facts, news, reviews, or listings. Those
live mixed-in across the editorial sources (Screwdown Crown, A Collected Man, WOE…),
all tagged identically as `editorial_blog`, so today nothing can tell them apart.

This runs Claude (Haiku, batched for cost) over each article's title + lede and
writes `public/collector_mentality_tags.json` — a separate index keyed by URL (it
never touches the corpus split, so the 3×/day editorial scrape can't clobber it).
Lumé reads it to power a COACHING mode kept behind the voice firewall: this content
informs how-to-collect guidance, NEVER how a specific watch is described
(feedback_reference_voice_intrinsic). Most of it is opinion/essay, not fact — so the
tag also flags it as the kind of content to present as a view, not a spec.

COST: Haiku, ~$1–2 for the whole editorial pool (title+lede only, batched). Bounded
by --max-articles + source priority. --dry-run sizes a run with no API spend.
Run in CI (tag-collector-mentality.yml, ANTHROPIC_API_KEY) or locally with the key.
"""
from __future__ import annotations

import argparse
import datetime
import json
import os
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "public"
OUT_PATH = PUBLIC / "collector_mentality_tags.json"

# Editorial essay sources, richest-for-mentality first so a cost-capped run hits the
# high-yield ones first. EXCLUDES the priced/dual-track shop feeds (hodinkee_shop,
# hairspring_finds = listings, not essays) and the reference_corpus_* node subsets
# (duplicates of editorial content assembled for synthesis).
PRIORITY_SOURCES = [
    "screwdowncrown",
    "acollectedman_journal",
    "woe_dispatch",
    "bulang_watch_talks",
    "christies_stories",
    "onthedash",
    "bring_a_loupe",
    "hodinkee_reference_points",
    "rolex_magazine",
    "fratello",
]

# Closed theme set → tags stay queryable. The model must pick from these.
THEMES = [
    "buying-discipline", "taste-development", "collecting-philosophy",
    "psychology-of-collecting", "value-mindset", "selling-letting-go",
    "community-ethics", "life-lessons",
]

BATCH = 15          # articles per LLM call (cuts per-call overhead)
LEDE_CHARS = 700    # excerpt length per article — enough to classify intent
MIN_CONF = 0.6      # store positives at/above this confidence
MAX_OUTPUT = 1500

SYSTEM = """You tag articles from watch publications for a "collector mentality" coaching feature in a vintage-watch app.

COLLECTOR MENTALITY = content whose PRIMARY purpose is HOW TO BE A BETTER COLLECTOR or the PSYCHOLOGY / PHILOSOPHY of collecting: developing taste, buying discipline, why we collect, dealing with hype/FOMO/imposter-syndrome, a healthy value mindset, selling and letting go, ethics & community, and life lessons drawn through watches.

NOT collector mentality: watch reference facts, model histories, news, reviews, hands-on/spec write-ups, price/market reports, auction results, product listings. A watch history that ends with one reflective line is NOT mentality — the article's MAIN point must be the collector's mindset.

For each article below (given its index i, title, and excerpt), decide.

Return VALID JSON ONLY — a JSON array, no prose, no markdown fences. Each item:
{"i": <index>, "mentality": true|false, "themes": [<from the allowed set>], "confidence": 0.0-1.0, "reason": "<= 12 words"}
Allowed themes: buying-discipline, taste-development, collecting-philosophy, psychology-of-collecting, value-mindset, selling-letting-go, community-ethics, life-lessons.
themes must be [] when mentality is false. Be strict — when in doubt, mentality=false."""


def meta_path(source: str) -> Path:
    return PUBLIC / f"{source}.json"


def bodies_path(source: str) -> Path:
    return PUBLIC / f"{source}_bodies.json"


def load_articles(sources, max_articles):
    """Yield {source,url,title,lede} across sources, capped at max_articles."""
    out = []
    for source in sources:
        mp, bp = meta_path(source), bodies_path(source)
        if not mp.exists():
            print(f"[warn] missing {mp.name}", file=sys.stderr)
            continue
        try:
            meta = json.loads(mp.read_text(encoding="utf-8"))
            bodies = json.loads(bp.read_text(encoding="utf-8")) if bp.exists() else {}
        except Exception as e:  # noqa: BLE001
            print(f"[warn] {source} not loaded: {e}", file=sys.stderr)
            continue
        items = meta.values() if isinstance(meta, dict) else meta
        for r in items:
            if not isinstance(r, dict):
                continue
            url = r.get("url") or ""
            title = (r.get("title") or "").strip()
            if not url or not title:
                continue
            body = bodies.get(url) or r.get("excerpt") or r.get("summary") or ""
            out.append({
                "source": source, "url": url, "title": title,
                "lede": str(body)[:LEDE_CHARS].strip(),
            })
            if len(out) >= max_articles:
                return out
    return out


def parse_json_array(s):
    s = (s or "").strip()
    if s.startswith("```"):
        s = re.sub(r"^```[a-zA-Z]*\n?", "", s)
        s = re.sub(r"\n?```$", "", s).strip()
    try:
        d = json.loads(s)
        return d if isinstance(d, list) else []
    except Exception:  # noqa: BLE001
        m = re.search(r"\[.*\]", s, re.DOTALL)
        if m:
            try:
                return json.loads(m.group(0))
            except Exception:  # noqa: BLE001
                return []
        return []


def build_batch_prompt(batch):
    lines = []
    for j, a in enumerate(batch):
        lines.append(f"[{j}] TITLE: {a['title']}\nEXCERPT: {a['lede']}\n")
    return "Articles:\n\n" + "\n".join(lines)


def main():
    ap = argparse.ArgumentParser(description="Tag corpus articles as collector-mentality content for Lumé.")
    ap.add_argument("--max-articles", type=int, default=10000, help="cost cap (articles scanned)")
    ap.add_argument("--sources", nargs="*", default=PRIORITY_SOURCES)
    ap.add_argument("--model", default=os.environ.get("MENTALITY_MODEL", "claude-haiku-4-5"))
    ap.add_argument("--min-confidence", type=float, default=MIN_CONF)
    ap.add_argument("--dry-run", action="store_true", help="no API calls — report sizing only")
    args = ap.parse_args()

    articles = load_articles(args.sources, args.max_articles)
    n_batches = (len(articles) + BATCH - 1) // BATCH
    by_src = {}
    for a in articles:
        by_src[a["source"]] = by_src.get(a["source"], 0) + 1
    print(f"articles: {len(articles)} | batches: {n_batches} (size {BATCH}) | model {args.model}")
    for s in args.sources:
        if by_src.get(s):
            print(f"  {by_src[s]:>5}  {s}")

    if args.dry_run:
        approx_in = sum(len(a["title"]) + len(a["lede"]) for a in articles) // 4 + n_batches * 250
        print(f"[dry-run] no API calls. ~{approx_in:,} input tokens across {n_batches} batches "
              f"(~${approx_in / 1_000_000:.2f} input @ Haiku $1/1M).")
        return

    from anthropic import Anthropic  # lazy so --dry-run needs no SDK
    client = Anthropic()
    system = [{"type": "text", "text": SYSTEM, "cache_control": {"type": "ephemeral"}}]

    tags = {}
    counts = {"scanned": 0, "mentality": 0}
    theme_counts = {}
    for bi in range(n_batches):
        batch = articles[bi * BATCH:(bi + 1) * BATCH]
        try:
            resp = client.messages.create(
                model=args.model, max_tokens=MAX_OUTPUT, system=system,
                messages=[{"role": "user", "content": build_batch_prompt(batch)}],
            )
            text = "".join(b.text for b in resp.content if b.type == "text")
        except Exception as e:  # noqa: BLE001
            print(f"[warn] batch {bi + 1}/{n_batches} failed: {e}", file=sys.stderr)
            continue
        for item in parse_json_array(text):
            if not isinstance(item, dict):
                continue
            j = item.get("i")
            if not isinstance(j, int) or j < 0 or j >= len(batch):
                continue
            counts["scanned"] += 1
            if not item.get("mentality") or (item.get("confidence") or 0) < args.min_confidence:
                continue
            a = batch[j]
            themes = [t for t in (item.get("themes") or []) if t in THEMES]
            tags[a["url"]] = {
                "source": a["source"], "title": a["title"], "themes": themes,
                "confidence": round(float(item.get("confidence") or 0), 2),
                "reason": (item.get("reason") or "").strip()[:120],
            }
            counts["mentality"] += 1
            for t in themes:
                theme_counts[t] = theme_counts.get(t, 0) + 1
        if (bi + 1) % 20 == 0:
            print(f"  …{bi + 1}/{n_batches} batches, {counts['mentality']} mentality articles so far")

    out = {
        "schema_version": "1.0.0",
        "generated": datetime.date.today().isoformat(),
        "model": args.model,
        "min_confidence": args.min_confidence,
        "note": "Collector-mentality articles for Lumé COACHING mode only — behind the voice "
                "firewall (never bleed into how a watch is described). Mostly opinion/essay, not fact.",
        "theme_counts": dict(sorted(theme_counts.items(), key=lambda kv: -kv[1])),
        "tags": tags,
    }
    OUT_PATH.write_text(json.dumps(out, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Wrote {OUT_PATH.relative_to(ROOT)}: {counts['mentality']} mentality articles "
          f"of {counts['scanned']} classified. Themes: {out['theme_counts']}")


if __name__ == "__main__":
    main()
