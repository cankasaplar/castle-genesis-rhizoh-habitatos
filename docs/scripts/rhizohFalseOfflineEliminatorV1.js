/**
 * Rhizoh False-Offline Eliminator v1 — observe layer (Phase 0.8)
 * Filters boot false-offlines; surfaces only real degradation.
 * Paste on rhizoh.com after Ground Truth + optional Gateway Health Index.
 * @see docs/RHIZOH_GATEWAY_HEALTH_INDEX_V0.md
 */
(function rhizohFalseOfflineEliminatorV1(global) {
  const BOOT_WINDOW_MS = 25_000;

  function navAgeMs() {
    if (typeof global.performance !== "undefined" && global.performance.timeOrigin != null) {
      return Date.now() - global.performance.timeOrigin;
    }
    return null;
  }

  function keeper() {
    return global.__CASTLE_GATEWAY_SESSION_KEEPER__ || {};
  }

  function resolveSemantic(phase, ctx = {}) {
    if (global.rhizohGatewayHealth?.mapSemanticGatewayState) {
      const sources = global.rhizohGatewayHealth.readGatewaySources?.() || {};
      return global.rhizohGatewayHealth.mapSemanticGatewayState({
        ...sources,
        phase: phase || sources.phase,
        falseOfflineLikely: ctx.falseOfflineLikely
      });
    }

    const ph = String(phase || "");
    const everConnected = ctx.everConnected === true;
    const sinceNavMs = ctx.sinceNavMs ?? navAgeMs();
    const reconnectAttempts = ctx.reconnectAttempts ?? keeper().reconnectAttempts ?? 0;

    if (ph === "connected") return { state: "healthy", severity: "ok" };
    if (ph === "uncertain") return { state: "uncertain", severity: "warn" };
    if (/offline/.test(ph) && !everConnected && sinceNavMs != null && sinceNavMs < BOOT_WINDOW_MS) {
      return { state: "warming_up", severity: "warn", suppressed_false_offline: true };
    }
    if (/offline/.test(ph)) return { state: "offline", severity: "bad" };
    return { state: "unknown", severity: "warn" };
  }

  function shouldSuppressOfflineLog(phase, ctx = {}) {
    const sem = resolveSemantic(phase, ctx);
    return sem.state === "warming_up" || sem.state === "uncertain";
  }

  function filterObserveLog(entries = []) {
    let everConnected = false;
    return entries.map((entry, i) => {
      const phase = entry.session?.gateway_phase ?? entry.system?.gateway_phase;
      if (phase === "connected") everConnected = true;

      const semantic = resolveSemantic(phase, {
        everConnected,
        sinceNavMs: entry.ground_truth?.ts
          ? entry.ground_truth.ts - (entries[0]?.ground_truth?.ts ?? entry.ground_truth.ts)
          : navAgeMs(),
        reconnectAttempts: entry.session?.reconnect_attempts
      });

      const falseOffline =
        /offline/.test(String(phase || "")) &&
        (semantic.state === "warming_up" || semantic.state === "uncertain");

      return Object.freeze({
        i,
        label: entry.meta?.label ?? entry.ground_truth?.label ?? `#${i}`,
        raw_phase: phase,
        semantic,
        false_offline_eliminated: falseOffline,
        signal: entry.signal ?? null,
        delta: entry.delta ?? null
      });
    });
  }

  function report(entries) {
    const list = filterObserveLog(Array.isArray(entries) ? entries : global.__rhizoh_observe_log || []);
    const eliminated = list.filter((r) => r.false_offline_eliminated).length;
    const realOffline = list.filter((r) => r.semantic?.state === "offline").length;
    const healthy = list.filter((r) => r.semantic?.state === "healthy").length;

    const summary = Object.freeze({
      schema: "castle.rhizoh.false_offline_eliminator.v1",
      samples: list.length,
      false_offline_eliminated: eliminated,
      real_offline: realOffline,
      healthy,
      verdict:
        realOffline > 0 && eliminated === 0
          ? "investigate_real_degradation"
          : eliminated > 0 && realOffline === 0
            ? "cold_start_only"
            : "mixed"
    });

    console.log("🛡️ FALSE-OFFLINE ELIMINATOR REPORT");
    console.table(summary);
    return Object.freeze({ summary, rows: list });
  }

  global.rhizohFalseOffline = Object.freeze({
    resolveSemantic,
    shouldSuppressOfflineLog,
    filterObserveLog,
    report
  });

  console.log("🛡️ rhizohFalseOffline ready — rhizohFalseOffline.report()");
})(typeof window !== "undefined" ? window : globalThis);
