/**
 * Rhizoh Observe Ground Truth Lock v0.6 + Drift Classifier v0.7
 * Phase 0 · read-only · panel is consumer not source
 * Paste before rhizohObserve / rhizohAuto / RhizohPanel on rhizoh.com
 * @see docs/RHIZOH_OBSERVATION_PROTOCOL_V0.2.md §13–§14
 */
(function rhizohObserveCoreV0_6(global) {
  const KEY = "rhizohObserveCore";

  if (global[KEY]) return global[KEY];

  function root() {
    return global.__rhizoh || global.opener?.__rhizoh || {};
  }

  function g(path) {
    return path.split(".").reduce((o, k) => (o ? o[k] : undefined), root());
  }

  /**
   * Runtime publish-time proxy — NOT NTP server clock.
   * True server_ts requires gateway health JSON or future SSOT field.
   */
  function readServerTimeProxy() {
    const r = root();
    return (
      r?.liveMonitor?.atMs ??
      r?.deployStatus?.atMs ??
      r?.presenceState?.atMs ??
      null
    );
  }

  function readGatewayPhase() {
    const keeper = global.__CASTLE_GATEWAY_SESSION_KEEPER__;
    let phase = keeper?.lastPhase ?? null;
    try {
      phase =
        global.__CASTLE_BUILD_RUNTIME_SNAPSHOT__?.()?.gatewayState?.phase ?? phase;
    } catch {
      /* noop */
    }
    return phase;
  }

  function readSessionContext() {
    const keeper = global.__CASTLE_GATEWAY_SESSION_KEEPER__ || {};
    const now = Date.now();
    return {
      gateway_phase: readGatewayPhase(),
      reconnect_attempts: keeper.reconnectAttempts ?? null,
      since_health_ok_ms:
        keeper.lastHealthOkAt > 0 ? now - Number(keeper.lastHealthOkAt) : null,
      session_stable: keeper.sessionStable === true
    };
  }

  /**
   * Triple-clock + frame anchor — Ground Truth Lock for every snapshot.
   * @param {{ label?: string, origin?: string }} [meta]
   */
  function buildGroundTruthLock(meta = {}) {
    const wall =
      typeof global.performance !== "undefined" && typeof global.performance.now === "function"
        ? global.performance.now()
        : null;

    return Object.freeze({
      schema: "castle.rhizoh.observe_ground_truth.v0.6",
      ts: Date.now(),
      iso: new Date().toISOString(),
      wall_ts: wall,
      server_ts_proxy: readServerTimeProxy(),
      scr_tick: g("liveMonitor.scr.tick_seq") ?? null,
      frame_id: global.__CASTLE_RUNTIME_FRAME_ID__ ?? null,
      visibility: global.document?.visibilityState ?? null,
      focused: typeof global.document?.hasFocus === "function" ? global.document.hasFocus() : null,
      runtime_present: !!global.__rhizoh,
      label: meta.label ?? null,
      origin: meta.origin ?? "observe"
    });
  }

  /**
   * Delta using dual-clock — separates wall sampling jitter from tick drift.
   * @param {object|null} prev
   * @param {object} snap — must include ground_truth + signal
   */
  function computeGroundTruthDelta(prev, snap) {
    if (!prev?.ground_truth || !snap?.ground_truth) return null;

    const tickDiff = (snap.signal?.scr_tick ?? 0) - (prev.signal?.scr_tick ?? 0);
    const jitterDiff = (snap.signal?.jitter_ms ?? 0) - (prev.signal?.jitter_ms ?? 0);
    const epochMs = snap.ground_truth.ts - prev.ground_truth.ts;

    let wallMs = null;
    if (
      snap.ground_truth.wall_ts != null &&
      prev.ground_truth.wall_ts != null
    ) {
      wallMs = snap.ground_truth.wall_ts - prev.ground_truth.wall_ts;
    }

    const tickVelocity =
      wallMs != null && wallMs > 0 ? tickDiff / (wallMs / 1000) : null;

    const samplingSkew =
      wallMs != null && epochMs > 0 ? Math.abs(wallMs - epochMs) : null;

    return Object.freeze({
      tick_diff: tickDiff,
      jitter_diff: jitterDiff,
      epoch_ms_since_prev: epochMs,
      wall_ms_since_prev: wallMs,
      tick_velocity_per_s: tickVelocity != null ? Number(tickVelocity.toFixed(4)) : null,
      sampling_skew_ms: samplingSkew != null ? Math.round(samplingSkew) : null,
      idle_gap: prev.ground_truth.visibility === "hidden" || !prev.ground_truth.focused
    });
  }

  function variance(values) {
    if (values.length < 2) return null;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const v = values.reduce((s, x) => s + (x - mean) ** 2, 0) / values.length;
    return Math.round(v);
  }

  /**
   * Multi-axis drift classifier v0.7
   * @param {object[]} history
   * @param {{ gateway?: object }} [opts]
   */
  function classifyDriftMultiAxisV1(history, opts = {}) {
    if (history.length < 2) {
      return Object.freeze({
        status: "warming_up",
        confidence: null,
        classes: [],
        axes: {}
      });
    }

    const h = history;
    const first = h[0];
    const last = h[h.length - 1];
    const gateway = opts.gateway || global.rhizohGatewayHealth?.read?.()?.sources || readSessionContext();

    const tickDiffs = h.slice(1).map((s, i) => (s.signal?.scr_tick ?? 0) - (h[i].signal?.scr_tick ?? 0));
    const stalled = tickDiffs.filter((d) => d <= 0).length;

    const velocities = h
      .map((s) => s.delta?.tick_velocity_per_s)
      .filter((v) => typeof v === "number" && Number.isFinite(v));
    const avgVelocity =
      velocities.length > 0
        ? Number((velocities.reduce((a, b) => a + b, 0) / velocities.length).toFixed(4))
        : null;

    const heartbeatGaps = h
      .map((s) => s.session?.since_health_ok_ms)
      .filter((v) => typeof v === "number");
    const heartbeatGapVariance = variance(heartbeatGaps);

    const reconnectDelta =
      h.length >= 2
        ? (last.session?.reconnect_attempts ?? 0) - (first.session?.reconnect_attempts ?? 0)
        : 0;

    const idleSamples = h.filter(
      (s) => s.ground_truth?.visibility === "hidden" || s.ground_truth?.focused === false
    ).length;

    const jitterTrend = (last.signal?.jitter_ms ?? 0) - (first.signal?.jitter_ms ?? 0);
    const samplingSkews = h.map((s) => s.delta?.sampling_skew_ms).filter((v) => typeof v === "number");
    const maxSkew = samplingSkews.length ? Math.max(...samplingSkews) : 0;

    const gwPhases = h.map((s) => s.session?.gateway_phase ?? s.system?.gateway_phase);
    let gwFlips = 0;
    for (let i = 1; i < gwPhases.length; i++) {
      if (gwPhases[i] != null && gwPhases[i - 1] != null && gwPhases[i] !== gwPhases[i - 1]) {
        gwFlips++;
      }
    }

    const classes = [];
    let score = 1;

    if (stalled === 0 && Math.abs(jitterTrend) <= 25 && gwFlips <= 1 && idleSamples === 0) {
      classes.push({
        kind: "normal_jitter",
        level: "ok",
        weight: 0.35,
        note: "SCR advancing · jitter in band · tab active"
      });
    }

    if (gwFlips >= 2 && stalled === 0) {
      classes.push({
        kind: "gateway_noise",
        level: "warn",
        weight: 0.25,
        note: `${gwFlips} phase flips · SCR alive`
      });
      score -= 0.15;
    }

    const semantic = global.rhizohGatewayHealth?.read?.()?.semantic;
    if (semantic?.state === "warming_up" && gwFlips <= 2) {
      classes.push({
        kind: "gateway_warming_up",
        level: "ok",
        weight: 0.2,
        note: "boot/cold-start — not hard offline"
      });
    } else if (semantic?.state === "uncertain") {
      classes.push({
        kind: "gateway_uncertain",
        level: "warn",
        weight: 0.15,
        note: "soft verification delay"
      });
      score -= 0.05;
    }

    if (
      (Math.abs(jitterTrend) > 25 || maxSkew > 500) &&
      last.signal?.rhythm_ok === false
    ) {
      classes.push({
        kind: "timing_jitter",
        level: "warn",
        weight: 0.2,
        note: `jitter trend ${jitterTrend}ms · sampling skew max ${maxSkew}ms`
      });
      score -= 0.12;
    }

    if (idleSamples > h.length * 0.4 && stalled > 0) {
      classes.push({
        kind: "idle_throttle",
        level: "warn",
        weight: 0.15,
        note: `${idleSamples}/${h.length} samples while tab idle/hidden`
      });
      score -= 0.1;
    }

    if (reconnectDelta >= 2 || (gateway.reconnect_attempts ?? 0) > 4) {
      classes.push({
        kind: "reconnect_pressure",
        level: "warn",
        weight: 0.2,
        note: `reconnect delta +${reconnectDelta}`
      });
      score -= 0.15;
    }

    if (heartbeatGapVariance != null && heartbeatGapVariance > 2_000_000) {
      classes.push({
        kind: "heartbeat_variance",
        level: "warn",
        weight: 0.15,
        note: `health gap variance ${heartbeatGapVariance}`
      });
      score -= 0.08;
    }

    if (stalled >= 2 && idleSamples < h.length * 0.5) {
      classes.push({
        kind: "real_instability",
        level: "bad",
        weight: 0.4,
        note: "SCR stalled while tab active"
      });
      score -= 0.35;
    }

    if (last.signal?.fork_risk || last.signal?.castle_split || !last.signal?.identity_ok) {
      classes.push({
        kind: "identity_risk",
        level: "bad",
        weight: 0.45,
        note: "fork · split · identity"
      });
      score -= 0.4;
    }

    if (classes.length === 0) {
      classes.push({
        kind: "mixed_signal",
        level: "warn",
        weight: 0.1,
        note: "insufficient axis separation"
      });
      score -= 0.05;
    }

    score = Math.max(0, Math.min(1, score));

    const status = classes.some((c) => c.level === "bad")
      ? "investigate"
      : classes.some((c) => c.level === "warn")
        ? "observe"
        : "stable";

    return Object.freeze({
      status,
      confidence: Number(score.toFixed(3)),
      classes: Object.freeze(classes),
      axes: Object.freeze({
        tick_velocity_avg: avgVelocity,
        reconnect_delta: reconnectDelta,
        gateway_flips: gwFlips,
        heartbeat_gap_variance: heartbeatGapVariance,
        idle_sample_ratio: Number((idleSamples / h.length).toFixed(3)),
        max_sampling_skew_ms: maxSkew,
        jitter_trend: jitterTrend,
        scr_stalls: stalled
      })
    });
  }

  /** Standard observe snapshot body — panel / auto / manual share this. */
  function buildObserveSnapshot(meta = {}) {
    const structural = g("liveMonitor.identity.structural");
    const identityBreak = g("liveMonitor.identity.identity_break");
    const session = readSessionContext();

    return {
      ground_truth: buildGroundTruthLock(meta),
      signal: {
        rhythm_ok: g("organismRhythm.ok"),
        jitter_ms: g("organismRhythm.max_jitter_ms"),
        scr_tick: g("liveMonitor.scr.tick_seq"),
        identity_ok: structural !== true && identityBreak !== true,
        fork_risk: g("liveMonitor.castle.fork_risk"),
        castle_split: g("liveMonitor.castle.castle_surface_split")
      },
      session,
      system: {
        gateway_phase: session.gateway_phase,
        live: !!g("liveMonitor"),
        wal: !!g("worldActionLog"),
        wal_entries: g("worldActionLog.entries")?.length ?? null,
        memory: !!g("worldWalPersistence")
      },
      phase0_guard: {
        observation_only: true,
        no_actions: true,
        no_mutation: true,
        panel_is_consumer: true
      }
    };
  }

  const api = Object.freeze({
    buildGroundTruthLock,
    computeGroundTruthDelta,
    classifyDriftMultiAxisV1,
    buildObserveSnapshot,
    readSessionContext
  });

  global[KEY] = api;
  return api;
})(typeof window !== "undefined" ? window : globalThis);
