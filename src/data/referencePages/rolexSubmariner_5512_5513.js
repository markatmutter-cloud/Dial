// Reference page content node — Rolex Submariner 5512 / 5513.
//
// The first anchor NODE in the Submariner reference graph (ROADMAP Epic 5).
// This file is pure CONTENT — hand-authored copy + curated, source-credited
// links + baked variant images. The ReferencePage component renders it; the
// live/auction/sold sliders are pulled from listings at render time (NOT
// stored here) by matching `market.refs`.
//
// Authoring rules (transparency posture, BRAND.md voice):
//  - Every external link names its source; we credit, we don't reproduce.
//  - Copy is synthesised, never lifted near-verbatim.
//  - Production years kept soft — sources disagree on exact endpoints.
//
// `connections` carry the recommender SHAPE (temperature + why), hand-authored
// for now — no recommender engine (that's Epic 7). Each connection's `match`
// drives a home-style example slider that simply renders empty where we hold
// no inventory.

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

  story: [
    "Few references carry as much of the Submariner's mythology as the 5512 and 5513 — the era most collectors mean when they say “vintage Sub,” and the point where the model settled into the form it still wears.",
    "They ran in parallel for three decades. The 5512 came first, gaining crown guards and soon after chronometer certification — its dial grew from two lines to the four-line “Superlative Chronometer Officially Certified” text that marks it out. The 5513 dropped the chronometer movement for a simpler execution, and in doing so became the longest-running and most-studied no-date Submariner of them all, in production into the late 1980s.",
    "What looks like one watch is really a landscape. The dial alone moved from gilt gloss to matte, meters-first to feet-first, serif to sans, through five generations of fat-plot “Maxi” printing; the case from square to pointed to rounded crown guards. The same references went to war, to COMEX saturation depths, and — on Roger Moore's wrist — to the cinema. This page takes the 5512 and 5513 as the anchor and follows those threads outward.",
  ],

  whyItMatters:
    "For many collectors this is the first serious vintage purchase — recognisable enough to feel safe, deep enough to never exhaust. It rewards close looking: condition, dial generation, and originality move value far more than the reference number, and the differences are subtle enough to turn buyers into students. It's also the reference where the modern sport watch was effectively standardised — which is why it sits at the crossroads of vintage-Rolex, tool-watch, military, and dive-watch collecting at once.",

  howToRead: [
    { cue: "Dial finish", note: "Gilt gloss (earlier, often a warm “tropical” browning) gives way to matte tritium later." },
    { cue: "Depth text", note: "“Meters-first” (metres before feet) marks the earlier dials; feet-first came later." },
    { cue: "Typography", note: "Serif vs non-serif text, and the stubby “Bart Simpson” coronet on some gilt dials." },
    { cue: "Maxi dials", note: "Five marks (Mk I–V) of progressively fat lume plots on late 5513s." },
    { cue: "Crown guards", note: "Square (earliest), then pointed (PCG), then rounded." },
    { cue: "5512 vs 5513", note: "Four lines of dial text (chronometer) is a 5512; two lines is a 5513." },
  ],

  // Featured "marks" — the variant section. Images baked from the Hairspring
  // Finds corpus (hot-links cleanly). Each links out to the full write-up.
  variants: [
    { name: "4-Line PCG 5512", traits: "Chronometer dial, pointed crown guards", img: "https://hairspring.com/cdn/shop/articles/Hero-3801-scaled.jpg", url: "https://hairspring.com/blogs/finds/4-line-dial-pcg-5512-rolex-submariner", source: "Hairspring Finds" },
    { name: "Gilt 5513", traits: "Glossy gilt dial, early production", img: "https://hairspring.com/cdn/shop/articles/Hero-184.jpg", url: "https://hairspring.com/blogs/finds/gilt-5513-rolex-submariner", source: "Hairspring Finds" },
    { name: "Tropical Meters-First 5513", traits: "Browned gilt, metres-before-feet", img: "https://hairspring.com/cdn/shop/articles/Hero-3062-scaled.jpg", url: "https://hairspring.com/blogs/finds/tropical-meters-first-5513-rolex-submariner", source: "Hairspring Finds" },
    { name: "‘Bart Simpson’ 5512", traits: "Stubby gilt coronet", img: "https://hairspring.com/cdn/shop/articles/Hero-1140-copy9-scaled.jpg", url: "https://hairspring.com/blogs/finds/bart-simpson-5512-rolex-submariner", source: "Hairspring Finds" },
    { name: "COMEX 5513", traits: "Issued professional-diving variant", img: "https://hairspring.com/cdn/shop/articles/5513-Comex-11.jpg", url: "https://hairspring.com/blogs/finds/comex-5513-rolex-submariner", source: "Hairspring Finds" },
    { name: "Explorer-Dial 5512", traits: "Rare 3-6-9 “Explorer” dial", img: "https://hairspring.com/cdn/shop/articles/Hero-3163-scaled.jpg", url: "https://hairspring.com/blogs/finds/explorer-dial-5512-rolex-submariner", source: "Hairspring Finds" },
  ],

  // Drives the live / auction / sold sliders. Matched against listing.ref +
  // reference_no; the Rolex guard avoids stray cross-brand 5512/5513 hits.
  market: { refs: ["5512", "5513"], brand: "rolex" },

  readingList: [
    { group: "Start here", title: "Reference Points: Understanding the Rolex Submariner", publication: "Hodinkee", url: "https://www.hodinkee.com/articles/rolex-submariner-reference-points" },
    { group: "Start here", title: "Submariner 5512 vs 5513 — Which One Should You Get?", publication: "Fratello", url: "https://www.fratellowatches.com/rolex-submariner-5512-vs-5513-which-one-should-you-get/" },
    { group: "Start here", title: "What to Know About the Submariner Reference 5512", publication: "Wind Vintage · Charlie Dunne", url: "https://www.windvintage.com/blog/collectors-guide-rolex-submariner-reference-5512" },
    { group: "Start here", title: "A Collector's Guide to the Vintage Submariner 5513", publication: "Hodinkee · Anthony Traina", url: "https://www.hodinkee.com/articles/a-collectors-guide-to-the-vintage-rolex-submariner-5513" },
    { group: "Start here", title: "History of the Submariner, Part 2 — The 55XX & 1680", publication: "Monochrome · Brice Goulard", url: "https://monochrome-watches.com/rolex-submariner-history-part-2-the-55xx-1680references/" },

    { group: "Reading the variants", title: "5513 Matte Dial — the matte-dial taxonomy (+ gilt 5512)", publication: "Beaumont Miller II", url: "http://5513mattedial.com/" },
    { group: "Reading the variants", title: "The Mk1 Maxi 5513 Submariner", publication: "Bulang & Sons", url: "https://bulangandsons.com/blogs/watch-talks/the-mk1-maxi-5513-rolex-submariner" },
    { group: "Reading the variants", title: "Explaining the ‘Bart Simpson’ Submariner", publication: "Hodinkee · Eric Wind", url: "https://www.hodinkee.com/articles/explaining-the-bart-simpson-rolex-submariner-erics-favorite" },
    { group: "Reading the variants", title: "The Sea-Dweller Chronicles: Teaming Up With COMEX", publication: "Perezcope · Jose Pereztroika", url: "https://perezcope.com/2020/06/28/the-sea-dweller-chronicles-dry-run-and-teaming-up-with-comex/" },

    { group: "Context & culture", title: "Can We Appreciate the Submariner As Just a Great Dive Watch?", publication: "Fratello", url: "https://www.fratellowatches.com/can-we-appreciate-the-rolex-submariner-as-just-a-great-dive-watch/" },
    { group: "Context & culture", title: "‘Live and Let Die’, 1973 — the Roger Moore 5513 prop", publication: "Christie's", url: "https://www.christies.com/en/lot/lot-1290106" },
  ],

  // Recommender SHAPE only (hand-authored). temperature: conform | expand | bridge.
  connections: [
    { label: "Submariner 1680 ‘Red Sub’", temperature: "conform", why: "The first date Submariner — same patina culture, the natural next step from no-date.", match: { refs: ["1680"], brand: "rolex" } },
    { label: "Explorer 1016", temperature: "expand", why: "Same-era tool-watch purity and matte-dial collecting, minus the dive bezel.", match: { refs: ["1016"], brand: "rolex" } },
    { label: "GMT-Master 1675", temperature: "expand", why: "Same era and case family; trades the dive bezel for a travel one, with its own dial-mark depth.", match: { refs: ["1675"], brand: "rolex" } },
    { label: "Tudor Submariner 7016", temperature: "expand", why: "The same design DNA with less status gravity — and a route into military-issued Tudor.", match: { text: ["submariner"], brand: "tudor" } },
    { label: "Omega Seamaster 300 · 165.024", temperature: "bridge", why: "The same diver seriousness in a softer, engineering-led language.", match: { text: ["165.024", "165024"] } },
    { label: "Blancpain Fifty Fathoms", temperature: "bridge", why: "Where the dive watch began — military legitimacy, more romance, less ubiquity.", match: { text: ["fifty fathoms"], brand: "blancpain" } },
  ],

  books: [
    { title: "Oyster Perpetual Submariner: The Watch That Unlocked the Deep", author: "Nicholas Foulkes · Wallpaper*", url: "https://www.accartbooks.com/us/book/oyster-perpetual-submariner/" },
    { title: "Vintage Rolex Sports Models (4th Ed.)", author: "Martin Skeet & Nick Urul · Schiffer", url: "https://schifferbooks.com/products/vintage-rolex-sports-models-4th-edition" },
    { title: "The Vintage Rolex Field Manual", author: "Colin A. White · MorningTundra", url: "https://www.vrfm.io/" },
    { title: "100 Superlative Rolex Watches", author: "John Goldberger · Damiani", url: "https://www.johngoldbergerwatches.com/100superlativerolxwatches.htm" },
  ],

  scopeNote:
    "This page groups the civilian 5512 and 5513 — the no-date, crown-guard, acrylic-crystal Submariners studied together by most collectors. The military (5513/5517 MilSub), COMEX (5514), date (1680) and Sea-Dweller (1665) branches each carry enough separate collector logic to become their own pages. Production-year ranges are approximate — sources disagree on exact endpoints — and film/auction associations are cultural context, not authentication.",
};

export default node;
