/**
 * Cognitive UX Layer v0 — compositor: perception → traversal → experience.
 *
 * Closes the chain: Binding (görür) + CAL (gezer) + CNR guard (ayırır).
 * RESEARCH-ONLY · nonExecutive · CAL-01 · CNR-01
 * @see docs/RHIZOH_COGNITIVE_UX_LAYER_V1.md
 */

import { assertCnrTripleSeparationV0 } from "./causalNavigationRuntimeV0.js";
import {
  bindCognitiveVisualizationV0,
  EPISTEMIC_UI_EVENT_V0
} from "./cognitiveVisualizationBindingV0.js";
import {
  bindCognitiveActionV0,
  CAL_INTERACTION_TYPE_V0,
  exploreEpistemicInteractionV0,
  exploreEpistemicSpaceV0
} from "./cognitiveActionLayerV0.js";
import { listMutationRecordsV0 } from "./mutationRecordEmitterV0.js";
import { runTicketMemoryPipelineV0 } from "./ticketMemoryPipelineV0.js";
import { buildMultiSpaceViewportV0 } from "./cognitiveUxSpatialProjectionV0.js";
import { MUTATION_REASON_CATEGORY_V1 } from "./mutationReasonCodeOntologyV1.js";
import { CAUSAL_SPACE_ID_V0 } from "../runtime/sportsCausalSpaceV0.js";
import { getSportsDriftCategoryCountsV0 } from "../runtime/rhizohUglSportsAdapterV0.js";
import {
  ingestSportsMatchEventV0,
  normalizeSportsMatchEventV0
} from "../runtime/sportsEventAdapterV0.js";

export const COGNITIVE_UX_SCHEMA_V0 = "castle.rhizoh.cognitive_ux.v0";
export const COGNITIVE_UX_TRAVERSAL_EVENT_V0 = "rhizoh:cognitive-ux-traversal-v0";
export const COGNITIVE_UX_SPACE_TRAVERSAL_EVENT_V0 = "rhizoh:cognitive-ux-space-traversal-v0";

/**
 * @param {string} nodeId
 */
function parseTraversalNodeIdV0(nodeId) {
  const raw = String(nodeId || "").trim();
  if (!raw) {
    return Object.freeze({
      interactionType: CAL_INTERACTION_TYPE_V0.CATEGORY_SPIKE_CLICK,
      targetCategory: MUTATION_REASON_CATEGORY_V1.SC
    });
  }

  const [kind, value] = raw.includes(":") ? raw.split(":", 2) : ["category", raw];

  switch (kind) {
    case "category":
      return Object.freeze({
        interactionType: CAL_INTERACTION_TYPE_V0.CATEGORY_SPIKE_CLICK,
        targetCategory: value || MUTATION_REASON_CATEGORY_V1.SC
      });
    case "alert":
      return Object.freeze({
        interactionType: CAL_INTERACTION_TYPE_V0.ALERT_PACKET_CLICK,
        alertId: value
      });
    case "rec":
      return Object.freeze({
        interactionType: CAL_INTERACTION_TYPE_V0.REC_EPOCH_CLICK,
        epochId: value
      });
    case "audit":
      return Object.freeze({
        interactionType: CAL_INTERACTION_TYPE_V0.AUDIT_CHAIN_CLICK,
        auditChain: { mutationId: value }
      });
    case "ticket":
      return Object.freeze({
        interactionType: CAL_INTERACTION_TYPE_V0.AUDIT_CHAIN_CLICK,
        auditChain: { ticketId: value }
      });
    default:
      return Object.freeze({
        interactionType: CAL_INTERACTION_TYPE_V0.CATEGORY_SPIKE_CLICK,
        targetCategory: MUTATION_REASON_CATEGORY_V1.SC,
        nodeId: raw
      });
  }
}

/**
 * Traversal engine hook — read_only lineage walk from spatial node click.
 * @param {{
 *   nodeId: string,
 *   mode?: string,
 *   lineageDepth?: number,
 *   pipeline?: object,
 *   alerts?: object[],
 *   dispatchEvent?: boolean
 * }} input
 */
export function onUserTraverseV0(input) {
  const mode = String(input.mode || "read_only");
  if (mode !== "read_only") {
    throw new Error("CAL-01: traversal mode must be read_only");
  }

  const parsed = parseTraversalNodeIdV0(input.nodeId);
  const records = listMutationRecordsV0(input.lineageDepth ?? 50);
  const alerts = input.alerts ?? input.pipeline?.anomalies?.alerts;

  const exploration = exploreEpistemicInteractionV0({
    ...parsed,
    records,
    alerts
  });

  const packet = Object.freeze({
    schema: COGNITIVE_UX_SCHEMA_V0,
    eventKind: "cognitive:traversal",
    nodeId: input.nodeId,
    mode,
    lineageDepth: input.lineageDepth ?? 50,
    exploration,
    executionClass: "read_only",
    causallyInert: true,
    interpretationOnly: true,
    nonExecutive: true
  });

  if (input.dispatchEvent !== false && typeof globalThis !== "undefined" && globalThis.dispatchEvent) {
    globalThis.dispatchEvent(new CustomEvent(COGNITIVE_UX_TRAVERSAL_EVENT_V0, { detail: packet }));
  }

  return packet;
}

/**
 * Space-level traversal — CAL multiplexing across causal spaces.
 * @param {{
 *   spaceId: string,
 *   nodeId?: string,
 *   matchId?: string,
 *   mode?: string,
 *   lineageDepth?: number,
 *   dispatchEvent?: boolean
 * }} input
 */
