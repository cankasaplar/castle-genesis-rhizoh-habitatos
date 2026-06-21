/**
 * Identity Manifest Projection v0 — Phase 1 READ ONLY.
 * causalMap (ECG) → derived identity summary; no event pipeline mutation.
 * @see docs/RHIZOH_IDENTITY_MANIFEST_V0.md
 */

import { buildCausalMapLayerV0 } from "./rhizohCausalMapLayerV0.js";
import { TRUTH_TRACE_KIND_V0 } from "./rhizohTruthTraceLayerV0.js";
import {
  getGlobalEpistemicIdentityV0,
  getLastEpistemicIdentityContinuityReportV0,
  IDENTITY_CONTINUITY_VERDICT_V0
} from "./epistemicIdentityContinuityV0.js";
import { getIdentityLifecycleSnapshotV0 } from "./rhizohIdentityLifecycleV0.js";
import { getIdentityEventLogSnapshotV0 } from "./rhizohIdentityEventLogV0.js";
import { getIdentityContinuitySnapshotV0 } from "./rhizohIdentityContinuityCoreV0.js";

export const IDENTITY_MANIFEST_PROJECTION_SCHEMA_V0 =
  "castle.rhizoh.identity_manifest_projection.v0";

export const IDENTITY_MANIFEST_PHASE_V0 = "read_only_v0";

export const IDENTITY_MANIFEST_CONTINUITY_VERDICT_V0 = "read_only_projection";

const CONSTITUTIONAL_ANCHOR_V0 = Object.freeze({
  charter: "RHIZOH_HONEST_BASELINE_CHARTER_V1",
  spine: "Observation ≠ Execution",
  etss: "ECG → derived projection (not TAL write path)"
});

/** @type {object | null} */
let lastProjectionV0 = null;
let identityManifestConsoleMountedV0 = false;

/**
 * @param {object[]} nodes
 * @param {string} kind
 */
function countNodesByKindV0(nodes, kind) {
  return nodes.filter((n) => n.kind === kind).length;
}

/**
 * @param {object} causalMap
 */
function summarizeCausalMapV0(causalMap) {
  const nodes = causalMap?.nodes || [];
  const raw = causalMap?.causalMapRaw || causalMap;
  const rawNodes = raw?.nodes || nodes;

  const domains = [
    ...new Set(
      nodes
        .filter((n) => n.kind === TRUTH_TRACE_KIND_V0.DOMAIN_TRANSITION)
        .map((n) => n.domain)
        .filter(Boolean)
    )
  ].slice(0, 8);

  const chessAnchors = rawNodes
    .filter((n) => {
      const label = String(n.label || "").toLowerCase();
      const domain = String(n.domain || "").toLowerCase();
      return label.includes("chess") || domain.includes("chess") || label.includes("cluster");
    })
    .map((n) => Object.freeze({ id: n.id, kind: n.kind, label: n.label }))
    .slice(0, 12);

  return Object.freeze({
    nodeCount: causalMap?.nodeCount ?? nodes.length,
    edgeCount: causalMap?.edgeCount ?? (causalMap?.edges?.length || 0),
    rawNodeCount: raw?.nodeCount ?? rawNodes.length,
    rawEdgeCount: raw?.edgeCount ?? (raw?.edges?.length || 0),
    compressed: causalMap?.compressed === true,
    domainTransitions: countNodesByKindV0(nodes, TRUTH_TRACE_KIND_V0.DOMAIN_TRANSITION),
    tensorDecisions: countNodesByKindV0(nodes, TRUTH_TRACE_KIND_V0.TENSOR_DECISION),
    spatialProjections: countNodesByKindV0(nodes, TRUTH_TRACE_KIND_V0.SPATIAL_NODE),
    runtimeSubstrate: countNodesByKindV0(nodes, TRUTH_TRACE_KIND_V0.RUNTIME_SUBSTRATE),
    codexGhosts: countNodesByKindV0(nodes, TRUTH_TRACE_KIND_V0.CODEX_GHOST),
    dominantDomains: Object.freeze(domains),
    chessAnchors: Object.freeze(chessAnchors),
    selfNarrative: causalMap?.selfNarrative ?? null
  });
}

