/**
 * Cesium Ion token sanity — avoid INVALID_TOKEN 401 spam when prod env is empty or placeholder.
 */

/**
 * @param {string} [token]
 * @returns {boolean}
 */
export function isCesiumIonTokenUsableV0(token) {
  const t = String(token ?? "").trim();
  if (t.length < 16) return false;
  if (/^(your_|placeholder|invalid|xxx|test_token)/i.test(t)) return false;
  if (t.includes("YOUR-") || t.includes("INSERT")) return false;
  return true;
}
