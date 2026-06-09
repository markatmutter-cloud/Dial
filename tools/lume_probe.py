#!/usr/bin/env python3
"""
Lumé conversation probe — run real multi-turn conversations through the ACTUAL
system prompt + real tool data on the real models, then GRADE each reply against
the tone/behaviour we want. Built after the find_missed miss taught the lesson:
test the CONVERSATION, not just the data plumbing ([[feedback_test_the_conversation]]).

Uses YOUR Anthropic key. Provide it via env or a gitignored .env.local:
    ANTHROPIC_API_KEY=sk-ant-...

Run:
    pip install anthropic      # once
    python3 tools/lume_probe.py
    python3 tools/lume_probe.py --only missed_links   # one scenario
    python3 tools/lume_probe.py --no-judge            # skip the LLM grader (cheaper)

What it does, per scenario:
  1. Runs the multi-turn conversation through the real tool-use loop (the same
     prompt, tool schemas, and model routing api/chat.js uses), with find_missed
     / search_listings answering from the real public/*.json.
  2. Cheap regex CHECKS on every reply (banned filler, price-ladder, em-dash,
     count quotes, self-contradiction, inline-link presence).
  3. An LLM JUDGE grades each reply against the tone rubric (from
     docs/LUME_TONE_GUIDANCE.md) and returns concrete violations.
  4. Prints the conversation + every finding, then a summary.
"""
import argparse
import json
import os
import re
import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"

# Load a gitignored .env.local (KEY=VALUE lines) so the key never touches chat/git.
_envf = ROOT / ".env.local"
if _envf.exists():
    for ln in _envf.read_text().splitlines():
        ln = ln.strip()
        if ln and not ln.startswith("#") and "=" in ln:
            k, v = ln.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))

try:
    from anthropic import Anthropic
except ImportError:
    sys.exit("pip install anthropic first")

KEY = os.environ.get("ANTHROPIC_API_KEY")
if not KEY:
    sys.exit("Set ANTHROPIC_API_KEY (env or a gitignored .env.local with ANTHROPIC_API_KEY=...)")

SYSTEM = (PUBLIC / "lume_system_prompt.txt").read_text()
client = Anthropic(api_key=KEY)
MODEL_FAST = "claude-haiku-4-5"
MODEL_SMART = "claude-opus-4-8"
JUDGE_MODEL = "claude-sonnet-4-6"
NOW = date(2026, 6, 8)


def choose_model(t):
    t = (t or "").lower()
    if len(t) > 400:
        return MODEL_SMART
    if re.search(r"\b(why|compare|vs\.?|versus|recommend|recommendation|should i|which|better|worth it|instead|help me (decide|choose))\b", t):
        return MODEL_SMART
    return MODEL_FAST


# ── real-data tools ───────────────────────────────────────────────────
_live = json.loads((PUBLIC / "listings_live.json").read_text())
_sold = json.loads((PUBLIC / "listings_sold.json").read_text())


def norm(s):
    return str(s or "").lower()


def _parse(d):
    try:
        return date.fromisoformat((d or "")[:10])
    except Exception:
        return None


def _urlkey(u):
    return re.sub(r"/+$", "", norm(u).replace("https://", "").replace("http://", "").replace("www.", "").split("?")[0])


