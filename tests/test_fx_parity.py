"""FX-table parity guard (B-18).

The USD-per-unit exchange rates live in TWO places that must agree:
  - merge.py            `FX`                (backend, sets priceUSD)
  - src/utils.js        `FX_RATES_USD_PER`  (frontend, client-side convert)

Nothing structural keeps them in sync, so a one-sided edit silently
drifts the two apart — and a wrong rate goes "8x off" on every price in
that currency, which then feeds the deals / biggest-price-drop sorts
(BUGS.md B-18, audit findings-correctness F2/F9, findings-data H4).

This is the same drift-guard pattern as src/service-worker.test.js:
rebuild the value from the other source and assert equality, so the two
copies can't diverge without a red build. When you genuinely change a
rate, update BOTH dicts and this test stays green.
"""
import re
from pathlib import Path

import merge

UTILS_JS = Path(__file__).resolve().parent.parent / "src" / "utils.js"


def _parse_frontend_fx():
    """Extract the FX_RATES_USD_PER object literal from src/utils.js and
    return it as a {CURRENCY: float} dict. Parses the `KEY: NUMBER,`
    lines inside the literal — no JS engine needed."""
    text = UTILS_JS.read_text(encoding="utf-8")
    m = re.search(r"FX_RATES_USD_PER\s*=\s*\{(.*?)\}", text, re.DOTALL)
    assert m, "FX_RATES_USD_PER object literal not found in src/utils.js"
    body = m.group(1)
    rates = {}
    for key, val in re.findall(r"([A-Za-z]{3})\s*:\s*([0-9]*\.?[0-9]+)", body):
        rates[key] = float(val)
    return rates


def test_fx_tables_agree_between_backend_and_frontend():
    backend = {k: float(v) for k, v in merge.FX.items()}
    frontend = _parse_frontend_fx()

    # Same set of currencies on both sides — a currency added to one
    # dict but not the other is itself a drift bug.
    assert set(backend) == set(frontend), (
        "FX currency sets differ between merge.py FX and utils.js "
        f"FX_RATES_USD_PER:\n  backend-only: {set(backend) - set(frontend)}\n"
        f"  frontend-only: {set(frontend) - set(backend)}"
    )

    # Every shared rate must match exactly.
    mismatches = {
        cur: (backend[cur], frontend[cur])
        for cur in backend
        if backend[cur] != frontend[cur]
    }
    assert not mismatches, (
        "FX rates drifted between merge.py and utils.js "
        f"(currency: (backend, frontend)): {mismatches}"
    )


def test_usd_anchor_is_unity():
    """USD is the conversion anchor; both sides must treat it as 1.0 or
    every cross-currency price shifts."""
    assert merge.FX.get("USD") == 1.0
    assert _parse_frontend_fx().get("USD") == 1.0
