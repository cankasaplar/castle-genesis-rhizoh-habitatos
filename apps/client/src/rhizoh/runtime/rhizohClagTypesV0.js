/** CLAG shared types — no traversal/graph logic (avoids import cycles). */

export const RHIZOH_CLAG_SCHEMA_V0 = "castle.rhizoh.cross_layer_awareness_graph.v0";

export const CLAG_NODE_KIND_V0 = Object.freeze({
  CONVERSATION: "conversation",
  NARRATIVE: "narrative",
  STUDIO: "studio",
  SPIRAL: "spiral",
  REAL_LIFE: "real_life",
  ACADEMY: "academy",
  DEPTH: "depth",
  SOCIAL: "social",
  INFLUENCE: "influence"
});

export const CLAG_EDGE_KIND_V0 = Object.freeze({
  INFLUENCES: "influences",
  MAPS_TO: "maps_to",
  SHAPES_MEMORY: "shapes_memory",
  PROPAGATES: "propagates"
});
