/**
 * Safe JSON export — clipboard only when document focused; always falls back to download.
 * Avoids CASTLE_FATAL on DevTools / unfocused tab clipboard writes.
 */

/**
 * @param {string} json
 * @param {string} filename
 * @returns {Promise<{ ok: boolean, method: string }>}
 */
export async function exportJsonSafeV0(json, filename) {
  const canClipboard =
    typeof document !== "undefined" &&
    typeof navigator !== "undefined" &&
    navigator.clipboard?.writeText &&
    (typeof document.hasFocus !== "function" || document.hasFocus());

  if (canClipboard) {
    try {
      await navigator.clipboard.writeText(json);
      return { ok: true, method: "clipboard" };
    } catch {
      /* fall through to download */
    }
  }

  if (typeof document !== "undefined") {
    try {
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.rel = "noopener";
      document.body?.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      return { ok: true, method: "download" };
    } catch {
      return { ok: false, method: "download_failed" };
    }
  }

  return { ok: false, method: "none" };
}