function summarizeIdentityPipelineV0() {
  const lifecycle = getIdentityLifecycleSnapshotV0();
  const eventLog = getIdentityEventLogSnapshotV0();
  const continuity = getIdentityContinuitySnapshotV0();
  const eventPipelineWired = eventLog.count > 0 || continuity.turnCount > 0;

  return Object.freeze({
    lifecycleTurnCount: lifecycle.turnCount ?? 0,
    eventLogCount: eventLog.count ?? 0,
    continuityTurnCount: continuity.turnCount ?? 0,
    eventPipelineWired,
    pipelineNote: eventPipelineWired
      ? "voice/turn path active"
      : "world/chess not routed to identity event SSOT"
  });
}

/**
 * Phase 1 projection — read-only derived manifest from causal graph + optional epistemic subject.
 *
 * @param {{ causalMap?: object, includeEpistemicSubject?: boolean }} [opts]
 */
export function projectIdentityManifestV0(opts = {}) {
  const causalMap =
    opts.causalMap ??
    (typeof window !== "undefined" ? window.__rhizoh?.causalMap : null) ??
    buildCausalMapLayerV0();

  const epistemicSubject =
    opts.includeEpistemicSubject === false ? null : getGlobalEpistemicIdentityV0();
  const continuityReport = getLastEpistemicIdentityContinuityReportV0();

  const subjectId = epistemicSubject?.epistemicIdentityId ?? "unbound";
  const epistemicVerdict =
    continuityReport?.verdict ?? IDENTITY_CONTINUITY_VERDICT_V0.UNINITIALIZED;

  const manifest = Object.freeze({
    schema: IDENTITY_MANIFEST_PROJECTION_SCHEMA_V0,
    phase: IDENTITY_MANIFEST_PHASE_V0,
    projectedAtMs: Date.now(),
    subjectId,
    constitutionalAnchor: CONSTITUTIONAL_ANCHOR_V0,
    causalSummary: summarizeCausalMapV0(causalMap),
    epistemicSubject: epistemicSubject
      ? Object.freeze({
          epistemicIdentityId: epistemicSubject.epistemicIdentityId,
          rootDigest: epistemicSubject.rootDigest,
          ledgerIdentityHash: epistemicSubject.ledgerIdentityHash,
          tickGraphDigest: epistemicSubject.tickGraphDigest,
          fingerprintChainLength: epistemicSubject.fingerprintChainLength,
          reproConsistent: epistemicSubject.reproConsistent
        })
      : null,
    identityPipeline: summarizeIdentityPipelineV0(),
    continuityVerdict: IDENTITY_MANIFEST_CONTINUITY_VERDICT_V0,
    epistemicVerdict,
    interpretationOnly: true,
    readOnly: true,
    influencesExecution: false
  });

  lastProjectionV0 = manifest;
  syncIdentityManifestWindowV0(manifest);
  return manifest;
}

export function getLastIdentityManifestProjectionV0() {
  return lastProjectionV0;
}

/** Test-only */
export function clearIdentityManifestProjectionForTestV0() {
  lastProjectionV0 = null;
  identityManifestConsoleMountedV0 = false;
  if (typeof window !== "undefined" && window.__rhizoh) {
    delete window.__rhizoh.identityManifest;
    delete window.__rhizoh_identity_manifest;
  }
}

/** Mount console API before first project() (browser only). */
export function mountIdentityManifestConsoleV0() {
  if (typeof window === "undefined" || identityManifestConsoleMountedV0) return;
  identityManifestConsoleMountedV0 = true;
  syncIdentityManifestWindowV0(null);
}

function syncIdentityManifestWindowV0(manifest) {
  if (typeof window === "undefined") return;
  window.__rhizoh = window.__rhizoh || {};
  if (manifest) window.__rhizoh_identity_manifest = manifest;
  window.__rhizoh.identityManifest = Object.freeze({
    project: projectIdentityManifestV0,
    last: () => lastProjectionV0,
    refresh: () => projectIdentityManifestV0()
  });
}
