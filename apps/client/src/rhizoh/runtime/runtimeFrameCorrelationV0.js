/**
 * Runtime frame correlation — tab-scoped id + gateway phase timeline (sessionStorage).
 * Bridges boot log, gateway flap, fatals (via payload.runtimeFrameId), voice/studio hooks later.
 *
 * @see docs/RHIZOH_RUNTIME_FRAME_CORRELATION_V0.md
 */

const LAST_FRAME_SS = "castle.last_frame.v1";
const GATEWAY_TIMELINE_SS = "castle.gateway.timeline.v1";
const MAX_TIMELINE = 96;
/** Aynı sekmede kısa süreli yenilemelerde aynı frame (debug için). */
const FRAME_REUSE_TTL_MS = 30 * 60 * 1000;

/**
 * @returns {string|null}
 */
export function getRuntimeFrameId() {
  try {
    return typeof window !== "undefined" && window.__CASTLE_RUNTIME_FRAME_ID__
      ? String(window.__CASTLE_RUNTIME_FRAME_ID__)
      : null;
  } catch {
    return null;
  }
}

function newFrameId() {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return `rf_${crypto.randomUUID()}`;
    }
  } catch {
    /* noop */
  }
  return `rf_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Idempotent: call once from main boot. Binds `window.__CASTLE_RUNTIME_FRAME_ID__` + `castle.last_frame.v1`.
 * @returns {string}
 */
export function initRuntimeFrameOnce() {
  if (typeof window === "undefined") return "";
  if (window.__CASTLE_RUNTIME_FRAME_ID__) return String(window.__CASTLE_RUNTIME_FRAME_ID__);

  let id = "";
  try {
    const raw = sessionStorage.getItem(LAST_FRAME_SS);
    if (raw) {
      const p = JSON.parse(raw);
      const at = Number(p?.at);
      if (p?.frameId && Number.isFinite(at) && Date.now() - at < FRAME_REUSE_TTL_MS) {
        id = String(p.frameId);
      }
    }
  } catch {
    /* noop */
  }
  if (!id) id = newFrameId();
  try {
    window.__CASTLE_RUNTIME_FRAME_ID__ = id;
  } catch {
    /* noop */
  }
  persistLastFrameSnapshot({ gatewayPhase: null, note: "boot_init" });
  return id;
}

/**
 * @param {Record<string, unknown>} extra
 */
export function persistLastFrameSnapshot(extra = {}) {
  const frameId = getRuntimeFrameId() || "";
  const row = {
    at: Date.now(),
    frameId,
    ...extra
  };
  try {
    sessionStorage.setItem(LAST_FRAME_SS, JSON.stringify(row));
  } catch {
    /* noop */
  }
}

/**
 * @param {string} phase
 * @param {Record<string, unknown>} [extra]
 */
export function recordGatewayPhaseForTimeline(phase, extra = {}) {
  const frameId = getRuntimeFrameId() || "";
  const entry = {
    at: Date.now(),
    frameId,
    phase: String(phase || ""),
    ...extra
  };
  let arr = [];
  try {
    const raw = sessionStorage.getItem(GATEWAY_TIMELINE_SS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) arr = parsed;
    }
  } catch {
    arr = [];
  }
  arr.push(entry);
  while (arr.length > MAX_TIMELINE) arr.shift();
  try {
    sessionStorage.setItem(GATEWAY_TIMELINE_SS, JSON.stringify(arr));
  } catch {
    /* noop */
  }
  persistLastFrameSnapshot({ gatewayPhase: phase, ...extra });
  detectAndLogGatewayFlap();
}

/**
 * @returns {{ at?: number, phase?: string, frameId?: string }[]}
 */
export function readGatewayTimelineEntries() {
  try {
    const raw = typeof sessionStorage !== "undefined" ? sessionStorage.getItem(GATEWAY_TIMELINE_SS) : "";
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * connected ↔ offline flip sayısı + poll / retry için önerilen ek gecikme (ms).
 * @param {{ at?: number, phase?: string }[]} [entriesOverride] — verilmezse sessionStorage okunur.
 */
export function computeGatewayFlapPressure(entriesOverride) {
  const now = Date.now();
  const arr = Array.isArray(entriesOverride)
    ? entriesOverride
    : readGatewayTimelineEntries().filter((e) => now - (Number(e?.at) || 0) < 90_000);
  let flips = 0;
  for (let i = 1; i < arr.length; i++) {
    const a = String(arr[i - 1]?.phase || "");
    const b = String(arr[i]?.phase || "");
    const aOff = /offline|offline_dns/.test(a);
    const bOn = b === "connected" || b === "uncertain";
    const aOn = a === "connected" || a === "uncertain";
    const bOff = /offline|offline_dns/.test(b);
    if ((aOff && bOn) || (aOn && bOff)) flips += 1;
  }
  const suggestedPollExtraMs = Math.min(48_000, Math.max(0, flips - 2) * 6_000);
  const suggestedRetryExtraMs = Math.min(8_000, flips * 1_200);
  let level = "calm";
  if (flips >= 4) level = "warm";
  if (flips >= 7) level = "hot";
  return {
    flips90s: flips,
    sampleCount90s: arr.length,
    suggestedPollExtraMs,
    suggestedRetryExtraMs,
    level
  };
}

function detectAndLogGatewayFlap() {
  const now = Date.now();
  const { flips90s, sampleCount90s } = computeGatewayFlapPressure();
  if (sampleCount90s < 8 || flips90s < 4) return;
  const key = "__CASTLE_GATEWAY_FLAP_LOG_AT__";
  const last = typeof window !== "undefined" ? Number(window[key]) || 0 : 0;
  if (now - last < 45_000) return;
  try {
    if (typeof window !== "undefined") window[key] = now;
  } catch {
    /* noop */
  }
  try {
    console.warn(
      "[CASTLE_GATEWAY_FLAP]",
      JSON.stringify({
        flips90sApprox: flips90s,
        samples90s: sampleCount90s,
        timelineKey: GATEWAY_TIMELINE_SS,
        hint: "Health poll backoff + jitter active when flips rise; see computeGatewayFlapPressure"
      })
    );
  } catch {
    /* noop */
  }
}
