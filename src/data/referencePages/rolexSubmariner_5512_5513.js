// Reference page content node — Rolex Submariner 5512 / 5513.
//
// First anchor NODE of the Submariner reference graph (ROADMAP Epic 5).
// Pure CONTENT — the ReferencePage component renders it; the live/auction/sold
// sliders pull from listings at render time (matched on `market`).
//
// VOICE (see BRAND.md + memory feedback_reference_voice_intrinsic):
//  - Write FOR collectors, ABOUT the watch. Intrinsic detail, what's
//    interesting, what to look for. Never about collectors, their journey,
//    taste or "where they are."
//  - NO hierarchy/diminishment — no "starter/entry/first-serious", no
//    "overshadowed/less status/budget alternative". Watch-to-watch
//    relationships are LATERAL (linked / alternative / complementary), never a
//    ladder. The progression/journey lives in the coaching part of the site.
//  - "Famous for / widely regarded for X" is fine. Synthesised, never lifted.
//  - Every external link is source-credited.

const node = {
  id: "rolex-submariner-5512-5513",
  brand: "Rolex",
  modelLine: "Submariner",
  refs: ["5512", "5513"],
  group: "5512 / 5513",
  definer: "No-date, crown-guard, acrylic-era Submariners · c. 1959–1989",

  hero: {
    img: "https://images.squarespace-cdn.com/content/v1/5b213f95506fbec9b54e014c/5e5073ed-1b46-4ef7-ac07-3e8c45734708/DSC07336.JPG?format=2500w",
    credit: "Wind Vintage",
    creditUrl: "https://www.windvintage.com/blog/collectors-guide-rolex-submariner-reference-5512",
  },

  // 3-line model context before the references.
  modelIntro:
    "The Submariner is Rolex's dive watch — introduced in 1953, waterproof by design, with a rotating bezel to time a descent and a high-contrast luminous dial built to be read underwater. It set the template the modern dive watch followed, and it remains the heart of Rolex's professional line alongside the GMT-Master, Explorer and Sea-Dweller.",

  // Story: what it followed → why it was made → what it's known for.
  story: [
    "The 5512 and 5513 are the no-date Submariners of the crown-guard, acrylic-crystal era. They followed the big-crown 6538 and 5510 — Submariners with large, exposed winding crowns — and added the shouldered guards that protect it, settling the 39mm Oyster form the model still wears.",
    "The two ran side by side. The 5512 came first and took a chronometer-rated movement, its dial growing from two lines of text to the four-line “Superlative Chronometer Officially Certified.” The 5513 used a non-chronometer movement and a cleaner two-line dial — and stayed in production into the late 1980s, the longest run of any vintage Submariner.",
    "What looks like one watch is really a landscape of small differences: the dial moving from glossy gilt to matte, the depth rating from metres-first to feet-first, the printing from serif to sans, through five generations of fat-plot “Maxi” dials; the case from square to pointed to rounded crown guards. It's widely regarded as the watch that standardised the modern dive watch — and it wears now exactly as it was built to.",
  ],

  // Cultural beat — who wore it, where it sat in the world at the time.
  inItsTime:
    "It earned its reputation in use. Military divers wore issued 5513s; COMEX saturation teams took modified examples to working depths; Roger Moore's Bond strapped one over a dinner jacket in Live and Let Die. The same plain black dive watch crossed from the seabed to the wrist of anyone who wanted one watch that could go anywhere.",

  // Named tightly — no amateur gloss; only the well-classified element
  // (typography) carries a note.
  pointsToLookFor: [
    { term: "Gilt vs matte dials" },
    { term: "Meters-first vs feet-first dials" },
    { term: "Four-line (chronometer 5512) vs two-line text" },
    { term: "Serif vs non-serif typography", note: "a well-mapped sequence of dial generations" },
    { term: "The “Bart Simpson” coronet" },
    { term: "Maxi dials, Mark I–V" },
    { term: "Square, pointed (PCG) and rounded crown guards" },
    { term: "Bezel insert, hands and lume condition" },
  ],

  // Featured "marks" — call-out box illustrating the points above. Images
  // baked from the Hairspring Finds corpus.
  variants: [
    { name: "Gilt 5513", traits: "Glossy gilt dial", img: "https://hairspring.com/cdn/shop/articles/Hero-184.jpg", url: "https://hairspring.com/blogs/finds/gilt-5513-rolex-submariner", source: "Hairspring Finds" },
    { name: "Tropical meters-first 5513", traits: "Browned gilt, metres-first", img: "https://hairspring.com/cdn/shop/articles/Hero-3062-scaled.jpg", url: "https://hairspring.com/blogs/finds/tropical-meters-first-5513-rolex-submariner", source: "Hairspring Finds" },
    { name: "Four-line PCG 5512", traits: "Chronometer dial, pointed guards", img: "https://hairspring.com/cdn/shop/articles/Hero-3801-scaled.jpg", url: "https://hairspring.com/blogs/finds/4-line-dial-pcg-5512-rolex-submariner", source: "Hairspring Finds" },
    { name: "“Bart Simpson” 5512", traits: "Stubby gilt coronet", img: "https://hairspring.com/cdn/shop/articles/Hero-1140-copy9-scaled.jpg", url: "https://hairspring.com/blogs/finds/bart-simpson-5512-rolex-submariner", source: "Hairspring Finds" },
    { name: "COMEX 5513", traits: "Issued professional-diving example", img: "https://hairspring.com/cdn/shop/articles/5513-Comex-11.jpg", url: "https://hairspring.com/blogs/finds/comex-5513-rolex-submariner", source: "Hairspring Finds" },
    { name: "Explorer-dial 5512", traits: "Rare 3-6-9 dial", img: "https://hairspring.com/cdn/shop/articles/Hero-3163-scaled.jpg", url: "https://hairspring.com/blogs/finds/explorer-dial-5512-rolex-submariner", source: "Hairspring Finds" },
  ],

  // Drives the segmented live/auction/sold strip. Rolex guard avoids stray
  // cross-brand 5512/5513 hits.
  market: { refs: ["5512", "5513"], brand: "rolex" },

  // Editorial, two tiers. Reference guides pinned; stories & images below.
  referenceGuides: [
    { title: "Reference Points: Understanding the Submariner", publication: "Hodinkee", url: "https://www.hodinkee.com/articles/rolex-submariner-reference-points", img: "https://hodinkee.imgix.net/uploads/images/1563302712188-5qa2e3aif6n-25f8146ad2b53d1ddcbbf94525a11cce/overhead_hero.jpg?ixlib=rails-1.1.0&fm=jpg&q=55&auto=format&usm=12" },
    { title: "Submariner 5512 vs 5513", publication: "Fratello", url: "https://www.fratellowatches.com/rolex-submariner-5512-vs-5513-which-one-should-you-get/", img: "https://www.fratellowatches.com/cdn-cgi/image/anim=false/wp-content/uploads/2010/10/Rolex-Submariner-5513-5982.jpg" },
    { title: "A Collector's Guide to the Vintage 5513", publication: "Hodinkee · Anthony Traina", url: "https://www.hodinkee.com/articles/a-collectors-guide-to-the-vintage-rolex-submariner-5513", img: "https://hodinkee.imgix.net/uploads/images/0c765145-8d35-4bc9-bdf3-a980fd655d60/5513-hero.jpg?ixlib=rails-1.1.0&fm=jpg&q=55&auto=format&usm=12&w=1200&h=630&fit=crop" },
    { title: "What to Know About the 5512", publication: "Wind Vintage · Charlie Dunne", url: "https://www.windvintage.com/blog/collectors-guide-rolex-submariner-reference-5512", img: "http://static1.squarespace.com/static/5b213f95506fbec9b54e014c/5b2151251ae6cf9251e877fa/65a9dd8c6b70aa73c276b77a/1768333484294/DSC06391.jpeg?format=1500w" },
    { title: "History of the Submariner, Part 2 — the 55XX & 1680", publication: "Monochrome · Brice Goulard", url: "https://monochrome-watches.com/rolex-submariner-history-part-2-the-55xx-1680references/", img: "https://monochrome-watches.com/wp-content/uploads/2020/08/History-of-the-Rolex-Submariner-Part-2-The-55XX-and-1680-References.jpg" },
    { title: "5513 Matte Dial — the matte-dial taxonomy (+ gilt 5512)", publication: "Beaumont Miller II", url: "http://5513mattedial.com/", img: "" },
  ],
  storiesAndImages: [
    { title: "The Mark I Maxi 5513", publication: "Bulang & Sons", url: "https://bulangandsons.com/blogs/watch-talks/the-mk1-maxi-5513-rolex-submariner", img: "https://bulangandsons.com/cdn/shop/articles/BS-Maxi-Mk1-Artuicle-21_19b1f52f-5b89-4187-86fe-8b93bcdd62a2.jpg?v=1756227529&width=1024" },
    { title: "Explaining the “Bart Simpson”", publication: "Hodinkee · Eric Wind", url: "https://www.hodinkee.com/articles/explaining-the-bart-simpson-rolex-submariner-erics-favorite", img: "https://hodinkee.imgix.net/uploads/article/hero_image/1463/1000w.jpg?ixlib=rails-1.1.0&fm=jpg&q=55&auto=format&usm=12&w=1200&h=630&fit=crop" },
    { title: "Steve McQueen at Le Mans, in a 5512", publication: "Rolex Magazine", url: "https://www.rolexmagazine.com/2015/11/steve-mcqueen-racing-at-le-mans-rolex.html", img: "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgbGIEEI6Q-WdPt7KTlc6JkIUcLczko-FqaigErt8fD1yJCEMCL-r-pMBxVFKrRbpxp6I-5Ya82mSQpQx0CxuHKANJlqB_dq5ZG7VCHrvCf820X3M0lbyTXBHYdpcdtdD7Guj3m9CgKssAB9ldohE6b9piV5mTQx_6694_5-msiqsYMIOsNx3mT80rTe17V/s3200/Steve%20McQueen%20Rolex%20Submariner%20and%20Persol%20Sunglasses.jpg" },
    { title: "A Royal Navy diver's issued 5513", publication: "Rolex Magazine", url: "https://www.rolexmagazine.com/2021/01/antiques-roadshow-royal-navy-divers.html", img: "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjB0fhVctG16xrrlCI3JEA07017AxE2jLFZDMe89mlVWXgpnlnFi1hphBuDuTbIqyEb1bceNgPnHSu1xh5uVAIhizijkejuoXbpaUKeJfjT1W4h_5GgOC914gQdf2CeGX1M4GtLpmBbgZY/s3200/royal-navy.jpg" },
    { title: "Teaming up with COMEX", publication: "Perezcope · Jose Pereztroika", url: "https://perezcope.com/2020/06/28/the-sea-dweller-chronicles-dry-run-and-teaming-up-with-comex/", img: "https://i0.wp.com/perezcope.com/wp-content/uploads/2020/06/200624-title-part-two-comex-janus-4-zoom.jpg?fit=1200%2C732&ssl=1" },
    { title: "Appreciating it as just a great dive watch", publication: "Fratello", url: "https://www.fratellowatches.com/can-we-appreciate-the-rolex-submariner-as-just-a-great-dive-watch/", img: "https://www.fratellowatches.com/cdn-cgi/image/anim=false/wp-content/uploads/2024/09/RolexResized-12.jpg" },
  ],

  // The rabbit hole — lateral discovery, NOT a ladder. distance: similar |
  // adjacent | edge. `why` describes the watch relationship, never up/down.
  connections: [
    { label: "Submariner 1680", distance: "similar", why: "The date Submariner, introduced alongside the no-date 5512/5513; the earliest carry the red “Submariner” text.", match: { refs: ["1680"], brand: "rolex" } },
    { label: "Explorer 1016", distance: "similar", why: "Rolex's other matte-dial tool watch of the same years — no rotating bezel, the same quiet legibility.", match: { refs: ["1016"], brand: "rolex" } },
    { label: "GMT-Master 1675", distance: "adjacent", why: "Shares the crown-guard case; swaps the dive bezel for a 24-hour travel bezel, with its own deep dial-variant story.", match: { refs: ["1675"], brand: "rolex" } },
    { label: "Tudor Submariner 7016", distance: "adjacent", why: "Tudor's Submariner of the era — the same case and dive-watch architecture, its own dials, references and movements.", match: { text: ["submariner"], brand: "tudor" } },
    { label: "Omega Seamaster 300 · 165.024", distance: "adjacent", why: "The same job in a different idiom — broad-arrow hands, a fully graduated bezel, an in-house feel.", match: { text: ["165.024", "165024"] } },
    { label: "Blancpain Fifty Fathoms", distance: "edge", why: "An earlier answer to the same brief — military dive history from a different lineage.", match: { text: ["fifty fathoms"], brand: "blancpain" } },
  ],

  books: [
    { title: "Oyster Perpetual Submariner: The Watch That Unlocked the Deep", author: "Nicholas Foulkes · Wallpaper*", url: "https://www.accartbooks.com/us/book/oyster-perpetual-submariner/" },
    { title: "Vintage Rolex Sports Models (4th Ed.)", author: "Martin Skeet & Nick Urul · Schiffer", url: "https://schifferbooks.com/products/vintage-rolex-sports-models-4th-edition" },
    { title: "The Vintage Rolex Field Manual", author: "Colin A. White · MorningTundra", url: "https://www.vrfm.io/" },
    { title: "100 Superlative Rolex Watches", author: "John Goldberger · Damiani", url: "https://www.johngoldbergerwatches.com/100superlativerolxwatches.htm" },
  ],

  scopeNote:
    "This page groups the civilian 5512 and 5513 — the no-date, crown-guard, acrylic-crystal Submariners studied together. The military (5513/5517 MilSub), COMEX (5514), date (1680) and Sea-Dweller (1665) lines each get their own page. Production-year ranges are approximate — sources disagree on exact endpoints — and film/auction associations are cultural context, not authentication.",
};

export default node;
