/**
 * Bilişsel iz etiketi — niyet + ağ geçidi fazı → kısa İngilizce trace kelimesi (UI).
 * @param {string} [intent]
 * @param {string} [gatewayPhase]
 */
export function deriveCognitiveTraceLabel(intent, gatewayPhase) {
  const ph = String(gatewayPhase || "");
  if (
    ph === "maintenance" ||
    ph === "offline" ||
    ph === "offline_dns" ||
    ph === "uncertain" ||
    ph === "degraded_llm" ||
    ph === "degraded_storage"
  ) {
    return "restoring";
  }
  const i = String(intent || "CHAT").toUpperCase();
  if (i === "REFLECT") return "present";
  if (i === "CRISIS") return "focused";
  if (i === "BUILD" || i === "PLAY") return "absorbing";
  if (i === "SILENCE") return "listening";
  return "present";
}
