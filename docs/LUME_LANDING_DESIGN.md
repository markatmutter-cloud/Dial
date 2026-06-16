# Lumé Landing — the adaptive morphing canvas (design rationale)

*A shareable narrative of how the Lumé landing surface is designed. Companion to
[LUME_UX_PRINCIPLES.md](LUME_UX_PRINCIPLES.md) (the voice/UX bible) and ROADMAP
Epic 10 (the feature thread). Started 2026-06-16.*

## The problem with a chat box

A blinking "how can I help?" text box is the wrong front door for a watch tool.
It asks the user to do the hard part (know what to ask, type it well), it returns
walls of links that don't feel clickable, and it never changes, so it goes stale
within a few weeks of daily use. The interesting thing Watchlist knows is its
data: live listings, sold lots, auctions, articles, reference guides. The landing
should *show* that, and reshape itself to the moment.

## The model: a morphing canvas, not a transcript

Lumé's landing is a **canvas that morphs**, not a chat log. Three things compose:

1. **A prompt-card grid.** A header question ("What are you after today?") over a
   set of journey cards (icon, title, one-line subtitle). Each card is a real
   user intent, not a canned prompt.
2. **Visual result panels.** Tapping a card morphs the canvas into a panel of
   actual watch cards (tap to open, easy to skip), with a "show more" that
   expands into a horizontal-scroll row. Cards everywhere; never a link list.
3. **A woven-in input.** A free-text bar is always present. Typing flows into the
   conversation when the user wants depth, but the *default* posture is "browse
   what I surfaced," not "compose a query."

The canvas is one host-agnostic component. It proves out in the Lumé tab today
and graduates into a full-screen, full-bleed surface summoned from the launcher
later, unchanged.

**Layout.** On a wide screen it's a **two-pane split**: the morphing **content on
the left** (with a Search bar) and an **always-on chat rail on the right** (Ask).
Tapping a journey or card updates the left while the conversation persists on the
right, so search-vs-ask is spatial, not a mode toggle. On mobile there's no room
to split, so it stays single-column: Search + Ask share one input and chat is a
view you switch into.

## The journeys

The Phase-1 journeys are all backed by data already in the app, so they render
instantly with no model round-trip:

- **Just listed** — the newest watches in.
- **What I might have missed** — in your taste, still live, not yet saved.
- **The ones that got away** — sold before you saved them, fastest sellers first.
- **What I followed that sold** — your hearts that have since sold.
- **Auctions ending soon** — lots closing in days.
- **Worth reading** — fresh from the journals.

(Deeper journeys — delve into a reference's history, compare two references — run
through the conversation and are a later phase, as are the journeys that need new
data: "new in my saved searches" and curated "auctions of note.")

## The adaptive layer (the part worth sharing)

Two pieces make the landing feel alive instead of fixed. Both run off **cheap,
local usage signals** (how many times you've opened Lumé, how long since your last
visit, how often you return in a day, how many watches you've hearted). No backend
required for the behaviour; the durable, cross-device version rides on the Lumé
profile/memory store later.

### 0. A warm, designed starter (not a banner over a menu)

The landing leads with a **personal greeting that names what's notable right now**
("Good evening, Mark. 2 lots closing soon · 4 fresh in your taste · 3 new to read"),
then **promotes the best-placed journey into a hero card** that carries its own warm
line *and a peek of the real watches* (thumbnails) — content sells itself. The rest
sit below as cards with **live count subtitles** ("3 just listed", "4 in your taste").
The contextual conversation lives *on* the content, never as a banner floating above
a uniform grid. This is the "make it impactful" pass (Mark, 2026-06-16).

### 1. The cold open has a lifecycle: exist → evolve → recede → disappear

A single greeting goes stale. So the opener moves through stages:

- **Newcomer** (first visits): a warm hero opener that introduces Lumé.
- **Finding their feet / regular**: it shrinks to a single line that *advances*
  each visit, so it never repeats twice running.
- **Returning after a gap (7+ days)**: it greets with "here's what moved while you
  were away."
- **Veteran** (many visits or many hearts): the opener **disappears entirely** —
  by then the user wants the cards and the input, not hand-holding.

The principle: a good guide talks more at the start of a relationship and less as
it matures. The interface should do the same.

### 2. The journey order follows intent, because intent follows context

The most likely thing a user wants changes with context, so the journey cards
**reorder** to lead with it:

- **An auction is closing soon** → lead with "what's under the hammer." A real
  deadline outranks everything, so it even earns a one-line opener for veterans.
- **Back after a week or more** → lead with the catch-up journeys (what you
  missed, what got away). They need an update, not novelty.
- **Back within a day** → lead with fresh stock and new articles. They're not
  hunting; they're browsing for stimulation and a learning hook.
- **Back several times in a day** → they're hunting something specific, so the
  always-present search bar is the real lead and fresh stock sits up top.

The same six journeys, ranked by the moment. The interface meets the user where
they are instead of presenting one fixed menu.

## Where this is recorded

- **This doc** — the rationale, for sharing.
- **Code** — the behaviour + the "why", at the site that owns it:
  `src/lib/lumeColdOpen.js` (cold-open lifecycle + journey ranking + usage
  signals), `src/components/LumeCanvas.js` (the morphing router),
  `src/lib/lumeMissed.js` (the catch-up selectors).
- **ROADMAP Epic 10** — the feature thread + what's queued next.
- **personal/LEARNING.md** — the builder-growth angle (designing an interface
  that adapts to usage), captured at session close.

## What's queued next

- **Unified search in the canvas** — the input has two explicit actions, Search
  and Ask. Search renders visual cross-type results in the canvas. **Shipped:
  listings / sold / auctions** (reusing the app's `matchesSearch`). **Follow-up:
  articles** (needs the lazy editorial corpus wired in) **and reference guides**
  (a net-new client guide index — not in the app's existing Search-all either).
- **Conversational depth** — reference dossiers + two-reference comparison panels.
- **New-data journeys** — saved-search deltas; curated "auctions of note."
- **Durable usage profile** — move the local usage signals into the Lumé
  profile/memory store for cross-device personalisation and an LLM-written,
  fully personal opener.
