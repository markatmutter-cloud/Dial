"""Monaco Legend price parsing (B-70).

MLA renders the CHF thousands separator as the HTML entity `&#039;`
(apostrophe), e.g. `Fr.\xa032&#039;500`. The sold/estimate parsers must
unescape entities before the number regex, or it stops at the `&` and
reads ~1000× too small (CHF 32'500 → 32 — Mark spotted Monaco Legend sold
figures showing as a few hundred dollars). These pin all three MLA
currency formats incl. the entity-separated CHF one.
"""
import auction_lots_scraper as a


def test_chf_entity_apostrophe_separator_sold():
    # the exact byte sequence from the live Exclusive Timepieces 41 sale
    assert a._mla_parse_sold_price("Fr.\xa032&#039;500") == ("CHF", 32500)
    assert a._mla_parse_sold_price("Fr. 575&#039;000") == ("CHF", 575000)


def test_eur_dot_separator_sold():
    assert a._mla_parse_sold_price("€ 9.750") == ("EUR", 9750)


def test_usd_comma_separator_sold():
    assert a._mla_parse_sold_price("US$ 5,000") == ("USD", 5000)


def test_sold_currency_falls_back_to_hint():
    cur, amt = a._mla_parse_sold_price("9'750", currency_hint="CHF")
    assert cur == "CHF" and amt == 9750


def test_estimation_entity_separator():
    assert a._mla_parse_estimation("Fr.\xa025&#039;000 – 50&#039;000") == ("CHF", 25000, 50000)


def test_estimation_eur_and_usd():
    assert a._mla_parse_estimation("€ 8.000 – 16.000") == ("EUR", 8000, 16000)
    assert a._mla_parse_estimation("US$ 5,000 - 10,000") == ("USD", 5000, 10000)
