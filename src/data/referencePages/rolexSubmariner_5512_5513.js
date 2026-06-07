// Reference page content node — Rolex Submariner 5512 / 5513.
//
// First anchor NODE of the Submariner reference graph (ROADMAP Epic 5). Pure
// CONTENT — ReferencePage renders it; live/auction/sold + connection examples
// pull from listings at render (matched on `market` / connection `match`).
//
// VOICE (BRAND.md + memory feedback_reference_voice_intrinsic): warm, narrative,
// "you"-voiced, generous. FOR collectors, ABOUT the watch. No hierarchy or
// diminishment ("starter"/"overshadowed"/"less status"); relationships LATERAL,
// not laddered; the collecting JOURNEY lives in coaching, not here. Intrinsic,
// not extrinsic. "Famous for X" ok. Every external link source-credited.
//
// Narrative model: `guides`/`marks` each pair a description with the article or
// example image it refers to — desktop renders them side by side, mobile stacks.

const node = {
  id: "rolex-submariner-5512-5513",
  // Pulls the LLM synthesis (public/reference_synthesis_<synthesisNode>.json) at
  // render — stories, conflicts, module candidates enrich the page from the
  // scraped+analyzed material. Human-review-gated (the digest is the review surface).
  synthesisNode: "submariner",
  // Which synthesis items this page shows: its own refs + model-wide context.
  // Branch-scoped items (sea-dweller/comex/milsub/1680/6538…) route to their own
  // future pages, not here. (Helium-valve = sea-dweller/comex → won't show.)
  synthesisScope: ["5512", "5513", "model-wide"],
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

  modelIntro:
    "The Submariner is Rolex's dive watch — introduced in 1953, waterproof by design, with a rotating bezel to time a descent and a high-contrast luminous dial built to be read underwater. It set the template the modern dive watch followed, and it remains the heart of Rolex's professional line alongside the GMT-Master, Explorer and Sea-Dweller.",

  story: [
    "This is the classic no-date Submariner: black dial, rotating bezel, acrylic crystal, crown guards, and just enough text to keep the whole thing balanced. Spend a little time with the reference, though, and you see how much the details move. Gilt dials give way to matte. Meters-first becomes feet-first. Crown guards change shape. Serifs appear and disappear. Maxi plots grow larger, and late glossy dials bring white-gold surrounds.",
    "That is what makes the 5512 and 5513 so good to study. They reward close looking without needing to be obscure. Between the two references you get the classic Submariner shape, decades of small production changes, and a whole collector language built around dials, cases, lume, bezels, service parts and condition.",
    "Use this page as a map. Read the guides, scan the auction records, compare current and sold examples, and let the reference pull you in. Time to start getting lost in it.",
  ],

  inItsTime:
    "It earned its reputation in use. Military divers wore issued 5513s; COMEX saturation teams took modified examples to working depths; Roger Moore's Bond strapped one over a dinner jacket in Live and Let Die. The same plain black dive watch crossed from the seabed to the wrist of anyone who wanted one watch that could go anywhere.",

  // Annotated guides — description paired with the article card. "readThisFor"
  // is the quick tag.
  guides: [
    {
      title: "Reference Points: Understanding the Submariner",
      publication: "Hodinkee",
      url: "https://www.hodinkee.com/articles/rolex-submariner-reference-points",
      img: "https://hodinkee.imgix.net/uploads/images/1563302712188-5qa2e3aif6n-25f8146ad2b53d1ddcbbf94525a11cce/overhead_hero.jpg?ixlib=rails-1.1.0&fm=jpg&q=55&auto=format&usm=12",
      blurb: "Start here for the full Submariner family tree before getting lost in the individual marks — the early no-crown-guard references, the move into crown guards, the 5512/5513 era, the 1680 Date, and the later shift away from the acrylic-crystal world. The value is breadth: it places the 5512 and 5513 in the middle of the story, not off on their own.",
      readThisFor: "the family tree and the historical arc",
    },
    {
      title: "What to Know About the Reference 5512",
      publication: "Wind Vintage · Charlie Dunne",
      url: "https://www.windvintage.com/blog/collectors-guide-rolex-submariner-reference-5512",
      img: "http://static1.squarespace.com/static/5b213f95506fbec9b54e014c/5b2151251ae6cf9251e877fa/65a9dd8c6b70aa73c276b77a/1768333484294/DSC06391.jpeg?format=1500w",
      blurb: "Gives the 5512 the focused attention it deserves. It's too often summarised as “the chronometer version,” which undersells it — early crown-guard cases, gilt dials, two- and four-line layouts, chronometer text, and the subtle differences between a good 5512 and a merely correct one.",
      readThisFor: "5512 case evolution and dial layouts",
    },
    {
      title: "5513 Matte Dial",
      publication: "Beaumont Miller II",
      url: "http://5513mattedial.com/",
      img: "",
      blurb: "Where you start learning to see a 5513 properly. Not a broad history — a dial study, which is exactly why it's useful. Meters-first, serif, non-serif, Maxi, pre-COMEX: spend time here and you start noticing what collectors actually talk about — typography, plot size, spacing, sequence, and how small dial changes reshape the whole watch.",
      readThisFor: "5513 dial marks and the visual language",
    },
    {
      title: "How to Buy a Vintage Submariner 5513",
      publication: "Hodinkee · Anthony Traina",
      url: "https://www.hodinkee.com/articles/a-collectors-guide-to-the-vintage-rolex-submariner-5513",
      img: "https://hodinkee.imgix.net/uploads/images/0c765145-8d35-4bc9-bdf3-a980fd655d60/5513-hero.jpg?ixlib=rails-1.1.0&fm=jpg&q=55&auto=format&usm=12&w=1200&h=630&fit=crop",
      blurb: "Brings the reference back to real watches — originality, condition, service parts, case quality, and the compromises that come with vintage Rolex. The 5513 isn't rare; the challenge isn't finding one, it's understanding what you're looking at. A replaced dial, later hands, polished case or attractive-but-incorrect combination changes the story completely.",
      readThisFor: "collecting context, condition and originality",
    },
  ],

  // Learn the marks — a paragraph each, paired with an example image where one
  // helps. Images baked from the Hairspring Finds / Bulang corpus.
  marks: [
    { name: "Gilt vs matte", body: "Early examples carry the warmth and depth of gilt-gloss dials; later watches move to matte dials with white printing. That shift alone changes the feel — gilt reads more delicate and old-world, matte more utilitarian and direct. Neither is better in the abstract; they belong to different chapters of the story.", img: "https://hairspring.com/cdn/shop/articles/Hero-184.jpg", url: "https://hairspring.com/blogs/finds/gilt-5513-rolex-submariner", source: "Hairspring Finds" },
    { name: "Meters-first vs feet-first", body: "Meters-first depth ratings are one of the classic vintage cues. The change to feet-first printing is subtle when you're new to the reference, but once you see it you never unsee it — and it becomes one of the quickest ways to place a dial in the broader sequence.", img: "https://hairspring.com/cdn/shop/articles/Hero-3062-scaled.jpg", url: "https://hairspring.com/blogs/finds/tropical-meters-first-5513-rolex-submariner", source: "Hairspring Finds" },
    { name: "Serif vs non-serif", body: "A small difference that changes the dial's personality, and a good example of how collectors build language around tiny variations almost no one else would notice. The four-line chronometer text of the 5512 is the other quick read — two lines means a 5513.", img: "https://hairspring.com/cdn/shop/articles/Hero-3801-scaled.jpg", url: "https://hairspring.com/blogs/finds/4-line-dial-pcg-5512-rolex-submariner", source: "Hairspring Finds" },
    { name: "Maxi dials, Mark I–V", body: "One of the most approachable rabbit holes in the 5513 world. Larger lume plots give the watch a stronger presence, and the Mk I–V distinctions give plenty to study — especially good if you want a vintage Submariner that still feels robust and wearable.", img: "https://bulangandsons.com/cdn/shop/articles/BS-Maxi-Mk1-Artuicle-21_19b1f52f-5b89-4187-86fe-8b93bcdd62a2.jpg?v=1756227529&width=1024", url: "https://bulangandsons.com/blogs/watch-talks/the-mk1-maxi-5513-rolex-submariner", source: "Bulang & Sons" },
    { name: "Late glossy dials & white-gold surrounds", body: "Later 5513s move into glossy dials with white-gold marker surrounds. They don't have the same matte-dial vintage feel, but they matter: this is the Submariner beginning to move toward its modern visual language — the same reference, a different atmosphere.", img: "", url: "", source: "" },
  ],

  // Notable examples worth seeing (the "marks" you'd point at). Image strip.
  variants: [
    { name: "“Bart Simpson” 5512", traits: "Stubby gilt coronet", img: "https://hairspring.com/cdn/shop/articles/Hero-1140-copy9-scaled.jpg", url: "https://hairspring.com/blogs/finds/bart-simpson-5512-rolex-submariner", source: "Hairspring Finds" },
    { name: "COMEX 5513", traits: "Issued professional-diving example", img: "https://hairspring.com/cdn/shop/articles/5513-Comex-11.jpg", url: "https://hairspring.com/blogs/finds/comex-5513-rolex-submariner", source: "Hairspring Finds" },
    { name: "Explorer-dial 5512", traits: "Rare 3-6-9 dial", img: "https://hairspring.com/cdn/shop/articles/Hero-3163-scaled.jpg", url: "https://hairspring.com/blogs/finds/explorer-dial-5512-rolex-submariner", source: "Hairspring Finds" },
  ],

  market: { refs: ["5512", "5513"], brand: "rolex" },

  // How to look — watch-outs as craft, not fear (Mark sample).
  howToLook: {
    intro: "Guides are useful, but real watches are where the learning sticks. Auction records, sold listings and current examples let you compare theory against actual watches — how dials age, how cases wear, how bezels fade, how sellers describe condition. When you look, pay attention to:",
    checks: [
      "whether the dial type makes sense for the serial range",
      "whether the hands and lume plots age consistently",
      "whether the case still has its shape, or has been polished soft",
      "whether the bezel insert belongs visually with the watch",
      "whether the bracelet is period-correct or later",
      "whether it's sold as original, restored, serviced or assembled",
      "whether the description tells you enough — or tells you too much, too confidently",
    ],
    outro: "The point isn't to become paranoid. It's to get better at looking.",
  },

  // The rabbit hole — lateral discovery, NOT a ladder.
  whereNext:
    "The 5512 and 5513 are anchor references. Once they start making sense, the rest of the map opens quickly — earlier to the big-crown era, sideways to the date, military and COMEX branches, later into the modern no-date line, or out to the wider dive-watch world.",
  // Buckets per Mark's collecting-arcs doc (2026-06-06 — see
  // docs/RECOMMENDER_STRATEGY.md "Reference-page connection buckets"):
  // the why-line explains the BRIDGE, not the resemblance.
  connections: [
    { label: "Explorer 1016", distance: "similar", why: "The most natural bridge there is: nothing unnecessary, pure function, timeless proportions — the same philosophy without the bezel.", match: { refs: ["1016"], brand: "rolex" } },
    { label: "Submariner 1680", distance: "similar", why: "The date Submariner, introduced alongside the no-date 5512/5513; the earliest carry the red “Submariner” text.", match: { refs: ["1680"], brand: "rolex" } },
    { label: "Blancpain Fifty Fathoms", distance: "similar", why: "The other founding military diver of 1953 — the same brief answered from a different lineage.", match: { text: ["fifty fathoms"], brand: "blancpain" } },
    { label: "Tudor Submariner", distance: "similar", why: "The same case and dive-watch architecture from the sibling brand — its own dials, snowflake hands and movements (7016 / 7021 / 9401).", match: { text: ["submariner"], brand: "tudor" } },
    { label: "Omega Seamaster 300 · 165.024", distance: "adjacent", why: "The same professional-diver job in a different idiom — broad-arrow hands, a fully graduated bezel, an in-house feel.", match: { text: ["165.024", "165024", "seamaster 300"], brand: "omega" } },
    { label: "JLC Memovox Polaris E859", distance: "adjacent", why: "A dive watch that timed the dive by sound — the alarm-diver answer to the bezel the Submariner standardised.", match: { text: ["polaris"], brand: "jaeger" } },
    { label: "Longines Legend Diver lineage", distance: "adjacent", why: "The internal-bezel compressor diver — the other major school of 1960s dive-case engineering.", match: { text: ["legend diver", "7042", "7150"], brand: "longines" } },
    { label: "GMT-Master 1675", distance: "adjacent", why: "Shares the crown-guard case; swaps the dive bezel for a 24-hour travel bezel, with its own deep dial-variant story.", match: { refs: ["1675"], brand: "rolex" } },
    { label: "Omega Railmaster", distance: "edge", why: "What if what you love is professional tools, not diving? The anti-magnetic field watch asks exactly that question.", match: { text: ["railmaster"], brand: "omega" } },
    { label: "Rolex Milgauss", distance: "edge", why: "The same question from inside Rolex — a scientist's instrument instead of a diver's, with the same engineering-led restraint.", match: { text: ["milgauss"], brand: "rolex" } },
    { label: "Cartier Tank", distance: "edge", why: "Not because it looks like a 5513 — because collectors drawn to timeless design, proportion and objects that outlive trends often end up appreciating both.", match: { text: ["tank"], brand: "cartier" } },
  ],

  // Cultural / visual pieces — the lower editorial tier.
  storiesAndImages: [
    { title: "History of the Submariner, Part 2 — the 55XX & 1680", publication: "Monochrome", url: "https://monochrome-watches.com/rolex-submariner-history-part-2-the-55xx-1680references/", img: "https://monochrome-watches.com/wp-content/uploads/2020/08/History-of-the-Rolex-Submariner-Part-2-The-55XX-and-1680-References.jpg" },
    { title: "Explaining the “Bart Simpson”", publication: "Hodinkee · Eric Wind", url: "https://www.hodinkee.com/articles/explaining-the-bart-simpson-rolex-submariner-erics-favorite", img: "https://hodinkee.imgix.net/uploads/article/hero_image/1463/1000w.jpg?ixlib=rails-1.1.0&fm=jpg&q=55&auto=format&usm=12&w=1200&h=630&fit=crop" },
    { title: "Steve McQueen at Le Mans, in a 5512", publication: "Rolex Magazine", url: "https://www.rolexmagazine.com/2015/11/steve-mcqueen-racing-at-le-mans-rolex.html", img: "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgbGIEEI6Q-WdPt7KTlc6JkIUcLczko-FqaigErt8fD1yJCEMCL-r-pMBxVFKrRbpxp6I-5Ya82mSQpQx0CxuHKANJlqB_dq5ZG7VCHrvCf820X3M0lbyTXBHYdpcdtdD7Guj3m9CgKssAB9ldohE6b9piV5mTQx_6694_5-msiqsYMIOsNx3mT80rTe17V/s3200/Steve%20McQueen%20Rolex%20Submariner%20and%20Persol%20Sunglasses.jpg" },
    { title: "A Royal Navy diver's issued 5513", publication: "Rolex Magazine", url: "https://www.rolexmagazine.com/2021/01/antiques-roadshow-royal-navy-divers.html", img: "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjB0fhVctG16xrrlCI3JEA07017AxE2jLFZDMe89mlVWXgpnlnFi1hphBuDuTbIqyEb1bceNgPnHSu1xh5uVAIhizijkejuoXbpaUKeJfjT1W4h_5GgOC914gQdf2CeGX1M4GtLpmBbgZY/s3200/royal-navy.jpg" },
    { title: "Teaming up with COMEX", publication: "Perezcope · Jose Pereztroika", url: "https://perezcope.com/2020/06/28/the-sea-dweller-chronicles-dry-run-and-teaming-up-with-comex/", img: "https://i0.wp.com/perezcope.com/wp-content/uploads/2020/06/200624-title-part-two-comex-janus-4-zoom.jpg?fit=1200%2C732&ssl=1" },
    { title: "Appreciating it as just a great dive watch", publication: "Fratello", url: "https://www.fratellowatches.com/can-we-appreciate-the-rolex-submariner-as-just-a-great-dive-watch/", img: "https://www.fratellowatches.com/cdn-cgi/image/anim=false/wp-content/uploads/2024/09/RolexResized-12.jpg" },
  ],

  books: [
    { title: "Oyster Perpetual Submariner: The Watch That Unlocked the Deep", author: "Nicholas Foulkes · Wallpaper*", url: "https://www.accartbooks.com/us/book/oyster-perpetual-submariner/", note: "The Rolex-authorized story — strongest on the broader cultural and historical framing." },
    { title: "100 Superlative Rolex Watches", author: "John Goldberger · Damiani", url: "https://www.johngoldbergerwatches.com/100superlativerolxwatches.htm", note: "Closer to the collector's bookshelf than a buying guide — important examples, photography, watches as objects." },
    { title: "Vintage Rolex Sports Models", author: "Martin Skeet & Nick Urul · Schiffer", url: "https://schifferbooks.com/products/vintage-rolex-sports-models-4th-edition", note: "The 5512/5513 make more sense seen alongside the other four-digit sports models." },
    { title: "The Vintage Rolex Field Manual", author: "Colin A. White · MorningTundra", url: "https://www.vrfm.io/", note: "Practical reference for learning the details and avoiding the obvious mistakes." },
  ],

  scopeNote:
    "This page groups the civilian 5512 and 5513 — the no-date, crown-guard, acrylic-crystal Submariners studied together. The military (5513/5517 MilSub), COMEX (5514), date (1680) and Sea-Dweller (1665) lines each get their own page. Production-year ranges are approximate — sources disagree on exact endpoints — and film/auction associations are cultural context, not authentication.",
};

export default node;
