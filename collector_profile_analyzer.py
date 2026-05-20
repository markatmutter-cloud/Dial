#!/usr/bin/env python3
"""Collector-profile analyzer — Sonnet 4.6 read of a user's taste signals.

Pulls a user's Supabase data (hearts, lists, hidden, owned, sold,
wishlist, saved searches, reactions) into a structured prompt and
asks Claude Sonnet 4.6 to write a paragraph about what kind of
collector this person looks like — taste, era preferences, brand
loyalty, where they're cautious, where they're aspirational, blind
spots, where their taste might go next.

Mark feedback 2026-05-20: "would we be able to try what it can
discern from my saved/hearted/added to lists data, previous buys,
current owned, shared with data."

This is an experimental one-shot. If the result is useful, the
analyzer's prompt + data shape can move into a recommender pipeline
later (see docs/RECOMMENDER_STRATEGY.md — Layer 2 "Collector
Mentality").

Setup (env vars):
    SUPABASE_URL           — https://<project>.supabase.co
    SUPABASE_SERVICE_KEY   — service-role key (read-only is fine)
    ANTHROPIC_API_KEY      — sk-ant-api03-...

Run:
    python3 collector_profile_analyzer.py                  # admin user (Mark)
    python3 collector_profile_analyzer.py --user-id <uuid> # any user

Cost: ~$0.03-0.05 per analysis at Sonnet 4.6 rates.
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from collections import Counter, defaultdict
from typing import Any

try:
    import anthropic
except ImportError:
    print("ERROR: install the Anthropic SDK: pip install anthropic", file=sys.stderr)
    sys.exit(1)

try:
    import requests
except ImportError:
    print("ERROR: install requests: pip install requests", file=sys.stderr)
    sys.exit(1)


# Mark's user_id (admin per CLAUDE.md). Override via --user-id for other users.
ADMIN_USER_ID = "3bf3f9e7-cd1b-4289-8b47-0536a15ea1eb"


def supabase_rpc(table: str, params: dict, base: str, headers: dict) -> list:
    """Issue a PostgREST GET to a Supabase table. Returns a list of rows."""
    url = f"{base}/rest/v1/{table}"
    r = requests.get(url, params=params, headers=headers, timeout=30)
    r.raise_for_status()
    return r.json()


def fetch_taste_data(user_id: str) -> dict:
    """Pull everything we want to analyse from Supabase. Returns a
    structured dict the LLM prompt builder consumes."""
    base = os.environ["SUPABASE_URL"].rstrip("/")
    key = os.environ.get("SUPABASE_SERVICE_KEY") or os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not key:
        print("ERROR: SUPABASE_SERVICE_KEY (or SUPABASE_SERVICE_ROLE_KEY) not set.", file=sys.stderr)
        sys.exit(1)
    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Accept": "application/json",
    }
    user_eq = f"eq.{user_id}"

    # Hearted items — the strongest positive signal. Pull snapshot for
    # brand/ref/source/price.
    hearts = supabase_rpc(
        "watchlist_items",
        {"user_id": user_eq, "select": "listing_id,saved_price_usd,saved_at,listing_snapshot", "limit": "1000"},
        base, headers,
    )

    # Hidden listings — what they actively rejected. Strong negative signal.
    # No snapshot column, so we only know the listing_id was hidden.
    hidden = supabase_rpc(
        "hidden_listings",
        {"user_id": user_eq, "select": "listing_id,hidden_at", "limit": "1000"},
        base, headers,
    )

    # Collections (lists) — name + type carries explicit intent (e.g.
    # "Wishlist", "Owned", "Hot Picks 2026").
    cols = supabase_rpc(
        "collections",
        {"user_id": user_eq, "select": "id,name,type,description,is_system,target_count,budget", "limit": "100"},
        base, headers,
    )

    # Collection items — joined later in-process. Pull all for this user's
    # collections.
    col_ids = [c["id"] for c in cols]
    col_items_by_id: dict[str, list] = {}
    if col_ids:
        # PostgREST `in.()` syntax — comma-separated UUIDs.
        in_clause = "in.(" + ",".join(col_ids) + ")"
        items = supabase_rpc(
            "collection_items",
            {
                "collection_id": in_clause,
                "select": (
                    "collection_id,listing_id,is_manual,is_pick,reasoning,"
                    "manual_brand,manual_model,manual_reference,manual_material,"
                    "manual_price_paid,manual_price_currency,manual_sold_price,"
                    "manual_sold_date,manual_comments,manual_thoughts,manual_description,"
                    "saved_price_usd,saved_currency,listing_snapshot,added_at,position,"
                    "flagged_for_sale,assumed_sell_value,source_of_entry"
                ),
                "limit": "2000",
            },
            base, headers,
        )
        for it in items:
            col_items_by_id.setdefault(it["collection_id"], []).append(it)

    # Saved searches — recurring interests the user named themselves.
    searches = supabase_rpc(
        "saved_searches",
        {"user_id": user_eq, "select": "label,query,min_price,max_price,created_at"},
        base, headers,
    )

    # Reactions on collection items (where this user is the reactor).
    # Bucket by emoji to see overall sentiment pattern.
    reactions = supabase_rpc(
        "collection_item_reactions",
        {"user_id": user_eq, "select": "emoji,created_at,collection_item_id", "limit": "500"},
        base, headers,
    )

    return {
        "hearts": hearts,
        "hidden": hidden,
        "collections": cols,
        "collection_items_by_id": col_items_by_id,
        "saved_searches": searches,
        "reactions": reactions,
    }


def summarise(data: dict) -> str:
    """Reduce the raw data into a compact prompt. We want the LLM to see
    structure, not raw rows — too much noise dilutes signal. Aim for
    ~4-8K input tokens."""
    out: list[str] = []
    hearts = data["hearts"]
    hidden = data["hidden"]
    cols = data["collections"]
    col_items = data["collection_items_by_id"]
    searches = data["saved_searches"]
    reactions = data["reactions"]

    out.append(f"# Collector dataset (anonymised)\n")
    out.append(f"- Hearted items: {len(hearts)}")
    out.append(f"- Hidden items: {len(hidden)}")
    out.append(f"- Collections: {len(cols)}")
    out.append(f"- Total collection items: {sum(len(v) for v in col_items.values())}")
    out.append(f"- Saved searches: {len(searches)}")
    out.append(f"- Reactions on shared items: {len(reactions)}\n")

    # ── Hearted: brand distribution + ref top hits + price range ──
    h_by_brand: Counter = Counter()
    h_refs: Counter = Counter()
    h_sources: Counter = Counter()
    h_prices: list[float] = []
    for it in hearts:
        snap = it.get("listing_snapshot") or {}
        brand = (snap.get("brand") or "Unknown").strip() or "Unknown"
        h_by_brand[brand] += 1
        ref = snap.get("reference_no") or snap.get("model_line")
        if ref:
            h_refs[(brand, str(ref))] += 1
        src = snap.get("source")
        if src:
            h_sources[src] += 1
        p = it.get("saved_price_usd") or snap.get("priceUSD") or snap.get("savedPriceUSD")
        if p and p > 0:
            try:
                h_prices.append(float(p))
            except (TypeError, ValueError):
                pass

    out.append("## Hearts — brand distribution (top 20)")
    for b, n in h_by_brand.most_common(20):
        out.append(f"  {b}: {n}")

    out.append("\n## Hearts — top references (brand + ref, top 20)")
    for (b, ref), n in h_refs.most_common(20):
        out.append(f"  {b} {ref}: {n}")

    if h_prices:
        h_prices.sort()
        out.append(f"\n## Hearts — price range (USD)")
        out.append(f"  min: ${h_prices[0]:.0f}")
        out.append(f"  25th: ${h_prices[len(h_prices)//4]:.0f}")
        out.append(f"  median: ${h_prices[len(h_prices)//2]:.0f}")
        out.append(f"  75th: ${h_prices[3*len(h_prices)//4]:.0f}")
        out.append(f"  max: ${h_prices[-1]:.0f}")

    out.append("\n## Hearts — top sources (top 12)")
    for s, n in h_sources.most_common(12):
        out.append(f"  {s}: {n}")

    # ── Collections breakdown ──
    out.append("\n\n## Collections (user-created lists + system buckets)")
    # Sort: system buckets first (Owned/Sold/Wishlist), then by item count.
    cols_sorted = sorted(cols, key=lambda c: (
        0 if c.get("is_system") else 1,
        -len(col_items.get(c["id"], [])),
    ))
    for c in cols_sorted:
        items = col_items.get(c["id"], [])
        ctype = c.get("type", "?")
        sysm = " [SYSTEM]" if c.get("is_system") else ""
        challenge_meta = ""
        if ctype == "challenge":
            challenge_meta = f" target={c.get('target_count')} budget={c.get('budget')}"
        out.append(f"\n### {c['name']!r} ({ctype}{sysm}{challenge_meta}) — {len(items)} items")
        if c.get("description"):
            out.append(f"   description: {c['description'][:200]}")
        # Sample items — manual entries first, then snapshot items.
        sample_lines: list[str] = []
        for it in items[:10]:
            if it.get("is_manual"):
                brand = it.get("manual_brand") or "?"
                model = it.get("manual_model") or ""
                ref = it.get("manual_reference") or ""
                price = it.get("manual_price_paid")
                cur = it.get("manual_price_currency") or "USD"
                sold = it.get("manual_sold_price")
                pieces = [f"{brand} {model} {ref}".strip()]
                if price:
                    pieces.append(f"paid {cur} {price:.0f}")
                if sold:
                    pieces.append(f"sold {cur} {sold:.0f}")
                thought = (it.get("manual_thoughts") or it.get("manual_comments") or "").strip()
                if thought:
                    pieces.append(f'"{thought[:120]}"')
                sample_lines.append("   - " + " · ".join(pieces))
            else:
                snap = it.get("listing_snapshot") or {}
                brand = snap.get("brand", "?")
                ref = snap.get("ref") or snap.get("model_line") or ""
                price = it.get("saved_price_usd") or snap.get("priceUSD") or 0
                pick_tag = " [PICK]" if it.get("is_pick") else ""
                reason = (it.get("reasoning") or "").strip()
                line = f"   - {brand} {str(ref)[:60]}{pick_tag}"
                if price:
                    line += f" · ${float(price):.0f}"
                if reason:
                    line += f' · "{reason[:120]}"'
                sample_lines.append(line)
        if len(items) > 10:
            sample_lines.append(f"   ... and {len(items) - 10} more")
        out.extend(sample_lines)

    # ── Hidden: brand-level summary ──
    out.append(f"\n\n## Hidden items: {len(hidden)} total")
    out.append("  (no snapshot stored — listing IDs only. The fact that this user actively HID this many items is itself a signal of curation pickiness.)")

    # ── Saved searches ──
    if searches:
        out.append("\n\n## Saved searches (user-named recurring interests)")
        for s in searches:
            line = f"  - {s['label']!r} (query: {s['query']!r})"
            if s.get("min_price") or s.get("max_price"):
                line += f"  price: {s.get('min_price', '')}–{s.get('max_price', '')}"
            out.append(line)

    # ── Reactions ──
    if reactions:
        emoji_counts = Counter(r.get("emoji") for r in reactions if r.get("emoji"))
        out.append(f"\n\n## Reactions on shared collection items (top emojis)")
        for e, n in emoji_counts.most_common(8):
            out.append(f"  {e}: {n}")

    return "\n".join(out)


SYSTEM_PROMPT = """You are a watch-collector taste analyst.

