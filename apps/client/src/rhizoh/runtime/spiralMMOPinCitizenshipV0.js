/**
 * SpiralMMO pin citizenship — per-pin 6+44 rhythm motion + tiered countdown gates.
 * Birds remain citizenship-exempt (free routes — spiralMMOAwakeningBirdV0).
 * RESEARCH-ONLY — perception pacing; no execution authority.
 */

import {
  RHIZOH_SPIRAL_MMO_BOOTSTRAP_PIN_V0,
  RHIZOH_SPIRAL_MMO_CONTINENT_PINS_V0
} from "./spiralMMOContinentPinsV0.js";
import { resolveSpiralMMOContinentIdV0 } from "./spiralMMOContinentCubeMotionV0.js";

export const SPIRAL_MMO_PIN_CITIZENSHIP_SCHEMA_V0 = "rhizoh.spiral_mmo_pin_citizenship.v0";

/** Shared motion anchor — seconds per full gate-ring revolution family. */
export const SPIRAL_MMO_SIX_FORTY_FOUR_BASE_SEC_V0 = 6.44;

export const SPIRAL_MMO_CITIZENSHIP_TIER_ID_V0 = Object.freeze({
  HOUR: "hour",
  DAY: "day",
  MONTH: "month",
  YEAR: "year"
});

export const SPIRAL_MMO_CITIZENSHIP_TIER_ORDER_V0 = Object.freeze([
  SPIRAL_MMO_CITIZENSHIP_TIER_ID_V0.HOUR,
  SPIRAL_MMO_CITIZENSHIP_TIER_ID_V0.DAY,
  SPIRAL_MMO_CITIZENSHIP_TIER_ID_V0.MONTH,
  SPIRAL_MMO_CITIZENSHIP_TIER_ID_V0.YEAR
]);

/**
 * Tier durations — 6 primary units + 44 secondary units per scale.
 * hour: 6h 44m · day: 6d 44m · month: 6mo + 44d · year: 6y + 44d
 */
export const SPIRAL_MMO_CITIZENSHIP_TIER_DURATION_MS_V0 = Object.freeze({
  hour: (6 * 60 * 60 + 44 * 60) * 1000,
  day: (6 * 24 * 60 * 60 + 44 * 60) * 1000,
  month: (6 * 30 * 24 * 60 * 60 + 44 * 24 * 60 * 60) * 1000,
  year: (6 * 365 * 24 * 60 * 60 + 44 * 24 * 60 * 60) * 1000
});

/** Human-readable 6+44 tier units — hour / day / month / year gates (not minutes alone). */
export const SPIRAL_MMO_SIX_FORTY_FOUR_TIER_LABELS_V0 = Object.freeze({
  hour: Object.freeze({
    short: "6h·44m",
    long: "Hour gate — 6 hours + 44 minutes",
    unit: "hour"
  }),
  day: Object.freeze({
    short: "6d·44m",
    long: "Day gate — 6 days + 44 minutes",
    unit: "day"
  }),
  month: Object.freeze({
    short: "6mo·44d",
    long: "Month gate — 6 months + 44 days",
    unit: "month"
  }),
  year: Object.freeze({
    short: "6y·44d",
    long: "Year gate — 6 years + 44 days",
    unit: "year"
  })
});

/**
 * @param {"hour"|"day"|"month"|"year"} tierId
 */
export function resolveSpiralMMOSixFortyFourTierLabelV0(tierId) {
  const key = String(tierId || SPIRAL_MMO_CITIZENSHIP_TIER_ID_V0.HOUR);
  return SPIRAL_MMO_SIX_FORTY_FOUR_TIER_LABELS_V0[key] || SPIRAL_MMO_SIX_FORTY_FOUR_TIER_LABELS_V0.hour;
}

const SPIRAL_MMO_PIN_CITIZENSHIP_LS_PREFIX_V0 = "rhizoh.spiral_mmo_pin_citizenship_anchor.v0:";

