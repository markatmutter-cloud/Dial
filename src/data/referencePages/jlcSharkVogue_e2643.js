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
    "Late-1960s steel chronograph with interchangeable bezels: Shark Deep Sea in the US, Vogue Chronograph in Europe · c. 1968–early 1970s",

  // "What the shorthand misses" — hand-authored editorial evidence blocks
  // (no synthesisNode on this Route-B page, so these ARE the Evidence section).
  shorthandTitle: "A short run under two names",
  shorthand: [
    {
      body: "The E2643 is best understood through its two market names. In the US, it was the Shark Deep Sea and is usually found with a LeCoultre dial. In Europe, it was the Vogue Chronograph and is usually signed Jaeger-LeCoultre. Both are correct when the rest of the watch supports the same market story.",
    },
    {
      body: "Exact production numbers are not established in the sources reviewed. What can be said more safely is that the model appears to have had a short commercial life. It arrived around 1968, entered a crowded sport-chronograph market, and seems to have been phased out after only a few years. Scarcity today should be described as observed market scarcity, not as a confirmed production total.",
    },
    {
      body: "The movement should also be described carefully. The E2643 is part of the Valjoux 72 family of manually wound column-wheel chronographs, with sources citing Valjoux 72, Valjoux 726 and JLC calibre 13 VZH depending on example and period. No example should be called simply 'a Valjoux 72' without qualification.",
    },
    {
      body: "The bezels define the reference. The catalogued concept centres on interchangeable bezels for diving, telemeter and world-time use. A non-standard bezel is not automatically wrong, but it should prompt closer checking. Extra-complication examples with added GMT hands, triple-date layouts or other non-catalogued features should be treated with caution.",
    },
  ],

  marksIntro:
    "How to read an E2643: the dial, bezels, signature, movement and case details that define the reference.",
  storiesIntro: "Three pieces that explain the E2643 beyond the spec sheet: the collector deep dive, the brand framing, and the market-history snapshot.",

  hero: {
    img: "https://mentawatches.com/wp-content/uploads/2023/04/DSC09842-Edit-scaled-1.jpg",
    credit: "Menta Watches",
    creditUrl: "https://mentawatches.com/product/lecoultre-full-set-e2643-shark-chronograph/",
  },

  modelIntro:
    "The E2643 is Jaeger-LeCoultre's late-1960s sports chronograph: a large steel case, a manually wound Valjoux-based chronograph movement, a reverse-panda dial, and a system of interchangeable bezels that let the same watch read as a diver, telemeter chronograph, or world-time travel watch.",

  story: [
    "It was sold under two period names. In the United States it was the Shark Deep Sea, usually signed LeCoultre. In Europe it was the Vogue Chronograph, usually signed Jaeger-LeCoultre. Neither version outranks the other. The useful question is whether the dial, movement, case and paperwork tell one coherent market story.",
    "The bezel system is the point of the watch. Fit the 60-minute bezel and it becomes a dive chronograph. Fit the telemeter bezel and it becomes a distance-timing instrument. Fit the world-time bezel and it becomes a travel watch. That flexibility is what separates the E2643 from more familiar late-1960s chronographs.",
    "The case gives it presence: around 40mm, thick angular lugs, pump pushers, broad bevels and a slightly muscular stance. It sits in the same broad sport-chronograph moment as the Heuer Autavia, Rolex Daytona, Omega Speedmaster, Breitling Co-Pilot and Zenith A277, but with a more eccentric JLC identity.",
  ],

  // Annotated guides — description paired with the source card. readThisFor = the quick tag.
  guides: [
    {
      title: "A View on the JLC Vintage Diving Chronograph: “The Shark”",
      publication: "WatchProSite",
      url: "https://www.watchprosite.com/jaeger-lecoultre/a-view-on-the-jaeger-lecoultre-vintage-diving-chronograph-the-shark-/2.745943.4926288/",
      img: "",
      blurb: "The single richest source on the reference. It pins the specs (~40mm, ~13mm thick, 120m water resistance, the Valjoux R72 / JLC Cal. 13 VZH column-wheel movement), documents the three catalogued bezels (world-time, diving, 24-hour), traces the crown design to the Polaris, and flags extra-complication examples (added GMT, triple-date, 24-hour) that should be treated with caution. Treat it as collector commentary, but it is the deepest map there is.",
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
    { name: "Reverse-panda dial", short: "Black dial, light registers and inner tachymeter scale. Most examples are reverse-panda; all-black dials are much rarer.", body: "The standard and most recognisable look: a black base with light sub-dials, tritium plots, and an inner tachymeter scale. JLC's own Collectibles description calls it a reverse-panda grained black dial with luminescent markers. Once you've seen a few, the proportions of the registers and the printing become your first read on originality.", img: "https://img.jaeger-lecoultre.com/open-graph-boxed-image-1/o-dpr-2/393de4b6e011966047ef647ea7bd8ce590229ea7.jpg", url: "https://www.jaeger-lecoultre.com/us-en/watches/collectibles/qve26431", source: "Jaeger-LeCoultre" },
    { name: "Interchangeable bezels", short: "Diving, telemeter and world-time bezels are the heart of the reference. Complete sets with spare bezels change the story.", body: "The defining feature. Catalogues describe three: a 60-minute / diving bezel, a telemeter bezel, and a world-time / 24-hour bezel. The watch was meant to change job by swapping the top. Complete sets with the original box and spare bezels are the ones collectors chase. WatchProSite flags a white 24-hour bezel as suspect, so treat unusual bezels with care.", img: "https://dist.phillips.com/auction-assets/HK080121/150931_001.jpg?fit=cover&optimize=medium&width=1302", url: "https://www.phillips.com/detail/jaegerlecoultre/150931", source: "Phillips" },
    { name: "LeCoultre vs Jaeger-LeCoultre", short: "LeCoultre usually points to the US market; Jaeger-LeCoultre to Europe. Either can be correct.", body: "A strong market tell, not a complete authentication rule: LeCoultre-signed dials generally indicate US-market watches, Jaeger-LeCoultre signatures point to European examples. The same reference under two names. Use it as a clue, then corroborate with the movement, case and any archive extract.", img: "https://dist.phillips.com/auction-assets/CH080117/97_001.jpg?fit=cover&optimize=medium&width=1302", url: "https://www.phillips.com/detail/JAEGER-LECOULTRE/CH080117/97", source: "Phillips" },
    { name: "Valjoux 72 / 726 / Cal. 13 VZH", short: "Different sources use different calibre names within the same Valjoux column-wheel chronograph family. Check the specific example.", body: "Listings cite the calibre differently and it confuses people. The manual chronograph is most often called Valjoux 72; later examples are listed as the upgraded 21,600 a/h cal. 726; and JLC's own designation is Cal. 13 VZH (Valjoux R72). They describe the same column-wheel family, so a blanket “it's always a Valjoux 72” is too narrow.", img: "https://dist.phillips.com/auction-assets/HK080624/206799_001.jpg?fit=cover&optimize=medium&width=1302", url: "https://www.phillips.com/detail/jaegerlecoultre/206799", source: "Phillips" },
    { name: "Case and lugs", short: "Around 40mm, thick angular lugs, pump pushers and broad bevels. The case carries much of the watch's character, so soft polishing matters.", body: "Around 40mm (some describe 40.5mm), ~13mm thick, 20mm lugs, with broad bevels and pump pushers. WatchProSite notes the lug geometry is shared with the civilian Breguet Type XX of the era. The case is most of the watch's presence, so check the lugs and bevels haven't been polished soft.", img: "https://falco-watches.com/cdn/shop/files/LECOULTRE_SHARK_CHRONOGRAPHE2643VALJOUX72.jpg", url: "https://falco-watches.com/products/lecoultre-shark-chronograph-e2643-valjoux-72", source: "Falco Watches" },
  ],

  // Notable examples worth seeing. Image strip.
  variants: [
    { name: "World-time full set", traits: "The complete concept: box, world-time bezel and spare bezels.", img: "https://mentawatches.com/wp-content/uploads/2023/04/DSC09884-Edit-scaled-1.jpg", url: "https://mentawatches.com/product/lecoultre-full-set-e2643-shark-chronograph/", source: "Menta Watches" },
    { name: "Rare all-black dial", traits: "Black sub-dials rather than reverse-panda registers. Phillips notes this as the rarer configuration.", img: "https://dist.phillips.com/auction-assets/CH080117/97_001.jpg?fit=cover&optimize=medium&width=1302", url: "https://www.phillips.com/detail/JAEGER-LECOULTRE/CH080117/97", source: "Phillips" },
    { name: "“Great White Shark”", traits: "Unusual white 24-hour bezel; rare and possibly prototype-adjacent rather than a standard variant.", img: "https://dist.phillips.com/auction-assets/HK080120/921_001.jpg?fit=cover&optimize=medium&width=1302", url: "https://www.phillips.com/detail/jaegerlecoultre/134486", source: "Phillips" },
    { name: "LeCoultre US-market example", traits: "LeCoultre-signed reverse-panda example, useful for understanding the US-market Shark identity.", img: "https://falco-watches.com/cdn/shop/files/LECOULTRE_SHARK_CHRONOGRAPHE2643VALJOUX72.jpg", url: "https://falco-watches.com/products/lecoultre-shark-chronograph-e2643-valjoux-72", source: "Falco Watches" },
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
    { label: "Heuer Autavia", distance: "similar", why: "The closest cousin in feel: 1960s rotating-bezel sport chronograph, Valjoux logic, tool-watch presence.", match: { brand: "heuer", text: ["autavia"] } },
    { label: "Zenith A277", distance: "similar", why: "A strong chronograph-diver bridge: military feel, rotating bezel, and a similar late-1960s purposefulness.", match: { brand: "zenith", refs: ["a277"], text: ["a 277"] } },
    { label: "Nivada Chronomaster", distance: "similar", why: "Another multi-role chronograph: part diver, part racing chrono, part general-purpose tool watch.", match: { brand: "nivada", text: ["chronomaster"] } },
    { label: "Gallet Multichron", distance: "similar", why: "Aviation history and some of the best-made chronographs that rarely get discussed. Gallet rewards reading.", match: { brand: "gallet", text: ["multichron"] } },
    { label: "Omega Speedmaster", distance: "adjacent", why: "The defining tool chronograph of the same era, and the standard the rest of the category is read against.", match: { brand: "omega", text: ["speedmaster"] } },
    { label: "Universal Genève Compax", distance: "adjacent", why: "Moves toward elegance without losing the chronograph appeal: mid-century proportion with the same mechanical heart.", match: { brand: "universal", text: ["compax"] } },
    { label: "Breitling Co-Pilot", distance: "adjacent", why: "The tool chronograph from another culture: aviation rather than diving, with the same instrument-first conviction.", match: { brand: "breitling", text: ["co-pilot", "co pilot", "copilot"] } },
    { label: "Rolex GMT-Master 1675", distance: "edge", why: "Same period, different route into the travel-tool idea. Useful if the world-time bezel is what catches you.", match: { brand: "rolex", refs: ["1675"] } },
    { label: "Omega Railmaster", distance: "edge", why: "Tool-watch scholarship without a single sub-dial: the test of whether it's the era's purposefulness you love.", match: { brand: "omega", text: ["railmaster"] } },
    { label: "Movado Sub-Sea chronographs", distance: "edge", why: "The same dive-chronograph category with its own distinctive period design.", match: { brand: "movado", text: ["sub-sea", "sub sea", "subsea"] } },
    { label: "JLC Memovox Polaris E859", distance: "edge", why: "JLC's own diving lineage: the internal family the Shark's gridded crown nods straight back to.", match: { brand: "jaeger", text: ["polaris"] } },
  ],

  // Cultural / reference pieces — the lower editorial tier.
  storiesAndImages: [
    { title: "A View on the Shark: the deep collector dive", blurb: "The richest single read on the E2643: bezel types, case details, crown lineage, movement naming and the extra-complication watches to be wary of.", publication: "WatchProSite", url: "https://www.watchprosite.com/jaeger-lecoultre/a-view-on-the-jaeger-lecoultre-vintage-diving-chronograph-the-shark-/2.745943.4926288/", img: "" },
    { title: "Deep Sea Shark, in JLC's own Collectibles programme", blurb: "The official anchor for the reference: reverse-panda dial, interchangeable bezels and the brand\'s own framing of the Deep Sea Shark.", publication: "Jaeger-LeCoultre", url: "https://www.jaeger-lecoultre.com/us-en/watches/collectibles/qve26431", img: "https://img.jaeger-lecoultre.com/open-graph-boxed-image-1/o-dpr-2/393de4b6e011966047ef647ea7bd8ce590229ea7.jpg" },
    { title: "1968 Jaeger-LeCoultre E2643: the short version", blurb: "The concise version: a late-1960s answer to the sport-chronograph boom that never became a commercial hit, which helps explain why correct examples feel scarce now.", publication: "Timeline.watch", url: "https://www.timeline.watch/watch/1968-jaeger-lecoultre-e-2643/", img: "https://www.timeline.watch/wp-content/uploads/2017/08/Jaeger-LeCoultre-E.2643.jpg" },
  ],

  scopeNote:
    "This page covers the E2643 across its two period names, Shark Deep Sea and Vogue Chronograph, and its known dial, bezel and movement variations. It is based on a verified research dossier and cross-checked against brand, auction, dealer and collector sources. Production-year ranges are approximate, exact production numbers are not established in the sources reviewed, and some extra-complication examples are debated or known to be incorrect. See Reference details and Sources for the evidence trail.",
};

export default node;
