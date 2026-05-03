/** @param {number} x */
function clamp01(x) {
  return Math.max(0, Math.min(1, Number(x) || 0));
}

/**
 * @param {{ events?: unknown[], interactions?: unknown[], coPresenceGraph?: Record<string, {count?:number,lastSeenAt?:number}> }} timeline
 */
export function computeAttentionDrift(timeline) {
  const t = timeline && typeof timeline === "object" ? timeline : {};
  const ev = Array.isArray(t.events) ? t.events : [];
  const ix = Array.isArray(t.interactions) ? t.interactions : [];
  const cp = t.coPresenceGraph && typeof t.coPresenceGraph === "object" ? t.coPresenceGraph : {};
  const now = Date.now();
  const recentEvents = ev.filter((e) => now - (Number(e?.ts) || 0) < 120_000);
  const activeEvents = recentEvents.length;
  const interactionMomentum = clamp01(ix.slice(-24).length / 24);
  const coEdges = Object.keys(cp).length;
  const coPresenceMomentum = clamp01(coEdges / 24);
  const direction =
    interactionMomentum > 0.64 ? "dialogue_focus" : coPresenceMomentum > 0.58 ? "room_scan" : "self_anchor";
  return {
    direction,
    activeEvents,
    interactionMomentum: Math.round(interactionMomentum * 1000) / 1000,
    coPresenceMomentum: Math.round(coPresenceMomentum * 1000) / 1000
  };
}