def tool_find_missed(inp, hearted):
    mode = inp.get("mode") if inp.get("mode") in ("live_unsaved", "sold_unsaved", "sold_saved") else "live_unsaved"
    window = min(max(int(inp.get("window_days") or 7), 1), 60)
    limit = min(max(int(inp.get("limit") or 8), 1), 15)
    sold = mode != "live_unsaved"
    only_saved = mode == "sold_saved"
    src = _sold if sold else _live
    taste_keys = {f"{norm(h.get('brand'))}|{norm(h.get('model_line') or h.get('model') or '')}" for h in hearted}
    taste_brands = {norm(h.get("brand")) for h in hearted}
    hearted_urls = {_urlkey(h.get("url")) for h in hearted if h.get("url")}
    out = []
    for it in src:
        if sold and not it.get("sold"):
            continue
        if not sold and it.get("sold"):
            continue
        d = _parse(it.get("soldAt") if sold else it.get("firstSeen"))
        if not d or (NOW - d).days > window or (NOW - d).days < 0:
            continue
        saved = _urlkey(it.get("url")) in hearted_urls
        if only_saved and not saved:
            continue
        if not only_saved and saved:
            continue
        brand = norm(it.get("brand"))
        ml = norm(it.get("model_line") or it.get("model") or "")
        if not only_saved and (taste_keys or taste_brands):
            if not (f"{brand}|{ml}" in taste_keys or brand in taste_brands):
                continue
        price = it.get("priceUSD") or it.get("lastMeaningfulPrice")
        price = price if isinstance(price, (int, float)) and price > 0 else None
        tts = None
        if sold and it.get("firstSeen") and it.get("soldAt"):
            tts = max(0, (_parse(it["soldAt"]) - _parse(it["firstSeen"])).days)
        out.append({
            "brand": it.get("brand"), "model": it.get("model_line") or it.get("model"),
            "reference": it.get("reference_id") or it.get("reference_no") or it.get("ref"),
            "priceUSD": price, "source": it.get("source"), "url": it.get("url"),
            "time_to_sell_days": tts, "firstSeen": it.get("firstSeen"), "soldAt": it.get("soldAt"),
            "taste_match": "model" if f"{brand}|{ml}" in taste_keys else ("brand" if brand in taste_brands else None),
        })
    if mode == "sold_unsaved":
        out.sort(key=lambda x: (x["time_to_sell_days"] if x["time_to_sell_days"] is not None else 999))
    else:
        out.sort(key=lambda x: (x.get("soldAt") if sold else x.get("firstSeen")) or "", reverse=True)
    return {"count": len(out), "mode": mode, "window_days": window, "results": out[:limit]}


def tool_search_listings(inp):
    limit = min(max(int(inp.get("limit") or 8), 1), 15)
    files = [_live] + ([_sold] if inp.get("include_sold") else [])
    q, brand, ref = norm(inp.get("query")), norm(inp.get("brand")), norm(inp.get("reference"))
    res = []
    for arr in files:
        for it in arr:
            hay = norm(f"{it.get('brand')} {it.get('ref')} {it.get('model_line')} {it.get('reference_id')} {it.get('reference_no')}")
            if q and q not in hay:
                continue
            if brand and brand not in norm(it.get("brand")):
                continue
            if ref and ref not in norm(f"{it.get('reference_id')} {it.get('reference_no')} {it.get('ref')}"):
                continue
            res.append({
                "brand": it.get("brand"), "model": it.get("model_line") or it.get("model"),
                "reference": it.get("reference_id") or it.get("reference_no"), "priceUSD": it.get("priceUSD"),
                "source": it.get("source"), "sold": bool(it.get("sold")), "url": it.get("url"),
            })
            if len(res) >= limit * 3:
                break
    return {"count": len(res), "results": res[:limit]}


TOOLS = [
    {"name": "get_user_context", "description": "Read the signed-in user's saved data (hearted items, counts).",
     "input_schema": {"type": "object", "properties": {}, "additionalProperties": False}},
    {"name": "search_listings", "description": "Search live (and optionally sold) dealer listings. Filter by query/brand/reference/price.",
     "input_schema": {"type": "object", "properties": {"query": {"type": "string"}, "brand": {"type": "string"}, "reference": {"type": "string"}, "min_price_usd": {"type": "number"}, "max_price_usd": {"type": "number"}, "include_sold": {"type": "boolean"}, "limit": {"type": "number"}}, "additionalProperties": False}},
    {"name": "find_missed", "description": "Find watches the user MISSED in their taste. modes: live_unsaved / sold_unsaved (the ones that got away, with time_to_sell_days + sold price) / sold_saved (their hearts that sold). Unsaved modes exclude hearted. Use for 'what did I miss this week'.",
     "input_schema": {"type": "object", "properties": {"mode": {"type": "string", "enum": ["live_unsaved", "sold_unsaved", "sold_saved"]}, "window_days": {"type": "number"}, "limit": {"type": "number"}}, "additionalProperties": False}},
    {"name": "get_reference", "description": "Curated reference index + deep-dive syntheses for a brand/model_line/reference.",
     "input_schema": {"type": "object", "properties": {"brand": {"type": "string"}, "model_line": {"type": "string"}, "reference": {"type": "string"}, "query": {"type": "string"}}, "additionalProperties": False}},
    {"name": "get_auction_state", "description": "Upcoming/live/ended auction-house sales.",
     "input_schema": {"type": "object", "properties": {"status": {"type": "string"}, "house": {"type": "string"}, "limit": {"type": "number"}}, "additionalProperties": False}},
    {"name": "search_articles", "description": "Search the editorial article corpus for knowledge about a watch/brand/model/topic.",
     "input_schema": {"type": "object", "properties": {"query": {"type": "string"}, "brand": {"type": "string"}, "limit": {"type": "number"}}, "additionalProperties": False}},
]


