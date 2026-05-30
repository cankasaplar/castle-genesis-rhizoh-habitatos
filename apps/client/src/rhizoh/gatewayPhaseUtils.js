/** Ağ geçidi yeniden deneme / uyarı gösterme — faz ayrımı tek kaynak */

export function rhizohGatewayPhaseShowsRetry(phase) {
  const p = String(phase || "");
  return (
    p === "offline" ||
    p === "offline_dns" ||
    p === "uncertain" ||
    p === "degraded" ||
    p === "degraded_llm" ||
    p === "degraded_storage" ||
    p === "maintenance"
  );
}
