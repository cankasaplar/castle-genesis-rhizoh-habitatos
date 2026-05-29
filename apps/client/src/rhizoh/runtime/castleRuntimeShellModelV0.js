/**
 * PR-1 — `productSurface` (core | world | demo) ile alt çubuk (UnifiedProductShellBar) UX id'leri ayrımı.
 * Alt çubuktaki id'ler tarihsel kısayollar; `productSurface` ile birebir aynı değildir.
 *
 * @param {string} pathname
 * @param {{ productSurface: string }} snapshot
 * @returns {string} shell item id veya "" (demo)
 */
export function deriveShellHighlightId(pathname, snapshot) {
  const productSurface = String(snapshot?.productSurface || "");
  if (productSurface === "demo") return "";
  if (productSurface === "world") return "world";
  const p = String(pathname || "");
  if (p.startsWith("/hall/")) return "hall";
  if (p.startsWith("/greenroom/") && !p.startsWith("/greenroom/live/")) return "greenroom";
  if (p.startsWith("/greenroom/live/") || p.startsWith("/broadcast/")) return "broadcast";
  if (p.startsWith("/studio") || p.startsWith("/spiral")) return "studio";
  if (p.startsWith("/settings") || p.startsWith("/academy")) return "profile";
  if (p === "/" || p === "") return "world";
  if (p.startsWith("/map") || p.startsWith("/world")) return "world";
  return "world";
}
