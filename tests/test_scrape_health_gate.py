"""Tests for scrape_health_gate.collect_problems (B-60).

The gate turns a silent per-source scrape failure into a red workflow
(so notify-scrape-failure.yml pages Mark). These pin the three signals:
move-step "missing" lines fail, verify_sources ERROR alerts fail, and
WARN dips / healthy runs do not.
"""
import json

import scrape_health_gate as g


def _verif(tmp_path, alerts):
    p = tmp_path / "verification.json"
    p.write_text(json.dumps({"alerts": alerts}))
    return p


def _movelog(tmp_path, text):
    p = tmp_path / "scrape_move.log"
    p.write_text(text)
    return p


def test_healthy_run_has_no_problems(tmp_path):
    move = _movelog(tmp_path, "")  # every source moved its CSV
    verif = _verif(tmp_path, [])
    assert g.collect_problems(move, verif) == []


def test_missing_source_is_flagged(tmp_path):
    move = _movelog(tmp_path, "watchcenter missing\nbelmont missing\n")
    verif = _verif(tmp_path, [])
    problems = g.collect_problems(move, verif)
    assert len(problems) == 2
    assert any("watchcenter" in p for p in problems)
    assert any("belmont" in p for p in problems)


def test_error_alert_is_flagged_warn_is_not(tmp_path):
    move = _movelog(tmp_path, "")
    verif = _verif(tmp_path, [
        {"level": "ERROR", "source": "swisshours", "note": "count dropped to zero"},
        {"level": "WARN", "source": "somlo", "note": "below median"},
    ])
    problems = g.collect_problems(move, verif)
    assert len(problems) == 1
    assert "swisshours" in problems[0]
    assert not any("somlo" in p for p in problems)


def test_both_signals_combine(tmp_path):
    move = _movelog(tmp_path, "watchclub missing\n")
    verif = _verif(tmp_path, [
        {"level": "ERROR", "source": "watchcenter", "note": "absent today"},
    ])
    assert len(g.collect_problems(move, verif)) == 2


def test_missing_log_absent_does_not_crash(tmp_path):
    # Job died before the move step ran — no log file. Gate must not throw;
    # the early failure already reds the workflow on its own.
    verif = _verif(tmp_path, [])
    assert g.collect_problems(tmp_path / "nope.log", verif) == []


def test_corrupt_verification_json_is_swallowed(tmp_path):
    move = _movelog(tmp_path, "")
    bad = tmp_path / "verification.json"
    bad.write_text("{not json")
    assert g.collect_problems(move, bad) == []
