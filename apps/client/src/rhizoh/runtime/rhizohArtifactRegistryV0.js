/**
 * RAR v0 — Rhizoh Artifact Registry.
 * What Rhizoh produced, lineage (MCIB/CCF/ECC), surface routing — not execution.
 * @see docs/RHIZOH_ARTIFACT_REGISTRY_V0.md
 */

export const RAR_SCHEMA_V0 = "castle.rhizoh.artifact_registry.v0";

export const RHIZOH_ARTIFACT_REGISTRY_EVENT_V0 = "rhizoh:artifact-registry-v0";

export const RAR_ARTIFACT_KIND_V0 = Object.freeze({
  NARRATIVE_CONTINUITY: "narrative_continuity",
  FEL_NARRATION: "fel_narration",
  COGNITIVE_LINEAGE: "cognitive_lineage",
  STRUCTURED_DOC: "structured_doc",
  EXPORT_GRAPH_NODE: "export_graph_node"
});

export const RAR_VISIBILITY_V0 = Object.freeze({
  USER: "user",
  INTERNAL: "internal",
  SURFACE_ONLY: "surface_only"
});

const RING_MAX_V0 = 128;

/** @type {Map<string, ReturnType<typeof registerRhizohArtifactV0>>} */
const byId = new Map();
/** @type {ReturnType<typeof registerRhizohArtifactV0>[]} */
const ring = [];
let seq = 0;

/**
 * @param {ReturnType<typeof registerRhizohArtifactV0>} artifact
 * @param {string | null} parentId
 */
function withParentLinkV0(artifact, parentId) {
  if (!parentId) return artifact;
  return Object.freeze({ ...artifact, parent_artifact_id: parentId });
}

/**
 * @param {{
 *   kind: string,
 *   payload?: Record<string, unknown>,
 *   lineage?: {
 *     experiential_now_id?: string | null,
 *     stream_coherence_id?: string | null,
 *     mcib_cause_count?: number,
 *     ccf_collapse_mode?: string | null,
 *     ecc_micro_kind?: string | null
 *   },
 *   surfaces?: string[],
 *   visibility?: string,
 *   parentArtifact?: ReturnType<typeof registerRhizohArtifactV0> | null,
 *   atMs?: number
 * }} input
 */
export function registerRhizohArtifactV0(input = {}) {
  seq += 1;
  const atMs = Number(input.atMs) || Date.now();
  const artifact_id = `rar_${atMs}_${seq}`;
  const lineage = input.lineage || {};

  const parentId = input.parentArtifact?.artifact_id || null;

  const artifact = withParentLinkV0(
    Object.freeze({
      schema: RAR_SCHEMA_V0,
      artifact_id,
      kind: String(input.kind || RAR_ARTIFACT_KIND_V0.EXPORT_GRAPH_NODE),
      atMs,
      version: 1,
      visibility: input.visibility || RAR_VISIBILITY_V0.USER,
      payload: Object.freeze(input.payload || {}),
      lineage: Object.freeze({
        experiential_now_id: lineage.experiential_now_id || null,
        stream_coherence_id: lineage.stream_coherence_id || null,
        mcib_cause_count: Number(lineage.mcib_cause_count) || 0,
        ccf_collapse_mode: lineage.ccf_collapse_mode || null,
        ecc_micro_kind: lineage.ecc_micro_kind || null
      }),
      surfaces: Object.freeze((input.surfaces || []).map(String)),
      parent_artifact_id: parentId,
      child_artifact_ids: Object.freeze([])
    }),
    parentId
  );

  byId.set(artifact_id, artifact);
  ring.push(artifact);
  if (ring.length > RING_MAX_V0) {
    const removed = ring.shift();
    if (removed) byId.delete(removed.artifact_id);
  }

  if (input.parentArtifact) {
    const p = input.parentArtifact;
    const updatedParent = Object.freeze({
      ...p,
      child_artifact_ids: Object.freeze([...(p.child_artifact_ids || []), artifact_id])
    });
    byId.set(p.artifact_id, updatedParent);
    const idx = ring.findIndex((a) => a.artifact_id === p.artifact_id);
    if (idx >= 0) ring[idx] = updatedParent;
  }

  publishArtifactRegistryV0();
  return artifact;
}

/**
 * Register from live window cognitive + ECC stack.
 * @param {ReturnType<import("./rhizohExperienceContinuityCompilerV0.js").compileExperienceContinuityV0>} [ecc]
 * @param {{ visibility?: string, surfaces?: string[] }} [opts]
 */
export function registerRhizohArtifactFromContinuityStackV0(ecc, opts = {}) {
  const rh = typeof window !== "undefined" ? window.__rhizoh || {} : {};
  const inertia = rh.cognitiveAttention?.attention_inertia;
  const mcib = inertia?.mcib;
  const ccf = inertia?.ccf;

  const lineage = Object.freeze({
    experiential_now_id: ccf?.experiential_now_id || null,
    stream_coherence_id: ecc?.stream_coherence_id || null,
    mcib_cause_count: mcib?.causes?.length || 0,
    ccf_collapse_mode: ccf?.collapse_mode || null,
    ecc_micro_kind: ecc?.micro_transition?.kind || null
  });

  const narrative = registerRhizohArtifactV0({
    kind: RAR_ARTIFACT_KIND_V0.NARRATIVE_CONTINUITY,
    payload: Object.freeze({
      continuity_line: ecc?.continuity_line || null,
      narrative_velocity: ecc?.narrative_velocity
    }),
    lineage,
    surfaces: opts.surfaces || ["t0_strip", "ui_2d"],
    visibility: opts.visibility || RAR_VISIBILITY_V0.USER,
    atMs: ecc?.atMs
  });

  if (mcib || ccf) {
    registerRhizohArtifactV0({
      kind: RAR_ARTIFACT_KIND_V0.COGNITIVE_LINEAGE,
      payload: Object.freeze({
        narrative_now_tr: ccf?.narrative_now_tr || null,
        mcib_superposition01: mcib?.superposition01
      }),
      lineage,
      surfaces: ["internal"],
      visibility: RAR_VISIBILITY_V0.INTERNAL,
      parentArtifact: narrative,
      atMs: ecc?.atMs
    });
  }

  return narrative;
}

export function listRhizohArtifactsV0(limit = 32) {
  return Object.freeze(ring.slice(-limit));
}

export function getRhizohArtifactByIdV0(id) {
  return byId.get(String(id || "")) || null;
}

export function getRhizohArtifactExportGraphV0() {
  return Object.freeze(
    ring.map((a) =>
      Object.freeze({
        artifact_id: a.artifact_id,
        kind: a.kind,
        parent_artifact_id: a.parent_artifact_id,
        child_artifact_ids: a.child_artifact_ids,
        surfaces: a.surfaces
      })
    )
  );
}

function publishArtifactRegistryV0() {
  if (typeof window === "undefined") return;
  const snap = Object.freeze({
    schema: RAR_SCHEMA_V0,
    count: ring.length,
    artifacts: listRhizohArtifactsV0(48),
    export_graph: getRhizohArtifactExportGraphV0()
  });
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.artifactRegistry = snap;
  try {
    window.dispatchEvent(
      new CustomEvent(RHIZOH_ARTIFACT_REGISTRY_EVENT_V0, { detail: snap })
    );
  } catch {
    /* noop */
  }
}

export function resetRhizohArtifactRegistryForTestV0() {
  seq = 0;
  ring.length = 0;
  byId.clear();
}
