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
    "Memovox alarm diver in a 42mm compressor case — the alarm you can hear underwater · 1,714 made, 1965–1970 · relaunched as a full collection in 2018",

  synthesisNode: "jlc-polaris",
  synthesisScope: ["E859", "E857", "E870", "190.8.96", "Q9008470", "Q9008170", "Q9038670", "Q9028471", "Q9068670", "Q9028180", "model-wide", "dive-watch-context"],

  hero: {
    img: "https://hodinkee.imgix.net/uploads/article/hero_image/2150/JLCPolaris1968_13.jpg?ixlib=rails-1.1.0&fm=jpg&q=55&auto=format&usm=12&fit=crop&ch=Width%2CDPR%2CSave-Data&alt=&ar=16%3A9&w=2400",
    credit: "Hodinkee",
    creditUrl: "https://www.hodinkee.com/articles/just-because-hands-on-with-a-1968-jaeger-lecoultre-polaris",
  },

  modelIntro:
    "The Memovox Polaris E859 is Jaeger-LeCoultre's dive watch built around a question nobody else was asking in the 1960s: what if a diver could hear when it was time to come up? It pairs the automatic Memovox alarm (calibre K825) with a 42mm Piquerez compressor case, an internal rotating dive bezel, and a patented multi-layer caseback — the outer layer pierced with 16 holes — engineered to carry the alarm's sound and vibration through water and wetsuit. Three cross-hatched crowns run the show: alarm at 2, inner bezel at 3, time and date at 4. Sold as Jaeger-LeCoultre in Europe and simply LeCoultre in the US, just 1,714 were made between 1965 and 1970 — and in 2018 JLC brought the name back as a full collection.",

  story: [
    "Most dive watches of the era timed a dive one way: you turned a bezel and watched the minute hand. The Polaris adds a second sense. Set the alarm disc before you descend and the watch tells you when your time is up — audibly, and through the caseback against your wrist, tactilely. That's why the engineering centres on the back of the watch rather than the front: an inner caseback seals the movement, a resonating layer amplifies the hammer strike, and the 16-hole outer back lets the sound out. Collectors describe the whole back as effectively one large gong.",
    "The face is just as deliberate. There's no external bezel at all — dive time lives on an internal rotating ring driven by the crown at 3, which keeps the dial enormous for the case and puts everything under one oversized domed Hesalite crystal. On the matte black second-generation dial with its big trapezoidal tritium plots, the effect is much repeated and hard to improve on: a dial floating under a pool of glass. The 42mm case wore huge in 1965; it reads perfectly current today.",
    "Then the watch disappeared — production ended in 1970 — and scarcity did its slow work. A 768-piece Tribute in 2008 proved the demand was real, and at SIHH 2018, fifty years after the famous 1968 dial, JLC relaunched Polaris as its sport collection: three-hander, Date, Chronograph, world-timer, a 1,000-piece Memovox, and from 2020 the Mariner — a true 300m diver that mounts the alarm gong on the case side so you can watch the hammer work through a sapphire back. The vintage E859 is the reason all of it exists.",
  ],

  inItsTime:
    "JLC came to the dive watch late and sideways. Blancpain and Rolex had defined the category in 1953–54 with external bezels; JLC's answer started with a 1959 letter from Bertram S. Lowe, president of LeCoultre's US arm in New York, proposing a diver with an alarm — the Memovox Deep Sea (E857) of that year was the first automatic dive watch with one. The Polaris is that idea fully engineered: Lowe again suggested the Piquerez compressor case, around 50 prototypes were made in 1963, and series production ran from 1965. Even the name is American — chosen by the US division to ride the era's polar, oceanic and space-age adventure, with the Polaris submarine-launched missile part of the same cultural backdrop. A dive watch conceived in New York, built in Le Sentier.",

  // Annotated guides — description paired with the source card. readThisFor = the quick tag.
  guides: [
    {
      title: "Polaris: E859 — In-Depth Review",
      publication: "Le Monde Edmond",
      url: "https://le-monde-edmond.com/polaris-e859-jaeger-indepthreview/",
      img: "",
      blurb: "The deepest collector source on the reference — built on an interview with Mstanga, the scholar who wrote a 64-page booklet on the watch. It carries the production breakdown (50 prototypes in 1963, 500 watches in 1965, 1,214 in the 1968 style, 55 Calypso-hand examples in 1970), the Bertram Lowe origin story, the caseback dating system, crown and crystal service tells, and the Tropic-strap / JB Champion delivery detail. Collector-sourced rather than official, but it's the map everything else gets checked against.",
      readThisFor: "the production breakdown and the deepest variant detail",
    },
    {
      title: "Deconstructed: a 1967 Memovox Polaris E859",
      publication: "Christie's",
      url: "https://www.christies.com/en/stories/deconstructed-jaeger-lecoultre-1967-memovox-polaris-e859-f4c07e3f1a7640c0b9c5c0bb405bc1db",
      img: "",
      blurb: "A clean technical walk through one 1967 example — the K825 movement, the compressor case, the 16-hole caseback and why the alarm is audible underwater, plus the LeCoultre/Jaeger-LeCoultre market split. The most accessible single explainer on how the watch actually works.",
      readThisFor: "how the alarm-diver engineering actually works",
    },
    {
      title: "A Historical Overview of the Memovox Polaris",
      publication: "Fratello",
      url: "https://www.fratellowatches.com/a-historical-overview-of-the-jaeger-lecoultre-memovox-polaris/",
      img: "",
      blurb: "The lineage piece: Memovox 1950 → Deep Sea Alarm 1959 → Polaris 1965/1968 → Polaris II 1970 → the 2008 Tribute and 2018 relaunch, with the EPSA/Piquerez case collaboration and the dial-generation shift documented along the way. Read it for how each chapter hands off to the next.",
      readThisFor: "the full vintage-to-modern lineage in one read",
    },
    {
      title: "Hands-On With a 1968 Jaeger-LeCoultre Polaris",
      publication: "Hodinkee",
      url: "https://www.hodinkee.com/articles/just-because-hands-on-with-a-1968-jaeger-lecoultre-polaris",
      img: "",
      blurb: "Short and vivid — what the watch is like in the metal, why the 1968 dial became the icon, and the market framing (1,714 made, box/papers/JB Champion bracelet premiums). This page's hero photograph comes from this story.",
      readThisFor: "the watch in the metal, and this page's hero shot",
    },
    {
      title: "The Polaris Collection: JLC's Path to the Tool Watch",
      publication: "Swisswatches Magazine",
      url: "https://swisswatches-magazine.com/jaeger-lecoultre-polaris-toolwatch-history/",
      img: "",
      blurb: "The modern half of the story: how the 2018 relaunch turned one vintage alarm diver into JLC's sport-watch platform — Automatic, Date, Chronograph, the Memovox LE, then the 300m Mariner models, gradient dials, a Geographic and a Perpetual Calendar. Pairs well with JLC's own history page for the brand's framing.",
      readThisFor: "the 2018–present collection and where it's going",
    },
    {
      title: "Memovox Polaris — JLC Collectibles QVE85901",
      publication: "Jaeger-LeCoultre",
      url: "https://www.jaeger-lecoultre.com/us-en/watches/collectibles/qve85901",
      img: "",
      blurb: "JLC's own archive listing for an E859 sold through its Collectibles programme — the official confirmation of the core spec: 42mm steel, calibre 825 with alarm and date, three crowns, resonance caseback, the 200m compressor case. Note the brand dates the model to 1968; independent scholarship places prototypes in 1963 and production from 1965, with 1968 the famous dial.",
      readThisFor: "the official spec, in the brand's own words",
    },
  ],

  // Learn the marks — a paragraph each.
  marks: [
    { name: "The 16-hole resonance caseback", body: "The signature. The outer steel back is pierced with 16 holes; beneath it a resonating layer and a sealed inner caseback turn the whole back into a speaker for the alarm — audible and palpable underwater. Inside, the production date is stamped month-hyphen-year (e.g. '5-68'), and the inner back is signed LeCoultre regardless of which market the dial was made for.", img: "", url: "https://le-monde-edmond.com/polaris-e859-jaeger-indepthreview/", source: "Le Monde Edmond" },
    { name: "Three quadrille crowns", body: "Alarm at 2, internal bezel at 3, time and date at 4 — all three with the fine cross-hatched 'quadrille' pattern that later resurfaced on JLC's Shark chronograph and the modern collection. Service-replacement crowns give themselves away with a raised circular border around the pattern; original crowns matter a lot to collectors of this reference.", img: "", url: "https://le-monde-edmond.com/polaris-e859-jaeger-indepthreview/", source: "Le Monde Edmond" },
    { name: "LeCoultre vs Jaeger-LeCoultre dials", body: "US-market watches are signed LeCoultre, European ones Jaeger-LeCoultre — both fully correct, the same watch under the two trade names. The alarm disc follows the dial: LeCoultre dials carry 'Memovox' (or, on a rare documented sub-variant, 'Memodate') on the centre disc, while European dials typically run a plain disc. The signature should agree with the movement bridge, the box and any archive extract.", img: "", url: "https://www.christies.com/en/stories/deconstructed-jaeger-lecoultre-1967-memovox-polaris-e859-f4c07e3f1a7640c0b9c5c0bb405bc1db", source: "Christie's" },
    { name: "Two dial generations (plus a 1967 bridge)", body: "First-generation dials (1965) are glossier black with slimmer indices and small lume plots; the 1968 second generation goes matte with the big trapezoidal tritium plots and bolder numerals that define the watch's image — Christie's documents a small 1967 batch trialling the new look. Hands move from dauphine/syringe variety toward batons by the second generation. Each style belongs to its year; neither is the 'better' dial.", img: "", url: "https://hairspring.com/blogs/finds/ebays-finest-1st-generation-lecoultre-polaris-diving-alarm", source: "Hairspring Finds" },
    { name: "Tritium that doesn't match on purpose", body: "Original index plots age legitimately from pale green through yellow to orange — and the hour and minute hands were deliberately lumed in a darker green, so an honest watch shows a non-matching dial-to-hands effect. Brown 'tropical' dials turn up too and can be lovely; strong colour change just raises the bar for verifying that everything else is original.", img: "", url: "https://hairspring.com/blogs/finds/tropical-e859-lecoultre-memovox-polaris", source: "Hairspring Finds" },
    { name: "The domed crystal and the Piquerez stamp", body: "Original rounded domed Hesalite crystals are rarely seen now — Phillips notes most surviving examples wear later service crystals with sharper edges, so an original dome is a real find. On the back, look for the EPSA diving-helmet emblem: the Piquerez compressor patent whose spring-loaded gasket seals tighter as pressure rises, and the same logo JLC later revived for the Master Compressor line.", img: "", url: "https://www.fratellowatches.com/a-historical-overview-of-the-jaeger-lecoultre-memovox-polaris/", source: "Fratello" },
    { name: "Tropic strap, JB Champion bracelet", body: "Delivery was on a 22mm Tropic-style rubber strap; US customers could order a JB Champion steel bracelet, now scarce and a meaningful premium on a full set. Boxes, blank guarantees, manuals and Extracts from the Archives all survive in small numbers — the E859 is a watch where completeness genuinely changes the picture.", img: "", url: "https://www.hodinkee.com/articles/just-because-hands-on-with-a-1968-jaeger-lecoultre-polaris", source: "Hodinkee" },
  ],

  // Notable examples worth seeing. Image strip.
  variants: [
    { name: "First-generation 1965", traits: "Glossier dial, small plots, slim indices — 500 made", img: "", url: "https://hairspring.com/blogs/finds/ebays-finest-1st-generation-lecoultre-polaris-diving-alarm", source: "Hairspring Finds" },
    { name: "1967 'Memodate'", traits: "Rare disc text below the alarm triangle — Phillips-documented", img: "", url: "https://www.phillips.com/detail/jaegerlecoultre/87259", source: "Phillips" },
    { name: "The 1968 icon", traits: "Matte dial, trapezoidal plots — the relaunch's blueprint", img: "", url: "https://www.hodinkee.com/articles/just-because-hands-on-with-a-1968-jaeger-lecoultre-polaris", source: "Hodinkee" },
    { name: "Tropical dial", traits: "Black gone warm brown — Phillips sold one at CHF 18,750", img: "", url: "https://hairspring.com/blogs/finds/tropical-e859-lecoultre-memovox-polaris", source: "Hairspring Finds" },
    { name: "1970 'Calypso hands'", traits: "~55 made, the run's controversial last chapter", img: "", url: "https://www.phillips.com/detail/jaegerlecoultre/124056", source: "Phillips" },
    { name: "2008 Tribute to Polaris", traits: "768-piece re-edition — the bridge to the modern line", img: "", url: "https://hairspring.com/blogs/finds/1-of-768-jaeger-lecoultre-polaris-limited-190-8-96", source: "Hairspring Finds" },
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
  connections: [
    { label: "JLC Memovox Deep Sea Alarm E857", distance: "similar", why: "The 1959 predecessor — the first automatic dive watch with an alarm, and the idea the Polaris perfected.", match: { brand: "jaeger", text: ["deep sea alarm", "deep-sea alarm", "e857"] } },
    { label: "JLC Polaris II (E870)", distance: "similar", why: "The 1970–71 sequel: oval case, external bezel, high-beat calibre 916 — a different answer to the same brief.", match: { brand: "jaeger", text: ["polaris ii", "e870"] } },
    { label: "Modern Polaris (2018–)", distance: "similar", why: "Memovox LE, Date, Chronograph, the 300m Mariner — the line the E859 relaunched in 2018.", match: { brand: "jaeger", text: ["polaris"] } },
    { label: "JLC Memovox (dress references)", distance: "adjacent", why: "The alarm complication at home in a dress case — E855 and friends, the family the Polaris took diving.", match: { brand: "jaeger", text: ["memovox"] } },
    { label: "Vulcain Cricket Nautical", distance: "adjacent", why: "The other underwater alarm — Vulcain's parallel answer, with its own decompression-table party trick.", match: { brand: "vulcain", text: ["cricket", "nautical"] } },
    { label: "Longines Legend Diver lineage", distance: "adjacent", why: "The same EPSA super-compressor case and twin-crown internal-bezel logic, in Longines' idiom.", match: { brand: "longines", text: ["legend diver", "7042", "7150"] } },
    { label: "Enicar Sherpa divers", distance: "adjacent", why: "Super Dive, OPS, Guide — adventurous compressor-cased 1960s tool watches with the same case-maker DNA.", match: { brand: "enicar", text: ["sherpa"] } },
    { label: "Universal Genève Polerouter Sub", distance: "adjacent", why: "A compressor-cased diver from another movement-maker house — the same engineering culture.", match: { brand: "universal", text: ["polerouter"] } },
    { label: "IWC Aquatimer (812 AD / 1812)", distance: "adjacent", why: "Internal-bezel diving from another haute-horlogerie maker, launched within a few years of the Polaris.", match: { brand: "iwc", text: ["aquatimer"] } },
    { label: "JLC Shark / Vogue E2643", distance: "edge", why: "JLC's other cult sports reference — the diving chronograph whose gridded crown nods straight back to the Polaris.", match: { brand: "jaeger", text: ["e2643", "shark", "vogue chronograph"] } },
    { label: "Omega Flightmaster", distance: "edge", why: "A different mission, the same conviction: let the complication dictate the architecture of the case.", match: { brand: "omega", text: ["flightmaster"] } },
    { label: "Aquastar Deepstar / Benthos", distance: "edge", why: "Purpose-built professional dive engineering from the same era — function-first oddballs worth knowing.", match: { brand: "aquastar", text: ["deepstar", "benthos"] } },
  ],

  // Cultural / reference pieces — the lower editorial tier.
  storiesAndImages: [
    { title: "On the Wooden Beam: a first-generation 1965 Polaris, hands and all", publication: "Blomman Watch Report", url: "https://blommanwatchreport.com/2019/08/19/on-the-wooden-beam-lecoultre-e-859-polaris-1965/", img: "" },
    { title: "Vintage Eye for the Modern Guy: 1968 E859 vs the 2018 Polaris Memovox", publication: "WatchTime", url: "https://www.watchtime.com/featured/vintage-eye-for-the-modern-guy-jaeger-lecoultre-polaris-memovox/", img: "" },
    { title: "Introducing the 2018 Polaris collection — the SIHH relaunch", publication: "Monochrome", url: "https://monochrome-watches.com/jaeger-lecoultre-polaris-2018-collection-sihh-2018-memovox-automatic-date-chronograph-price/", img: "" },
    { title: "Hands-on: the Polaris Mariner Memovox — the alarm goes back to 300m", publication: "Fratello", url: "https://www.fratellowatches.com/hands-on-jaeger-lecoultre-polaris-mariner-memovox-review/", img: "" },
    { title: "Retracing the journey of the Polaris — 1968 to today", publication: "The Hour Markers", url: "https://thehourmarkers.com/articles/retracing-the-journey-of-the-jaegerlecoultre-polaris", img: "" },
    { title: "The history of the Polaris, in JLC's own words", publication: "Jaeger-LeCoultre", url: "https://www.jaeger-lecoultre.com/us-en/jaeger-lecoultre-polaris-history", img: "" },
  ],

  scopeNote:
    "This page anchors on the vintage E859 and follows the line forward through the 2008 Tribute and the 2018–present collection. It's authored from a verified research dossier plus a 36-source synthesis pass; every claim is source-credited inline or in the linked sources. Two honest caveats: the production breakdown by year (500 / 1,214 / 55) is collector scholarship supported by archive extracts rather than a published JLC table, and JLC's own materials date the model to 1968 — the year of the famous dial — while independent sources document prototypes from 1963 and production from 1965. Phillips lot links are cited for their documented examples; their pages are referenced rather than scraped.",
};

export default node;
