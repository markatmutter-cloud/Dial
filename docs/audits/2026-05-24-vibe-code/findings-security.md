# Security Audit — Watchlist (cold, read-only, static review)

**Scope:** Supabase RLS completeness, key exposure, SSRF/proxy abuse, security-definer RPC input validation, scraper-data injection, dependency CVEs, secrets hygiene. No live connection, no execution, no network.

## Summary

The Supabase data layer is well-engineered: every user-data table whose policies are visible in the repo gates on `auth.uid() = user_id` (directly or via the audited `can_view_collection`/`can_edit_collection` helpers), all security-definer RPCs resolve `auth.uid()` internally rather than trusting client-supplied ids, the `anon` EXECUTE surface is deliberately trimmed, and admin data paths are gated server-side by `is_admin()` (not just the client `REACT_APP_ADMIN_EMAILS` flag). No `service_role` key anywhere; the browser only sees the publishable key. No `dangerouslySetInnerHTML`/`eval`/committed secrets. The real issues are gaps, not active breaches.

## Findings

### HIGH-1 · Five foundational user-data tables have no committed schema; RLS-enabled state is unverifiable from the repo
**Evidence:** No `create table` for `watchlist_items`, `hidden_listings`, `saved_searches`, `tracked_lots`, or the base collections/challenges table exists under `supabase/schema/`. Their policies appear *only* as drop/recreate statements in `supabase/schema/2026-05-10_rls_initplan_perf.sql:31-96` — those policies are correct (`(select auth.uid()) = user_id` per command), but the repo never asserts `alter table … enable row level security` for these tables, nor defines the `user_id` column/FK shape. README confirms they predate the migration folder.
**Why it matters:** RLS policies do nothing if RLS is not *enabled* on the table. That toggle is the single line that, if ever off (or never on for a pre-convention table), exposes every user's saved items / hidden lists / saved searches / tracked lots cross-tenant. It's not in version control for the five highest-blast-radius tables, so a reviewer cannot prove from the repo that it's on, and a dashboard edit could regress it with no diff.
**Fix-sketch:** Dump live DDL (MCP `list_tables`/DDL) and commit an idempotent `create table … ; alter table … enable row level security;` migration, with a `pg_class.relrowsecurity` verify comment (mirror `2026-05-16_db_hygiene.sql:80`). **Effort: S.**

### MEDIUM-1 · `listing_events` accepts unauthenticated, fully client-controlled inserts (analytics forgery / pollution)
**Evidence:** `supabase/schema/2026-05-05_listing_events.sql:72-74` — `for insert with check (true)`. The client sets `user_id` itself in the payload (`src/hooks/useEventTelemetry.js:60-64`), and the policy never checks `user_id = auth.uid()`. No rate limit; only `event_type` is constrained (CHECK enum, `:51`).
**Why it matters:** Anyone with the publishable key (even anonymous) can POST rows forging any `user_id`, `source`, or `listing_id`, or flood the table. This data feeds the admin dashboard via `list_user_limits()` (`2026-05-06_user_limits.sql:215-223`) and `source_engagement_summary()`, which Mark uses for curation ("earning its keep"), plus an unbounded-write cost vector on the free tier. SELECT is admin-only, so it's integrity/abuse, not a confidentiality leak.
**Fix-sketch:** `with check (user_id is null or user_id = (select auth.uid()))`, or route writes through a `security definer` RPC that stamps `user_id := auth.uid()` (same pattern as `create_challenge_v2`). **Effort: S / M.**

### MEDIUM-2 · No `package-lock.json` committed — non-reproducible builds, unpinned JS transitive deps
**Evidence:** `git ls-files | grep -iE "lock|require"` returns only `.claude/scheduled_tasks.lock` and `requirements-dev.txt` — no `package-lock.json`/`yarn.lock`. `package.json` floats `@supabase/supabase-js ^2.45.0`, `@vercel/blob ^0.27.0`, React, and the full `react-scripts@5.0.1` transitive tree.
**Why it matters:** Vercel installs fresh per deploy. With no lockfile, every build resolves the latest matching transitive tree — the classic npm supply-chain vector lands in production with no diff and no reproducibility. `react-scripts@5.0.1` drags a large, partly-stale tree (historically nth-check/postcss/webpack-dev-server advisories — mostly build-time), and `@supabase/supabase-js` ships to the browser and floats.
**Fix-sketch:** Commit `package-lock.json`, use `npm ci` in CI/Vercel, run `npm audit` and triage runtime vs dev-only. **Effort: S.**

### MEDIUM-3 · Python scraper dependencies are unpinned (no runtime `requirements.txt`)
**Evidence:** Only `requirements-dev.txt` exists (`pytest>=8.0`). README tells users to `pip install requests` ad-hoc (`README.md:318`); workflows install unpinned. Scrapers' only third-party runtime import is `requests` (60 files; rest stdlib).
**Why it matters:** Actions runners `pip install` the latest `requests` + transitive (`urllib3`/`certifi`) on every scheduled run, in a context holding `BROWSE_AI_API_KEY`, eBay OAuth creds, and a Supabase write key. A compromised release executes with those secrets in env, unconstrained by any pin.
**Fix-sketch:** Pinned `requirements.txt` (ideally `--require-hashes` via pip-compile); install with `-r` in workflows. **Effort: S.**

