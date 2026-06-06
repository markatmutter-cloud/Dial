#!/usr/bin/env python3
"""
Cold-usability-audit walkthrough driver (2026-06-06).

Drives the LIVE site (the-watch-list.app) signed-out, as a first-time
user would meet it, and screenshots every decision point of the task
battery in docs/audits/2026-06-06-usability/AUDIT_REPORT.md. Two
viewports: iPhone 390x844 (primary — the iOS PWA is the real surface)
and desktop 1440x900.

Every step is wrapped: a failed click/selector logs the failure into
manifest.json and the walk continues, because "couldn't find it with an
obvious selector" is itself a usability signal worth keeping.

Run (needs the playwright venv — see AUDIT_REPORT.md "Repro"):
  /tmp/wl-audit-venv/bin/python docs/audits/2026-06-06-usability/walk.py

Kept in-repo so the audit is repeatable after the dispatch layer ships
(before/after comparison with the same script).
"""

import json
import sys
import time
from pathlib import Path

from playwright.sync_api import sync_playwright

BASE = "https://the-watch-list.app"
ROOT = Path(__file__).parent
MANIFEST = []


def log(step, ok, note=""):
    MANIFEST.append({"step": step, "ok": ok, "note": note})
    print(f"[{'ok' if ok else 'XX'}] {step}  {note}", flush=True)


def settle(page, ms=2500):
    """SPA-friendly wait: load + grace for fetch/render."""
    try:
        page.wait_for_load_state("load", timeout=15000)
    except Exception:
        pass
    page.wait_for_timeout(ms)


def shot(page, vp, name, full=False):
    # jpeg q75 keeps the evidence folder commit-sized (PNGs were 62MB/run)
    out = ROOT / "screens" / vp / f"{name}.jpg"
    out.parent.mkdir(parents=True, exist_ok=True)
    page.screenshot(path=str(out), full_page=full, type="jpeg", quality=75)
    return str(out.relative_to(ROOT))


def try_click(page, vp, step, candidates, shotname, settle_ms=2500):
    """Try selector candidates in order; screenshot whatever results."""
    last = "no selector matched any element"
    for sel in candidates:
        try:
            loc = page.locator(sel).first
            if loc.count() == 0:
                continue
            loc.click(timeout=4000)
            settle(page, settle_ms)
            shot(page, vp, shotname)
            log(f"{vp}/{step}", True, f"clicked {sel!r} -> {page.url}")
            return True
        except Exception as e:
            last = f"{sel!r}: {type(e).__name__}"
    shot(page, vp, shotname + "-FAILED")
    log(f"{vp}/{step}", False, f"no candidate worked; last={last}")
    return False


