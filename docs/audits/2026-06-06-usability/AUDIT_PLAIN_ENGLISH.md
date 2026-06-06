# The usability audit, in plain English — 2026-06-06

You watched someone get stuck. I rebuilt that situation with a robot
browser: visited the live site signed-out, on a phone and on a desktop,
tried to do the nine things a first-time visitor would actually try, and
photographed every step. Then three independent reviewers scored the
journey through her eyes. Here's what came back.

## The headline: she was right, and so were you

**Finding the sold prices genuinely fails for a newcomer — and it fails for
the exact reason you saw.** The row that switches between Listings /
Auctions / Sold paints its inactive options in faint grey. To anyone who
didn't build the site, grey text means "not available." Meanwhile the
Date and Price filter buttons just below are filled, outlined chips — they
look like the clickable things. So when you said "click the subtab," she
tapped the most button-looking thing near her finger. Twice. The navigation
whispers and the filters shout; on desktop it's even more lopsided.

And one level up: nothing anywhere tells her a second level of navigation
*exists*. The site never says "inside Watches there are three views." She'd
have to discover it by accident — which is precisely the exploring she was
too nervous to do.

## Her fear of "going too deep" — half wrong, half right

**Wrong, inside the app:** I walked three levels deep and pressed the back
button three times. It retraced every single step, no dead ends, no blank
screens. The app is actually one of the safest sites to wander I've
audited. She just has no way of *knowing* that.

**Right, on the cards:** tap a watch card and you're silently thrown onto
the dealer's own website in a new tab — different site, no warning, and the
back button no longer brings you home. The most-tapped thing on the site
does exactly what a nervous user fears most. Same for articles: tapping one
opens the source publication in a new tab — on a phone it often looks like
the tap simply did nothing. There is no way to read an article *inside*
the app at all (even though the article text is already sitting in the
app's data — we fetch it; we just never show it). That's the B-51 thread
you already flagged from your own use; the audit confirms it's the second
biggest newcomer problem.

## The quiet wins (worth knowing)

- The **sign-in prompt is genuinely good** — "free, keep browsing without
  an account," honest about what it doesn't do, easy to dismiss. Nothing
  scary there.
- **Every tab works the same way** — search, filter buttons, a count. Learn
  it once, it transfers. That discipline shows.
- The **filter sheet on mobile is excellent** — clear sections, real brand
  names, a button that says "Show 3,942 watches." One problem: it hides
  behind a small unlabeled icon she will never press. Great room, invisible
  door.
- The **reference guide page is the best newcomer screen in the app** —
  breadcrumb, readable story, save button. (Small flip needed: the page
  shouts "E2643" and whispers "Jaeger-LeCoultre Shark" — a newcomer needs
  it the other way round.)

## Words that got in the way

- **"HAMMER £635"** — that IS the answer to "what did it sell for," wearing
  a word she doesn't know. Say "Sold for £635."
- **"CURRENT USD 1,100"** — say "Current bid."
- **"LOUPE THIS"** — it's a dealer's name, but it reads as a command, and
  she doesn't know what a loupe is. Style source names so they can't read
  as verbs.
- The search box leads with **"Search reference…"** — "reference" is the
  one word she doesn't own, on the first control she sees. Lead with brand
  and model.
- The site never says **what it is**. One line under the logo would answer
  her five-second question.

## What I'd do, in order

1. **Build the dispatch layer** (the per-tab overview cards you already
   designed in the IA redesign) — it's the real fix for "I didn't know that
   level existed." This audit is the evidence it deserves to jump the queue.
2. **Restyle the sub-tab row** so navigation out-shouts filters, and
   consider plainer labels ("For sale · Auctions · Sold").
3. **Stop the silent exits** — an "opens at dealer ↗" cue on cards, and an
   in-app article reader (B-51).
4. **The copy sweep** — hammer/current-bid/search-placeholder/"Filter"
   label. Half a day, all one-liners.
5. Small stuff: Escape key should close popups (logged as B-63); the empty
   Saved screen shouldn't show sorting buttons and a "0".

Everything above is logged where it belongs (BUGS for the defects, ROADMAP
Epic 9 for the design work) — the full version with screenshots is
[AUDIT_REPORT.md](AUDIT_REPORT.md). The walkthrough script is kept in the
folder, so after the dispatch layer ships we can re-run the identical
journey and see the before/after.
