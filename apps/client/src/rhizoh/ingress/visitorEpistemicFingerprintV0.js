/**
 * Visitor epistemic fingerprint v0 — WRITE-FREE soft continuity.
 * State reconstruction from observation; NOT memory · NOT identity.
 * @see docs/RHIZOH_EPISTEMIC_SOFT_IDENTITY_V0.md
 */

import { getObserverTraceSnapshotV0 } from "./observerReadOnlyHookV0.js";
import { getVisitorEpistemicTraceV0 } from "./visitorEpistemicTraceV0.js";

export const VISITOR_EPISTEMIC_FINGERPRINT_SCHEMA_V0 = "castle.rhizoh.visitor_epistemic_fingerprint.v0";

const SURFACE_KEYS_V0 = Object.freeze(["map", "chess", "castle", "media", "chat"]);

function djb2HexV0(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = (h * 33) ^ str.charCodeAt(i);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

/**
 * @param {{ type?: string, target?: string, meta?: { surface?: string } }} entry
 */
export function inferSurfaceFromObserverEventV0(entry) {
  const metaSurface = String(entry?.meta?.surface || "").toLowerCase();
  if (SURFACE_KEYS_V0.includes(metaSurface)) return metaSurface;

  const type = String(entry?.type || "").toLowerCase();
  if (type.includes("map") || type === "world_path") return "map";
  if (type.includes("chess")) return "chess";
  if (type.includes("castle")) return "castle";
  if (type.includes("media") || type.includes("player")) return "media";
  if (type.includes("invite") || type.includes("chat")) return "chat";
  return null;
}

function normalizeAttentionVectorV0(weights) {
  const sum = SURFACE_KEYS_V0.reduce((acc, key) => acc + (weights[key] || 0), 0) || 1;
  return Object.freeze(
    SURFACE_KEYS_V0.reduce((acc, key) => {
      acc[key] = Math.round(((weights[key] || 0) / sum) * 1000) / 1000;
      return acc;
    }, /** @type {Record<string, number>} */ ({}))
  );
}

function computeReturnLikelihoodV0(visitor, attentionTotal, sessions) {
  const base = Number(visitor?.return_probability ?? 0) || 0;
  const depthBoost = Math.min(0.35, attentionTotal * 0.08);
  const sessionBoost = Math.min(0.25, Math.max(0, sessions - 1) * 0.12);
  return Math.round(Math.min(0.98, base + depthBoost + sessionBoost) * 100) / 100;
}

function computeStabilityIndexV0(sessions, attentionPattern, priorPattern) {
  const sessionFactor = Math.min(1, sessions / 4);
  if (!priorPattern) {
    return Math.round(sessionFactor * 0.45 * 100) / 100;
  }
  let delta = 0;
  for (const key of SURFACE_KEYS_V0) {
    delta += Math.abs((attentionPattern[key] || 0) - (priorPattern[key] || 0));
  }
  const consistency = Math.max(0, 1 - delta / 2);
  return Math.round(Math.min(1, sessionFactor * 0.55 + consistency * 0.45) * 100) / 100;
}

/**
 * Reconstruct fingerprint from live observation planes (B only).
 * @param {{ visitor?: object, observerTrace?: object, priorAttentionPattern?: Record<string, number> }} [opts]
 */
export function buildVisitorEpistemicFingerprintV0(opts = {}) {
  const visitor = opts.visitor ?? getVisitorEpistemicTraceV0();
  const observerTrace = opts.observerTrace ?? getObserverTraceSnapshotV0();
  const entries = observerTrace?.entries || [];

  const attentionWeights = SURFACE_KEYS_V0.reduce((acc, key) => {
    acc[key] = 0;
    return acc;
  }, /** @type {Record<string, number>} */ ({}));

  for (const entry of entries) {
    const surface = inferSurfaceFromObserverEventV0(entry);
    if (!surface) continue;
    attentionWeights[surface] = (attentionWeights[surface] || 0) + (Number(entry?.intensity) || 0.1);
  }

  for (const surface of visitor?.visited_surfaces || []) {
    if (SURFACE_KEYS_V0.includes(surface)) {
      attentionWeights[surface] = (attentionWeights[surface] || 0) + 0.15;
    }
  }

  const attentionTotal = Object.values(attentionWeights).reduce((a, b) => a + b, 0);
  const attention_pattern = normalizeAttentionVectorV0(attentionWeights);

  const eventCanon = entries
    .map((e) => `${e.type}:${e.target}:${e.intensity ?? 0.1}`)
    .sort()
    .join("|");
  const pathCanon = (visitor?.path || []).join(">");
  const session_signature = `eps_${djb2HexV0(`${eventCanon}#${pathCanon}`)}`;

  const sessions = Number(visitor?.sessions ?? 0) || 0;
  const return_likelihood = computeReturnLikelihoodV0(visitor, attentionTotal, sessions);
  const stability_index = computeStabilityIndexV0(
    sessions,
    attention_pattern,
    opts.priorAttentionPattern
  );

  return Object.freeze({
    schema: VISITOR_EPISTEMIC_FINGERPRINT_SCHEMA_V0,
    session_signature,
    attention_pattern,
    return_likelihood,
    stability_index,
    observerEventCount: entries.length,
    reconstructionOnly: true,
    isMemory: false,
    isIdentity: false,
    influencesCausalGraph: false,
    influencesIdentity: false
  });
}