def run_tool(name, inp, hearted):
    inp = inp or {}
    if name == "find_missed":
        return tool_find_missed(inp, hearted)
    if name == "search_listings":
        return tool_search_listings(inp)
    if name == "get_user_context":
        return {"hearted_count": len(hearted), "hearted_sample": hearted[:12], "saved_search_count": 0}
    # get_reference / get_auction_state / search_articles: not the focus of these
    # listing scenarios — return empty so Lumé doesn't free-recall.
    return {"count": 0, "results": [], "note": "no corpus entry in probe"}


def content_to_dicts(content):
    out = []
    for b in content:
        if b.type == "tool_use":
            out.append({"type": "tool_use", "id": b.id, "name": b.name, "input": b.input})
        elif b.type == "text":
            out.append({"type": "text", "text": b.text})
    return out


def run_turn(convo, hearted):
    """Run one user turn through the bounded tool-use loop; return (reply, toolnames)."""
    last_user = next((m["content"] for m in reversed(convo) if m["role"] == "user" and isinstance(m["content"], str)), "")
    model = choose_model(last_user)
    names = []
    for _ in range(6):
        params = {"model": model, "max_tokens": 1024, "system": [{"type": "text", "text": SYSTEM}], "tools": TOOLS, "messages": convo}
        if model == MODEL_SMART:
            params["thinking"] = {"type": "disabled"}
        r = client.messages.create(**params)
        if r.stop_reason == "tool_use":
            convo.append({"role": "assistant", "content": content_to_dicts(r.content)})
            results = []
            for b in r.content:
                if b.type == "tool_use":
                    names.append(b.name)
                    results.append({"type": "tool_result", "tool_use_id": b.id, "content": json.dumps(run_tool(b.name, b.input, hearted))[:60000]})
            convo.append({"role": "user", "content": results})
            continue
        text = "\n".join(b.text for b in r.content if b.type == "text").strip()
        text = re.sub(r"<actions>[\s\S]*?</actions>", "", text).strip()  # drop the chips block from the prose view
        convo.append({"role": "assistant", "content": text})
        return text, names
    return "(tool loop exhausted)", names


# ── cheap regex checks ────────────────────────────────────────────────
BANNED = re.compile(r"\b(great data|core hunting grounds|taste profile|collector journey|aligns with your profile|considering list|curated for you|exciting opportunit|wrist candy)\b", re.I)
LADDER = re.compile(r"\b(starter (watch|piece)|entry.?level|ready to move up|graduate to|a serious collector would|upgrade from)\b", re.I)
COUNT = re.compile(r"\b\d{2,}\s+(live\s+)?listings?\b", re.I)
CONTRADICT = re.compile(r"isn'?t (in our system|live|available)|aren'?t (in our system|live|available)|not in our system", re.I)


def regex_findings(reply, expect_links):
    f = []
    if BANNED.search(reply):
        f.append(f"banned filler: '{BANNED.search(reply).group(0)}'")
    if LADDER.search(reply):
        f.append(f"price-ladder language: '{LADDER.search(reply).group(0)}'")
    if "—" in reply:
        f.append("em-dash in copy")
    if COUNT.search(reply):
        f.append(f"quoted a count: '{COUNT.search(reply).group(0)}'")
    if CONTRADICT.search(reply):
        f.append(f"self-contradiction phrase: '{CONTRADICT.search(reply).group(0)}'")
    if expect_links:
        watches = len(re.findall(r"\bRolex|\bOmega|\bTudor|\bHeuer|\bPatek|\bJaeger|\brolex", reply))
        links = len(re.findall(r"\]\(https?://", reply))
        if watches and links == 0:
            f.append("named watches but linked none")
    return f