const MS_PER_MIN = 60 * 1000;
const MS_PER_HOUR = 60 * MS_PER_MIN;
const MS_PER_DAY = 24 * MS_PER_HOUR;

/**
 * @param {number} ms
 * @param {"hour"|"day"|"month"|"year"} tierId
 */
export function formatSpiralMMOPinCitizenshipRemainingV0(ms, tierId) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  if (tierId === SPIRAL_MMO_CITIZENSHIP_TIER_ID_V0.HOUR) {
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return `${h}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
  }
  if (tierId === SPIRAL_MMO_CITIZENSHIP_TIER_ID_V0.DAY) {
    const d = Math.floor(total / 86400);
    const rem = total % 86400;
    const h = Math.floor(rem / 3600);
    const m = Math.floor((rem % 3600) / 60);
    return `${d}d ${h}h ${String(m).padStart(2, "0")}m`;
  }
  if (tierId === SPIRAL_MMO_CITIZENSHIP_TIER_ID_V0.MONTH) {
    const days = Math.floor(total / 86400);
    const mo = Math.floor(days / 30);
    const d = days % 30;
    const h = Math.floor((total % 86400) / 3600);
    return `${mo}mo ${d}d ${h}h`;
  }
  const days = Math.floor(total / 86400);
  const y = Math.floor(days / 365);
  const d = days % 365;
  return `${y}y ${d}d`;
}

/**
 * @returns {ReadonlyArray<object>}
 */
function listSpiralMMOPinNodesV0() {
  return Object.freeze([RHIZOH_SPIRAL_MMO_BOOTSTRAP_PIN_V0, ...RHIZOH_SPIRAL_MMO_CONTINENT_PINS_V0]);
}

/**
 * @param {object} node
 * @returns {number}
 */
export function resolveSpiralMMOPinOrdinalV0(node = {}) {
  const pinId = String(node?.id || "").trim();
  const pins = listSpiralMMOPinNodesV0();
  const idx = pins.findIndex((p) => p.id === pinId);
  if (idx >= 0) return idx;
  const continent = resolveSpiralMMOContinentIdV0(node.continent || node.id || "europe");
  const byContinent = pins.findIndex((p) => p.continent === continent);
  return byContinent >= 0 ? byContinent : 0;
}

/**
 * Per-pin unique 6:44 motion family — ring speeds + phase offset.
 * @param {object} node
 */
export function deriveSpiralMMOPinSixFortyFourMotionV0(node = {}) {
  const ordinal = resolveSpiralMMOPinOrdinalV0(node);
  const continent = resolveSpiralMMOContinentIdV0(node.continent || node.id || "europe");
  const scale = 1 + ordinal * (44 / 644);
  const cycleSec = Number((SPIRAL_MMO_SIX_FORTY_FOUR_BASE_SEC_V0 * scale).toFixed(3));
  const ringDefs = [
    { r: 42, speed: 1.0, dash: "28 52" },
    { r: 28, speed: -1.644, dash: "18 34" },
    { r: 14, speed: 2.44, dash: "10 20" }
  ].map((ring, layerIdx) => {
    const layerScale = 1 + ordinal * 0.06 + layerIdx * 0.044;
    const durSec = Number((cycleSec * (0.34 + layerIdx * 0.28) * layerScale).toFixed(3));
    return Object.freeze({
      ...ring,
      speed: ring.speed * (ordinal % 2 === 0 ? 1 : -1) * layerScale,
      durSec,
      dur: `${durSec}s`
    });
  });

  return Object.freeze({
    schema: "rhizoh.spiral_mmo_pin_six_forty_four_motion.v0",
    pinId: String(node?.id || `spiralmmo_${continent}`),
    continent,
    ordinal,
    cycleSec,
    phaseOffsetDeg: (ordinal * 44) % 360,
    ringDefs: Object.freeze(ringDefs)
  });
}

/**
 * @param {string} pinId
 * @param {number} [nowMs]
 */
function readSpiralMMOPinCitizenshipAnchorMsV0(pinId, nowMs = Date.now()) {
  const key = `${SPIRAL_MMO_PIN_CITIZENSHIP_LS_PREFIX_V0}${pinId}`;
  if (typeof window === "undefined") return nowMs;
  try {
    const raw = window.sessionStorage.getItem(key);
    const parsed = Number(raw);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  } catch {
    /* ignore */
  }
  try {
    window.sessionStorage.setItem(key, String(nowMs));
  } catch {
    /* ignore */
  }
  return nowMs;
}

/**
 * @param {object} node
 * @param {number} [nowMs]
 */
export function resolveSpiralMMOPinCitizenshipV0(node, nowMs = Date.now()) {
  const pinId = String(node?.id || `spiralmmo_${resolveSpiralMMOContinentIdV0(node.continent)}`);
  const anchorMs = readSpiralMMOPinCitizenshipAnchorMsV0(pinId, nowMs);
  const motion = deriveSpiralMMOPinSixFortyFourMotionV0({ ...node, id: pinId });

  const tiers = SPIRAL_MMO_CITIZENSHIP_TIER_ORDER_V0.map((tierId) => {
    const durationMs = SPIRAL_MMO_CITIZENSHIP_TIER_DURATION_MS_V0[tierId];
    const deadlineMs = anchorMs + durationMs;
    const remainingMs = Math.max(0, deadlineMs - nowMs);
    return Object.freeze({
      tierId,
      durationMs,
      deadlineMs,
      remainingMs,
      remainingLabel: formatSpiralMMOPinCitizenshipRemainingV0(remainingMs, tierId),
      complete: remainingMs <= 0
    });
  });

  const activeTier = tiers.find((t) => !t.complete) || tiers[tiers.length - 1];

  return Object.freeze({
    schema: SPIRAL_MMO_PIN_CITIZENSHIP_SCHEMA_V0,
    pinId,
    continent: motion.continent,
    anchorMs,
    motion,
    tiers: Object.freeze(tiers),
    activeTierId: activeTier.tierId,
    activeRemainingMs: activeTier.remainingMs,
    activeRemainingLabel: activeTier.remainingLabel,
    fullyCitizen: tiers.every((t) => t.complete),
    citizenshipRequired: true,
    birdsExempt: true,
    atMs: nowMs
  });
}

/**
 * @param {number} [nowMs]
 */
export function listSpiralMMOPinCitizenshipSnapshotsV0(nowMs = Date.now()) {
  return Object.freeze(
    listSpiralMMOPinNodesV0().map((pin) => resolveSpiralMMOPinCitizenshipV0(pin, nowMs))
  );
}

/**
 * DevTools / report hook.
 */
export function publishSpiralMMOPinCitizenshipRegistryV0(nowMs = Date.now()) {
  const pins = listSpiralMMOPinCitizenshipSnapshotsV0(nowMs);
  if (typeof window === "undefined") return pins;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.spiralMMOPinCitizenship = Object.freeze({
    schema: `${SPIRAL_MMO_PIN_CITIZENSHIP_SCHEMA_V0}.registry`,
    pins,
    birdsExempt: true,
    note: "Per-pin 6+44 tier countdown (hour/day/month/year); birds fly spiral flocks with tier badges",
    atMs: nowMs
  });
  window.__rhizoh.listSpiralMMOPinCitizenship = () => listSpiralMMOPinCitizenshipSnapshotsV0();
  return pins;
}

/** @internal vitest */
export function __resetSpiralMMOPinCitizenshipForTestV0() {
  if (typeof window === "undefined") return;
  try {
    const keys = [];
    for (let i = 0; i < window.sessionStorage.length; i += 1) {
      const k = window.sessionStorage.key(i);
      if (k && k.startsWith(SPIRAL_MMO_PIN_CITIZENSHIP_LS_PREFIX_V0)) keys.push(k);
    }
    keys.forEach((k) => window.sessionStorage.removeItem(k));
  } catch {
    /* ignore */
  }
}
