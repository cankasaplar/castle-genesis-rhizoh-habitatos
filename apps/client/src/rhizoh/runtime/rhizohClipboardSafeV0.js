/**
 * Safe clipboard copy — focused document only; never throws.
 * DevTools / unfocused tab → download or console fallback.
 */

/**
 * @param {string} text
 * @param {{ filename?: string, logOnFallback?: boolean }} [opts]
 * @returns {Promise<{ ok: boolean, method: string, hint?: string }>}
 */
export async function copyTextSafeV0(text, opts = {}) {
  const filename = String(opts.filename || "rhizoh-copy.txt");
  const logOnFallback = opts.logOnFallback !== false;

  const canClipboard =
    typeof document !== "undefined" &&
    typeof navigator !== "undefined" &&
    typeof navigator.clipboard?.writeText === "function" &&
    (typeof document.hasFocus !== "function" || document.hasFocus());

  if (canClipboard) {
    try {
      await navigator.clipboard.writeText(text);
      return { ok: true, method: "clipboard" };
    } catch {
      /* fall through */
    }
  }

  if (typeof document !== "undefined") {
    try {
      const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.rel = "noopener";
      document.body?.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      return {
        ok: true,
        method: "download",
        hint: "Clipboard blocked — brief downloaded as file."
      };
    } catch {
      /* fall through */
    }
  }

  if (logOnFallback && typeof console !== "undefined") {
    console.log(text);
  }

  return {
    ok: false,
    method: "console_log",
    hint:
      "Clipboard blocked (focus DevTools tab or use Studio Copy brief button). Brief printed above."
  };
}
