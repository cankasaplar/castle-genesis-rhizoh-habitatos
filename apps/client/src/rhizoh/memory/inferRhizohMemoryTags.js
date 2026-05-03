/**
 * Hafıza etiketleri (intent-conditioned retrieval için hafif ipucu).
 * @param {string} userText
 * @param {string} assistantText
 * @returns {string[]}
 */
export function inferRhizohMemoryTags(userText, assistantText) {
  const t = `${String(userText || "")} ${String(assistantText || "")}`.toLowerCase();
  const tags = [];
  if (/mimari|architecture|router|kernel|pipeline|modül|layer\b/i.test(t)) tags.push("architecture");
  if (/cesium|harita|tile|terrain|real_map|globe|flyto/i.test(t)) tags.push("cesium");
  if (/hata|crash|bug|fix|error|çök|exception|debug/i.test(t)) tags.push("crisis");
  if (/gateway|401|429|503|token|ağ geçidi/i.test(t)) tags.push("gateway");
  if (/hafıza|memory|continuity|codex|session/i.test(t)) tags.push("memory");
  if (/duygu|ton|ilişki|bond|trust/i.test(t)) tags.push("relational");
  return [...new Set(tags)].slice(0, 8);
}