You will read a structured dataset of a single collector's behaviour on a vintage-watch curation app — what they've hearted, hidden, organised into lists, saved as recurring searches, marked as owned/sold/wishlist, and reacted to.

Write a thoughtful 400-600 word profile of this collector. Cover:

1. **What kind of collector are they?** Era preferences, brand loyalty, complications, price comfort zone, niche vs canonical taste.

2. **Where is their taste decided vs exploratory?** Strong signals (heavy brand concentration, recurring refs, specific lists) vs places they're sampling more broadly.

3. **What's the through-line?** Is there a thematic thread (motorsport / military / tropical dials / integrated bracelets / classic designers)?

4. **What might they be cautious of, and what are they aspirational about?** Hidden items and budget constraints point at the former; outlier price points and "wishlist" content point at the latter.

5. **Where might their taste go next?** Adjacent references, deeper cuts in lines they already favour, contrarian moves.

6. **Blind spots and biases.** What's noticeably absent? Where might recommendations help them broaden?

Write in second-person ("you") as if speaking to the collector. Be specific — name actual brands and references when they're clearly load-bearing. Avoid generic SaaS / horoscope language. If something is ambiguous, say so.

Don't list every brand or stat — synthesise. Quote a list name or a manual-entry note if it reveals intent. End with one or two pointed observations or questions worth thinking about."""


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("--user-id", default=ADMIN_USER_ID,
                        help="Supabase user UUID (default: admin/Mark).")
    parser.add_argument("--model", default="claude-sonnet-4-6",
                        help="Anthropic model ID (default: Sonnet 4.6).")
    parser.add_argument("--dump-prompt", action="store_true",
                        help="Print the assembled prompt to stderr before calling the API.")
    parser.add_argument("--out", default="",
                        help="Write analysis to this file in addition to stdout.")
    args = parser.parse_args()

    if not os.environ.get("ANTHROPIC_API_KEY"):
        print("ERROR: ANTHROPIC_API_KEY not set.", file=sys.stderr)
        sys.exit(1)

    print(f"Fetching Supabase data for user {args.user_id} ...", file=sys.stderr)
    data = fetch_taste_data(args.user_id)
    user_prompt = summarise(data)

    if args.dump_prompt:
        print("\n────── PROMPT ──────", file=sys.stderr)
        print(user_prompt, file=sys.stderr)
        print("────── END PROMPT ──────\n", file=sys.stderr)

    print(f"Calling {args.model} ...", file=sys.stderr)
    client = anthropic.Anthropic()
    response = client.messages.create(
        model=args.model,
        max_tokens=2000,
        system=[{
            "type": "text",
            "text": SYSTEM_PROMPT,
            "cache_control": {"type": "ephemeral"},
        }],
        messages=[{"role": "user", "content": user_prompt}],
    )
    text = next((b.text for b in response.content if b.type == "text"), "")

    print(text)
    if args.out:
        with open(args.out, "w") as f:
            f.write(text + "\n")
        print(f"\n[wrote analysis to {args.out}]", file=sys.stderr)

    # Token / cost summary to stderr.
    usage = response.usage
    if usage:
        print(f"\n[usage] input={usage.input_tokens} output={usage.output_tokens} "
              f"cache_read={getattr(usage, 'cache_read_input_tokens', 0) or 0} "
              f"cache_write={getattr(usage, 'cache_creation_input_tokens', 0) or 0}", file=sys.stderr)


if __name__ == "__main__":
    main()
