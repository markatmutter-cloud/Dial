"""Tests for the Watchfid editorial scraper (WordPress REST).

Watchfid is WordPress + Elementor. The risk this file exists to pin is
the Elementor one: `content.rendered` can come back as bare shortcodes
rather than prose, in which case a naive parse silently yields an empty
corpus. These cover the happy path, the shortcode-stripping, the excerpt
fallback, and the body floor that must NOT be papered over.

The fixtures are the shape `/wp-json/wp/v2/posts?_embed` returns.
"""
import watchfid_editorial_scraper as wf


def _post(**over):
    body = "<p>" + ("The radial dial Speedmaster is a curious thing. " * 12) + "</p>"
    post = {
        "id": 101,
        "slug": "the-speedmaster-radial-dials",
        "link": "https://www.watchfid.com/the-speedmaster-radial-dials/",
        "title": {"rendered": "The Speedmaster Radial Dials"},
        "date": "2026-07-14T09:30:00",
        "modified": "2026-07-20T11:00:00",
        "content": {"rendered": body},
        "excerpt": {"rendered": "<p>A short teaser.</p>"},
        "_embedded": {
            "wp:featuredmedia": [{"source_url": "https://www.watchfid.com/img/speedy.jpg"}],
            "author": [{"name": "Fabio"}],
        },
    }
    post.update(over)
    return post


# --- happy path -----------------------------------------------------------

def test_parses_a_normal_post():
    rec = wf.parse_post(_post())

    assert rec["url"] == "https://www.watchfid.com/the-speedmaster-radial-dials/"
    assert rec["title"] == "The Speedmaster Radial Dials"
    assert rec["author"] == "Fabio"
    assert rec["published_at"] == "2026-07-14"
    assert rec["updated_at"] == "2026-07-20"
    assert rec["image"] == "https://www.watchfid.com/img/speedy.jpg"
    assert rec["source"] == "watchfid_editorial"
    assert rec["source_type"] == "editorial_blog"
    assert rec["word_count"] > 50


def test_brand_is_inferred_from_the_title():
    rec = wf.parse_post(_post(title={"rendered": "Rolex Submariner 5513 in depth"}))

    assert rec["brand"] == "Rolex"


def test_falls_back_to_publication_name_when_byline_is_admin():
    rec = wf.parse_post(_post(_embedded={"author": [{"name": "admin"}]}))

    assert rec["author"] == "Watchfid"


def test_falls_back_to_body_image_without_a_featured_image():
    body = '<p>' + ("word " * 60) + '</p><img src="https://www.watchfid.com/img/inline.jpg">'
    rec = wf.parse_post(_post(content={"rendered": body}, _embedded={}))

    assert rec["image"] == "https://www.watchfid.com/img/inline.jpg"


# --- the Elementor failure mode -------------------------------------------

def test_elementor_shortcodes_are_stripped_from_the_body():
    body = "<p>[elementor-template id=\"4821\"] Real prose about the dial. " + ("more text " * 40) + "</p>"
    rec = wf.parse_post(_post(content={"rendered": body}))

    assert "elementor-template" not in rec["body_text"]
    assert "[" not in rec["body_text"]
    assert "Real prose about the dial." in rec["body_text"]


def test_shortcode_only_body_falls_back_to_the_excerpt():
    # content.rendered is pure Elementor scaffolding — the excerpt is the
    # only prose the API gives us.
    excerpt = "<p>" + ("A genuine teaser paragraph about the watch. " * 8) + "</p>"
    rec = wf.parse_post(_post(
        content={"rendered": '[elementor-template id="4821"]'},
        excerpt={"rendered": excerpt},
    ))

    assert rec is not None
    assert "genuine teaser paragraph" in rec["body_text"]


def test_post_with_no_usable_prose_anywhere_is_dropped():
    rec = wf.parse_post(_post(
        content={"rendered": '[elementor-template id="4821"]'},
        excerpt={"rendered": "<p>Tiny.</p>"},
    ))

    assert rec is None, "a stub must not enter the corpus"


def test_body_floor_is_the_documented_200_chars():
    # Guards against someone quietly lowering the floor to make an
    # Elementor problem look solved.
    assert wf.MIN_BODY_CHARS == 200


# --- records without the basics -------------------------------------------

def test_post_without_a_link_is_dropped():
    assert wf.parse_post(_post(link="")) is None


def test_post_without_a_title_is_dropped():
    assert wf.parse_post(_post(title={"rendered": ""})) is None


# --- refresh policy -------------------------------------------------------

def test_unseen_post_is_always_fetched():
    assert wf.should_refresh(None, full=False) is True


def test_recently_scraped_post_is_skipped():
    fresh = {"scraped_at": wf.datetime.now(wf.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")}

    assert wf.should_refresh(fresh, full=False) is False


def test_full_refresh_overrides_freshness():
    fresh = {"scraped_at": wf.datetime.now(wf.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")}

    assert wf.should_refresh(fresh, full=True) is True


def test_entry_with_unparseable_timestamp_is_refetched():
    assert wf.should_refresh({"scraped_at": "not-a-date"}, full=False) is True
