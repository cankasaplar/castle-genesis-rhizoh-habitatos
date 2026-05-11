/**
 * Uzak gateway'de POST /rhizoh/epistemic/seal veya …/logs/batch 404 dönerse (eski deploy / yanlış servis),
 * istemci aynı oturumda bu uçlara tekrar tekrar istek atmasın — konsol gürültüsü ve gereksiz yük azalır.
 */

/** @type {null | boolean} null bilinmiyor, true uçlar en az bir kez 200 ile doğrulandı, false 404 ile kapandı */
let routesReachable = null;
let warned404 = false;

export function getEpistemicGatewayRoutesReachable() {
  return routesReachable;
}

export function markEpistemicGatewayRoutesOk() {
  routesReachable = true;
}

/**
 * @param {"seal"|"batch"} kind
 * @param {string} [base]
 */
export function markEpistemicGatewayRoutesMissing(kind, base = "") {
  if (routesReachable === false) return;
  routesReachable = false;
  if (warned404) return;
  warned404 = true;
  const path = kind === "seal" ? "/rhizoh/epistemic/seal" : "/rhizoh/epistemic/logs/batch";
  const suffix = base ? ` — ${base}` : "";
  console.warn(
    `[Rhizoh epistemic] POST ${path} → 404${suffix}. ` +
      "LLM yolu (/rhizoh/llm) çalışıyor olsa bile bu hostta epistemik HTTP uçları yok veya eski gateway sürümü deploy edilmiş. " +
      "Çözüm: apps/gateway güncel kodunu deploy edin (epistemicSeal + epistemicLogsBatch) ve CASTLE_EPISTEMIC_SEAL_SECRET veya CASTLE_GATEWAY_TOKEN ile mühürü açın. " +
      "Bu oturumda uzak mühür ve ledger batch tekrar denenmeyecek; continuity_saved istemci tarafında sürebilir."
  );
}

/** @internal vitest */
export function __resetEpistemicGatewayCapabilityForTests() {
  routesReachable = null;
  warned404 = false;
}
