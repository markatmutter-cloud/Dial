"""Tests for the debounced scrape-health gate (B-60 / B-66).

The gate turns a silent per-source scrape failure into a red workflow (so
notify-scrape-failure.yml pages Mark) — but only after a source has missed
THRESHOLD *consecutive* runs, so a one-run anti-bot/timeout flap (which
loses no data thanks to merge.py's B-15 debounce) stays green.

These pin: the two miss signals (move-step "missing" lines + verify_sources
ERROR alerts, WARN ignored), the consecutive-miss counting across runs, the
reset-on-recovery, and the threshold crossing that pages.

They also pin the SNOOZE (2026-08-30): a source can be muted until a date when
the fix is not ours to make (B-80), and the emphasis in these tests is on the
fail-loud direction — a malformed, undated or unreadable snooze must mute
NOTHING. An alerting system that goes quiet because a config was mistyped is
worse than one with no mute at all.
"""
import json
from datetime import date

import scrape_health_gate as g


def _movelog(tmp_path, text):
    p = tmp_path / "scrape_move.log"
    p.write_text(text)
    return p


def _verif(tmp_path, alerts):
    p = tmp_path / "verification.json"
    p.write_text(json.dumps({"alerts": alerts}))
    return p


def _snoozefile(tmp_path, payload):
    """Write a snooze config; `payload` may be any JSON-able value (or a raw
    string, to exercise the corrupt-file path)."""
    p = tmp_path / "snooze.json"
    p.write_text(payload if isinstance(payload, str) else json.dumps(payload))
    return p


def _at_threshold(tmp_path, source="watchcenter"):
    """State file with `source` sitting on THRESHOLD consecutive misses."""
    state = tmp_path / "state.json"
    verif = _verif(tmp_path, [])
    move = _movelog(tmp_path, f"{source} missing\n")
    for _ in range(g.THRESHOLD):
        g.record(move, verif, state)
    return state


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
    failing, warning, snoozed = g.evaluate(state, _snoozefile(tmp_path, {}))
    assert failing == []
    assert snoozed == []
    assert any("watchcenter" in w for w in warning)


def test_threshold_consecutive_misses_fails(tmp_path):
    state = tmp_path / "state.json"
    verif = _verif(tmp_path, [])
    move = _movelog(tmp_path, "watchcenter missing\n")
    for _ in range(g.THRESHOLD):
        g.record(move, verif, state)
    failing, warning, snoozed = g.evaluate(state, _snoozefile(tmp_path, {}))
    assert any("watchcenter" in f for f in failing)
    assert warning == []
    assert snoozed == []


def test_evaluate_empty_state_is_clean(tmp_path):
    assert g.evaluate(tmp_path / "absent.json",
                      tmp_path / "absent-snooze.json") == ([], [], [])


# --- snoozes: muting a source whose fix is not ours ------------------------

TODAY = date(2026, 9, 1)


def test_active_snooze_moves_a_failing_source_out_of_paging(tmp_path):
    state = _at_threshold(tmp_path)
    snooze = _snoozefile(tmp_path, {
        "watchcenter": {"until": "2026-09-13", "reason": "B-80 dealer outage"}
    })

    failing, warning, snoozed = g.evaluate(state, snooze, today=TODAY)

    assert failing == [], "an actively snoozed source must not page"
    assert any("watchcenter" in s for s in snoozed)


def test_snoozed_source_still_reports_every_run(tmp_path):
    # Muted, not invisible: the line still carries the miss count, the expiry
    # and the reason, so a known-broken source stays in front of you.
    state = _at_threshold(tmp_path)
    snooze = _snoozefile(tmp_path, {
        "watchcenter": {"until": "2026-09-13", "reason": "B-80 dealer outage"}
    })

    _, _, snoozed = g.evaluate(state, snooze, today=TODAY)

    line = snoozed[0]
    assert f"missed {g.THRESHOLD} consecutive" in line
    assert "2026-09-13" in line
    assert "B-80 dealer outage" in line


def test_snooze_expires_by_itself_and_pages_again(tmp_path):
    state = _at_threshold(tmp_path)
    snooze = _snoozefile(tmp_path, {
        "watchcenter": {"until": "2026-08-20", "reason": "B-80 dealer outage"}
    })

    failing, _, snoozed = g.evaluate(state, snooze, today=TODAY)

    assert snoozed == []
    assert any("watchcenter" in f for f in failing)
    assert any("SNOOZE EXPIRED" in f for f in failing), (
        "an expired mute must read as 'this is back', not as a fresh outage"
    )