def walk(pw, vp):
    if vp == "mobile":
        ctx = pw.chromium.launch(headless=True).new_context(
            viewport={"width": 390, "height": 844},
            device_scale_factor=2,
            is_mobile=True,
            has_touch=True,
            user_agent=(
                "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) "
                "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1"
            ),
        )
    else:
        ctx = pw.chromium.launch(headless=True).new_context(
            viewport={"width": 1440, "height": 900}, device_scale_factor=2
        )
    page = ctx.new_page()

    # ---- T1 orientation: land cold -------------------------------------
    page.goto(BASE, timeout=45000)
    settle(page, 4000)
    shot(page, vp, "01-landing")
    log(f"{vp}/T1-landing", True, page.url)
    page.mouse.wheel(0, 700)
    page.wait_for_timeout(800)
    shot(page, vp, "02-landing-scrolled")
    log(f"{vp}/T1-landing-scrolled", True)

    # ---- T2 find sold prices: Watches tab, then the Sold sub-tab -------
    try_click(page, vp, "T2-watches-tab",
              ['text="Watches"', '[role=tab]:has-text("Watches")',
               'button:has-text("Watches")', 'a:has-text("Watches")'],
              "03-watches-tab")
    try_click(page, vp, "T2-sold-subtab",
              ['text="Sold"', 'button:has-text("Sold")'],
              "04-sold-subtab")

    # ---- T4 upcoming auctions ------------------------------------------
    try_click(page, vp, "T4-auctions-subtab",
              ['text="Auctions"', 'button:has-text("Auctions")'],
              "05-auctions-subtab")

    # back to the default listings view for the filter task
    # (the sub-tab is labelled "Listings", not "Live" — itself a finding:
    # top tab "Watches" > sub-tab "Listings")
    try_click(page, vp, "T3-back-to-listings",
              ['text="Listings"', 'button:has-text("Listings")'],
              "06-listings-subtab")

    # ---- T3 filter pills: brand (desktop pill / mobile filter icon) ----
    try_click(page, vp, "T3-brand-filter",
              ['button:has-text("Brand")', 'text="Brand"',
               'button[aria-label*="ilter" i]'],
              "07-brand-filter-open", settle_ms=1500)
    try:
        page.keyboard.press("Escape")
        page.wait_for_timeout(600)
    except Exception:
        pass

    # ---- T8 search ------------------------------------------------------
    searched = False
    for sel in ['input[type="search"]', 'input[placeholder*="earch" i]',
                'input[placeholder*="ilter" i]', 'input[type="text"]']:
        try:
            loc = page.locator(sel).first
            if loc.count() == 0:
                continue
            loc.click(timeout=3000)
            loc.fill("Submariner")
            settle(page, 2500)
            shot(page, vp, "08-search-submariner")
            log(f"{vp}/T8-search", True, f"via {sel!r}")
            searched = True
            break
        except Exception:
            continue
    if not searched:
        shot(page, vp, "08-search-FAILED")
        log(f"{vp}/T8-search", False, "no search input found/usable")
    else:
        try:
            page.locator(sel).first.fill("")
            page.wait_for_timeout(800)
        except Exception:
            pass

    # ---- T5 heart a watch signed-out + card drill-in (T9 depth 1) ------
    try_click(page, vp, "T5-heart-signedout",
              ['button[aria-label*="eart" i]', 'button[aria-label*="ave" i]',
               'button:has-text("♡")', 'text="♡"'],
              "09-heart-signedout", settle_ms=1500)
    # dismiss the sign-in modal the way a user would (Escape doesn't close it)
    try_click(page, vp, "T5-dismiss-signin",
              ['text="Keep browsing without an account"',
               'button[aria-label*="lose" i]', 'text="×"'],
              "09b-signin-dismissed", settle_ms=1200)

    depth_urls = [page.url]
    try_click(page, vp, "T9-card-open",
              ['text=/\\$\\d[\\d,]+/', 'img[alt]:visible', 'img'],
              "10-card-open")
    depth_urls.append(page.url)

    # ---- T5b Saved tab signed-out ---------------------------------------
    try_click(page, vp, "T5-saved-tab",
              ['text="Saved"', 'button:has-text("Saved")', 'a:has-text("Saved")'],
              "11-saved-signedout")

    # ---- T6 articles ------------------------------------------------------
    try_click(page, vp, "T6-articles-tab",
              ['text="Articles"', 'button:has-text("Articles")', 'a:has-text("Articles")'],
              "12-articles-tab")
    try_click(page, vp, "T6-article-open",
              ['[class*="card" i] img', 'article img', 'img[alt]:visible'],
              "13-article-open")
    depth_urls.append(page.url)

    # ---- T7 reference guides ---------------------------------------------
    try_click(page, vp, "T7-guides-tab",
              ['text="Reference Guides"', 'text="Guides"',
               'button:has-text("Guides")', 'a:has-text("Guides")'],
              "14-guides-tab")
    try_click(page, vp, "T7-guide-open",
              ['[class*="card" i]', 'img[alt]:visible'],
              "15-guide-open")
    depth_urls.append(page.url)

    # ---- T9 get back: browser-back x3 from deep --------------------------
    for i in range(1, 4):
        try:
            page.go_back(timeout=10000)
            settle(page, 1800)
            shot(page, vp, f"16-back-{i}")
            log(f"{vp}/T9-back-{i}", True, page.url)
        except Exception as e:
            shot(page, vp, f"16-back-{i}-FAILED")
            log(f"{vp}/T9-back-{i}", False, type(e).__name__)

    log(f"{vp}/depth-urls", True, " -> ".join(depth_urls))
    ctx.close()


def main():
    with sync_playwright() as pw:
        for vp in ("mobile", "desktop"):
            print(f"\n=== {vp} ===", flush=True)
            try:
                walk(pw, vp)
            except Exception as e:
                log(f"{vp}/FATAL", False, f"{type(e).__name__}: {e}")
    (ROOT / "manifest.json").write_text(json.dumps(MANIFEST, indent=2))
    fails = [m for m in MANIFEST if not m["ok"]]
    print(f"\ndone — {len(MANIFEST)} steps, {len(fails)} failed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
