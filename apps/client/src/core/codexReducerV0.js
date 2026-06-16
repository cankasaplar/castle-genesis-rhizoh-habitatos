/**
 * Codex reducer — pure STATE = f(EVENTS) fold.
 */

export const RHIZOH_CODEX_STATE_SCHEMA_V0 = "castle.rhizoh.codex_state.v0";

export const CODEX_EVENT_TYPE_V0 = Object.freeze({
  AWAKEN: "AWAKEN",
  GHOST_DISPATCH: "GHOST_DISPATCH",
  GHOST_ARCHIVED: "GHOST_ARCHIVED"
});

/**
 * @returns {object}
 */
export function createInitialCodexStateV0() {
  return Object.freeze({
    schema: RHIZOH_CODEX_STATE_SCHEMA_V0,
    totalGhosts: 0,
    cycleLayer: 0,
    stats: Object.freeze({
      awakenCount: 0,
      dispatchCount: 0,
      archivedCount: 0
    }),
    ghosts: Object.freeze([]),
    ghostArchive: Object.freeze([])
  });
}

/**
 * @param {object} state
 * @param {{ type?: string, payload?: object, seq?: number }} event
 */
export function reduceCodexEventV0(state, event) {
  const base = state && typeof state === "object" ? state : createInitialCodexStateV0();
  const type = String(event?.type || "");
  const payload = event?.payload && typeof event.payload === "object" ? event.payload : {};

  if (type === CODEX_EVENT_TYPE_V0.AWAKEN) {
    const cycleLayer = Math.max(0, Number(base.cycleLayer) || 0) + 1;
    const stats = {
      awakenCount: (base.stats?.awakenCount || 0) + 1,
      dispatchCount: base.stats?.dispatchCount || 0,
      archivedCount: base.stats?.archivedCount || 0
    };
    return Object.freeze({
      ...base,
      cycleLayer,
      stats: Object.freeze(stats),
      lastAwaken: Object.freeze({
        pin: String(payload.pin || payload.continent || ""),
        triggerPinIndex: Number(payload.triggerPinIndex),
        triggerPinId: String(payload.triggerPinId || "")
      })
    });
  }

  if (type === CODEX_EVENT_TYPE_V0.GHOST_DISPATCH) {
    const ghost = Object.freeze({
      id: String(payload.id || `ghost_replay_${event?.seq || 0}`),
      type: String(payload.type || "mirror"),
      origin: String(payload.origin || ""),
      destination: String(payload.destination || ""),
      cycleLayer: Number(payload.cycleLayer) || base.cycleLayer || 0,
      preference: String(payload.preference || "adaptive"),
      entropy: Number(payload.entropy) || 0.5,
      archived: false
    });
    const ghosts = [...(Array.isArray(base.ghosts) ? base.ghosts : []), ghost];
    const stats = {
      awakenCount: base.stats?.awakenCount || 0,
      dispatchCount: (base.stats?.dispatchCount || 0) + 1,
      archivedCount: base.stats?.archivedCount || 0
    };
    return Object.freeze({
      ...base,
      totalGhosts: ghosts.length,
      ghosts: Object.freeze(ghosts),
      stats: Object.freeze(stats)
    });
  }

  if (type === CODEX_EVENT_TYPE_V0.GHOST_ARCHIVED) {
    const ghostId = String(payload.id || payload.ghostId || "");
    const active = (Array.isArray(base.ghosts) ? base.ghosts : []).filter((g) => g.id !== ghostId);
    const archivedGhost = (Array.isArray(base.ghosts) ? base.ghosts : []).find((g) => g.id === ghostId);
    const archive = [...(Array.isArray(base.ghostArchive) ? base.ghostArchive : [])];
    if (archivedGhost) archive.push(Object.freeze({ ...archivedGhost, archived: true }));
    const stats = {
      awakenCount: base.stats?.awakenCount || 0,
      dispatchCount: base.stats?.dispatchCount || 0,
      archivedCount: (base.stats?.archivedCount || 0) + (archivedGhost ? 1 : 0)
    };
    return Object.freeze({
      ...base,
      totalGhosts: active.length,
      ghosts: Object.freeze(active),
      ghostArchive: Object.freeze(archive),
      stats: Object.freeze(stats)
    });
  }

  return base;
}

/**
 * @param {object[]} events
 * @param {object} [initial]
 */
export function foldCodexEventsV0(events, initial) {
  let state = initial || createInitialCodexStateV0();
  const list = Array.isArray(events) ? events : [];
  for (const event of list) {
    state = reduceCodexEventV0(state, event);
  }
  return state;
}