def test_snooze_is_inclusive_of_its_final_day(tmp_path):
    state = _at_threshold(tmp_path)
    snooze = _snoozefile(tmp_path, {
        "watchcenter": {"until": TODAY.isoformat(), "reason": "B-80"}
    })

    failing, _, snoozed = g.evaluate(state, snooze, today=TODAY)

    assert failing == []
    assert len(snoozed) == 1


# --- fail-loud: a broken snooze config must mute nothing --------------------

def test_undated_snooze_entry_does_not_mute(tmp_path):
    state = _at_threshold(tmp_path)
    snooze = _snoozefile(tmp_path, {"watchcenter": {"reason": "forgot the date"}})

    failing, _, snoozed = g.evaluate(state, snooze, today=TODAY)

    assert snoozed == []
    assert any("watchcenter" in f for f in failing)


def test_malformed_date_does_not_mute(tmp_path):
    state = _at_threshold(tmp_path)
    snooze = _snoozefile(tmp_path, {
        "watchcenter": {"until": "13/09/2026", "reason": "wrong format"}
    })

    failing, _, snoozed = g.evaluate(state, snooze, today=TODAY)

    assert snoozed == []
    assert any("unreadable snooze entry" in f for f in failing), (
        "a typo'd date must page AND say why it was ignored"
    )


def test_non_dict_snooze_entry_does_not_mute(tmp_path):
    state = _at_threshold(tmp_path)
    snooze = _snoozefile(tmp_path, {"watchcenter": "2026-09-13"})

    failing, _, snoozed = g.evaluate(state, snooze, today=TODAY)

    assert snoozed == []
    assert any("watchcenter" in f for f in failing)


def test_corrupt_snooze_file_does_not_mute(tmp_path):
    state = _at_threshold(tmp_path)
    snooze = _snoozefile(tmp_path, "{not json at all")

    failing, _, snoozed = g.evaluate(state, snooze, today=TODAY)

    assert snoozed == []
    assert any("watchcenter" in f for f in failing)


def test_absent_snooze_file_does_not_mute(tmp_path):
    state = _at_threshold(tmp_path)

    failing, _, snoozed = g.evaluate(state, tmp_path / "nope.json", today=TODAY)

    assert snoozed == []
    assert any("watchcenter" in f for f in failing)


def test_snooze_for_a_different_source_does_not_mute(tmp_path):
    state = _at_threshold(tmp_path, source="watchcenter")
    snooze = _snoozefile(tmp_path, {
        "somebodyelse": {"until": "2026-09-13", "reason": "unrelated"}
    })

    failing, _, snoozed = g.evaluate(state, snooze, today=TODAY)

    assert snoozed == []
    assert any("watchcenter" in f for f in failing)


# --- snoozes never hide an early flap --------------------------------------

def test_snooze_does_not_suppress_a_below_threshold_warning(tmp_path):
    # A source under the threshold is not paging anyway; muting it would only
    # hide the first signs that it has started flapping.
    state = tmp_path / "state.json"
    g.record(_movelog(tmp_path, "watchcenter missing\n"), _verif(tmp_path, []), state)
    snooze = _snoozefile(tmp_path, {
        "watchcenter": {"until": "2026-09-13", "reason": "B-80"}
    })

    failing, warning, snoozed = g.evaluate(state, snooze, today=TODAY)

    assert failing == []
    assert snoozed == []
    assert any("watchcenter" in w for w in warning)


# --- stale snoozes get flagged for cleanup ---------------------------------

def test_stale_snooze_is_reported_once_the_source_recovers(tmp_path):
    state = tmp_path / "state.json"
    verif = _verif(tmp_path, [])
    for _ in range(g.THRESHOLD):
        g.record(_movelog(tmp_path, "watchcenter missing\n"), verif, state)
    g.record(_movelog(tmp_path, ""), verif, state)          # recovered
    snooze = _snoozefile(tmp_path, {
        "watchcenter": {"until": "2026-09-13", "reason": "B-80"}
    })

    assert g.stale_snoozes(state, snooze) == ["watchcenter"]


def test_no_stale_snooze_while_the_source_is_still_missing(tmp_path):
    state = _at_threshold(tmp_path)
    snooze = _snoozefile(tmp_path, {
        "watchcenter": {"until": "2026-09-13", "reason": "B-80"}
    })

    assert g.stale_snoozes(state, snooze) == []


# --- the shipped config is real ---------------------------------------------

def test_committed_snooze_file_is_well_formed():
    """Every entry in the real data/scrape_health_snooze.json must parse as a
    date and carry a reason — a shipped typo would silently mute nothing and
    nobody would notice until an outage went unreported."""
    entries = g.load_snoozes()
    for src, entry in entries.items():
        assert g._snooze_state(entry, date(2000, 1, 1)) != "invalid", (
            f"{src} has an unreadable 'until' date"
        )
        assert entry.get("reason"), f"{src} has no reason recorded"
