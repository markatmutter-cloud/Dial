"""A push-retry loop must never be able to bin a run's work.

Every scrape workflow ends the same way: stage outputs, commit, push,
and on rejection `git pull --rebase` and retry. Many of these workflows
run concurrently, so the rejection path is normal, not exceptional.

The failure mode this guards against (#920): `git pull --rebase`
refuses to run when the tree has unstaged changes. If the commit step
staged a hand-listed set of files and anything else was modified, every
retry aborted identically and the job exited 1 having thrown away a
40-minute scrape. `Scrape editorial corpus` did exactly that on all 10
runs from 2026-07-15 to 08-16 — the corpus froze for a month.

Two independent defenses, both required here:
  1. `--autostash` — the rebase proceeds even if something is unstaged.
  2. a broad `git add <dir>/` — nothing is left unstaged in the first
     place, and a new output file can't silently go uncommitted because
     nobody remembered to extend a hand-written list.

Defense 1 is what makes the retry loop actually work; defense 2 is what
keeps outputs from being dropped. Neither subsumes the other.
"""
from __future__ import annotations

import re
from pathlib import Path

# Deliberately no YAML parse: the thing under test is the shell script
# inside `run:` blocks, which is opaque text to a YAML loader anyway.
# Keeping this dependency-free means it can never skip itself into
# vacuous green in CI.
WORKFLOW_DIR = Path(__file__).resolve().parent.parent / ".github" / "workflows"

# `git add <something>/` — a directory, not a named file.
BROAD_ADD = re.compile(r"git add\s+(?:[^\n]*\s)?[\w./*-]+/(?:\s|$)")


def _pushing_workflows() -> dict[str, str]:
    """Workflow file -> text, for every workflow with a rebase-retry loop."""
    out = {}
    for path in sorted(WORKFLOW_DIR.glob("*.yml")):
        text = path.read_text()
        if "pull --rebase" in text:
            out[path.name] = text
    return out


def _rebase_calls(text: str) -> list[str]:
    return [
        line.strip()
        for line in text.splitlines()
        # Skip prose: comment lines mention the command when explaining it.
        if "git pull --rebase" in line and not line.strip().startswith("#")
    ]


def test_every_rebase_retry_uses_autostash():
    offenders = {}
    for name, text in _pushing_workflows().items():
        bad = [c for c in _rebase_calls(text) if "--autostash" not in c]
        if bad:
            offenders[name] = bad
    assert not offenders, (
        "These workflows rebase without --autostash, so a single unstaged "
        f"file makes every push retry abort and discards the run's work: {offenders}"
    )


def test_pushing_workflows_stage_a_directory():
    """Reject hand-listed `git add a.json b.json` in a pushing workflow."""
    offenders = []
    for name, text in _pushing_workflows().items():
        add_lines = [
            ln for ln in text.splitlines()
            if re.search(r"^\s*git add\s", ln) and not ln.strip().startswith("#")
        ]
        if not add_lines:
            continue
        # The add may be a backslash continuation across lines; test the
        # whole statement, not just its first line.
        joined = " ".join(add_lines)
        if not BROAD_ADD.search(joined):
            offenders.append((name, joined[:110]))
    assert not offenders, (
        "These workflows stage a hand-listed set of files. A new output file "
        "then goes uncommitted (and unstaged) until someone remembers to edit "
        f"the list — the #920 failure. Stage a directory instead: {offenders}"
    )


def test_guard_covers_the_real_workflows():
    """Tripwire so the two assertions above can't pass vacuously."""
    assert len(_pushing_workflows()) >= 8
