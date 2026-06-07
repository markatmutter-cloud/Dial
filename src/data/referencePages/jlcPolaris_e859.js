// Reference page content node — Jaeger-LeCoultre / LeCoultre Memovox Polaris,
// ref E859 (anchor), with the modern Polaris collection (2018–) as the line's
// living continuation.
//
// HYBRID build (Route A + B): authored from Mark's verified research dossier
// (docs/reference_research/jlc_polaris_e859_source_research.md) PLUS the Opus
// synthesis over a 36-source curated corpus (reference_sources/jlc-polaris.json
// → public/reference_synthesis_jlc-polaris.json — linked below via
// synthesisNode, which feeds the stories/debates sections at render time).
// Phillips lot facts come via the dossier (their lot pages are link-only in the
// corpus — Phillips WAF blocks CI fetches; see CLAUDE.md scraper conventions).
//
// VOICE (BRAND.md + memory feedback_reference_voice_intrinsic): warm, narrative,
// "you"-voiced, generous. FOR collectors, ABOUT the watch. No hierarchy or
// diminishment; relationships LATERAL, not laddered. Every external link credited.

const node = {
  id: "jlc-polaris-e859",
  brand: "Jaeger-LeCoultre",
  modelLine: "Polaris",
  refs: ["E859"],
  group: "E859",
  definer:
    "Automatic alarm diver · 42mm EPSA compressor case · calibre 825/K825 · internal bezel · 16-hole resonance caseback · c. 1,714 production examples, 1965–1970 · relaunched as a collection in 2018",

  synthesisNode: "jlc-polaris",
  synthesisScope: ["E859", "E857", "E870", "190.8.96", "Q9008470", "Q9008170", "Q9038670", "Q9028471", "Q9068670", "Q9028180", "model-wide", "dive-watch-context"],

  hero: {
    img: "https://hodinkee.imgix.net/uploads/article/hero_image/2150/JLCPolaris1968_13.jpg?ixlib=rails-1.1.0&fm=jpg&q=55&auto=format&usm=12&fit=crop&ch=Width%2CDPR%2CSave-Data&alt=&ar=16%3A9&w=2400",
    credit: "Hodinkee",
    creditUrl: "https://www.hodinkee.com/articles/just-because-hands-on-with-a-1968-jaeger-lecoultre-polaris",
  },

  modelIntro:
    "The Memovox Polaris E859 is one of the defining complicated dive watches of the 1960s: a 42mm compressor-cased diver with an automatic Memovox alarm (calibre 825 — K825 in collector and auction usage), an internal rotating bezel, a date, and a multi-layer caseback whose 16-hole outer layer was designed so the alarm could be heard and felt underwater. Three cross-hatched crowns control it: alarm at 2, inner bezel at 3, time and date at 4. Dials are typically signed Jaeger-LeCoultre for Europe and LeCoultre for the US — both correct. Collector scholarship, supported by archive extracts, puts production at 1,714 examples between 1965 and 1970, excluding roughly 50 prototypes; JLC's own materials frame the model around 1968, the year of its best-known dial. In 2018 the brand brought Polaris back as a full collection.",

  story: [
    "Most dive watches of the period solved the timing problem with a bezel. The Polaris added a second timing method: a mechanical alarm set on the central disc, designed to sound — and to be felt through the caseback — when dive time ran out. That's why the engineering centres on the back of the watch rather than the front. The back is a resonance system: a sealed inner caseback protects the movement, a resonating layer amplifies the hammer strike, and the perforated 16-hole outer cover lets the sound travel through water and wetsuit.",
    "The dial side is just as deliberate. There's no external bezel — dive time lives on an internal rotating ring driven by the crown at 3, which keeps the dial unusually large for the case and puts everything under one oversized domed Hesalite crystal. The large dome and the absence of an external bezel make the dial feel unusually open for a dive watch, especially on the matte second-generation dial with its big trapezoidal tritium plots. The 42mm case was oversized by 1965 standards; it reads entirely current today.",
    "Production ended in 1970 and the reference went quiet for decades. A 768-piece Tribute in 2008 demonstrated the collector demand, and at SIHH 2018 — fifty years after the best-known dial — JLC relaunched Polaris as its sport collection: three-hander, Date, Chronograph, world-timer, a 1,000-piece Memovox, and from 2020 the Mariner, a 300m diver that relocates the alarm gong to the case side behind a sapphire back. The E859 is the reference the modern line keeps returning to.",
  ],

  inItsTime:
    "JLC came to the dive watch late and sideways. Blancpain and Rolex had defined the category in 1953–54 with external bezels; JLC's answer started with a 1959 letter from Bertram S. Lowe, president of LeCoultre's US arm in New York, proposing a diver with an alarm — the Memovox Deep Sea (E857) of that year was the first automatic dive watch with one. The Polaris is that idea fully engineered: Lowe again suggested the Piquerez compressor case, around 50 prototypes were made in 1963, and series production ran from 1965. Even the name is American — chosen by the US division to ride the era's polar, oceanic and space-age adventure, with the Polaris submarine-launched missile part of the same cultural backdrop. A dive watch conceived in New York, built in Le Sentier.",

  // Annotated guides — description paired with the source card. readThisFor = the quick tag.
  guides: [
    {
      title: "Memovox Polaris — JLC Collectibles QVE85901",
      publication: "Jaeger-LeCoultre",
      url: "https://www.jaeger-lecoultre.com/us-en/watches/collectibles/qve85901",
      img: "https://img.jaeger-lecoultre.com/open-graph-boxed-image-1/o-dpr-2/904b13178c59eafc99a2be53a9a11aea328013fd.jpg",
      blurb: "JLC's own archive listing for an E859 sold through its Collectibles programme — the official confirmation of the core spec: 42mm steel, calibre 825 with alarm and date, three crowns, resonance caseback, the 200m compressor case. Note the brand dates the model to 1968; independent scholarship places prototypes in 1963 and production from 1965, with 1968 the famous dial.",
      readThisFor: "official spec — the brand-confirmed core facts",
    },
    {
      title: "Deconstructed: a 1967 Memovox Polaris E859",
      publication: "Christie's",
      url: "https://www.christies.com/en/stories/deconstructed-jaeger-lecoultre-1967-memovox-polaris-e859-f4c07e3f1a7640c0b9c5c0bb405bc1db",
      img: "https://www.christies.com/-/media/images/features/articles/2017/06/13/jaegerlecoultre-deconstructed/main-jeagerlecoultre-d.jpg",
      blurb: "A clean technical walk through one 1967 example — the K825 movement, the compressor case, the 16-hole caseback and why the alarm is audible underwater, plus the LeCoultre/Jaeger-LeCoultre market split. The most accessible single explainer on how the watch actually works.",
      readThisFor: "best technical explainer — how the alarm-diver engineering works",
    },
    {
      title: "Polaris: E859 — In-Depth Review",
      publication: "Le Monde Edmond",
      url: "https://le-monde-edmond.com/polaris-e859-jaeger-indepthreview/",
      img: "https://le-monde-edmond.com/wp-content/uploads/2017/01/Polaris.jpg",
      blurb: "The deepest collector source on the reference — built on an interview with Mstanga, the scholar who wrote a 64-page booklet on the watch. It carries the production breakdown (50 prototypes in 1963, 500 watches in 1965, 1,214 in the 1968 style, 55 Calypso-hand examples in 1970), the Bertram Lowe origin story, the caseback dating system, crown and crystal service tells, and the Tropic-strap / JB Champion delivery detail. Collector-sourced rather than official, but it's the map everything else gets checked against.",
      readThisFor: "deepest collector scholarship — production breakdown and variant detail",
    },
    {
      title: "A Historical Overview of the Memovox Polaris",
      publication: "Fratello",
      url: "https://www.fratellowatches.com/a-historical-overview-of-the-jaeger-lecoultre-memovox-polaris/",
      img: "https://www.fratellowatches.com/cdn-cgi/image/anim=false/wp-content/uploads/2024/07/PolarisMuseum-5.jpg",
      blurb: "The lineage piece: Memovox 1950 → Deep Sea Alarm 1959 → Polaris 1965/1968 → Polaris II 1970 → the 2008 Tribute and 2018 relaunch, with the EPSA/Piquerez case collaboration and the dial-generation shift documented along the way. Read it for how each chapter hands off to the next.",
      readThisFor: "best lineage — the full vintage-to-modern arc in one read",
    },
    {
      title: "Hands-On With a 1968 Jaeger-LeCoultre Polaris",
      publication: "Hodinkee",
      url: "https://www.hodinkee.com/articles/just-because-hands-on-with-a-1968-jaeger-lecoultre-polaris",
      img: "https://hodinkee.imgix.net/uploads/article/hero_image/2150/JLCPolaris1968_13.jpg?ixlib=rails-1.1.0&fm=jpg&q=55&auto=format&usm=12",
      blurb: "Short and vivid — what the watch is like in the metal, why the 1968 dial became the icon, and the market framing (the 1,714-piece shorthand, box/papers/JB Champion bracelet premiums). This page's hero photograph comes from this story.",
      readThisFor: "best in-the-metal read — feel, photography, desirability",
    },
    {
      title: "The Polaris Collection: JLC's Path to the Tool Watch",
      publication: "Swisswatches Magazine",
      url: "https://swisswatches-magazine.com/jaeger-lecoultre-polaris-toolwatch-history/",
      img: "https://swisswatches-magazine.com/uploads/2025/07/jaeger-lecoultre-polaris-chronograph-q9028651-stainless-steel-blue-dial-bracelet-wristshot.jpg",
      blurb: "The modern half of the story: how the 2018 relaunch turned one vintage alarm diver into JLC's sport-watch platform — Automatic, Date, Chronograph, the Memovox LE, then the 300m Mariner models, gradient dials, a Geographic and a Perpetual Calendar. Pairs well with JLC's own history page for the brand's framing.",
      readThisFor: "modern-collection context — 2018 to today",
    },
  ],

  // Learn the marks — a paragraph each.
  marks: [
    { name: "The 16-hole resonance caseback", body: "The signature. The outer steel back is pierced with 16 holes; beneath it sit a resonating layer and a sealed inner caseback — a three-part resonance system designed so the alarm can be heard and felt underwater. Inside, the production date is stamped month-hyphen-year (e.g. '5-68'), and the inner back is signed LeCoultre regardless of which market the dial was made for.", img: "https://le-monde-edmond.com/wp-content/uploads/2017/01/Polaris.jpg", url: "https://le-monde-edmond.com/polaris-e859-jaeger-indepthreview/", source: "Le Monde Edmond" },
    { name: "Three quadrille crowns", body: "Alarm at 2, internal bezel at 3, time and date at 4 — all three with the fine cross-hatched 'quadrille' pattern that later resurfaced on JLC's Shark chronograph and the modern collection. Service-replacement crowns give themselves away with a raised circular border around the pattern; original crowns matter a lot to collectors of this reference.", img: "https://le-monde-edmond.com/wp-content/uploads/2017/01/Polaris.jpg", url: "https://le-monde-edmond.com/polaris-e859-jaeger-indepthreview/", source: "Le Monde Edmond" },
    { name: "LeCoultre vs Jaeger-LeCoultre dials", body: "US-market watches are typically signed LeCoultre, European ones Jaeger-LeCoultre — both fully correct, the same watch under the two trade names. The alarm disc follows the dial: LeCoultre dials carry 'Memovox' (or, on a rare documented sub-variant, 'Memodate') on the centre disc, while European dials typically run a plain disc. The signature should agree with the movement bridge, the box and any archive extract.", img: "https://www.christies.com/-/media/images/features/articles/2017/06/13/jaegerlecoultre-deconstructed/main-jeagerlecoultre-d.jpg", url: "https://www.christies.com/en/stories/deconstructed-jaeger-lecoultre-1967-memovox-polaris-e859-f4c07e3f1a7640c0b9c5c0bb405bc1db", source: "Christie's" },
    { name: "Two dial generations (plus a 1967 bridge)", body: "First-generation dials (1965) are glossier black with slimmer indices and small lume plots; the 1968 second generation goes matte with the big trapezoidal tritium plots and bolder numerals that define the watch's image — Christie's documents a small 1967 batch trialling the new look. Hands move from dauphine/syringe variety toward batons by the second generation. Each style belongs to its year; neither is the 'better' dial.", img: "https://hairspring.com/cdn/shop/articles/Hero-194.jpg", url: "https://hairspring.com/blogs/finds/ebays-finest-1st-generation-lecoultre-polaris-diving-alarm", source: "Hairspring Finds" },
    { name: "Tritium that doesn't match on purpose", body: "Original index plots age legitimately from pale green through yellow to orange — and the hour and minute hands were deliberately lumed in a darker green, so an honest watch shows a non-matching dial-to-hands effect. Brown 'tropical' dials turn up too and can be lovely; strong colour change just raises the bar for verifying that everything else is original.", img: "https://hairspring.com/cdn/shop/articles/Hero-2361-1.jpg", url: "https://hairspring.com/blogs/finds/tropical-e859-lecoultre-memovox-polaris", source: "Hairspring Finds" },
    { name: "The domed crystal and the Piquerez stamp", body: "Original rounded domed Hesalite crystals are rarely seen now — Phillips notes most surviving examples wear later service crystals with sharper edges, so an original dome is a real find. On the back, look for the EPSA diving-helmet emblem: the Piquerez compressor patent whose spring-loaded gasket seals tighter as pressure rises, and the same logo JLC later revived for the Master Compressor line.", img: "https://www.fratellowatches.com/cdn-cgi/image/anim=false/wp-content/uploads/2024/07/PolarisMuseum-5.jpg", url: "https://www.fratellowatches.com/a-historical-overview-of-the-jaeger-lecoultre-memovox-polaris/", source: "Fratello" },
    { name: "Tropic strap, JB Champion bracelet", body: "Delivery was on a 22mm Tropic-style rubber strap; US customers could order a JB Champion steel bracelet, now scarce and a meaningful premium on a full set. Boxes, blank guarantees, manuals and Extracts from the Archives all survive in small numbers — the E859 is a watch where completeness genuinely changes the picture.", img: "https://hodinkee.imgix.net/uploads/article/hero_image/2150/JLCPolaris1968_13.jpg?ixlib=rails-1.1.0&fm=jpg&q=55&auto=format&usm=12", url: "https://www.hodinkee.com/articles/just-because-hands-on-with-a-1968-jaeger-lecoultre-polaris", source: "Hodinkee" },
  ],

  // Notable examples worth seeing. Image strip.
  variants: [
    { name: "First-generation 1965", traits: "Glossier dial, small plots, slim indices — 500 made", img: "https://hairspring.com/cdn/shop/articles/Hero-194.jpg", url: "https://hairspring.com/blogs/finds/ebays-finest-1st-generation-lecoultre-polaris-diving-alarm", source: "Hairspring Finds" },
    { name: "1967 'Memodate'", traits: "Rare disc text below the alarm triangle — Phillips-documented", img: "https://dist.phillips.com/auction-assets/CH080215/141_001.jpg?fit=cover&optimize=medium&width=1302", url: "https://www.phillips.com/detail/jaegerlecoultre/87259", source: "Phillips" },
    { name: "The 1968 icon", traits: "Matte dial, trapezoidal plots — the relaunch's blueprint", img: "https://hodinkee.imgix.net/uploads/article/hero_image/2150/JLCPolaris1968_13.jpg?ixlib=rails-1.1.0&fm=jpg&q=55&auto=format&usm=12", url: "https://www.hodinkee.com/articles/just-because-hands-on-with-a-1968-jaeger-lecoultre-polaris", source: "Hodinkee" },
    { name: "Tropical dial", traits: "Black gone warm brown — Phillips results: CHF18,750 (Geneva SIX) and HK$212,500 (Hong Kong SIX)", img: "https://hairspring.com/cdn/shop/articles/Hero-2361-1.jpg", url: "https://hairspring.com/blogs/finds/tropical-e859-lecoultre-memovox-polaris", source: "Hairspring Finds" },
    { name: "1970 'Calypso hands'", traits: "~55 made, the run's controversial last chapter", img: "https://dist.phillips.com/auction-assets/CH080119/90_001.jpg?fit=cover&optimize=medium&width=1302", url: "https://www.phillips.com/detail/jaegerlecoultre/124056", source: "Phillips" },
    { name: "2008 Tribute to Polaris", traits: "768-piece re-edition — the bridge to the modern line", img: "https://hairspring.com/cdn/shop/articles/Memovox.jpg", url: "https://hairspring.com/blogs/finds/1-of-768-jaeger-lecoultre-polaris-limited-190-8-96", source: "Hairspring Finds" },
  ],

  market: { brand: "jaeger", refs: ["e859"], text: ["polaris"] },

  // How to look — watch-outs as craft, not fear (dossier checklist).
  howToLook: {
    intro: "The E859 is valuable enough that incorrect parts, relumes and assembled examples are a real presence, and technical enough that every component leaves evidence. When you look, pay attention to:",
    checks: [
      "whether the dial signature (LeCoultre / Jaeger-LeCoultre) agrees with the movement bridge, caseback and any archive extract",
      "the disc text — Memovox is standard, Memodate is a rare documented sub-variant, not automatically wrong",
      "all three quadrille crowns — a raised border around the cross-hatch means a service replacement",
      "the crystal — original rounded domes are scarce; sharp-edged service crystals are the norm",
      "the caseback set: 16-hole outer back, EPSA helmet stamp, the month-year date inside (e.g. '5-68')",
      "lume — plots may age green to orange, but hands should be the deliberately darker green; uniform bright lume everywhere suggests a relume",
      "the movement — calibre K825 with alarm and date (a 'K285' in a listing is a known cataloguing typo), numbers matching any extract",
      "completeness — Tropic strap, JB Champion bracelet, box, guarantee and extract each move a full set's story",
    ],
    outro: "None of this is meant to scare you off — it's the craft of reading a 60-year-old tool watch honestly, and the E859 rewards it more than most.",
  },

  // The rabbit hole — lateral discovery.
  whereNext:
    "The Polaris opens in three directions at once: deeper into JLC's own alarm lineage, sideways into the compressor-case and internal-bezel divers it shares engineering with, and forward into the modern collection it seeded.",
  // Buckets per Mark's collecting-arcs doc (2026-06-06 — see
  // docs/RECOMMENDER_STRATEGY.md "Reference-page connection buckets"):
  // the why-line explains the BRIDGE, not the resemblance. In-family
  // entries (E857, E870, modern line) kept alongside Mark's buckets —
  // they're line navigation, not recommendations.
  connections: [
    { label: "Vulcain Cricket Nautical", distance: "similar", why: "The closest philosophical cousin in all of watchmaking — the other underwater alarm, with its own decompression-table party trick.", match: { brand: "vulcain", text: ["nautical", "cricket"] } },
    { label: "Longines Legend Diver lineage", distance: "similar", why: "The same EPSA super-compressor case and internal-bezel logic in Longines' idiom — the front door to the whole compressor rabbit hole.", match: { brand: "longines", text: ["legend diver", "7042", "7150"] } },
    { label: "Universal Genève Polerouter Sub", distance: "similar", why: "Compressor case, collector appeal, and an introduction to UG collecting — without leaving the adventure world.", match: { brand: "universal", text: ["polerouter"] } },
    { label: "JLC Memovox Deep Sea Alarm E857", distance: "similar", why: "The direct family member — the 1959 watch that first put an alarm underwater, and the idea the Polaris perfected.", match: { brand: "jaeger", text: ["deep sea alarm", "deep-sea alarm", "e857"] } },
    { label: "JLC Polaris II (E870)", distance: "similar", why: "The 1970–71 sequel: oval case, external bezel, high-beat calibre 916 — a different answer to the same brief.", match: { brand: "jaeger", text: ["polaris ii", "e870"] } },
    { label: "Modern Polaris (2018–)", distance: "similar", why: "Memovox LE, Date, Chronograph, the 300m Mariner — the line the E859 relaunched in 2018.", match: { brand: "jaeger", text: ["polaris"] } },
    { label: "Omega Seamaster 300 · 165.024", distance: "adjacent", why: "A professional diver of the same era — what the adventure-instrument idea looks like without the complication.", match: { brand: "omega", text: ["165.024", "165024", "seamaster 300"] } },
    { label: "Rolex Submariner 5513", distance: "adjacent", why: "Strips away the complication entirely and focuses on purity — the bezel-and-nothing-else school the Polaris deliberately answered.", match: { brand: "rolex", refs: ["5513", "5512"] } },
    { label: "Enicar Sherpa divers", distance: "adjacent", why: "Super Dive, OPS, Guide — the adventure-watch lineage from the same compressor case-maker DNA.", match: { brand: "enicar", text: ["sherpa"] } },
    { label: "JLC Memovox (dress references)", distance: "adjacent", why: "If it's the alarm complication that holds you rather than the diving case — E855, E875 and the wider Memovox family.", match: { brand: "jaeger", text: ["memovox"] } },
    { label: "Lip Nautic-Ski", distance: "adjacent", why: "Another dive-use alarm watch — the same idea at a more accessible scale, with its own period charm.", match: { brand: "lip", text: ["nautic"] } },
    { label: "IWC Ingenieur 866", distance: "edge", why: "Not a diver at all — this is the route toward purpose-built machines generally: engineering seriousness as the thing itself.", match: { brand: "iwc", text: ["ingenieur"] } },
    { label: "Omega Railmaster CK2914", distance: "edge", why: "The scientific tool-watch branch — anti-magnetic instead of waterproof, the same purpose-built honesty.", match: { brand: "omega", text: ["railmaster"] } },
    { label: "Omega Seamaster Memomatic", distance: "edge", why: "Omega's automatic alarm — the alarm-watch route continued outside the dive context.", match: { brand: "omega", text: ["memomatic"] } },
    { label: "Doxa SUB 300", distance: "edge", why: "For the diving-instrument logic itself — the no-deco bezel scale as the complication, where the Polaris used sound.", match: { brand: "doxa", text: ["sub 300", "sub300"] } },
    { label: "Cartier Santos", distance: "edge", why: "A completely different aesthetic with the same origin story — aviation's purpose-built watch, the way the Polaris is diving's.", match: { brand: "cartier", text: ["santos"] } },
    { label: "JLC Shark / Vogue E2643", distance: "edge", why: "JLC's other cult sports reference — the diving chronograph whose gridded crown nods straight back to the Polaris.", match: { brand: "jaeger", text: ["e2643", "shark", "vogue chronograph"] } },
  ],

  // Cultural / reference pieces — the lower editorial tier.
  storiesAndImages: [
    { title: "On the Wooden Beam: a first-generation 1965 Polaris, hands and all", publication: "Blomman Watch Report", url: "https://blommanwatchreport.com/2019/08/19/on-the-wooden-beam-lecoultre-e-859-polaris-1965/", img: "https://blommanwatchreport.com/wp-content/uploads/2019/08/p1110870.jpg" },
    { title: "Vintage Eye for the Modern Guy: 1968 E859 vs the 2018 Polaris Memovox", publication: "WatchTime", url: "https://www.watchtime.com/featured/vintage-eye-for-the-modern-guy-jaeger-lecoultre-polaris-memovox/", img: "" },
    { title: "Introducing the 2018 Polaris collection — the SIHH relaunch", publication: "Monochrome", url: "https://monochrome-watches.com/jaeger-lecoultre-polaris-2018-collection-sihh-2018-memovox-automatic-date-chronograph-price/", img: "https://monochrome-watches.com/wp-content/uploads/2018/01/Jaeger-LeCoultre-Polaris-Memovox-2018-ref-9038670-13.jpg" },
    { title: "Hands-on: the Polaris Mariner Memovox — the alarm goes back to 300m", publication: "Fratello", url: "https://www.fratellowatches.com/hands-on-jaeger-lecoultre-polaris-mariner-memovox-review/", img: "https://www.fratellowatches.com/cdn-cgi/image/anim=false/wp-content/uploads/2020/10/JLC-EMBARGO-Mariner-Memovox-15.jpg" },
    { title: "Retracing the journey of the Polaris — 1968 to today", publication: "The Hour Markers", url: "https://thehourmarkers.com/articles/retracing-the-journey-of-the-jaegerlecoultre-polaris", img: "https://assets.thehourmarkers.com/public/image_Posts_2_3_fc2ecfd8bc.png" },
    { title: "The history of the Polaris, in JLC's own words", publication: "Jaeger-LeCoultre", url: "https://www.jaeger-lecoultre.com/us-en/jaeger-lecoultre-polaris-history", img: "" },
  ],

  scopeNote:
    "This page anchors on the vintage E859 and follows the line forward through the 2008 Tribute and the 2018–present collection. It's authored from a verified research dossier plus a 36-source synthesis pass; every claim is source-credited inline or in the linked sources. Two honest caveats: the production breakdown by year (500 / 1,214 / 55) is collector scholarship supported by archive extracts rather than a published JLC table, and JLC's own materials date the model to 1968 — the year of the famous dial — while independent sources document prototypes from 1963 and production from 1965. Phillips lot links are cited for their documented examples; their pages are referenced rather than scraped.",
};

export default node;
