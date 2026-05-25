// Reference-page node registry.
//
// Each node is a hand-authored content file (see rolexSubmariner_5512_5513.js).
// Adding a reference page = author one content file + add it here. The
// References sub-tab (Collecting) lands directly on the single node for now
// (Phase 1); a browse index over `REFERENCE_NODES` is Phase 2.

import rolexSubmariner5512_5513 from "./rolexSubmariner_5512_5513";

export const REFERENCE_NODES = [
  rolexSubmariner5512_5513,
];

export const REFERENCE_NODES_BY_ID = REFERENCE_NODES.reduce((acc, n) => {
  acc[n.id] = n;
  return acc;
}, {});

// Phase-1 default node the References sub-tab opens on.
export const DEFAULT_REFERENCE_NODE = REFERENCE_NODES[0];

export function getReferenceNode(id) {
  return REFERENCE_NODES_BY_ID[id] || DEFAULT_REFERENCE_NODE;
}
