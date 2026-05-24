"""
Opt-in helpers shared across per-source scrapers.

Per CLAUDE.md: the per-dealer scraper file model is intentional — each
site has its own quirks (Bulang collection-scoping, Falco's
nonstandard fields, etc.) and a one-driver-fits-all model has been
explicitly rejected. These helpers exist for the boilerplate that
genuinely IS identical across sources (retrying transient 5xx, etc.)
without coercing scrapers into a uniform shape.

Use directly; don't subclass.
"""
from __future__ import annotations

import time

import requests


def fetch_json_with_retry(
    url: str,
    *,
    params: dict | None = None,
    headers: dict | None = None,
    timeout: int = 20,
    retries: int = 3,
    backoff_base: int = 2,
) -> dict | list:
    """
    GET a URL and return parsed JSON. Retries on 5xx responses and
    network errors with exponential backoff (`backoff_base ** attempt`
    seconds between attempts). 4xx responses raise immediately — those
    are permanent and retrying won't help.

    Reference call site that originally motivated this: Falco Watches'
    products.json pagination (PR #530 hotfix). Apply at high-blast-
    radius fetch sites — pagination loops, full-catalog endpoints —
    where a single transient failure would otherwise zero out the
    source's data for the run and mark every previously-tracked item
    as sold via merge.py's disappearance logic.
    """
    last_exc: Exception | None = None
    for attempt in range(retries + 1):
        try:
            r = requests.get(url, params=params, headers=headers, timeout=timeout)
            # 4xx (auth / not-found / rate-limit) is permanent — raise now
            # so we don't waste retries. 5xx falls through to retry path.
            if 400 <= r.status_code < 500:
                r.raise_for_status()
            r.raise_for_status()
            return r.json()
        except requests.HTTPError as e:
            last_exc = e
            status = e.response.status_code if e.response is not None else 0
            if status and status < 500:
                raise
            print(f"  retry {attempt + 1}/{retries} after HTTP {status} on {url}")
        except requests.RequestException as e:
            last_exc = e
            print(f"  retry {attempt + 1}/{retries} after network error on {url}: {e}")
        if attempt < retries:
            time.sleep(backoff_base ** attempt)
    raise last_exc  # type: ignore[misc]
