/**
 * Narrative Projection Engine v0 — observerTrace → semantic lookup → read-only narrative.
 * NOT epistemic resonance · NOT bidirectional coupling · NOT causal write.
 * @see docs/RHIZOH_NARRATIVE_PROJECTION_ENGINE_V0.md
 */

import { getObserverTraceSnapshotV0, OBSERVER_PLANE_V0 } from "./observerReadOnlyHookV0.js";
import { inferSurfaceFromObserverEventV0 } from "./visitorEpistemicFingerprintV0.js";
import {
  lookupPinSemanticV0,
  lookupSurfaceSemanticV0,
  normalizePinTargetIdV0
} from "./epistemicPinSemanticRegistryV0.js";

export const NARRATIVE_PROJECTION_ENGINE_SCHEMA_V0 =
  "castle.rhizoh.narrative_projection_engine.v0";

/**
 * @param {object} entry
 * @param {{ locale?: string }} opts
 */
function resolveEntryNarrativeV0(entry, opts = {}) {
  const type = String(entry?.type || "");
  const target = String(entry?.target || "");
  const surface = inferSurfaceFromObserverEventV0(entry) || entry?.meta?.surface;
  const salience = Math.min(1, Math.max(0, Number(entry?.intensity ?? 0.1) || 0.1));

  let semantic = null;
  let entityId = target || surface || type;

  if (type.includes("map") || surface === "map") {
    if (target && target !== "fly_to") {
      semantic = lookupPinSemanticV0(target, opts);
      entityId = normalizePinTargetIdV0(target) || target;
    } else {
      semantic = lookupSurfaceSemanticV0("map", opts);
      entityId = "map";
    }
  } else if (type.includes("chess") || surface === "chess") {
    semantic =
      lookupPinSemanticV0(target === "arena" ? "chess_arena" : target, opts) ||
      lookupSurfaceSemanticV0("chess", opts);
    entityId = target || "chess_arena";
  } else if (type.includes("castle") || surface === "castle") {
    semantic = lookupSurfaceSemanticV0("castle", opts);
    entityId = target || "castle";
  } else if (surface) {
    semantic = lookupSurfaceSemanticV0(String(surface), opts);
    entityId = surface;
  }

  if (!semantic) return null;

  return Object.freeze({
    schema: "castle.rhizoh.grounded_narrative_item.v0",
    eventType: type,
    entityId,
    salience,
    title: semantic.title,
    role: semantic.role,
    description: semantic.description,
    registryHit: semantic.registryHit,
    grounded: semantic.grounded,
    semanticCoupling: false,
    epistemicResonance: false,
    bidirectionalInfluence: false,
    readOnly: true,
    interpretationOnly: true,
    influencesCausalGraph: false,
    influencesExecution: false
  });
}

/**
 * Pipeline: observerTrace → attention → semantic lookup → narrative projection.
 * @param {{ observerTrace?: object, locale?: string }} [opts]
 */
export function resolveNarrativeFromObserverTraceV0(opts = {}) {
  const trace = opts.observerTrace ?? getObserverTraceSnapshotV0();
  const entries = trace?.entries || [];
  const locale = opts.locale ?? "en";

  const byEntity = new Map();
  for (const entry of entries) {
    const item = resolveEntryNarrativeV0(entry, { locale });
    if (!item) continue;
    const prev = byEntity.get(item.entityId);
    if (!prev || item.salience > prev.salience) {
      byEntity.set(item.entityId, item);
    }
  }

  const groundedNarratives = [...byEntity.values()].sort((a, b) => b.salience - a.salience);
  const primaryFocus = groundedNarratives[0] ?? null;

  return Object.freeze({
    schema: NARRATIVE_PROJECTION_ENGINE_SCHEMA_V0,
    plane: OBSERVER_PLANE_V0.NARRATIVE,
    groundedNarratives: Object.freeze(groundedNarratives),
    primaryFocus,
    entityCount: groundedNarratives.length,
    semanticCoupling: false,
    epistemicResonance: false,
    bidirectionalInfluence: false,
    readOnly: true,
    interpretationOnly: true,
    influencesCausalGraph: false,
    influencesExecution: false,
    isMemory: false
  });
}

export function mountNarrativeProjectionEngineConsoleV0() {
  if (typeof window === "undefined") return;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.narrativeProjectionEngine = Object.freeze({
    resolve: resolveNarrativeFromObserverTraceV0
  });
}