export function onUserTraverseSpaceV0(input) {
  const mode = String(input.mode || "read_only");
  if (mode !== "read_only") {
    throw new Error("CAL-01: space traversal mode must be read_only");
  }

  const exploration = exploreEpistemicSpaceV0({
    spaceId: input.spaceId,
    nodeId: input.nodeId,
    matchId: input.matchId || input.nodeId,
    lineageDepth: input.lineageDepth ?? 50
  });

  const packet = Object.freeze({
    schema: COGNITIVE_UX_SCHEMA_V0,
    eventKind: "cognitive:space-traversal",
    spaceId: input.spaceId,
    nodeId: input.nodeId,
    matchId: input.matchId || input.nodeId,
    mode,
    exploration,
    executionClass: "read_only",
    causallyInert: true,
    interpretationOnly: true,
    nonExecutive: true
  });

  if (input.dispatchEvent !== false && typeof globalThis !== "undefined" && globalThis.dispatchEvent) {
    globalThis.dispatchEvent(new CustomEvent(COGNITIVE_UX_SPACE_TRAVERSAL_EVENT_V0, { detail: packet }));
  }

  return packet;
}

/**
 * @param {{
 *   pipeline: object,
 *   interaction?: object | null,
 *   dispatchEvents?: boolean,
 *   matchId?: string
 * }} input
 */
export function bindCognitiveUxV0(input) {
  const p = input.pipeline;
  const binding = bindCognitiveVisualizationV0({
    pipeline: {
      index: p.index,
      analytics: p.analytics,
      anomalies: p.anomalies,
      reconcile: p.reconcile,
      commit: p.commit,
      admission: p.admission
    },
    dispatchEvent: input.dispatchEvents === true
  });

  const cognitiveAction = input.interaction
    ? bindCognitiveActionV0({
        interaction: input.interaction,
        pipeline: p
      })
    : null;

  const viewport = buildMultiSpaceViewportV0(binding, {
    sportsDriftCategories: getSportsDriftCategoryCountsV0(input.matchId || "")
  });
  const cnrGuard = assertCnrTripleSeparationV0({
    cognitiveBinding: binding,
    cognitiveAction,
    commit: p.commit
  });

  if (!cnrGuard.ok) {
    throw new Error(cnrGuard.violations?.join("; ") || "CNR-01 boundary violation");
  }

  return Object.freeze({
    schema: COGNITIVE_UX_SCHEMA_V0,
    binding,
    cognitiveAction,
    viewport,
    cnrGuard,
    verbs: Object.freeze({
      traverse: "gezer",
      perceive: "görür",
      approve: "onaylar"
    }),
    interpretationOnly: true,
    nonExecutive: true,
    cubeStateCommit: false
  });
}

/**
 * @param {{
 *   records?: object[],
 *   interaction?: object | null,
 *   dispatchEvents?: boolean,
 *   pipelineOpts?: object
 * }} [input]
 */
export function buildCognitiveUxSnapshotV0(input = {}) {
  const records = input.records ?? listMutationRecordsV0(200);
  const pipeline = runTicketMemoryPipelineV0({
    records,
    bindVisualization: true,
    bindCux: true,
    wireSignals: false,
    dispatchEvents: false,
    ...input.pipelineOpts
  });

  const cux = bindCognitiveUxV0({
    pipeline,
    interaction: input.interaction ?? null,
    dispatchEvents: input.dispatchEvents
  });

  return Object.freeze({
    schema: `${COGNITIVE_UX_SCHEMA_V0}.snapshot`,
    pipeline,
    cux,
    eventChannels: Object.freeze({
      perception: EPISTEMIC_UI_EVENT_V0,
      traversal: COGNITIVE_UX_TRAVERSAL_EVENT_V0,
      spaceTraversal: COGNITIVE_UX_SPACE_TRAVERSAL_EVENT_V0
    }),
    causalSpaces: Object.freeze([CAUSAL_SPACE_ID_V0.CHESS, CAUSAL_SPACE_ID_V0.SPORTS]),
    atMs: Date.now(),
    interpretationOnly: true,
    nonExecutive: true
  });
}

export function isCognitiveUxEnabledV0() {
  if (typeof import.meta !== "undefined" && import.meta.env?.DEV) return true;
  if (typeof localStorage === "undefined") return false;
  try {
    return localStorage.getItem("castle.cux.v0") === "1";
  } catch {
    return false;
  }
}

export function ensureCognitiveUxV0() {
  if (typeof window === "undefined") return null;
  window.__rhizoh = window.__rhizoh || {};
  if (!window.__rhizoh.cognitiveUxSnapshot) {
    window.__rhizoh.cognitiveUxSnapshot = () => buildCognitiveUxSnapshotV0();
  }
  if (!window.__rhizoh.cognitiveUxTraverse) {
    window.__rhizoh.cognitiveUxTraverse = (nodeId, opts) =>
      onUserTraverseV0({ nodeId, ...(opts || {}) });
  }
  if (!window.__rhizoh.traverseSpace) {
    window.__rhizoh.traverseSpace = (spaceId, nodeIdOrMatchId, opts) =>
      onUserTraverseSpaceV0({
        spaceId,
        nodeId: nodeIdOrMatchId,
        matchId: nodeIdOrMatchId,
        ...(opts || {})
      });
  }
  if (!window.__rhizoh.ingestSportsEvent) {
    window.__rhizoh.ingestSportsEvent = (raw) =>
      ingestSportsMatchEventV0(normalizeSportsMatchEventV0(raw));
  }
  if (!window.__rhizoh.cognitiveUxEnabled) {
    window.__rhizoh.cognitiveUxEnabled = () => isCognitiveUxEnabledV0();
  }
  return window.__rhizoh.cognitiveUxSnapshot;
}
