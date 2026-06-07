/**
 * Companion timeline v0 — derived from PWE eventLog (single truth).
 */

import { COMPANION_PRESENCE_STATE_LABELS_TR_V0 } from "./companionPresenceStateV0.js";

export const COMPANION_TIMELINE_SCHEMA_V0 = "castle.companion_timeline.v0";

/** @typedef {"observation" | "conversation" | "training" | "exploration" | "presence" | "castle" | "studio"} CompanionTimelineKindV0 */

/**
 * @param {object} entry
 * @returns {{ kind: CompanionTimelineKindV0, label: string, atMs: number, action: string } | null}
 */
function mapEventToTimelineRowV0(entry) {
  if (!entry?.atMs || !entry?.action) return null;
  const action = String(entry.action);
  const payload = entry.payload && typeof entry.payload === "object" ? entry.payload : {};

  if (action === "COMPANION_OBS_SPAWN") {
    return {
      kind: "observation",
      label: "Dünyaya eşlik etmeye başladı",
      atMs: entry.atMs,
      action
    };
  }
  if (action === "CASTLE_PWE_SPAWN") {
    return {
      kind: "castle",
      label: "Castle anchor ile bağlandı",
      atMs: entry.atMs,
      action
    };
  }
  if (action === "PRESENCE_STATE") {
    const st = payload.state || payload.presenceState;
    const label = COMPANION_PRESENCE_STATE_LABELS_TR_V0[st] || st || "Presence";
    const kind =
      st === "training" ? "training" : st === "exploring" ? "exploration" : "presence";
    return { kind, label: `Presence: ${label}`, atMs: entry.atMs, action };
  }
  if (action === "PRESENCE_PATCH") {
    if (payload.presenceState) {
      const st = payload.presenceState;
      const label = COMPANION_PRESENCE_STATE_LABELS_TR_V0[st] || st;
      const kind =
        st === "training" ? "training" : st === "exploring" ? "exploration" : "presence";
      return { kind, label: `Presence: ${label}`, atMs: entry.atMs, action };
    }
    if (payload.observable === true) {
      return { kind: "observation", label: "Gözlem alanında", atMs: entry.atMs, action };
    }
    return null;
  }
  if (action === "STATE_PATCH") {
    const keys = payload.keys || [];
    if (keys.includes("animation") && payload.animation === "explore") {
      return { kind: "exploration", label: "Keşif modu (studio)", atMs: entry.atMs, action };
    }
    if (keys.includes("mood") || keys.includes("trust")) {
      return { kind: "studio", label: "Studio state güncellendi", atMs: entry.atMs, action };
    }
    return null;
  }
  if (action === "CASTLE_PWE_REBIND") {
    return { kind: "castle", label: "Castle merkezi güncellendi", atMs: entry.atMs, action };
  }
  if (action === "TIMELINE_CONVERSATION") {
    return {
      kind: "conversation",
      label: String(payload.preview || "Konuşma"),
      atMs: entry.atMs,
      action
    };
  }
  return null;
}

/**
 * @param {import("./castlePersistentWorldEntityV0.js").CastlePweV0 | null} pwe
 * @param {{ limit?: number }} [opts]
 */
export function buildCompanionTimelineV0(pwe, opts = {}) {
  const limit = Math.max(1, Math.min(32, Number(opts.limit) || 12));
  if (!pwe?.eventLog?.length) {
    return Object.freeze({ schema: COMPANION_TIMELINE_SCHEMA_V0, rows: Object.freeze([]) });
  }

  const rows = [];
  for (let i = pwe.eventLog.length - 1; i >= 0 && rows.length < limit; i--) {
    const row = mapEventToTimelineRowV0(pwe.eventLog[i]);
    if (row) rows.push(Object.freeze(row));
  }

  return Object.freeze({
    schema: COMPANION_TIMELINE_SCHEMA_V0,
    pweId: pwe.id,
    rows: Object.freeze(rows)
  });
}

/**
 * Optional hook from gateway/comms (later).
 * @param {{ preview?: string, source?: string }} [detail]
 */
export function appendCompanionConversationTimelineV0(detail = {}) {
  import("./castlePersistentWorldEntityV0.js")
    .then((m) => {
      m.appendCastlePweTimelineEventV0("TIMELINE_CONVERSATION", {
        preview: String(detail.preview || "").slice(0, 120),
        source: detail.source || "gateway"
      });
    })
    .catch(() => {});
}
