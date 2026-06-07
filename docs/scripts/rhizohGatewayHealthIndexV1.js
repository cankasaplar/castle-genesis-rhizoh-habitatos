/**
 * Rhizoh Gateway Health Index v1 — read-only observability (Phase 0)
 * Reads real runtime sources; does not mutate gateway state.
 * @see docs/RHIZOH_GATEWAY_HEALTH_INDEX_V0.md
 */
(function rhizohGatewayHealthIndexV1(global) {
  const TIMELINE_KEY = "castle.gateway.timeline.v1";

  function readTimeline() {
    try {
      const raw = global.sessionStorage?.getItem(TIMELINE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function computeFlapPressure(entries) {
    const now = Date.now();
    const arr = entries.filter((e) => now - (Number(e?.at) || 0) < 90_000);
    let flips = 0;
    for (let i = 1; i < arr.length; i++) {
      const a = String(arr[i - 1]?.phase || "");
      const b = String(arr[i]?.phase || "");
      const aOff = /offline|offline_dns/.test(a);
      const bOn = b === "connected" || b === "uncertain";
      const aOn = a === "connected" || a === "uncertain";
      const bOff = /offline|offline_dns/.test(b);
      if ((aOff && bOn) || (aOn && bOff)) flips += 1;
    }
    let level = "calm";
    if (flips >= 4) level = "warm";
    if (flips >= 7) level = "hot";
    return { flips90s: flips, sampleCount90s: arr.length, level };
  }

  function readGatewaySources() {
    const keeper = global.__CASTLE_GATEWAY_SESSION_KEEPER__ || null;
    let snapshot = null;
    try {
      snapshot =
        typeof global.__CASTLE_BUILD_RUNTIME_SNAPSHOT__ === "function"
          ? global.__CASTLE_BUILD_RUNTIME_SNAPSHOT__()
          : null;
    } catch {
      snapshot = null;
    }

    const gatewayState = snapshot?.gatewayState || null;
    const phase = gatewayState?.phase || keeper?.lastPhase || null;
    const timeline = readTimeline();
    const flap = computeFlapPressure(timeline);
    const now = Date.now();
    const sinceHealthOk =
      keeper?.lastHealthOkAt > 0 ? now - Number(keeper.lastHealthOkAt) : null;

    return {
      phase,
      health_status: gatewayState?.healthConfidence != null ? "rolling" : null,
      health_confidence: gatewayState?.healthConfidence ?? null,
      health_sample_n: gatewayState?.healthSampleN ?? null,
      health_fail_n: gatewayState?.healthFailN ?? null,
      health_churn: gatewayState?.healthChurnEscalated === true,
      session_stable: keeper?.sessionStable === true,
      reconnect_attempts: keeper?.reconnectAttempts ?? null,
      since_health_ok_ms: sinceHealthOk,
      flap,
      connection_id: keeper?.connectionId || snapshot?.connectionId || null,
      timeline_tail: timeline.slice(-8)
    };
  }

  function classifyFalseOfflineRisk(sources) {
    const notes = [];
    let falseOfflineLikely = false;

    if (sources.phase === "uncertain") {
      falseOfflineLikely = true;
      notes.push("phase=uncertain — debounce holding session (not full offline)");
    }
    if (sources.session_stable && /offline/.test(String(sources.phase || ""))) {
      falseOfflineLikely = true;
      notes.push("session_stable but phase offline — likely transient health miss");
    }
    if (sources.flap.flips90s > 0 && sources.flap.flips90s <= 2) {
      notes.push(`${sources.flap.flips90s} flap(s) in 90s — cold start / network jitter band`);
    }
    if (sources.health_churn) {
      notes.push("rolling churn escalated — sustained health failures");
    }

    return { falseOfflineLikely, notes };
  }

  function computeIndex(sources) {
    let score = 100;
    const notes = [];

    const ph = String(sources.phase || "").toLowerCase();
    if (ph === "connected" || ph === "degraded" || ph === "degraded_llm" || ph === "degraded_storage") {
      /* ok base */
    } else if (ph === "uncertain") {
      score -= 15;
      notes.push("uncertain phase");
    } else if (/offline/.test(ph)) {
      score -= 45;
      notes.push("offline phase");
    } else if (ph === "connecting" || ph === "reconnecting" || ph === "initializing") {
      score -= 25;
      notes.push("bootstrap in progress");
    } else if (!ph) {
      score -= 20;
      notes.push("phase unknown — app shell may not have published gatewayUx yet");
    }

    if (sources.since_health_ok_ms != null && sources.since_health_ok_ms > 25_000) {
      score -= Math.min(25, Math.floor((sources.since_health_ok_ms - 25_000) / 5_000) * 5);
      notes.push(`last health ok ${sources.since_health_ok_ms}ms ago`);
    }

    if (sources.flap.level === "warm") {
      score -= 15;
      notes.push("flap warm");
    } else if (sources.flap.level === "hot") {
      score -= 30;
      notes.push("flap hot");
    }

    if ((sources.reconnect_attempts ?? 0) > 3) {
      score -= 10;
      notes.push(`reconnect_attempts=${sources.reconnect_attempts}`);
    }

    if (sources.health_confidence != null && sources.health_confidence < 0.75) {
      score -= 15;
      notes.push(`health confidence ${Math.round(sources.health_confidence * 100)}%`);
    }

    score = Math.max(0, Math.min(100, score));

    const gate = score >= 75 ? "STABLE" : score >= 50 ? "WATCH" : "UNSTABLE";

    return {
      score,
      gate,
      notes,
      ...classifyFalseOfflineRisk(sources)
    };
  }

  function mapSemanticGatewayState(sources) {
    const ph = String(sources.phase || "").toLowerCase();
    const notes = [];

    if (ph === "connected") {
      return Object.freeze({ state: "healthy", severity: "ok", notes: ["probe ok"] });
    }
    if (ph === "uncertain") {
      return Object.freeze({
        state: "uncertain",
        severity: "warn",
        notes: ["soft state — session preserved · not hard offline"]
      });
    }
    if (ph === "degraded" || ph === "degraded_llm" || ph === "degraded_storage") {
      return Object.freeze({ state: "degraded", severity: "warn", notes: ["reachable but dependency weak"] });
    }
    if (ph === "connecting" || ph === "reconnecting" || ph === "initializing") {
      return Object.freeze({
        state: "warming_up",
        severity: "warn",
        notes: ["bootstrap retry — not crash"]
      });
    }
    if (/offline/.test(ph)) {
      const bootWindow =
        typeof global.performance !== "undefined" &&
        global.performance.timeOrigin != null &&
        Date.now() - global.performance.timeOrigin < 25_000;

      if (bootWindow || (sources.reconnect_attempts ?? 0) <= 5) {
        notes.push("boot/cold-start band — Log #2 pattern");
        return Object.freeze({
          state: "warming_up",
          severity: "warn",
          notes: [...notes, "probe fail during convergence · SCR may still advance"]
        });
      }

      if (sources.session_stable && sources.falseOfflineLikely) {
        return Object.freeze({
          state: "uncertain",
          severity: "warn",
          notes: ["hard offline label but session_stable — treat as soft"]
        });
      }

      return Object.freeze({
        state: "offline",
        severity: "bad",
        notes: ["persistent probe failure"]
      });
    }

    return Object.freeze({ state: "unknown", severity: "warn", notes: ["phase not published yet"] });
  }

  function read() {
    const sources = readGatewaySources();
    const falseOffline = classifyFalseOfflineRisk(sources);
    const sourcesWithRisk = { ...sources, ...falseOffline };
    const index = computeIndex(sourcesWithRisk);
    const semantic = mapSemanticGatewayState({ ...sources, falseOfflineLikely: falseOffline.falseOfflineLikely });
    return Object.freeze({
      schema: "castle.rhizoh.gateway_health_index.v1",
      atMs: Date.now(),
      sources: Object.freeze(sourcesWithRisk),
      semantic: Object.freeze(semantic),
      index: Object.freeze(index)
    });
  }

  global.rhizohGatewayHealth = Object.freeze({
    read,
    readGatewaySources,
    computeIndex,
    mapSemanticGatewayState
  });
})(typeof window !== "undefined" ? window : globalThis);
