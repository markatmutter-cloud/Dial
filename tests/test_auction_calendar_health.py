"""Tests for the debounced auction-CALENDAR health gate.

The gate turns a silently-broken calendar scraper into a red workflow (so
notify-scrape-failure.yml opens an issue) — but only after a house has
missed THRESHOLD *consecutive* runs, so a transient block stays green.

These pin the behaviour that was missing while Monaco Legend and Phillips
sat broken for six weeks: an empty result is a miss, counted across runs,
reset on recovery, paging at the threshold.

The empty-CSV case is the one worth staring at. A scraper that writes a
header-only file looks *healthier* than one that writes nothing — the move
step's "<house> auctions missing" line never fires — while doing more
damage, because it overwrites the previous good file. The gate reads the
artifact, not the scraper's exit code, so it can't be fooled by a scraper
that mis-reports its own success.
"""
import json

import auction_calendar_health as g

HEADER = "title,date_start,location,url\n"
ROW = "Important Watches,2026-11-09,Geneva,https://x/1\n"


def _houses(tmp_path, spec):
    """spec: {house: body|None}. None = the scraper produced no file."""
    out = {}
    for house, body in spec.items():
        path = tmp_path / f"{house}_auctions.csv"
        if body is not None:
            path.write_text(body)
        out[house] = path
    return out


# --- current_misses: this-run signals -------------------------------------

def test_populated_csv_is_healthy(tmp_path):
    houses = _houses(tmp_path, {"christies": HEADER + ROW})
    assert g.current_misses(houses) == {}


def test_absent_csv_is_a_miss(tmp_path):
    houses = _houses(tmp_path, {"phillips": None})
    assert "no CSV produced" in g.current_misses(houses)["phillips"]


def test_header_only_csv_is_a_miss(tmp_path):
    """The Monaco Legend / Phillips failure shape: a file, but no sales."""
    houses = _houses(tmp_path, {"monacolegend": HEADER})
    assert "empty" in g.current_misses(houses)["monacolegend"]


def test_completely_empty_file_is_a_miss(tmp_path):
    houses = _houses(tmp_path, {"marteauandco": ""})
    assert "marteauandco" in g.current_misses(houses)


def test_one_broken_house_does_not_flag_its_healthy_siblings(tmp_path):
    houses = _houses(tmp_path, {
        "christies": HEADER + ROW,
        "sothebys": HEADER + ROW + ROW,
        "phillips": HEADER,
    })
    assert set(g.current_misses(houses)) == {"phillips"}


def test_bonhams_is_not_gated():
    """Bonhams' calendar 403s CI by design (B-72) — gating it would page
    every run for something CI cannot fix."""
    assert "bonhams" not in g.HOUSES


# --- record: consecutive counting across runs -----------------------------

def test_misses_accumulate_across_runs(tmp_path):
    state = tmp_path / "state.json"
    houses = _houses(tmp_path, {"phillips": HEADER})
    for expected in (1, 2, 3):
        assert g.record(houses, state)["phillips"]["misses"] == expected


def test_recovery_clears_the_count(tmp_path):
    state = tmp_path / "state.json"
    broken = _houses(tmp_path, {"phillips": HEADER})
    g.record(broken, state)
    g.record(broken, state)
    assert g.load_state(state)["phillips"]["misses"] == 2

    fixed = _houses(tmp_path, {"phillips": HEADER + ROW})
    assert g.record(fixed, state) == {}
    assert g.load_state(state) == {}


def test_recovery_then_rebreak_starts_from_one(tmp_path):
    state = tmp_path / "state.json"
    houses = _houses(tmp_path, {"phillips": HEADER})
    path = houses["phillips"]
    g.record(houses, state)
    g.record(houses, state)

    path.write_text(HEADER + ROW)          # scraper fixed
    assert g.record(houses, state) == {}

    path.write_text(HEADER)                # and broken again
    assert g.record(houses, state)["phillips"]["misses"] == 1


def test_corrupt_state_file_does_not_crash(tmp_path):
    state = tmp_path / "state.json"
    state.write_text("{not json")
    assert g.record(_houses(tmp_path, {"phillips": HEADER}), state)["phillips"]["misses"] == 1


# --- evaluate: threshold crossing -----------------------------------------

def _state(tmp_path, counts):
    p = tmp_path / "state.json"
    p.write_text(json.dumps(
        {h: {"misses": n, "reason": "empty"} for h, n in counts.items()}))
    return p


def test_below_threshold_warns_but_does_not_page(tmp_path):
    failing, warning = g.evaluate(_state(tmp_path, {"phillips": g.THRESHOLD - 1}))
    assert failing == []
    assert len(warning) == 1


def test_at_threshold_pages(tmp_path):
    failing, warning = g.evaluate(_state(tmp_path, {"phillips": g.THRESHOLD}))
    assert len(failing) == 1
    assert "phillips" in failing[0]
    assert warning == []


def test_healthy_state_is_silent(tmp_path):
    assert g.evaluate(_state(tmp_path, {})) == ([], [])


def test_check_mode_exit_codes(tmp_path, monkeypatch):
    monkeypatch.setattr(g, "STATE", _state(tmp_path, {"phillips": g.THRESHOLD}))
    assert g.main(["auction_calendar_health.py", "--check"]) == 1

    monkeypatch.setattr(g, "STATE", _state(tmp_path, {"phillips": 1}))
    assert g.main(["auction_calendar_health.py", "--check"]) == 0


def test_record_mode_always_exits_zero(tmp_path, monkeypatch):
    """--record must never fail the job; --check owns pass/fail."""
    monkeypatch.setattr(g, "STATE", tmp_path / "state.json")
    monkeypatch.setattr(g, "HOUSES", _houses(tmp_path, {"phillips": HEADER}))
    assert g.main(["auction_calendar_health.py", "--record"]) == 0
