/**
 * Side effects for reality transitions: continuity, heatmap, pet meta, codex hints.
 * Keeps localStorage schema backward-compatible with rhizoh.continuity.v1
 */

const CONTINUITY_KEY = "rhizoh.continuity.v1";
const HEATMAP_KEY = "castle.reality.heatmap.v1";
const HEATMAP_CAP = 200;

function readContinuity() {
  try {
    const raw = window.localStorage.getItem(CONTINUITY_KEY) || "";
    if (!raw) return { turns: [], persona: {}, meta: {} };
    const parsed = JSON.parse(raw);
    return {
      turns: Array.isArray(parsed?.turns) ? parsed.turns.slice(-10) : [],
      persona: parsed?.persona && typeof parsed.persona === "object" ? parsed.persona : {},
      meta: parsed?.meta && typeof parsed.meta === "object" ? parsed.meta : {}
    };
  } catch {
    return { turns: [], persona: {}, meta: {} };
  }
}

function writeContinuity(next) {
  try {
    window.localStorage.setItem(CONTINUITY_KEY, JSON.stringify(next));
  } catch {
    /* noop */
  }
}

/** RhizohMemory: durable note for LLM / continuity (Turkish; success + failure lore). */
export function rhizohRememberReality(p) {
  const base = readContinuity();
  const meta = { ...base.meta };
  const realityLog = Array.isArray(meta.realityLog) ? meta.realityLog.slice() : [];
  const note = p.success
    ? p.to === "REAL_MAP"
      ? `Kullanıcı bugün REAL_MAP (İstanbul sahasına) geçti · kaynak: ${p.source}`
      : `Kullanıcı GLOBE soyut küreye döndü · kaynak: ${p.source}`
    : `Geçiş tamamlanamadı · ${p.reason || "error"} · ${p.from} → ${p.to} · kaynak: ${p.source}`;
  realityLog.push({
    ts: Date.now(),
    from: p.from,
    to: p.to,
    source: p.source,
    durationMs: p.durationMs,
    success: p.success,
    reason: p.reason ?? null,
    note
  });
  meta.realityLog = realityLog.slice(-50);
  writeContinuity({ ...base, meta });
}

/** Heatmap / telemetry ring (local only until you wire PostHog/GA). */
export function recordRealityHeatmap(p) {
  try {
    const raw = window.localStorage.getItem(HEATMAP_KEY) || "";
    let arr = [];
    try {
      const parsed = JSON.parse(raw || "[]");
      arr = Array.isArray(parsed) ? parsed : [];
    } catch {
      arr = [];
    }
    arr.push({
      ts: Date.now(),
      from: p.from,
      to: p.to,
      source: p.source,
      durationMs: p.durationMs,
      success: p.success,
      reason: p.reason ?? null
    });
    window.localStorage.setItem(HEATMAP_KEY, JSON.stringify(arr.slice(-HEATMAP_CAP)));
  } catch {
    /* noop */
  }
}

/** GhostPet: successful REAL_MAP → explorer + curiosity. */
export function touchGhostPetReality(p) {
  if (!p.success || p.to !== "REAL_MAP") return;
  const base = readContinuity();
  const meta = { ...base.meta };
  const prev = meta.ghostPet && typeof meta.ghostPet === "object" ? meta.ghostPet : {};
  const curiosity = Number(prev.curiosity || 0) + 2;
  meta.ghostPet = {
    ...prev,
    mood: "explorer",
    curiosity,
    lastRealMapAt: Date.now(),
    lastSource: p.source
  };
  writeContinuity({ ...base, meta });
}

/** GhostPet: failed transition → confused stack (emergent personality). */
export function touchGhostPetRealityFailure(p) {
  if (p.success) return;
  const base = readContinuity();
  const meta = { ...base.meta };
  const prev = meta.ghostPet && typeof meta.ghostPet === "object" ? meta.ghostPet : {};
  const confused = Number(prev.confused || 0) + 1;
  meta.ghostPet = {
    ...prev,
    mood: "confused",
    confused,
    lastFailedTransitionAt: Date.now(),
    lastFailReason: String(p.reason || "UNKNOWN")
  };
  writeContinuity({ ...base, meta });
}

/** Codex: transition as lore node (success or failure). */
export function appendCodexDiscoveryNode(p) {
  const base = readContinuity();
  const meta = { ...base.meta };
  const nodes = Array.isArray(meta.codexDiscovery) ? meta.codexDiscovery.slice() : [];
  nodes.push({
    id: `rdx-${Date.now().toString(36)}`,
    kind: p.success ? "reality_transition" : "reality_transition_failed",
    from: p.from,
    to: p.to,
    source: p.source,
    success: p.success,
    reason: p.reason ?? null,
    ts: Date.now()
  });
  meta.codexDiscovery = nodes.slice(-80);
  writeContinuity({ ...base, meta });
}

/** Broadcast / presence hook (no-op transport; host app or LiveKit can subscribe). */
export function syncBroadcastPresence(p) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("castle:presence-sync", {
      detail: {
        realm: p.success ? p.to : p.from,
        intendedRealm: p.to,
        source: p.source,
        success: p.success,
        at: Date.now()
      }
    })
  );
}

/** Analytics bridge: host, GTM, or extension listens to `castle:analytics`. */
export function trackRealityAnalytics(p) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("castle:analytics", {
      detail: {
        name: "reality_transition",
        from: p.from,
        to: p.to,
        source: p.source,
        durationMs: p.durationMs,
        success: p.success,
        reason: p.reason ?? null
      }
    })
  );
}
