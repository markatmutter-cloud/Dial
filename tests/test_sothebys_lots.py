"""Tests for the Sotheby's GraphQL lot-card transform (B-69).

The enumerator itself does live network I/O (verified by hand against real
live + closed sales: 414 / 160 lots with estimates, images, and realised
prices). These pin the pure transform `_sothebys_card_to_lot` — the part
that maps a LotCard payload to our lot record — so a future schema/field
slip is caught: estimate + currency, the sold-price path (closed sales),
image rendition pick, maker prepend, and the exclusion filters.
"""
import auction_lots_scraper as a


def _card(**over):
    card = {
        "lotId": "lot-1",
        "title": "Nautilus, Reference 5711/1A",
        "subtitle": None,
        "creatorsDisplayTitle": "Patek Philippe, Geneva",
        "lotNumber": {"lotDisplayNumber": "42"},
        "slug": {"lotSlug": "nautilus-5711"},
        "estimateV2": {"lowEstimate": {"amount": "10000", "currency": "USD"},
                       "highEstimate": {"amount": "20000", "currency": "USD"}},
        "media": {"images": [{"renditions": [
            {"url": "http://img/small.jpg", "width": 400},
            {"url": "http://img/large.jpg", "width": 1024}]}]},
        "bidState": {"sold": None},
    }
    card.update(over)
    return card


def _conv(card):
    return a._sothebys_card_to_lot(card, "https://www.sothebys.com/en/buy/auction/2026/fine-watches",
                                   "Fine Watches", "USD", "2026", "fine-watches",
                                   "2026-06-17T21:00Z")


def test_live_lot_maps_estimate_image_and_title():
    url, d = _conv(_card())
    assert url.endswith("/2026/fine-watches/nautilus-5711")
    assert d["house"] == "Sotheby's"
    assert d["lot_number"] == "42"
    # maker prepended (not already in the model title)
    assert d["title"] == "Patek Philippe Nautilus, Reference 5711/1A"
    assert d["estimate_low"] == 10000 and d["estimate_high"] == 20000
    assert d["currency"] == "USD"
    assert d["sold_price"] is None and d["status"] == "active"
    # widest rendition wins
    assert d["image"] == "http://img/large.jpg"


def test_sold_lot_takes_final_price_and_currency():
    url, d = _conv(_card(bidState={"sold": {
        "isSold": True,
        "premiums": {"finalPrice": {"amount": "204800", "currency": "CHF"}}}}))
    assert d["sold_price"] == 204800
    assert d["currency"] == "CHF"          # follows the realised-price currency
    assert d["status"] == "ended"
    assert d["sold_price_usd"] is not None  # FX conversion ran


def test_maker_not_doubled_when_already_in_title():
    _, d = _conv(_card(title="Rolex Submariner 5513", creatorsDisplayTitle="Rolex"))
    assert d["title"] == "Rolex Submariner 5513"


def test_excluded_title_dropped():
    assert _conv(_card(title="A gold openface pocket watch")) is None


def test_missing_slug_or_id_dropped():
    assert _conv(_card(slug={})) is None
    assert _conv(_card(lotId=None)) is None


def test_zero_amount_treated_as_absent():
    _, d = _conv(_card(estimateV2={"lowEstimate": {"amount": "0", "currency": "USD"},
                                   "highEstimate": {"amount": "0", "currency": "USD"}}))
    assert d["estimate_low"] is None and d["estimate_high"] is None
