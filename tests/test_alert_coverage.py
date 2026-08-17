"""Every scheduled workflow must be watched by the failure notifier.

A workflow with a `cron:` runs when nobody is at the keyboard. If it
isn't listed in notify-scrape-failure.yml's `workflow_run.workflows`,
a failure opens no issue and sends no actionable alert — it fails
silently by construction.

That is not hypothetical. "Scrape editorial corpus" was never in the
list, so when it broke on 2026-07-15 (push race, fixed in #920) it
failed on all 10 subsequent runs without opening a single issue. The
editorial corpus sat frozen at the 07-12 refresh for a month while the
dealer-side alerts kept arriving daily and looked like the only problem.

This test is the guard: add a cron without wiring the alert and the
build goes red, here, instead of a month later.
"""
from __future__ import annotations

from pathlib import Path

import pytest

yaml = pytest.importorskip("yaml")

WORKFLOW_DIR = Path(__file__).resolve().parent.parent / ".github" / "workflows"
NOTIFIER = WORKFLOW_DIR / "notify-scrape-failure.yml"


def _load(path: Path) -> dict:
    # `on:` is the YAML 1.1 boolean True, so PyYAML parses the trigger
    # block under the key True rather than the string "on". Handle both
    # so this keeps working if the loader ever changes.
    return yaml.safe_load(path.read_text()) or {}


def _trigger_block(doc: dict) -> dict:
    return doc.get("on", doc.get(True, {})) or {}


def _scheduled_workflows() -> dict[str, Path]:
    """Map workflow display-name -> file, for every workflow with a cron."""
    found = {}
    for path in sorted(WORKFLOW_DIR.glob("*.yml")):
        doc = _load(path)
        schedule = _trigger_block(doc).get("schedule")
        if not schedule:
            continue
        name = doc.get("name")
        assert name, f"{path.name} has a cron but no top-level `name:`"
        found[name] = path
    return found


def _watched_workflows() -> set[str]:
    block = _trigger_block(_load(NOTIFIER)).get("workflow_run", {})
    return set(block.get("workflows", []))


def test_notifier_watches_every_scheduled_workflow():
    scheduled = _scheduled_workflows()
    watched = _watched_workflows()

    unwatched = {n: p.name for n, p in scheduled.items() if n not in watched}
    assert not unwatched, (
        "These workflows run on a cron but are not watched by "
        f"notify-scrape-failure.yml, so their failures alert nobody: {unwatched}. "
        "Add each display-name to `on.workflow_run.workflows` there."
    )


def test_notifier_has_no_stale_entries():
    """Names in the notifier must match a real workflow's `name:`.

    workflow_run matches on the display name. A typo or a renamed
    workflow leaves an entry that silently matches nothing — the
    failure mode this whole file exists to prevent, wearing a
    disguise.
    """
    all_names = {
        _load(p).get("name") for p in WORKFLOW_DIR.glob("*.yml")
    } - {None}
    stale = _watched_workflows() - all_names
    assert not stale, (
        f"notify-scrape-failure.yml watches names that match no workflow: {stale}. "
        "workflow_run matches on display name, so these entries do nothing."
    )


def test_scheduled_workflow_count_is_sane():
    """Cheap tripwire: the repo should always have scheduled scrapes.

    If this hits zero, something has gone very wrong with the workflow
    directory (bad glob, mass rename) and the coverage assertions above
    would pass vacuously.
    """
    assert len(_scheduled_workflows()) >= 5
