// Reference page content node — Jaeger-LeCoultre / LeCoultre "Shark Deep Sea"
// (US) · "Vogue Chronograph" (Europe), ref E2643.
//
// The FIRST verified, source-authored reference node built from a researched
// dossier rather than the scrape→synthesis pipeline (Route B). Content is hand
// -authored from a verified research doc (docs/reference_research/
// jlc_shark_vogue_e2643.md) cross-checked against dealer/auction/forum sources
// (Phillips, A Collected Man, Menta, Falco, Oliver & Clarke, WatchProSite,
// WristReview, Timeline.watch). No synthesisNode — every claim here is
// source-credited inline; the moat is that it's authored + verified, not scraped.
//
// VOICE (BRAND.md + memory feedback_reference_voice_intrinsic): warm, narrative,
// "you"-voiced, generous. FOR collectors, ABOUT the watch. No hierarchy or
// diminishment; relationships LATERAL, not laddered. Every external link credited.
// NO EM-DASHES in rendered strings (Mark 2026-06-06): colons, commas, periods,
// parens instead. En-dashes in numeric ranges are fine. Comments are exempt.
//
// Narrative model: guides/marks each pair a description with the article or
// example image it refers to — desktop renders them side by side, mobile stacks.

const node = {
  id: "jlc-shark-vogue-e2643",
  brand: "Jaeger-LeCoultre",
  modelLine: "Shark / Vogue Chronograph",
  refs: ["E2643"],
  group: "E2643",
  definer:
    "Late-1960s steel chronograph with swappable bezels: “Shark Deep Sea” in the US, “Vogue” in Europe · c. 1968–1971",

  // "What the shorthand misses" — hand-authored editorial evidence blocks
  // (no synthesisNode on this Route-B page, so these ARE the Evidence section).
  shorthand: [
    {
      heading: "Two names, one watch",
      body: "Shark Deep Sea and Vogue Chronograph are not different models. They are the US and European trade names for the same E2643, and the dial signature usually follows: LeCoultre for the US, Jaeger-LeCoultre for Europe. Neither name nor signature outranks the other; the question is whether the whole watch tells one market story.",
      sourcePosition: "Phillips lot essays document the naming split; WatchProSite and dealer write-ups use the names interchangeably.",
    },
    {
      heading: "Production numbers aren't established",
      body: "Unlike references with archive tables, the E2643's exact production run isn't documented in the sources reviewed. The shorthand is a short run, roughly 1968 to 1971, ended by weak commercial performance. Scarcity today is inferred from how rarely correct examples surface, not from a known figure.",
      sourcePosition: "Timeline.watch frames the short unsuccessful run; no reviewed source publishes a production count.",
    },
    {
      heading: "One movement, three names",
      body: "Valjoux 72, calibre 726 and JLC's Cal. 13 VZH all describe the same column-wheel family at different moments. Listings citing different calibres are not necessarily describing different watches, and a blanket 'it's always a Valjoux 72' is too narrow for later examples.",
      sourcePosition: "WatchProSite pins the family; Phillips lots list both 72 and 726 across examples.",
    },
    {
      heading: "The bezels are the identity, and the trap",
      body: "Three bezels were catalogued: diving, telemeter, and world-time. Swapping them was the point, so an unusual bezel isn't automatically wrong, but it is automatically a question. The known fake pattern runs the other way: added complications (GMT hands, triple-date) that no catalogued E2643 carried.",
      sourcePosition: "Phillips catalogues the three bezels; WatchProSite flags the white 24-hour bezel as suspect and the extra-complication fakes.",
    },
  ],

  hero: {
    img: "https://mentawatches.com/wp-content/uploads/2023/04/DSC09842-Edit-scaled-1.jpg",
    credit: "Menta Watches",
    creditUrl: "https://mentawatches.com/product/lecoultre-full-set-e2643-shark-chronograph/",
  },

  modelIntro:
    "The E2643 is Jaeger-LeCoultre's late-1960s sports chronograph: a large steel case, a manually wound Valjoux-based chronograph movement, a reverse-panda dial, and a system of interchangeable bezels that let one watch read as a diver, a telemeter chronograph, or a world-time travel watch. It was sold as the “Shark Deep Sea” in the United States and the “Vogue Chronograph” in Europe, and the dial signature usually follows that split: LeCoultre on US-market watches, Jaeger-LeCoultre on European ones.",

  story: [
    "This is one of the more characterful sports chronographs of the late 1960s, and part of the fun is that it refuses to sit in a single category. Fit the 60-minute bezel and it's a dive chronograph. Fit the telemeter bezel and it's a tool for timing things you see and hear. Fit the world-time bezel and it becomes a travel watch. The same watch, three different identities, which is exactly the idea Jaeger-LeCoultre built it around.",
    "The case is where the appeal starts. Auction houses and dealers consistently describe it as big for the period, with thick, angular lugs and a strong, slightly macho stance: around 40mm, roughly 13mm thick, with broad bevels and pump pushers. The reverse-panda dial keeps it legible, the inner tachymeter scale adds instrument flavour, and the rotating bezel does the heavy lifting on identity. WatchProSite even traces the gridded crown back to JLC's own Polaris.",
    "Use this page as a map. The naming split, the bezel system, the Valjoux 72 / 726 movement family, the reverse-panda and rare all-black dials. Read the sources, compare the auction records, and let the reference pull you in. It's a watch that rewards looking closely.",
  ],

  inItsTime:
    "JLC built the E2643 as a deliberate answer to a booming sport-chronograph market, in the years when Heuer, Rolex, Omega and Breitling were all fighting for the wrist of anyone who wanted a tool chronograph. Timeline.watch frames it as a response that never found big commercial success and was phased out after only a few years, which is part of why correct examples are scarce today. It sits at the crossroads of the dive watch, the travel watch and the Valjoux-72 chronograph world: a true bridge reference.",

  // Annotated guides — description paired with the source card. readThisFor = the quick tag.
  guides: [
    {
      title: "A View on the JLC Vintage Diving Chronograph: “The Shark”",
      publication: "WatchProSite",
      url: "https://www.watchprosite.com/jaeger-lecoultre/a-view-on-the-jaeger-lecoultre-vintage-diving-chronograph-the-shark-/2.745943.4926288/",
      img: "",
      blurb: "The single richest source on the reference. It pins the specs (~40mm, ~13mm thick, 120m water resistance, the Valjoux R72 / JLC Cal. 13 VZH column-wheel movement), documents the three catalogued bezels (world-time, diving, 24-hour), traces the crown design to the Polaris, and crucially flags the fakes: “extra-complication” LeCoultre chronographs (added GMT, triple-date, 24-hour) that aren't original. Treat it as collector commentary, but it's the deepest map there is.",
      readThisFor: "the deep technical picture and the authenticity watch-outs",
    },
    {
      title: "LeCoultre Deep Sea Shark E2643",
      publication: "A Collected Man",
      url: "https://www.acollectedman.com/products/buy-lecoultre-deep-sea-shark-e2643-watch",
      img: "https://www.acollectedman.com/cdn/shop/products/Jaeger-LeCoultre_Shark_Deep_Sea_E2643_vintage_watch_at_A_Collected_Man22_2c03adae-9cfe-4595-865f-bfa4e0e31001.jpg",
      blurb: "A dealer write-up with a strong image set: dial, crown, case, caseback, movement, wrist. Good for learning what a clean, correct example actually looks like up close, and for the case-and-condition language collectors use around this reference.",
      readThisFor: "high-quality images and condition language",
    },
    {
      title: "Geneva Watch Auction FIVE, Lot 97: the rare all-black dial",
      publication: "Phillips",
      url: "https://www.phillips.com/detail/JAEGER-LECOULTRE/CH080117/97",
      img: "https://dist.phillips.com/auction-assets/CH080117/97_001.jpg?fit=cover&optimize=medium&width=1302",
      blurb: "The auction lot that documents the naming split (Shark Deep Sea / Vogue), the LeCoultre US-market explanation, and the unusual all-black-dial variant, which Phillips explicitly calls out as rarer than the standard reverse-panda. A good anchor for how the auction world catalogues the model.",
      readThisFor: "the naming split and the rare all-black dial",
    },
    {
      title: "Friday Afternoon Find: A 1960s JLC Diving Chronograph Worldtime",
      publication: "Hodinkee",
      url: "https://www.hodinkee.com/articles/friday-afternoon-find-a-1960s-jaeger-lecoultre-diving-chrono",
      img: "https://hodinkee.imgix.net/uploads/article/hero_image/1560/1000w.jpg?ixlib=rails-1.1.0&fm=jpg&q=55&auto=format&usm=12&w=1200&h=630&fit=crop",
      blurb: "A 2011 snapshot that's useful precisely because it's old: it shows the world-time-bezel Shark when it was still a sub-$5k curiosity, a reminder of how far appreciation for the reference has travelled. Light on specs, strong on context.",
      readThisFor: "historical market context",
    },
  ],

  // Learn the marks — a paragraph each.
  marks: [
    { name: "Reverse-panda dial", body: "The standard and most recognisable look: a black base with light sub-dials, tritium plots, and an inner tachymeter scale. JLC's own Collectibles description calls it a reverse-panda grained black dial with luminescent markers. Once you've seen a few, the proportions of the registers and the printing become your first read on originality.", img: "https://img.jaeger-lecoultre.com/open-graph-boxed-image-1/o-dpr-2/393de4b6e011966047ef647ea7bd8ce590229ea7.jpg", url: "https://www.jaeger-lecoultre.com/us-en/watches/collectibles/qve26431", source: "Jaeger-LeCoultre" },
    { name: "The interchangeable bezels", body: "The defining feature. Catalogues describe three: a 60-minute / diving bezel, a telemeter bezel, and a world-time / 24-hour bezel. The watch was meant to change job by swapping the top. Complete sets with the original box and spare bezels are the ones collectors chase. WatchProSite flags a white 24-hour bezel as suspect, so treat unusual bezels with care.", img: "https://dist.phillips.com/auction-assets/HK080121/150931_001.jpg?fit=cover&optimize=medium&width=1302", url: "https://www.phillips.com/detail/jaegerlecoultre/150931", source: "Phillips" },
    { name: "LeCoultre vs Jaeger-LeCoultre signature", body: "A strong market tell, not a complete authentication rule: LeCoultre-signed dials generally indicate US-market watches, Jaeger-LeCoultre signatures point to European examples. The same reference under two names. Use it as a clue, then corroborate with the movement, case and any archive extract.", img: "https://dist.phillips.com/auction-assets/CH080117/97_001.jpg?fit=cover&optimize=medium&width=1302", url: "https://www.phillips.com/detail/JAEGER-LECOULTRE/CH080117/97", source: "Phillips" },
    { name: "Valjoux 72 · 726 · Cal. 13 VZH: one movement, three names", body: "Listings cite the calibre differently and it confuses people. The manual chronograph is most often called Valjoux 72; later examples are listed as the upgraded 21,600 a/h cal. 726; and JLC's own designation is Cal. 13 VZH (Valjoux R72). They describe the same column-wheel family, so a blanket “it's always a Valjoux 72” is too narrow.", img: "https://dist.phillips.com/auction-assets/HK080624/206799_001.jpg?fit=cover&optimize=medium&width=1302", url: "https://www.phillips.com/detail/jaegerlecoultre/206799", source: "Phillips" },
    { name: "Big, angular case with Type-XX-adjacent lugs", body: "Around 40mm (some describe 40.5mm), ~13mm thick, 20mm lugs, with broad bevels and pump pushers. WatchProSite notes the lug geometry is shared with the civilian Breguet Type XX of the era. The case is most of the watch's presence, so check the lugs and bevels haven't been polished soft.", img: "https://falco-watches.com/cdn/shop/files/LECOULTRE_SHARK_CHRONOGRAPHE2643VALJOUX72.jpg", url: "https://falco-watches.com/products/lecoultre-shark-chronograph-e2643-valjoux-72", source: "Falco Watches" },
  ],

  // Notable examples worth seeing. Image strip.
  variants: [
    { name: "World-time full set", traits: "Box + spare bezels, the complete concept", img: "https://mentawatches.com/wp-content/uploads/2023/04/DSC09884-Edit-scaled-1.jpg", url: "https://mentawatches.com/product/lecoultre-full-set-e2643-shark-chronograph/", source: "Menta Watches" },
    { name: "Rare all-black dial", traits: "Black sub-dials; Phillips notes most are reverse-panda", img: "https://dist.phillips.com/auction-assets/CH080117/97_001.jpg?fit=cover&optimize=medium&width=1302", url: "https://www.phillips.com/detail/JAEGER-LECOULTRE/CH080117/97", source: "Phillips" },
    { name: "“Great White Shark”", traits: "Unusual white 24-hour bezel, possible US prototype", img: "https://dist.phillips.com/auction-assets/HK080120/921_001.jpg?fit=cover&optimize=medium&width=1302", url: "https://www.phillips.com/detail/jaegerlecoultre/134486", source: "Phillips" },
    { name: "LeCoultre US-market example", traits: "Reverse-panda, LeCoultre-signed, telemeter bezel", img: "https://falco-watches.com/cdn/shop/files/LECOULTRE_SHARK_CHRONOGRAPHE2643VALJOUX72.jpg", url: "https://falco-watches.com/products/lecoultre-shark-chronograph-e2643-valjoux-72", source: "Falco Watches" },
  ],

  market: { refs: ["e2643"], text: ["e 2643", "shark deep sea", "vogue chronograph"] },

  // How to look — watch-outs as craft, not fear (built from the research dossier
  // + WatchProSite's authenticity caveats).
  howToLook: {
    intro: "Correct E2643s are scarce and the reference attracts both honest variation and outright fakes, so real examples are where the learning sticks. When you look, pay attention to:",
    checks: [
      "whether the dial is signed LeCoultre or Jaeger-LeCoultre, and whether that fits the rest of the story",
      "which bezel is fitted, and whether any spare bezels come with it",
      "whether the movement is a Valjoux 72 / 726 (Cal. 13 VZH), and matches the case and dial",
      "whether the big angular case still has its bevels, or has been polished soft",
      "whether the tritium plots and hands have aged together",
      "any “extra” complication (GMT, triple-date, 24-hour hand): WatchProSite flags these as a known fake pattern",
      "completeness: original box, spare bezels, guarantee and archive extract all matter here",
    ],
    outro: "The point isn't paranoia. It's learning to tell an honest Shark from a dressed-up one.",
  },

  // The rabbit hole — lateral discovery. These are the bridge references from the
  // research dossier (Close → similar, Alternative → adjacent, Edge → edge).
  whereNext:
    "The E2643 is a bridge watch by design, so it opens in several directions at once: sideways into the Valjoux-72 chronograph universe, across to other 1960s dive and travel tool watches, and inward to JLC's own diving lineage.",
  // Buckets per Mark's collecting-arcs doc (2026-06-06 — see
  // docs/RECOMMENDER_STRATEGY.md "Reference-page connection buckets"):
  // the why-line explains the BRIDGE, not the resemblance.
  connections: [
    { label: "Heuer Autavia", distance: "similar", why: "Almost mandatory: shared Valjoux-powered, rotating-bezel, 1960s tool-chronograph logic. The closest cousin in feel.", match: { brand: "heuer", text: ["autavia"] } },
    { label: "Zenith A277", distance: "similar", why: "One of the great bridge watches in vintage collecting. It leads toward chronographs, divers and military aesthetics all at once.", match: { brand: "zenith", refs: ["a277"], text: ["a 277"] } },
    { label: "Nivada Chronomaster", distance: "similar", why: "A cult chronograph that reads as part Speedmaster, part diver, part racing chrono. The closest thing the Shark has to a sibling outside JLC.", match: { brand: "nivada", text: ["chronomaster"] } },
    { label: "Gallet Multichron", distance: "similar", why: "Aviation history and some of the best-made chronographs that rarely get discussed. Gallet rewards reading.", match: { brand: "gallet", text: ["multichron"] } },
    { label: "Omega Speedmaster", distance: "adjacent", why: "The defining tool chronograph of the same era, and the standard the rest of the category is read against.", match: { brand: "omega", text: ["speedmaster"] } },
    { label: "Universal Genève Compax", distance: "adjacent", why: "Moves toward elegance without losing the chronograph appeal: mid-century proportion with the same mechanical heart.", match: { brand: "universal", text: ["compax"] } },
    { label: "Breitling Co-Pilot", distance: "adjacent", why: "The tool chronograph from another culture: aviation rather than diving, with the same instrument-first conviction.", match: { brand: "breitling", text: ["co-pilot", "co pilot", "copilot"] } },
    { label: "Rolex GMT-Master 1675", distance: "edge", why: "Same period, different complication, for when the pull turns out to be 1960s tool watches rather than chronographs specifically.", match: { brand: "rolex", refs: ["1675"] } },
    { label: "Omega Railmaster", distance: "edge", why: "Tool-watch scholarship without a single sub-dial: the test of whether it's the era's purposefulness you love.", match: { brand: "omega", text: ["railmaster"] } },
    { label: "Patek Philippe Calatrava", distance: "edge", why: "Sooner or later most chronograph collectors develop an eye for proportion and restraint. The Calatrava is usually where it leads.", match: { brand: "patek", text: ["calatrava"] } },
    { label: "JLC Memovox Polaris E859", distance: "edge", why: "JLC's own diving lineage: the internal family the Shark's gridded crown nods straight back to.", match: { brand: "jaeger", text: ["polaris"] } },
  ],

  // Cultural / reference pieces — the lower editorial tier.
  storiesAndImages: [
    { title: "A View on the Shark: the deep collector dive", publication: "WatchProSite", url: "https://www.watchprosite.com/jaeger-lecoultre/a-view-on-the-jaeger-lecoultre-vintage-diving-chronograph-the-shark-/2.745943.4926288/", img: "" },
    { title: "Deep Sea Shark, in JLC's own Collectibles programme", publication: "Jaeger-LeCoultre", url: "https://www.jaeger-lecoultre.com/us-en/watches/collectibles/qve26431", img: "https://img.jaeger-lecoultre.com/open-graph-boxed-image-1/o-dpr-2/393de4b6e011966047ef647ea7bd8ce590229ea7.jpg" },
    { title: "1968 Jaeger-LeCoultre E2643: the short version", publication: "Timeline.watch", url: "https://www.timeline.watch/watch/1968-jaeger-lecoultre-e-2643/", img: "https://www.timeline.watch/wp-content/uploads/2017/08/Jaeger-LeCoultre-E.2643.jpg" },
  ],

  scopeNote:
    "This page covers the E2643 across its two period names (Shark Deep Sea / Vogue Chronograph) and its dial, bezel and movement variations. It's authored from a verified research dossier and cross-checked against dealer, auction and forum sources; every claim is source-credited inline. Production-year ranges are approximate (sources disagree on exact endpoints), some bezel and “extra-complication” variants are debated or known fakes (see How to look), and exact production numbers aren't established in the sources reviewed.",
};

export default node;