JUDGE_SYSTEM = """You grade a reply from "Lumé", a watch chat assistant, against the product's tone + behaviour rules. Be strict but fair. The rules:
- Plain words (watch/listing/article), NEVER "pieces"; no chatty filler ("great data", "taste profile", "core hunting grounds").
- Opens with substance, not a reaction to the user.
- No price ladder: never frames a pricier watch as automatically better/more serious; no "starter/entry-level/move up".
- Grounded: never invents a user construct ("your considering list"); never asserts a watch fact it wasn't given; never tells the user a watch it surfaced "isn't in our system".
- When listing specific watches, links each one inline.
- Concrete watch reasons, not empty filler; names recommendation distance where relevant; ends with a real next step; doesn't pad when matches are thin.
- No em-dashes.
Return ONLY JSON: {"ok": true|false, "violations": ["short specific violation", ...]}. Empty violations if clean."""


def judge(user_text, reply):
    r = client.messages.create(
        model=JUDGE_MODEL, max_tokens=500,
        system=[{"type": "text", "text": JUDGE_SYSTEM}],
        messages=[{"role": "user", "content": f"USER ASKED:\n{user_text}\n\nLUMÉ REPLIED:\n{reply}\n\nGrade it. JSON only."}],
    )
    txt = "".join(b.text for b in r.content if b.type == "text")
    m = re.search(r"\{[\s\S]*\}", txt)
    try:
        return json.loads(m.group(0)) if m else {"ok": False, "violations": ["judge parse error"]}
    except Exception:
        return {"ok": False, "violations": ["judge parse error"]}


# ── scenarios ─────────────────────────────────────────────────────────
ROLEX_TOOL = [
    {"brand": "Rolex", "model_line": "Submariner", "url": ""},
    {"brand": "Rolex", "model_line": "GMT-Master", "url": ""},
    {"brand": "Rolex", "model_line": "Sea-Dweller", "url": ""},
]
SPEEDY = [{"brand": "Omega", "model_line": "Speedmaster", "url": ""}]

SCENARIOS = [
    {"id": "missed_links", "hearted": ROLEX_TOOL, "expect_links": True,
     "turns": ["What's been listed this week I haven't hearted that might be a good fit for me?",
               "can you give me links for all of these?"]},
    {"id": "got_away", "hearted": ROLEX_TOOL, "expect_links": True,
     "turns": ["Did anything good sell this week that I missed?"]},
    {"id": "hearted_got_away", "hearted": ROLEX_TOOL, "expect_links": False,
     "turns": ["Have any of my hearted watches sold recently?"]},
    {"id": "thin_taste", "hearted": [{"brand": "F.P. Journe", "model_line": "Chronometre Bleu", "url": ""}], "expect_links": False,
     "turns": ["What did I miss this week that fits me?"]},
    {"id": "price_ladder_probe", "hearted": SPEEDY, "expect_links": False,
     "turns": ["Is a Patek Philippe a more serious collector's watch than my Speedmaster?"]},
    {"id": "compare", "hearted": ROLEX_TOOL, "expect_links": True,
     "turns": ["Show me some Submariners that got away and tell me which was the best buy"]},
]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", help="run one scenario id")
    ap.add_argument("--no-judge", action="store_true")
    args = ap.parse_args()
    scenarios = [s for s in SCENARIOS if not args.only or s["id"] == args.only]

    total_findings = 0
    for s in scenarios:
        print("\n" + "=" * 78 + f"\nSCENARIO: {s['id']}  (taste: {', '.join(h['brand']+' '+h['model_line'] for h in s['hearted'])})\n" + "=" * 78)
        convo = []
        for turn in s["turns"]:
            convo.append({"role": "user", "content": turn})
            reply, tools = run_turn(convo, s["hearted"])
            print(f"\n>>> USER: {turn}\n--- tools: {tools or 'none'} ---\nLUMÉ: {reply}\n")
            findings = regex_findings(reply, s["expect_links"])
            if not args.no_judge:
                j = judge(turn, reply)
                findings += [f"[judge] {v}" for v in (j.get("violations") or [])]
            if findings:
                total_findings += len(findings)
                print("  ⚠ FINDINGS:")
                for x in findings:
                    print(f"    - {x}")
            else:
                print("  ✓ clean")
    print("\n" + "=" * 78 + f"\nDONE. {total_findings} finding(s) across {len(scenarios)} scenario(s).\n" + "=" * 78)


if __name__ == "__main__":
    main()