### LOW-1 · Scraped `url`/`img` rendered into `href`/`src` without URL-scheme allowlisting
**Evidence:** `src/components/Card.js:269` (`href={item.url}`), `:274` (`src={imgSrc(item.img)}`); same unsanitized `item.url`→`href` in `ShareReceiver.js:343,447`, `EditorialView.js:923`, `CollectionsTab.js:3202`, `ListReviewMode.js:705`. `src/utils.js:445-481` (`imgSrc`) rewrites only specific CDN hosts and otherwise returns the raw URL. `merge.py:395-402` strips scheme only for ID hashing; the original URL is stored verbatim.
**Why it matters:** React does not reliably block `javascript:`/`data:` hrefs. A dealer/editorial source or poisoned scrape placing `javascript:…` in a product URL yields a clickable link executing script in the app origin (the user's Supabase session). The only barrier today is that scraped JSON flows through a daily commit with no content review and no runtime defense.
**Fix-sketch:** A `safeHref(url)` helper returning the URL only if `new URL(url).protocol` is http/https; route all scraped-data href/src through it. Add `script-src 'self'` CSP as defense-in-depth. **Effort: S.**

### LOW-2 · `get_public_list` / `get_public_challenge` expose any free-form list / completed challenge by UUID (capability-URL model, no per-share toggle)
**Evidence:** `2026-05-07_public_list.sql:35-106` grants `anon, authenticated` and returns the full item set for any `type='free-form' and not is_system and not is_shared_inbox` collection — gated solely on UUID possession, no "explicitly shared" flag; returns `ownerId` (`:95`). Same for any `state='complete'` challenge (`2026-05-06_public_challenge.sql:18-80`). `pending_invite_by_token` (`2026-05-08_invite_by_token.sql:78-116`) leaks inviter + invited email to any authenticated holder of an invite UUID. The capability-URL model is documented as intentional (`2026-05-08_invite_by_token.sql:1-21`).
**Why it matters:** Every free-form list is readable by anyone who learns its UUID, regardless of intent — only list *type* gates it, not a private/shared boundary. UUIDv4 is unguessable so this is an acceptable capability-URL design, but a leaked URL (history, referer, forward) permanently exposes the list contents + owner id.
**Fix-sketch:** Record the capability-URL decision explicitly; if a private/shared distinction is ever wanted, add `share_token`/`is_shareable` and gate on it instead of list type. Drop `ownerId` from the anon payload if unused. **Effort: S / M.**

### LOW-3 · `api/img.js` follows upstream redirects after the host-allowlist check
**Evidence:** `api/img.js:54` validates `target.hostname` against an exact-match `ALLOWED_HOSTS` Set (tight), then `:70-73` fetches with `redirect: "follow"`. The allowlist is checked on the initial URL only.
**Why it matters:** Textbook SSRF-via-redirect residue — if an allow-listed dealer host 30x'd to an arbitrary address, the proxy would follow and return the body. Risk is low (only 2 dealer hosts can trigger a fetch, serverless/no internal infra, body served as image), and it is correctly *not* an open proxy.
**Fix-sketch:** `redirect: "manual"` and reject 30x (these dealers serve images directly), or re-validate the `Location` host. **Effort: S.**

### LOW-4 (informational) · `health.py` `subprocess` reviewed — clean
**Evidence:** `health.py:26,60,179` are the only `subprocess`/`os.system` uses (`grep -rn "eval(\|exec(\|os.system\|subprocess" *.py`); no `eval`/`exec`/`pickle`/shell-string interpolation of external data anywhere in the Python tree. Confirms the scraper code-exec surface was checked and is clean; verify `subprocess.run` keeps arg-list form (no `shell=True`) on next edit.

## Confirmed GOOD (no finding)
- No `service_role`/`SUPABASE_SERVICE` in `src/`/`api/`/`public/`; client uses publishable key only (`src/supabase.js:18-21`). Clean `git log -S` for `sb_secret_`/`service_role`. `.gitignore` covers `.env*` and `personal/`.
- All security-definer RPCs resolve `auth.uid()` internally, never trusting client user_id (`create_challenge_v2`, `create_collection_v2`, collaborator RPCs, `set_watchlist_cap_by_email`, `my_reactions_with_items`); admin RPCs have internal `is_admin()` guards, so the client `REACT_APP_ADMIN_EMAILS` gate (`src/App.js:810-812`) is UI-only.
- `anon` EXECUTE deliberately revoked on signed-in RPCs (`2026-05-08_security_hardening.sql:41-69`, `2026-05-16_db_hygiene.sql:35`).
- `collection_collaborators` allows no direct client writes (RLS on, zero write policies — `2026-05-07_collection_collaborators.sql:268-287`); all mutation via owner-checked RPCs. `accept_invite_by_token` refuses transferring an already-accepted invite (`2026-05-08_invite_by_token.sql:49-55`).
- `api/share.js` escapes all interpolated output, matches IDs only against server-side JSON, `encodeURIComponent`s the redirect — no reflected XSS, no open redirect (target is fixed site origin).
- `+Track` validator is strict eBay-item-URL regex allowlisting; pasted URL is stored, not server-fetched (`src/supabase.js:1752-1761`).

## Verdict
**Domain sub-grade: Security — B.**
**Finding count by severity: CRITICAL 0 · HIGH 1 · MEDIUM 3 · LOW 4 (1 of which is informational).**

Access-control design is genuinely solid — no cross-tenant leak, no key exposure, no user-reachable injection sink today. Held to B (not A) by the HIGH audit-gap on the five un-versioned foundational tables (RLS-enabled state unprovable from the repo, and they hold the most sensitive per-user data), the supply-chain gaps (no JS lockfile, unpinned Python deps), and the forgeable telemetry table. None are active breaches; all are closable with small, low-risk changes.
