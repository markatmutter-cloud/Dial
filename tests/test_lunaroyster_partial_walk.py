"""Tests for Luna Royster's partial-walk tolerance (B-79).

LR's catalog runs ~19 pages at per_page=100 and the host intermittently
502s a single deep page under that load. The scraper used to raise on a
failed page, which discarded every page already fetched and wrote no CSV
at all — three of those in a row crossed the scrape-health gate and paged
Mark, even though 18 of 19 pages had come back clean.

These pin the two halves of the fix: the walk keeps what it fetched when
a page drops, and the truncation guard (the watchclub B-59 pattern) still
refuses to write a snapshot small enough that merge.py would false-flag
the missing items as sold.
"""
import csv

import lunaroyster_scraper as lr


def _item(n, price=5000):
    """One WooCommerce Store API product, as the walk sees it."""
    return {
        "name": f"Rolex Submariner {n}",
        "permalink": f"https://lunaroyster.com/product/watch-{n}/",
        "prices": {"price": str(price * 100), "currency_minor_unit": 2},
        "images": [{"src": f"https://lunaroyster.com/img/{n}.jpg"}],
        "short_description": "",
        "is_in_stock": True,
    }


def _pages(monkeypatch, pages):
    """Drive get_all_listings with a scripted page->payload mapping.

    A payload of None is a page that failed all three attempts.
    """
    monkeypatch.setattr(lr.SESSION, "get", lambda *a, **k: None)
    monkeypatch.setattr(lr, "fetch_page", lambda page, per_page: pages.get(page, []))
    monkeypatch.setattr(lr.time, "sleep", lambda *_: None)


# --- the walk keeps what it fetched --------------------------------------

def test_walk_keeps_pages_fetched_before_a_dropped_page(monkeypatch):
    # Two full pages, then page 3 fails outright.
    full = [_item(i) for i in range(100)]
    _pages(monkeypatch, {1: full, 2: full, 3: None})

    items = lr.get_all_listings()

    assert len(items) == 200, "pages 1-2 must survive page 3 failing"


def test_walk_still_stops_cleanly_at_end_of_catalog(monkeypatch):
    full = [_item(i) for i in range(100)]
    _pages(monkeypatch, {1: full, 2: [_item(200), _item(201)]})

    items = lr.get_all_listings()

    assert len(items) == 102, "a short final page ends the walk normally"


def test_dropped_first_page_yields_nothing_rather_than_raising(monkeypatch):
    _pages(monkeypatch, {1: None})

    assert lr.get_all_listings() == []


# --- the truncation guard still protects merge.py ------------------------

def _run_main(monkeypatch, tmp_path, raw, prior_rows):
    monkeypatch.chdir(tmp_path)
    (tmp_path / "data").mkdir()
    with open(tmp_path / "data" / "lunaroyster.csv", "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=["title"])
        w.writeheader()
        for i in range(prior_rows):
            w.writerow({"title": f"prior {i}"})

    monkeypatch.setattr(lr, "get_all_listings", lambda: raw)
    return tmp_path / "lunaroyster_listings.csv"


def test_healthy_partial_snapshot_is_written(monkeypatch, tmp_path):
    # 30 items against a prior of 33: a real but unremarkable drop.
    out = _run_main(monkeypatch, tmp_path, [_item(i) for i in range(30)], prior_rows=33)

    lr.main()

    assert out.exists()
    with open(out) as f:
        assert sum(1 for _ in csv.DictReader(f)) == 30


def test_severely_truncated_snapshot_skips_the_write(monkeypatch, tmp_path):
    # 5 items against a prior of 33 — below BOTH the 50% ratio and the
    # 25-item floor, so merge.py must keep prior state instead.
    out = _run_main(monkeypatch, tmp_path, [_item(i) for i in range(5)], prior_rows=33)

    try:
        lr.main()
    except SystemExit as e:
        assert e.code == 0, "guard exits clean so the workflow step stays green"
    else:
        raise AssertionError("expected the guard to abort the write")

    assert not out.exists(), "no CSV written = merge.py keeps the prior good state"


def test_guard_does_not_fire_without_a_prior_run(monkeypatch, tmp_path):
    # A brand-new source has no prior CSV; a small first result is real.
    out = _run_main(monkeypatch, tmp_path, [_item(i) for i in range(5)], prior_rows=0)
    (tmp_path / "data" / "lunaroyster.csv").unlink()

    lr.main()

    assert out.exists()


# --- fetch_page itself: the real retry path, not a stub ------------------

class _Resp:
    def __init__(self, status):
        self.status_code = status

    def json(self):
        return [_item(1)]


def test_fetch_page_returns_none_after_exhausting_retries(monkeypatch):
    calls = []

    def fake_get(*a, **k):
        calls.append(1)
        return _Resp(502)

    monkeypatch.setattr(lr.SESSION, "get", fake_get)
    monkeypatch.setattr(lr.time, "sleep", lambda *_: None)

    assert lr.fetch_page(19, 100) is None
    assert len(calls) == 3, "still three attempts before giving up"


def test_fetch_page_returns_payload_on_200(monkeypatch):
    monkeypatch.setattr(lr.SESSION, "get", lambda *a, **k: _Resp(200))
    monkeypatch.setattr(lr.time, "sleep", lambda *_: None)

    assert lr.fetch_page(1, 100) == [_item(1)]
