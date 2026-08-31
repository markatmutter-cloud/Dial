# Session handoff — 2026-08-31

**One-line:** One small Lumé UX fix shipped (#936, merged). Then Mark said he's
**still not liking how Lumé responds** — that thread is now logged as **B-84**
and is the real next piece of work. It is *not* diagnosed: Mark hasn't said
which failure mode he means, and nobody should touch the prompt until he does.

## What shipped
- **#936 — seeded Lumé opens skip the standard intro.** Merged to `main`
  (`efe878e`). "Share with Lumé" (card ⋯) and the share-receive "Ask Lumé"
  callout now open the chat with no greeting and no starter chips, so the answer
  about that watch leads instead of the "what's your watch problem?" wall. A
  plain launcher open is unchanged. `ChatBubbleHost` holds a `seeded` flag that
  sticks for the life of the thread (minimise/reopen doesn't bring the intro
  back); two tests in `ChatBubbleHost.test.jsx` cover both paths. Full jest
  suite green.

## The live thread — B-84, Lumé's response quality
Mark: *"I'm still not liking the way lume responds."* The **still** points back
at the 2026-06-18 weak-chat-feel thread that `LUME_FORCE_SMART_MODEL` was built
to A/B and that was never concluded.

**Do not start editing the prompt.** The complaint has at least six materially
different readings (generic voice · too hedged · too long · shallow · answers
the wrong thing · facts thin). **Step one is asking Mark which, ideally with one
bad transcript pasted in.** Everything else is guessing at a rewrite.

Two suspects were gathered this session, both unverified, both in B-84:
1. **Prompt overload** — `public/lume_system_prompt.txt` is 141 lines, mostly
   prohibitions; the voice section is ~6 of them.
2. **The A/B was never concluded** — `chooseModel` still defaults to Haiku with
   Opus on compare/why/recommend intents (`api/lume_reference.js:48-65`), and
   the temporary `LUME_FORCE_SMART_MODEL` switch is still in the code. **Check
   whether it's still set in the Vercel env before anything else** — if it is,
   live chat is all-Opus and the routing is moot. I could not check it from
   here.

When verifying: run the **real** conversation (`tools/lume_probe.py` or
subagents on the real prompt + real tool data) and read the answers. Mind
**B-76** first — the eval suite bills real models and has drained credit before.

## Also logged
- **B-84 — Lumé's response quality** (above). That is the only new ID from this
  session; the Knightsbridge pagination bug I was about to log turned out to be
  already filed as **B-83** by the 08-30 session's second close pass, which
  landed mid-write. Theirs is the better entry and it stayed; my duplicate was
  dropped and my Lumé entry renumbered around it.

## Parallel-session note (read before assuming state)
The 2026-08-30 session was closing at the same time as this one and pushed a
second close pass (`e0433a7`) while I was mid-rebase. Its handoff is therefore
**still live and NOT archived** — `SESSION_HANDOFF_2026-08-30.md` and this file
both exist. Read both; this one does not restate its scrape-failure detail.
What changed since it was written: **all five of its PRs have merged** (#937
included), its B-81 hypothesis correction has already landed, and Watch Center
stays muted to **2026-09-13** (B-80) serving stale listings meanwhile.

## Environment note
Remote sandbox. The egress proxy blocks several dealer domains
(`collectorscornerny.com`, `watchesofknightsbridge.com`, `watchfid.com`), so
direct probes are impossible here — use `source-probe.yml` from CI, remembering
it uses plain curl and so says nothing about a curl_cffi path. `personal/` is
gitignored and absent from a fresh clone, so **LEARNING.md could not be updated
from this session** — that note is owed on a machine that has it.

## Clean state
`main` clean and in sync. My branch `claude/watch-share-chat-intro-n2ry3q` is
merged and can be deleted. **No PRs left open** — #937 merged during this close.
