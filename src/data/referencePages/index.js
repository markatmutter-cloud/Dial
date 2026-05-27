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
import omegaSeamaster300_165024 from "./omegaSeamaster300_165024";
import omegaRailmaster_ck2914 from "./omegaRailmaster_ck2914";

export const REFERENCE_NODES = [
  rolexSubmariner5512_5513,
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
