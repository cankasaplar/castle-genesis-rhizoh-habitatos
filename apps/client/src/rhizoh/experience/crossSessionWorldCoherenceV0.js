/**
 * CORE-ELIGIBLE — Cross-session world coherence (v0).
 *
 * Session mutation is ephemeral; this anchor (localStorage) preserves
 * *felt similarity* when the same visitor returns days later.
 *
 * Not shared state — personal coherence anchor only.
 */

import { readWorldMutationLedgerV0, writeWorldMutationLedgerV0 } from "./worldMutationFeedbackV0.js";
import { readLivingWorldPersistenceV0 } from "./livingWorldPersistenceUxV0.js";

export const CROSS_SESSION_COHERENCE_SCHEMA_V0 = "castle.rhizoh.cross_session_coherence.v0";

const STORAGE_KEY_V0 = "rhizoh.cross_session.coherence.v0";

/** Blend session ledger toward anchor after this gap (ms). */
export const COHERENCE_REHYDRATE_GAP_MS_V0 = 24 * 60 * 60 * 1000;

/** How strongly return visits pull toward anchor (0–1). */
export const COHERENCE_BLEND_STRENGTH_V0 = 0.42;

function clamp01(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

function lerp(a, b, t) {
  return a + (b - a) * clamp01(t);
}

function storageKeyV0(worldInstanceId) {
  return `${STORAGE_KEY_V0}:${String(worldInstanceId || "default")}`;
}

function nowMs() {
  return Date.now();
}

/**
 * @param {unknown} raw
 */
export function parseCrossSessionCoherenceAnchorV0(raw) {
  if (!raw || typeof raw !== "object") return null;
  const o = /** @type {Record<string, unknown>} */ (raw);
  if (o.schema !== CROSS_SESSION_COHERENCE_SCHEMA_V0) return null;
  return Object.freeze({
    schema: CROSS_SESSION_COHERENCE_SCHEMA_V0,
    worldInstanceId: String(o.worldInstanceId || ""),
    observationImprint: clamp01(o.observationImprint),
    castleAffinity: clamp01(o.castleAffinity),
    atmosphereShift: clamp01(o.atmosphereShift),
    atmosphereSignature: String(o.atmosphereSignature || ""),
    visitCountAtSeal: Math.max(0, Number(o.visitCountAtSeal) || 0),
    sealedAtMs: Number(o.sealedAtMs) || 0
  });
}

/**
 * @param {string} worldInstanceId
 */
export function readCrossSessionCoherenceAnchorV0(worldInstanceId) {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(storageKeyV0(worldInstanceId));
    if (!raw) return null;
    return parseCrossSessionCoherenceAnchorV0(JSON.parse(raw));
  } catch {
    return null;
  }
}

/**
 * Persist long-term felt anchor (pagehide / session end).
 *
 * @param {string} worldInstanceId
 */
export function sealCrossSessionCoherenceAnchorV0(worldInstanceId) {
  const id = String(worldInstanceId || "");
  if (!id || typeof localStorage === "undefined") return null;

  const ledger = readWorldMutationLedgerV0(id);
  const persist = readLivingWorldPersistenceV0(id);
  const anchor = Object.freeze({
    schema: CROSS_SESSION_COHERENCE_SCHEMA_V0,
    worldInstanceId: id,
    observationImprint: ledger.observationImprint,
    castleAffinity: ledger.castleAffinity,
    atmosphereShift: ledger.atmosphereShift,
    atmosphereSignature: persist?.lastAtmosphereLead || persist?.lastWeatherType || "",
    visitCountAtSeal: persist?.visitCount ?? 0,
    sealedAtMs: nowMs()
  });

  try {
    localStorage.setItem(storageKeyV0(id), JSON.stringify(anchor));
  } catch {
    return null;
  }
  return anchor;
}

/**
 * On return after long gap: blend session ledger toward anchor so world *feels* familiar.
 *
 * @param {{
 *   worldInstanceId: string,
 *   lastVisitGapMs?: number,
 *   returning?: boolean
 * }} io
 */
export function hydrateCrossSessionCoherenceV0(io) {
  const id = String(io?.worldInstanceId || "");
  const anchor = readCrossSessionCoherenceAnchorV0(id);
  if (!anchor) {
    return Object.freeze({ hydrated: false, anchor: null, ledger: readWorldMutationLedgerV0(id) });
  }

  const gapFromAnchor = anchor.sealedAtMs > 0 ? nowMs() - anchor.sealedAtMs : 0;
  const gap = Math.max(Number(io?.lastVisitGapMs) || 0, gapFromAnchor);
  const longGap =
    gap >= COHERENCE_REHYDRATE_GAP_MS_V0 || Boolean(io?.returning && gap > 90_000);
  const cur = readWorldMutationLedgerV0(id);

  if (!longGap && cur.mutationGeneration > 0) {
    return Object.freeze({ hydrated: false, anchor, ledger: cur });
  }

  const t = COHERENCE_BLEND_STRENGTH_V0;
  const blended = Object.freeze({
    ...cur,
    worldInstanceId: id,
    observationImprint: clamp01(lerp(cur.observationImprint, anchor.observationImprint, t)),
    castleAffinity: clamp01(lerp(cur.castleAffinity, anchor.castleAffinity, t)),
    atmosphereShift: clamp01(lerp(cur.atmosphereShift, anchor.atmosphereShift, t))
  });
  writeWorldMutationLedgerV0(blended);

  return Object.freeze({
    hydrated: true,
    anchor,
    ledger: blended,
    coherenceLine: describeCrossSessionCoherenceV0({ anchor, gapMs: gap, hydrated: true })
  });
}

/**
 * @param {{
 *   anchor: ReturnType<typeof parseCrossSessionCoherenceAnchorV0> | null,
 *   gapMs?: number,
 *   hydrated?: boolean
 * }} io
 */
export function describeCrossSessionCoherenceV0(io) {
  if (!io.anchor) return null;
  if (io.hydrated) {
    return "Uzun aradan sonra dünya tanıdık — ritim korunuyor, küçük farklar var.";
  }
  const gap = Number(io.gapMs) || 0;
  const days = Math.floor(gap / (24 * 60 * 60 * 1000));
  if (days >= 3) {
    return "Günler sonra aynı örnek — his benzer, detaylar hafifçe kaymış.";
  }
  if (days >= 1) {
    return "Dünkü ritim hatırlanıyor — dünya seni tanıyor.";
  }
  return null;
}

export function clearCrossSessionCoherenceForTestV0(worldInstanceId) {
  if (typeof localStorage === "undefined") return;
  try {
    if (worldInstanceId) {
      localStorage.removeItem(storageKeyV0(worldInstanceId));
    } else {
      for (let i = localStorage.length - 1; i >= 0; i -= 1) {
        const k = localStorage.key(i);
        if (k && k.startsWith(STORAGE_KEY_V0)) localStorage.removeItem(k);
      }
    }
  } catch {
    /* noop */
  }
}
