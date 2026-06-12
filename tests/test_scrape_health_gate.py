"""Tests for the debounced scrape-health gate (B-60 / B-66).

The gate turns a silent per-source scrape failure into a red workflow (so
notify-scrape-failure.yml pages Mark) — but only after a source has missed
THRESHOLD *consecutive* runs, so a one-run anti-bot/timeout flap (which
loses no data thanks to merge.py's B-15 debounce) stays green.

These pin: the two miss signals (move-step "missing" lines + verify_sources
ERROR alerts, WARN ignored), the consecutive-miss counting across runs, the
reset-on-recovery, and the threshold crossing that pages.
"""
import json

import scrape_health_gate as g


def _movelog(tmp_path, text):
    p = tmp_path / "scrape_move.log"
    p.write_text(text)
    return p


def _verif(tmp_path, alerts):
    p = tmp_path / "verification.json"
    p.write_text(json.dumps({"alerts": alerts}))
    return p


# --- current_misses: this-run signals -------------------------------------

def test_healthy_run_has_no_misses(tmp_path):
    assert g.current_misses(_movelog(tmp_path, ""), _verif(tmp_path, [])) == {}


def test_missing_lines_are_detected(tmp_path):
    move = _movelog(tmp_path, "watchcenter missing\nbelmont missing\n")
    misses = g.current_misses(move, _verif(tmp_path, []))
    assert set(misses) == {"watchcenter", "belmont"}


def test_error_alert_counts_warn_does_not(tmp_path):
    move = _movelog(tmp_path, "")
    verif = _verif(tmp_path, [
        {"level": "ERROR", "source": "swisshours", "note": "count dropped to zero"},
        {"level": "WARN", "source": "somlo", "note": "below median"},
    ])
    misses = g.current_misses(move, verif)
    assert set(misses) == {"swisshours"}


def test_missing_log_absent_does_not_crash(tmp_path):
    assert g.current_misses(tmp_path / "nope.log", _verif(tmp_path, [])) == {}


def test_corrupt_verification_json_is_swallowed(tmp_path):
    bad = tmp_path / "verification.json"
    bad.write_text("{not json")
    assert g.current_misses(_movelog(tmp_path, ""), bad) == {}


# --- record: consecutive-miss counting ------------------------------------

def test_record_increments_across_consecutive_runs(tmp_path):
    state = tmp_path / "state.json"
    verif = _verif(tmp_path, [])
    move = _movelog(tmp_path, "watchcenter missing\n")

    s1 = g.record(move, verif, state)
    assert s1["watchcenter"]["misses"] == 1
    s2 = g.record(move, verif, state)
    assert s2["watchcenter"]["misses"] == 2
    # state file persisted the count between calls
    assert json.loads(state.read_text())["watchcenter"]["misses"] == 2


def test_record_resets_recovered_source(tmp_path):
    state = tmp_path / "state.json"
    verif = _verif(tmp_path, [])
    g.record(_movelog(tmp_path, "watchcenter missing\n"), verif, state)
    g.record(_movelog(tmp_path, "watchcenter missing\n"), verif, state)
    # next run it produced a CSV → drops out of state entirely
    healed = g.record(_movelog(tmp_path, ""), verif, state)
    assert "watchcenter" not in healed
    assert json.loads(state.read_text()) == {}


def test_record_tracks_sources_independently(tmp_path):
    state = tmp_path / "state.json"
    verif = _verif(tmp_path, [])
    g.record(_movelog(tmp_path, "a missing\nb missing\n"), verif, state)
    # b recovers, a misses again, c newly misses
    s = g.record(_movelog(tmp_path, "a missing\nc missing\n"), verif, state)
    assert s["a"]["misses"] == 2
    assert s["c"]["misses"] == 1
    assert "b" not in s


# --- evaluate: threshold crossing pages -----------------------------------

def test_single_flap_warns_does_not_fail(tmp_path):
    state = tmp_path / "state.json"
    g.record(_movelog(tmp_path, "watchcenter missing\n"), _verif(tmp_path, []), state)
    failing, warning = g.evaluate(state)
    assert failing == []
    assert any("watchcenter" in w for w in warning)


def test_threshold_consecutive_misses_fails(tmp_path):
    state = tmp_path / "state.json"
    verif = _verif(tmp_path, [])
    move = _movelog(tmp_path, "watchcenter missing\n")
    for _ in range(g.THRESHOLD):
        g.record(move, verif, state)
    failing, warning = g.evaluate(state)
    assert any("watchcenter" in f for f in failing)
    assert warning == []


def test_evaluate_empty_state_is_clean(tmp_path):
    assert g.evaluate(tmp_path / "absent.json") == ([], [])
