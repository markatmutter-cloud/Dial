// Reference-page node registry.
//
// Each node is a content file. A "live" node (default) carries full authored
// content (see rolexSubmariner_5512_5513.js) and renders via ReferencePage. A
// node with status:"coming_soon" is a STUB — it appears in the browse tree
// (Brand › Model line › Reference) but drills into a "coming soon" teaser
// (subscribe-to-unlock smoke test), not a full page.
//
// Adding a reference page = author one content file + register it here. The
// References sub-tab (Collecting) lands on the browse tree (ReferenceBrowse);
// the tree is derived from this registry. See docs/REFERENCE_STRUCTURE_PLAN.md.

import rolexSubmariner5512_5513 from "./rolexSubmariner_5512_5513";
import jlcSharkVogue_e2643 from "./jlcSharkVogue_e2643";
import jlcPolaris_e859 from "./jlcPolaris_e859";
import omegaSeamaster300_165024 from "./omegaSeamaster300_165024";
import omegaRailmaster_ck2914 from "./omegaRailmaster_ck2914";

export const REFERENCE_NODES = [
  rolexSubmariner5512_5513,
  jlcSharkVogue_e2643,
  jlcPolaris_e859,
  omegaSeamaster300_165024,
  omegaRailmaster_ck2914,
];

export const REFERENCE_NODES_BY_ID = REFERENCE_NODES.reduce((acc, n) => {
  acc[n.id] = n;
  return acc;
}, {});

// A node is "live" (full authored page) unless explicitly flagged coming_soon.
export function isLiveNode(node) {
  return !!node && node.status !== "coming_soon";
}

// First live node — fallback for getReferenceNode + any direct deep-link.
export const DEFAULT_REFERENCE_NODE =
  REFERENCE_NODES.find(isLiveNode) || REFERENCE_NODES[0];

export function getReferenceNode(id) {
  return REFERENCE_NODES_BY_ID[id] || DEFAULT_REFERENCE_NODE;
}

// Brand › Model line › Reference tree for the browse surface. Preserves
// registry order; groups by brand, then model line.
//   [{ brand, modelLines: [{ modelLine, nodes: [node, …] }] }]
export function buildReferenceTree(nodes = REFERENCE_NODES) {
  const brands = [];
  const brandIdx = {};
  const lineIdx = {};
  nodes.forEach((n) => {
    if (!n || !n.brand || !n.modelLine) return;
    if (brandIdx[n.brand] === undefined) {
      brandIdx[n.brand] = brands.length;
      brands.push({ brand: n.brand, modelLines: [] });
    }
    const b = brands[brandIdx[n.brand]];
    const lineKey = n.brand + "::" + n.modelLine;
    if (lineIdx[lineKey] === undefined) {
      lineIdx[lineKey] = b.modelLines.length;
      b.modelLines.push({ modelLine: n.modelLine, nodes: [] });
    }
    b.modelLines[lineIdx[lineKey]].nodes.push(n);
  });
  return brands;
}

// Rough recency for the card ordering on the Reference-guides landing
// (newest-updated first). A node may carry its own `updatedAt`; this map is
// the fallback/source for now. Update when a guide is meaningfully revised.
const REFERENCE_UPDATED_AT = {
  "rolex-submariner-5512-5513": "2026-05-24",
  "omega-seamaster-300-165024": "2026-05-29",
  "omega-railmaster-ck2914": "2026-05-30",
  "jlc-shark-vogue-e2643": "2026-05-31",
  "jlc-polaris-e859": "2026-06-06",
};
export function referenceUpdatedAt(node) {
  return (node && (node.updatedAt || REFERENCE_UPDATED_AT[node.id])) || "";
}

// Project a reference node into the listing-shaped object the save/heart
// machinery stores (mirrors articleAsListing). `kind:"reference"` discriminates
// it in the watchlist; the stable id is derived from node.id. Lets a reference
// guide be hearted / added-to-list from where it's read, and resurfaced as the
// "Guides" type on the Hearted surface (Phase 2b, closes B-37). The url is an
// in-app deep link so opening a saved guide stays in the app.
export function referenceAsListing(node) {
  if (!node || !node.id) return null;
  const refLabel = node.group || (node.refs && node.refs.join(" / ")) || "";
  return {
    id: `ref_${node.id}`,
    url: `?tab=references&ref=${node.id}`,
    img: (node.hero && node.hero.img) || null,
    ref: refLabel,
    title: [node.brand, node.modelLine, refLabel].filter(Boolean).join(" ").trim(),
    brand: node.brand || "",
    model: node.modelLine || null,
    model_line: node.modelLine || null,
    reference_no: refLabel || null,
    kind: "reference",
    reference: { nodeId: node.id, group: refLabel, definer: node.definer || "" },
    sold: false,
    price: null,
    currency: null,
  };
}
