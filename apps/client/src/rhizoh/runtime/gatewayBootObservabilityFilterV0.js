/**
 * Gateway boot observability filter v0 — false-offline eliminator (boot log SSOT).
 * Suppresses hard offline boot logs during cold-start convergence band.
 * @see docs/RHIZOH_GATEWAY_HEALTH_INDEX_V0.md
 */

export const GATEWAY_BOOT_WARMING_WINDOW_MS = 25_000;

/**
 * @param {{
 *   phase?: string,
 *   everConnected?: boolean,
 *   sinceNavMs?: number,
 *   reconnectAttempts?: number
 * }} input
 * @returns {{
 *   event: string,
 *   level: "ok" | "warn",
 *   semantic: string,
 *   message: string,
 *   detail?: string,
 *   suppressed_false_offline?: boolean
 * } | null}
 */
export function resolveGatewayBootObservabilityLogV0(input = {}) {
  const phase = String(input.phase || "");
  if (!phase) return null;

  if (phase === "connected") {
    return {
      event: "app.gateway.connected",
      level: "ok",
      semantic: "healthy",
      message: "Rhizoh gateway online"
    };
  }

  if (phase === "uncertain") {
    return {
      event: "app.gateway.uncertain",
      level: "ok",
      semantic: "uncertain",
      message: "Gateway verification soft-fail — session preserved"
    };
  }

  if (phase === "degraded" || phase === "degraded_llm" || phase === "degraded_storage") {
    return {
      event: "app.gateway.degraded",
      level: "warn",
      semantic: "degraded",
      message: phase,
      detail: phase
    };
  }

  if (phase === "offline" || phase === "offline_dns") {
    const sinceNavMs = Number(input.sinceNavMs);
    const reconnectAttempts = Number(input.reconnectAttempts) || 0;
    const everConnected = input.everConnected === true;
    const inBootBand =
      !everConnected &&
      ((Number.isFinite(sinceNavMs) && sinceNavMs >= 0 && sinceNavMs < GATEWAY_BOOT_WARMING_WINDOW_MS) ||
        reconnectAttempts <= 5);

    if (inBootBand) {
      return {
        event: "app.gateway.warming_up",
        level: "ok",
        semantic: "warming_up",
        message: `probe pending (${phase}) — cold start convergence`,
        detail: phase,
        suppressed_false_offline: true
      };
    }

    return {
      event: "app.gateway.offline",
      level: "warn",
      semantic: "offline",
      message: phase,
      detail: phase
    };
  }

  return null;
}

/**
 * Observe-side: reclassify raw phase for drift / reports (no boot log side effects).
 * @param {string} phase
 * @param {{ everConnected?: boolean, sinceNavMs?: number, reconnectAttempts?: number }} [ctx]
 */
export function mapGatewaySemanticStateV0(phase, ctx = {}) {
  const log = resolveGatewayBootObservabilityLogV0({ phase, ...ctx });
  if (!log) return { state: "unknown", severity: "warn" };
  return {
    state: log.semantic,
    severity: log.semantic === "healthy" ? "ok" : log.semantic === "offline" ? "bad" : "warn",
    suppressed_false_offline: log.suppressed_false_offline === true
  };
}
