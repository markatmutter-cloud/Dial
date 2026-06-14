"""Per-house auction health check (B-75).

Flags a house with a published, current catalog (auctions.json) but ZERO
lots in the feed (auction_lots.json + bonhams_lots.json) — the silent-zero
failure mode that hit Sotheby's / Christie's / Bonhams in June 2026.
Debounced like the dealer gate (B-66): pages only after THRESHOLD
consecutive empty runs.
"""
import json
from datetime import date

import auction_health as h


def _write(tmp, name, obj):
    p = tmp / name
    p.write_text(json.dumps(obj))
    return p


TODAY = date(2026, 6, 14)


def _auctions(tmp, sales):
    return _write(tmp, "auctions.json", sales)


def _lots(tmp, lots):
    return _write(tmp, "auction_lots.json", lots)


def _bonhams(tmp, lots):
    return _write(tmp, "bonhams_lots.json", lots)


def test_published_catalog_with_zero_lots_is_broken(tmp_path):
    a = _auctions(tmp_path, [
        {"house": "Sotheby's", "title": "Fine Watches", "hasCatalog": True,
         "dateStart": "2026-06-08", "dateEnd": "2026-06-17"},
    ])
    lots = _lots(tmp_path, [])            # nothing scraped
    bon = _bonhams(tmp_path, [])
    assert "Sotheby's" in h.broken_houses(a, lots, bon, today=TODAY)


def test_published_catalog_with_lots_is_healthy(tmp_path):
    a = _auctions(tmp_path, [
        {"house": "Sotheby's", "title": "Fine Watches", "hasCatalog": True,
         "dateStart": "2026-06-08", "dateEnd": "2026-06-17"},
    ])
    lots = _lots(tmp_path, [{"house": "Sotheby's"}])
    bon = _bonhams(tmp_path, [])
    assert h.broken_houses(a, lots, bon, today=TODAY) == {}


def test_bonhams_lots_counted_from_separate_feed(tmp_path):
    a = _auctions(tmp_path, [
        {"house": "Bonhams", "title": "NY Fine Watches", "hasCatalog": True,
         "dateStart": "2026-06-06", "dateEnd": "2026-06-16"},
    ])
    lots = _lots(tmp_path, [])            # Bonhams never lands in auction_lots.json
    bon = _bonhams(tmp_path, [{"house": "Bonhams"}])
    assert h.broken_houses(a, lots, bon, today=TODAY) == {}


def test_no_catalog_sale_is_ignored(tmp_path):
    a = _auctions(tmp_path, [
        {"house": "Bonhams", "title": "Weekly", "hasCatalog": False,
         "dateStart": "2026-06-26", "dateEnd": "2026-07-08"},
    ])
    assert h.broken_houses(a, _lots(tmp_path, []), _bonhams(tmp_path, []), today=TODAY) == {}


def test_long_past_sale_is_ignored(tmp_path):
    a = _auctions(tmp_path, [
        {"house": "Phillips", "title": "Old sale", "hasCatalog": True,
         "dateStart": "2026-05-01", "dateEnd": "2026-05-10"},  # >RECENT_DAYS ago
    ])
    assert h.broken_houses(a, _lots(tmp_path, []), _bonhams(tmp_path, []), today=TODAY) == {}


def test_far_future_catalog_is_ignored(tmp_path):
    a = _auctions(tmp_path, [
        {"house": "Phillips", "title": "Way out", "hasCatalog": True,
         "dateStart": "2026-12-01", "dateEnd": "2026-12-10"},  # >LOOKAHEAD_DAYS
    ])
    assert h.broken_houses(a, _lots(tmp_path, []), _bonhams(tmp_path, []), today=TODAY) == {}


def test_record_debounce_and_threshold(tmp_path):
    a = _auctions(tmp_path, [
        {"house": "Sotheby's", "title": "Fine Watches", "hasCatalog": True,
         "dateStart": "2026-06-08", "dateEnd": "2026-06-17"},
    ])
    lots = _lots(tmp_path, [])
    bon = _bonhams(tmp_path, [])
    state = tmp_path / "state.json"
    for _ in range(h.THRESHOLD):
        h.record(a, lots, bon, state, today=TODAY)
    failing, warning = h.evaluate(state)
    assert any("Sotheby's" in f for f in failing)
    # recovery clears it
    h.record(a, _lots(tmp_path, [{"house": "Sotheby's"}]), bon, state, today=TODAY)
    assert h.evaluate(state) == ([], [])


def test_single_empty_run_warns_not_fails(tmp_path):
    a = _auctions(tmp_path, [
        {"house": "Sotheby's", "title": "Fine Watches", "hasCatalog": True,
         "dateStart": "2026-06-08", "dateEnd": "2026-06-17"},
    ])
    state = tmp_path / "state.json"
    h.record(a, _lots(tmp_path, []), _bonhams(tmp_path, []), state, today=TODAY)
    failing, warning = h.evaluate(state)
    assert failing == [] and any("Sotheby's" in w for w in warning)
