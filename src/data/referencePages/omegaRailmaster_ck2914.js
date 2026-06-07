// Reference page node — Omega Railmaster CK2914 (COMING SOON stub).
// See omegaSeamaster300_165024.js for the stub convention.

const node = {
  id: "omega-railmaster-ck2914",
  brand: "Omega",
  modelLine: "Railmaster",
  refs: ["CK2914"],
  group: "CK2914",
  definer:
    "Omega's 1957 anti-magnetic field watch — built for engineers and technicians working near magnetic fields · the Railmaster's first reference",
  status: "coming_soon",
  teaser:
    "Launched in 1957 alongside the Speedmaster and Seamaster 300, the Railmaster paired a soft-iron antimagnetic core with a clean, high-legibility dial. CK2914 is where the line begins. A full reference guide is on the way.",

  // Pre-authored connection buckets (Mark's collecting-arcs doc 2026-06-06,
  // see docs/RECOMMENDER_STRATEGY.md) — inert while the node is a stub,
  // live the day the page is authored.
  connections: [
    { label: "Rolex Milgauss 1019", distance: "similar", why: "Not because it looks similar — because it answers exactly the same problem: a watch for people who work near magnetic fields.", match: { brand: "rolex", text: ["milgauss"] } },
    { label: "IWC Ingenieur 866", distance: "similar", why: "The Railmaster's cousin: scientific collecting, anti-magnetic history, and a door into Genta-adjacent design lineage.", match: { brand: "iwc", text: ["ingenieur"] } },
    { label: "Rolex Explorer 1016", distance: "adjacent", why: "The same philosophy without the soft-iron core — nothing unnecessary, pure function, timeless proportions.", match: { brand: "rolex", refs: ["1016"] } },
    { label: "Omega Seamaster 300 · 165.024", distance: "adjacent", why: "The sibling from the 1957 professional trilogy — the same brief pointed at depth instead of magnetism.", match: { brand: "omega", text: ["165.024", "165024", "seamaster 300"] } },
    { label: "Omega Speedmaster", distance: "adjacent", why: "The third leg of the trilogy — the broader Omega tool story the Railmaster belongs to.", match: { brand: "omega", text: ["speedmaster"] } },
    { label: "A. Lange & Söhne Lange 1", distance: "edge", why: "Engineering purity expressed in a completely different register — for the collector whose real love is rigour, not tools.", match: { brand: "lange", text: ["lange 1"] } },
    { label: "King Seiko 44-9990", distance: "edge", why: "Historically important, beautifully made, under-collected — understated scholarship from the other side of the world.", match: { brand: "seiko", text: ["king seiko"] } },
    { label: "Ressence Type 3", distance: "edge", why: "Scientific curiosity taken forward seventy years — the same engineering-first instinct, unrecognisably evolved.", match: { brand: "ressence", text: ["ressence", "type 3"] } },
  ],
};

export default node;
