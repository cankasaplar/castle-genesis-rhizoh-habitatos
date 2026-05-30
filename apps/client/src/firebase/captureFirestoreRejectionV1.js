/**
 * Firestore write rejections — exact code + message for rules vs payload debugging.
 * @see docs/FIRESTORE_RULES_VS_STUDIO_ENVELOPE_AUDIT_V0.md
 */

/**
 * @param {unknown} err
 * @returns {{ code: string, message: string, name: string, customData: Record<string, unknown> | null, at: number }}
 */
export function normalizeFirestoreReject(err) {
  const code = err && typeof err === "object" && err.code != null ? String(err.code) : "";
  const message = err && typeof err === "object" && err.message != null ? String(err.message) : String(err || "");
  const name = err && typeof err === "object" && err.name != null ? String(err.name) : "";
  const customData =
    err && typeof err === "object" && err.customData && typeof err.customData === "object"
      ? /** @type {Record<string, unknown>} */ (err.customData)
      : null;
  return { code, message, name, customData, at: Date.now() };
}

/**
 * Logs structured reject + stores last row on window for DevTools / support.
 * @param {string} context
 * @param {unknown} err
 * @param {Record<string, unknown>} [extra]
 * @returns {ReturnType<typeof normalizeFirestoreReject>}
 */
export function logFirestoreRejection(context, err, extra = {}) {
  const n = normalizeFirestoreReject(err);
  const row = { context, ...n, ...(extra && typeof extra === "object" ? extra : {}) };
  try {
    console.error("[CASTLE_FIRESTORE_REJECT]", JSON.stringify(row));
  } catch {
    console.error("[CASTLE_FIRESTORE_REJECT]", context, n.code, n.message);
  }
  try {
    if (typeof window !== "undefined") {
      window.__CASTLE_LAST_FIRESTORE_REJECT__ = row;
    }
  } catch {
    /* noop */
  }
  return n;
}
