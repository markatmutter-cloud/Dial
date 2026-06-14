"""Christie's lot-blob extraction across both platforms (B-73).

www.christies.com assigns `window.chrComponents.lots = {data:{…}}`; the
online-only platform (onlineonly.christies.com, reached via the calendar's
`sso?SaleID=…` link) assigns the whole `window.chrComponents = {…,"lots":
{data:{…}},…}` in one blob. `_christies_lots_blob` must read both, or
online-only catalogues come back empty (Mark: "Christie's still doesn't
have the listings to view, just the external link"). Verified live: the
patched enumerator pulls 87/87 lots with estimates + images for the NY
Edit, and the main-site path is unchanged (225-lot Rare Watches).
"""
import auction_lots_scraper as a


def test_blob_from_main_site_lots_assignment():
    html = ('<script>window.chrComponents.lots = '
            '{"data":{"lots":[{"object_id":1}],"total_hits_filtered":1}};</script>')
    data = a._christies_lots_blob(html)
    assert data and len(data["lots"]) == 1
    assert data["total_hits_filtered"] == 1


def test_blob_from_online_only_whole_chrcomponents():
    html = ('<script>window.chrComponents = {"header":{"data":{}},'
            '"lots":{"data":{"lots":[{"object_id":2},{"object_id":3}],'
            '"total_hits_filtered":2,"sale":null}}};</script>')
    data = a._christies_lots_blob(html)
    assert data and len(data["lots"]) == 2
    assert data["total_hits_filtered"] == 2


def test_blob_absent_returns_none():
    assert a._christies_lots_blob("<html>no components here</html>") is None


def test_chr_num_coerces_online_only_decimal_strings():
    assert a._chr_num("18000.00") == 18000      # online-only string form
    assert a._chr_num(24000) == 24000           # main-site int form
    assert a._chr_num(None) is None
    assert a._chr_num("") is None
    assert a._chr_num("n/a") is None


def test_online_image_reconstructed_from_roundel_placeholder():
    """B-73: onlineonly.christies.com IP-gates the lot image (CI gets a
    roundel placeholder); reconstruct the real www.christies.com URL from
    the sale number / year / location code / lot number."""
    cal = {"title": "Watches Online: The New York Edit",
           "location": "Online, New York", "dateStart": "2026-06-05"}
    lot = {"image": {"image_src": "/Content/img/christies-roundel.svg"},
           "lot_number": 201}
    url = a._christies_online_image(
        "https://onlineonly.christies.com/sso?SaleID=30716&SaleNumber=23588", cal, lot)
    assert url == ("https://www.christies.com/img/LotImages/2026/NYR/"
                   "2026_NYR_23588_0201_000.jpg?mode=max")


def test_online_image_passthrough_when_already_real():
    real = ("https://www.christies.com/img/LotImages/2026/NYR/"
            "2026_NYR_23588_0201_000(slug).jpg?mode=max")
    lot = {"image": {"image_src": real}, "lot_number": 201}
    assert a._christies_online_image("x", {}, lot) == real
