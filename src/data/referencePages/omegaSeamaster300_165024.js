// Reference page node — Omega Seamaster 300, ref 165.024 (COMING SOON stub).
//
// Minimal stub so the Brand › Model line › Reference tree has real structure
// beyond the single authored 5512/5513 page. No authored prose / synthesis yet;
// ReferenceBrowse renders a "coming soon" teaser (subscribe-to-unlock smoke
// test) for status:"coming_soon" nodes rather than the full ReferencePage.
// Promote to a live node = fill in the full content fields + drop the status.

const node = {
  id: "omega-seamaster300-165024",
  brand: "Omega",
  modelLine: "Seamaster 300",
  refs: ["165.024"],
  group: "165.024",
  definer:
    "Omega's 1960s professional diver: broad-arrow hands, a fully graduated bezel, an in-house feel · c. 1962–1969",
  status: "coming_soon",
  teaser:
    "The Seamaster 300 answered the same brief as the Submariner in a different idiom: a symmetric-lug case, a fully graduated 60-minute bezel, and the broad-arrow handset Omega built for legibility at depth. A full reference guide is on the way.",

  // Pre-authored connection buckets (Mark's collecting-arcs doc 2026-06-06,
  // see docs/RECOMMENDER_STRATEGY.md) — inert while the node is a stub,
  // live the day the page is authored.
  connections: [
    { label: "Omega Seamaster 300 CK2913", distance: "similar", why: "The first-generation Seamaster 300, where the broad-arrow story begins.", match: { brand: "omega", text: ["2913"] } },
    { label: "Rolex Submariner 5513", distance: "similar", why: "The same professional-diver brief answered in Rolex's idiom: the natural side-by-side.", match: { brand: "rolex", refs: ["5513", "5512"] } },
    { label: "Blancpain Fifty Fathoms", distance: "similar", why: "The military-diver lineage from the category's other founding house.", match: { brand: "blancpain", text: ["fifty fathoms"] } },
    { label: "Tudor Submariner 7928", distance: "similar", why: "The era's other issued diver: military history at a working watch's scale.", match: { brand: "tudor", text: ["submariner"] } },
    { label: "JLC Memovox Polaris E859", distance: "adjacent", why: "An adventure instrument of the same years that timed the dive by sound instead of sight.", match: { brand: "jaeger", text: ["polaris"] } },
    { label: "Omega Railmaster CK2914", distance: "adjacent", why: "The 1957 trilogy sibling: the same engineering honesty pointed at magnetism instead of depth.", match: { brand: "omega", text: ["railmaster"] } },
    { label: "Rolex Explorer 1016", distance: "adjacent", why: "Pure-function tool watching without a bezel at all: restraint as the feature.", match: { brand: "rolex", refs: ["1016"] } },
    { label: "Universal Genève Polerouter", distance: "edge", why: "Introduces design and elegance: a cornerstone reference for when the eye starts caring about line as much as legitimacy.", match: { brand: "universal", text: ["polerouter"] } },
    { label: "IWC Ingenieur SL", distance: "edge", why: "The door to Genta and industrial design: tool legitimacy translated into form.", match: { brand: "iwc", text: ["ingenieur"] } },
    { label: "Patek Philippe Calatrava", distance: "edge", why: "A collector who appreciates the purity of a 165.024 often eventually appreciates the purity of a Calatrava. The same value, different world.", match: { brand: "patek", text: ["calatrava"] } },
  ],
};

export default node;
