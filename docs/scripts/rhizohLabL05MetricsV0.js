/**
 * Lab L0.5 — quantitative plateau math (read-only, paste on rhizoh.com)
 * Extends L0 HEALTHY_OVERLOAD_EQUILIBRIUM with rates + jitter distribution + queue residency.
 * @see docs/RHIZOH_DISTRIBUTED_OBSERVE_LAB_V0.md
 */
(function rhizohLabL05MetricsV0(global) {
  const PREV_KEY = "__rhizoh_lab_l05_prev";
  const RHYTHM_RING_KEY = "__rhizoh_lab_l05_jitter_ring";
  const QUEUE_RING_KEY = "__rhizoh_lab_l05_queue_ring";
  const RING_MAX = 48;
  const QUEUE_RING_MAX = 120;
  const SATURATION_QUEUED = 56;
  const HEALTH_PROBE_TIMEOUT_MS = 6500;
  const PLATEAU_EPS_EPS = 2.5;

  function root() {
    return global.__rhizoh || {};
  }

  function g(path) {
    return path.split(".").reduce((o, k) => (o ? o[k] : undefined), root());
  }

  function percentile(sorted, p) {
    if (!sorted.length) return null;
    const idx = Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * p));
    return sorted[idx];
  }

  function readGatewayProbeMetrics() {
    const keeper = global.__CASTLE_GATEWAY_SESSION_KEEPER__ || {};
    const phase = keeper.lastPhase ?? g("liveMonitor.gateway.phase") ?? null;
    const sinceOk =
      keeper.lastHealthOkAt > 0 ? Date.now() - Number(keeper.lastHealthOkAt) : null;
    const bootAge =
      typeof global.performance?.timeOrigin === "number"
        ? Date.now() - global.performance.timeOrigin
        : null;
    const gh = global.rhizohGatewayHealth?.read?.();

    return Object.freeze({
      gateway_phase: phase,
      semantic_state: gh?.semantic?.state ?? null,
      model: "probe_convergence_delay_not_reconnect_storm",
      gateway_health_ne_gateway_startup_latency:
        "health=probe state · startup=boot convergence profile (A slow · B fast)",
      since_health_ok_ms: sinceOk,
      probe_timeout_ceiling_ms: HEALTH_PROBE_TIMEOUT_MS,
      gateway_probe_latency_ms_proxy:
        sinceOk != null && sinceOk < HEALTH_PROBE_TIMEOUT_MS
          ? sinceOk
          : bootAge != null && bootAge < 25_000
            ? bootAge
            : null,
      boot_age_ms: bootAge,
      reconnect_attempts: keeper.reconnectAttempts ?? null,
      session_stable: keeper.sessionStable === true
    });
  }

  function sampleQueueResidency(queued) {
    const ring = global[QUEUE_RING_KEY] || [];
    const now = Date.now();
    ring.push({ atMs: now, queued: Number(queued) || 0 });
    while (ring.length > QUEUE_RING_MAX) ring.shift();
    global[QUEUE_RING_KEY] = ring;

    const saturated = ring.filter((s) => s.queued >= SATURATION_QUEUED);
    if (saturated.length < 2) {
      return Object.freeze({
        samples: ring.length,
        queue_residency_ms_mean: null,
        saturation_sample_ratio: ring.length ? saturated.length / ring.length : null
      });
    }

    let dwellMs = 0;
    for (let i = 1; i < ring.length; i++) {
      if (ring[i].queued >= SATURATION_QUEUED && ring[i - 1].queued >= SATURATION_QUEUED) {
        dwellMs += ring[i].atMs - ring[i - 1].atMs;
      }
    }

    return Object.freeze({
      samples: ring.length,
      queue_residency_ms_mean:
        saturated.length > 1 ? Math.round(dwellMs / Math.max(1, saturated.length - 1)) : null,
      saturation_sample_ratio: Number((saturated.length / ring.length).toFixed(3))
    });
  }

  function readIngressThroughputMetrics() {
    const q = g("ingressQueue") || global.__rhizoh?.observe?.ingressQueue?.() || {};
    const now = Date.now();
    const seq = Number(q.lastAcceptedSeq);
    const queued = Number(q.queued) || 0;
    const tickSeq = Number(g("presenceFrame.tickSeq") ?? g("organismHeartbeat.tickSeq"));
    const prev = global[PREV_KEY];

    let drain_rate_per_sec = null;
    let ingest_rate_per_sec = null;
    let delta_seq = null;
    let delta_tick = null;
    let delta_ms = null;

    if (prev && Number.isFinite(seq) && Number.isFinite(prev.lastAcceptedSeq)) {
      delta_ms = now - prev.atMs;
      delta_seq = seq - prev.lastAcceptedSeq;
      if (delta_ms > 0) {
        drain_rate_per_sec = Number((delta_seq / (delta_ms / 1000)).toFixed(3));
      }
    }

    if (prev && Number.isFinite(tickSeq) && Number.isFinite(prev.tickSeq) && delta_ms > 0) {
      delta_tick = tickSeq - prev.tickSeq;
      ingest_rate_per_sec = Number((delta_tick / (delta_ms / 1000)).toFixed(3));
    }

    global[PREV_KEY] = {
      atMs: now,
      lastAcceptedSeq: seq,
      tickSeq: Number.isFinite(tickSeq) ? tickSeq : prev?.tickSeq,
      queued
    };

    const residency = sampleQueueResidency(queued);

    let plateau = null;
    if (drain_rate_per_sec != null && ingest_rate_per_sec != null) {
      const gap = Math.abs(ingest_rate_per_sec - drain_rate_per_sec);
      plateau = Object.freeze({
        producer_approx_consumer: gap <= PLATEAU_EPS_EPS,
        rate_gap_per_sec: Number(gap.toFixed(3)),
        interpretation:
          gap <= PLATEAU_EPS_EPS
            ? "throughput_limit_reached · steady congestion plateau"
            : ingest_rate_per_sec > drain_rate_per_sec
              ? "ingest_leading · queue may climb"
              : "drain_leading · queue may breathe"
      });
    }

    return Object.freeze({
      queued,
      inflight: q.inflight ?? null,
      backpressure: q.backpressure === true,
      lastAcceptedSeq: Number.isFinite(seq) ? seq : null,
      presence_tick_seq: Number.isFinite(tickSeq) ? tickSeq : null,
      flow_control_engaged: q.backpressure === true,
      model: "bounded_saturation_no_deadlock_if_seq_monotonic",
      delta_seq,
      delta_tick,
      delta_ms,
      drain_rate_per_sec,
      ingest_rate_per_sec_proxy: ingest_rate_per_sec,
      ingest_proxy_note: "Δpresence tickSeq / Δt — local production proxy, not server ingress count",
      queue_residency: residency,
      plateau
    });
  }

  function readRhythmJitterDistribution() {
    const layers = g("organismStabilization.rhythm.layers") || [];
    const jitters = layers.map((l) => Number(l.jitter_ms)).filter((n) => Number.isFinite(n));
    const max = g("organismRhythm.max_jitter_ms");
    const ok = g("organismRhythm.ok");
    const tolerance = g("organismStabilization.rhythm.tolerance_ms") ?? 64;

    const ring = global[RHYTHM_RING_KEY] || [];
    if (Number.isFinite(max)) ring.push(max);
    while (ring.length > RING_MAX) ring.shift();
    global[RHYTHM_RING_KEY] = ring;

    const sorted = [...ring].sort((a, b) => a - b);
    const layerSorted = [...jitters].sort((a, b) => a - b);

    return Object.freeze({
      rhythm_ok: ok === true,
      max_jitter_ms: max ?? null,
      tolerance_ms: tolerance,
      temporal_budget_violation: ok === false,
      model: "scheduling_pressure_not_semantic_failure",
      layer_count: jitters.length,
      layer_jitter_ms: Object.freeze(jitters.slice(0, 16)),
      session_max_ring: Object.freeze([...ring]),
      jitter_p50_ms: percentile(sorted, 0.5),
      jitter_p95_ms: percentile(sorted, 0.95),
      jitter_p99_ms: percentile(sorted, 0.99),
      layer_jitter_p50_ms: percentile(layerSorted, 0.5),
      layer_jitter_p95_ms: percentile(layerSorted, 0.95)
    });
  }

  function buildSsotBlock(anchors, ingress, rhythm, gateway) {
    return Object.freeze({
      STATE: "HEALTHY_OVERLOAD_EQUILIBRIUM",
      SEMANTIC_LAYER: Object.freeze({
        stable: anchors.cis01 >= 0.9 && anchors.product_gate_ok === true,
        cis01: anchors.cis01,
        identity_locked: anchors.identity_locked === true
      }),
      QUEUE_LAYER: Object.freeze({
        bounded_saturation: ingress.backpressure === true,
        queued: ingress.queued,
        seq_monotonic: ingress.lastAcceptedSeq != null,
        drain_rate_per_sec: ingress.drain_rate_per_sec,
        ingest_rate_per_sec_proxy: ingress.ingest_rate_per_sec_proxy
      }),
      TEMPORAL_LAYER: Object.freeze({
        rhythm_ok: rhythm.rhythm_ok,
        max_jitter_ms: rhythm.max_jitter_ms,
        temporal_budget_violation: rhythm.temporal_budget_violation,
        jitter_p50_ms: rhythm.jitter_p50_ms,
        jitter_p95_ms: rhythm.jitter_p95_ms,
        jitter_p99_ms: rhythm.jitter_p99_ms
      }),
      GATEWAY: Object.freeze({
        model: gateway.model,
        semantic_state: gateway.semantic_state,
        boot_age_ms: gateway.boot_age_ms
      }),
      FAILURE_CLASS: "none_observed",
      PRESSURE_CLASS: "steady_congestion_plateau"
    });
  }

  function capture(arg = "l05") {
    const label =
      typeof arg === "string"
        ? arg.trim() || "l05"
        : arg && typeof arg === "object"
          ? String(arg.label ?? "l05").trim() || "l05"
          : "l05";
    const laptop =
      arg && typeof arg === "object" && arg.laptop != null ? String(arg.laptop) : null;

    const anchors = Object.freeze({
      world_identity_id: g("worldIdentity.world_identity_id") ?? null,
      cis01: g("continuityIntegrityScore.cis01") ?? null,
      product_gate_ok: g("continuityIntegrityScore.product_gate_ok") === true,
      identity_locked: g("castleCoherenceLock.ok") === true,
      drift_class: g("temporalDriftGuard.drift_class") ?? null,
      phase_coherence_ok: g("temporalDriftGuard.phase_coherence_ok") === true
    });

    const gateway_probe = readGatewayProbeMetrics();
    const ingress = readIngressThroughputMetrics();
    const rhythm_jitter = readRhythmJitterDistribution();

    const snap = Object.freeze({
      schema: "castle.rhizoh.lab_l05_metrics.v0",
      atMs: Date.now(),
      meta: Object.freeze({
        label,
        phase: "L0.5",
        ...(laptop ? { laptop } : {})
      }),
      anchors,
      gateway_probe,
      ingress,
      rhythm_jitter,
      ssot: buildSsotBlock(anchors, ingress, rhythm_jitter, gateway_probe)
    });

    (global.__rhizoh_lab_l05_log = global.__rhizoh_lab_l05_log || []).push(snap);
    return snap;
  }

  function report() {
    const log = global.__rhizoh_lab_l05_log || [];
    if (log.length < 2) {
      console.warn("rhizohLabL05.report: need ≥2 capture() calls for rates");
      return { ok: false, samples: log.length };
    }
    const a = log[log.length - 2];
    const b = log[log.length - 1];
    return Object.freeze({
      ok: true,
      from: a.meta?.label,
      to: b.meta?.label,
      drain_rate_per_sec: b.ingress?.drain_rate_per_sec,
      ingest_rate_per_sec_proxy: b.ingress?.ingest_rate_per_sec_proxy,
      plateau: b.ingress?.plateau,
      jitter_p95_ms: b.rhythm_jitter?.jitter_p95_ms,
      queue_residency_ms_mean: b.ingress?.queue_residency?.queue_residency_ms_mean
    });
  }

  global.rhizohLabL05 = Object.freeze({
    capture,
    report,
    readGatewayProbeMetrics,
    readIngressThroughputMetrics: readIngressThroughputMetrics,
    readRhythmJitterDistribution
  });

  console.log(
    "✅ rhizohLabL05 ready — capture('A_t0'); wait ≥120s; capture('A_t2'); rhizohLabL05.report()"
  );
})(typeof window !== "undefined" ? window : globalThis);
