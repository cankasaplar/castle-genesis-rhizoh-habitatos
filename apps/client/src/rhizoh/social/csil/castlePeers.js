/**
 * Çevrimiçi kale eşleri — CSIL entity + bond graph tohumları.
 */

import { ENTITY_CLASS } from "./identityResolution.js";
import { REL_STAGE } from "./relationshipGraph.js";
import { permissionsFor } from "./trustBoundary.js";
import { INTRO_PHASE } from "./introductionProtocol.js";

/**
 * @param {unknown[]} remoteCastles
 * @param {string} localUid
 * @returns {{ id: string, label: string, bridged: boolean, nexusEnergy?: number }[]}
 */
export function castlePeersForSocial(remoteCastles, localUid) {
  const u = String(localUid || "").trim();
  const list = Array.isArray(remoteCastles) ? remoteCastles : [];
  return list
    .filter((c) => c && String(c.id || "").trim() && String(c.id) !== u)
    .slice(0, 14)
    .map((c) => {
      const id = String(c.id);
      const peers = Array.isArray(c.bridgePeers) ? c.bridgePeers : [];
      return {
        id: `castle_peer_${id}`,
        label: String(c.displayName || id.slice(0, 8)).slice(0, 48),
        bridged: u ? peers.includes(u) : false,
        nexusEnergy: typeof c.nexusEnergy === "number" ? c.nexusEnergy : undefined
      };
    });
}

/**
 * @param {ReturnType<typeof import("./socialRegistry.js").createInitialSocialRegistry>} reg
 * @param {{ id: string, label: string, bridged: boolean }[]} peers
 */
export function mergeCastlePeersIntoRegistry(reg, peers) {
  const r = reg && typeof reg === "object" ? reg : {};
  const now = Date.now();
  for (const p of peers || []) {
    const eid = String(p?.id || "").trim();
    if (!eid) continue;
    const prev = r.entities[eid] || {};
    r.entities[eid] = {
      entityId: eid,
      displayName: String(p.label || eid).slice(0, 48),
      class: ENTITY_CLASS.HUMAN_USER,
      introduced: !!prev.introduced,
      castlePeer: true,
      bridged: !!p.bridged,
      voiceSignature: prev.voiceSignature || null,
      firstSeenAt: prev.firstSeenAt || now,
      lastSeenAt: now,
      identityConfidence: p.bridged ? 0.72 : 0.55,
      identitySource: "castle_active_presence"
    };
    const prevRel = r.relationships[eid] || {};
    r.relationships[eid] = {
      stage: prevRel.stage && prevRel.stage !== "unknown" ? prevRel.stage : REL_STAGE.SEEN,
      familiarity: Math.max(Number(prevRel.familiarity) || 0, p.bridged ? 0.22 : 0.12),
      trust: Math.max(Number(prevRel.trust) || 0, p.bridged ? 0.28 : 0.15),
      userMessageCount: Number(prevRel.userMessageCount) || 0,
      introduced: !!prevRel.introduced,
      displayName: r.entities[eid].displayName
    };
    r.permissions[eid] = permissionsFor(r.relationships[eid].stage, ENTITY_CLASS.HUMAN_USER);
    r.introductions[eid] = r.introductions[eid] || { phase: INTRO_PHASE.WELCOMED, updatedAt: now };
  }
  return r;
}
