/**
 * CORE-ELIGIBLE — Persistent self signature (user identity ≠ session identity).
 *
 * - **Session identity:** world instance id (tab/session bucket)
 * - **User identity:** stable self signature (localStorage, cross-session)
 *
 * Drift / entropy economy binds to self signature — not session alone.
 */

export const IDENTITY_DRIFT_BINDING_SCHEMA_V0 = "castle.rhizoh.identity_drift_binding.v0";

const STORAGE_KEY_V0 = "rhizoh.self_signature.v0";

function djb2Hex8(input) {
  const s = String(input || "");
  let h = 5381;
  for (let i = 0; i < s.length; i += 1) {
    h = (h * 33) ^ s.charCodeAt(i);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

function nowMs() {
  return Date.now();
}

function storageKeyV0() {
  return STORAGE_KEY_V0;
}

/**
 * @param {unknown} raw
 */
export function parseSelfSignatureRecordV0(raw) {
  if (!raw || typeof raw !== "object") return null;
  const o = /** @type {Record<string, unknown>} */ (raw);
  if (o.schema !== IDENTITY_DRIFT_BINDING_SCHEMA_V0) return null;
  return Object.freeze({
    schema: IDENTITY_DRIFT_BINDING_SCHEMA_V0,
    selfSignature: String(o.selfSignature || ""),
    createdAtMs: Number(o.createdAtMs) || 0,
    seedHint: String(o.seedHint || "")
  });
}

/**
 * Resolve or mint persistent self signature.
 *
 * @param {{ timeZone?: string, locale?: string, worldInstanceId?: string }} [io]
 */
export function resolvePersistentSelfSignatureV0(io = {}) {
  if (typeof localStorage !== "undefined") {
    try {
      const raw = localStorage.getItem(storageKeyV0());
      const parsed = raw ? parseSelfSignatureRecordV0(JSON.parse(raw)) : null;
      if (parsed?.selfSignature) return parsed.selfSignature;
    } catch {
      /* mint below */
    }
  }

  const seedHint = [io.timeZone || "UTC", io.locale || "und", io.worldInstanceId || ""].join("|");
  const lang =
    typeof navigator !== "undefined" && navigator.language ? navigator.language : "und";
  const selfSignature = `self_${djb2Hex8(`${seedHint}|${lang}|identity_v0`)}`;

  if (typeof localStorage !== "undefined") {
    try {
      localStorage.setItem(
        storageKeyV0(),
        JSON.stringify({
          schema: IDENTITY_DRIFT_BINDING_SCHEMA_V0,
          selfSignature,
          createdAtMs: nowMs(),
          seedHint
        })
      );
    } catch {
      /* quota */
    }
  }
  return selfSignature;
}

/**
 * @param {string} worldInstanceId
 */
export function resolveSessionIdentityV0(worldInstanceId) {
  return Object.freeze({
    sessionId: String(worldInstanceId || ""),
    kind: "world_instance_session",
    ephemeral: true
  });
}

/**
 * Bind drift context: user signature + session bucket.
 *
 * @param {{
 *   worldInstanceId: string,
 *   timeZone?: string,
 *   locale?: string
 * }} io
 */
export function bindIdentityDriftContextV0(io) {
  const session = resolveSessionIdentityV0(io.worldInstanceId);
  const selfSignature = resolvePersistentSelfSignatureV0({
    timeZone: io.timeZone,
    locale: io.locale,
    worldInstanceId: io.worldInstanceId
  });

  return Object.freeze({
    schema: IDENTITY_DRIFT_BINDING_SCHEMA_V0,
    selfSignature,
    sessionIdentity: session.sessionId,
    userIdentity: selfSignature,
    sessionEphemeral: true,
    driftBindingKey: `${selfSignature}:${session.sessionId}`
  });
}

/**
 * Short display hint (not full id in UI — orientation only).
 * @param {string} selfSignature
 */
export function formatSelfSignatureHintV0(selfSignature) {
  const s = String(selfSignature || "");
  if (!s.startsWith("self_")) return "anon";
  return `self · ${s.slice(-4)}`;
}

export function clearSelfSignatureForTestV0() {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.removeItem(storageKeyV0());
  } catch {
    /* noop */
  }
}
