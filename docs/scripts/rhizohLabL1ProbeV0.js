/**
 * Rhizoh Lab L1 — observe-only organism phase probe (no mutation).
 * Paste once on rhizoh.com · read-only · SPECFLOW: ops SSOT
 * @see docs/RHIZOH_DISTRIBUTED_OBSERVE_LAB_V0.md § Lab L1
 * @see docs/RHIZOH_SRPOA_V1.md — runtime sets origin only; context = observer
 *
 * L1 = stabilization problem surface — not another measurement-only phase.
 * SSOT temporal truth: window.__rhizoh.organismRhythm.ok
 * Decomposition: window.__rhizoh.organismStabilization.rhythm.layers
 */
(function rhizohLabL1ProbeV0() {
  const LOG_KEY = "__rhizoh_lab_l1_log";
  const RING_KEY = "__rhizoh_lab_l1_jitter_ring";
  const TOL_MS = 64;
  const SRPOA = "SRPOA-v1";
  const READ_ONLY_ERR = "OBSERVERS ARE READ-ONLY (SRPOA-v1)";

  const rh = (window.__rhizoh = window.__rhizoh || {});

  function assertSrpoaSingleRuntime(where) {
    if (rh.runtimeMode != null && rh.runtimeMode !== "single") {
      throw new Error(`SRPOA VIOLATION: MULTI-RUNTIME DETECTED (${where})`);
    }
    rh.runtimeMode = "single";
  }

  assertSrpoaSingleRuntime("probe:init");
  rh.observeMode = false;

  function blockCapture() {
    throw new Error(READ_ONLY_ERR);
  }

  const g = (p) => p.split(".").reduce((o, k) => (o ? o[k] : undefined), window.__rhizoh || {});

  function resolveOrigin(arg) {
    if (arg?.laptop != null) {
      console.warn("[rhizohLabL1] meta.laptop deprecated (SRPOA-v1) — use origin:'runtime' only");
    }
    if (arg?.context != null) {
      throw new Error(
        "SRPOA: context is a forbidden write field on runtime (observer computes only)"
      );
    }
    const origin = arg?.origin != null ? String(arg.origin) : "runtime";
    if (origin !== "runtime") {
      throw new Error(`L1 capture: origin must be "runtime", got "${origin}"`);
    }
    return Object.freeze({ origin });
  }

  const pct = (arr, p) => {
    if (!arr.length) return null;
    const s = [...arr].sort((a, b) => a - b);
    return s[Math.min(s.length - 1, Math.floor((s.length - 1) * p))];
  };

  function readRhythmSurface() {
    const rhythm = g("organismRhythm") || {};
    const stabRhythm = g("organismStabilization.rhythm") || {};
    const hb = g("organismHeartbeat") || {};
    const layers = (stabRhythm.layers || rhythm.layers || []).map((l) =>
      Object.freeze({
        phase: l.phase,
        at_ms: l.at_ms,
        jitter_ms: +l.jitter_ms,
        delta_from_heartbeat_ms: l.delta_from_heartbeat_ms,
        snapped_at_ms: l.snapped_at_ms
      })
    );

    let worst = null;
    for (const l of layers) {
      if (!worst || l.jitter_ms > worst.jitter_ms) worst = l;
    }

    const byPhase = {};
    for (const l of layers) {
      const prev = byPhase[l.phase];
      if (!prev || l.jitter_ms > prev.jitter_ms) byPhase[l.phase] = l;
    }

    return Object.freeze({
      organismRhythm_ok: rhythm.ok === true,
      max_jitter_ms: rhythm.max_jitter_ms ?? stabRhythm.max_jitter_ms ?? null,
      tolerance_ms: rhythm.tolerance_ms ?? stabRhythm.tolerance_ms ?? TOL_MS,
      grid_ms: rhythm.grid_ms ?? stabRhythm.grid_ms ?? hb.grid_ms ?? null,
      temporal_state:
        (rhythm.ok === true ? "within_budget" : "temporal_budget_violation"),
      heartbeat: Object.freeze({
        aligned_at_ms: hb.aligned_at_ms ?? stabRhythm.aligned_at_ms ?? null,
        grid_ms: hb.grid_ms ?? stabRhythm.grid_ms ?? null,
        tickSeq: hb.tickSeq ?? null,
        heartbeat_index: hb.heartbeat_index ?? null,
        phase01: hb.phase01 ?? null,
        masterNowMs: hb.masterNowMs ?? null
      }),
      layers,
      worst_layer: worst,
      by_phase: byPhase
    });
  }

  function preflight() {
    const q = g("ingressQueue") || window.__rhizoh?.observe?.ingressQueue?.() || {};
    const queued = +q.queued || 0;
    const bp = q.backpressure === true;
    const cis = g("continuityIntegrityScore.cis01");
    const iv = g("worldIdentity.identity_version");
    const icl = g("castleCoherenceLock.ok") === true;
    const queue_plateau = queued >= 60 && queued <= 64 && bp;

    return Object.freeze({
      l1_entry_gates: Object.freeze({
        queue_plateau,
        cis_stable: cis != null && Math.abs(cis - 0.9496) < 0.002,
        identity_monotonic_hint: Number.isFinite(iv),
        icl_locked: icl
      }),
      l1_entry_ok: queue_plateau && cis != null && icl && Number.isFinite(iv),
      anchors: Object.freeze({
        identity_version: iv ?? null,
        cis01: cis ?? null,
        queued,
        backpressure: bp,
        lastAcceptedSeq: q.lastAcceptedSeq ?? null
      }),
      rhythm: readRhythmSurface()
    });
  }

  if (rh.observeMode === true) {
    window.__rhizoh_lab = Object.freeze({
      schema: "castle.rhizoh.srpoa_observer_block.v1",
      architecture: SRPOA,
      role: "observer",
      policy: Object.freeze({ allowCapture: false, allowWrite: false })
    });
    window.rhizohLabL1 = Object.freeze({
      schema: "castle.rhizoh.lab_l1_readonly_facade.v1",
      preflight: () => Object.freeze({ blocked: true, reason: READ_ONLY_ERR }),
      read: readRhythmSurface,
      capture: blockCapture,
      report: () => Object.freeze({ ok: false, reason: READ_ONLY_ERR }),
      mode: () => Object.freeze({ runtimeMode: rh.runtimeMode, observeMode: true, role: "observer" })
    });
    console.error("❌ SRPOA: probe on observer tab — use rhizohLabObserverShellV0.js only");
    return;
  }

  window.__rhizoh_lab = Object.freeze({
    schema: "castle.rhizoh.srpoa_runtime.v1",
    architecture: SRPOA,
    role: "producer",
    policy: Object.freeze({ allowCapture: true, allowWrite: true })
  });

  function capture(arg) {
    const label = typeof arg === "string" ? arg : String(arg?.label ?? "l1");
    const { origin } = resolveOrigin(typeof arg === "object" ? arg : {});
    if (rh.observeMode === true) {
      throw new Error(READ_ONLY_ERR);
    }
    const now = Date.now();
    const pf = preflight();
    const surface = readRhythmSurface();

    const ring = window[RING_KEY] || [];
    if (Number.isFinite(surface.max_jitter_ms)) {
      ring.push(+surface.max_jitter_ms);
      while (ring.length > 96) ring.shift();
    }
    window[RING_KEY] = ring;

    const snap = Object.freeze({
      schema: "castle.rhizoh.lab_l1_probe.v0",
      atMs: now,
      meta: Object.freeze({
        label,
        phase: "L1",
        architecture: SRPOA,
        observe_only: true,
        origin
      }),
      preflight: pf,
      rhythm_surface: surface,
      jitter_ring: Object.freeze({
        n: ring.length,
        p50_ms: pct(ring, 0.5),
        p95_ms: pct(ring, 0.95),
        max_ms: ring.length ? Math.max(...ring) : null
      }),
      ssot: Object.freeze({
        l1_question:
          "can organismRhythm.ok stabilize under sustained queue saturation via phase alignment (not threshold drift alone)?",
        temporal_truth: "organismRhythm.ok",
        failure_class: "none"
      })
    });

    (window[LOG_KEY] = window[LOG_KEY] || []).push(snap);
    return snap;
  }

  function report() {
    const log = window[LOG_KEY] || [];
    if (log.length < 2) {
      return { ok: false, need: "≥2 capture() with ≥60s between", n: log.length };
    }
    const first = log[0];
    const last = log[log.length - 1];
    const okCount = log.filter((s) => s.rhythm_surface?.organismRhythm_ok === true).length;
    const worstPhases = log
      .map((s) => s.rhythm_surface?.worst_layer?.phase)
      .filter(Boolean);
    const phaseCounts = worstPhases.reduce((acc, p) => {
      acc[p] = (acc[p] || 0) + 1;
      return acc;
    }, {});
    const dominantWorst =
      Object.entries(phaseCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

    const j0 = first.rhythm_surface?.max_jitter_ms;
    const j1 = last.rhythm_surface?.max_jitter_ms;
    const deltaJ = j0 != null && j1 != null ? +(j1 - j0).toFixed(1) : null;

    return Object.freeze({
      ok: true,
      from: first.meta?.label,
      to: last.meta?.label,
      captures: log.length,
      ok_rate: +(okCount / log.length).toFixed(3),
      max_jitter_first_ms: j0,
      max_jitter_last_ms: j1,
      max_jitter_delta_ms: deltaJ,
      jitter_p95_last: last.jitter_ring?.p95_ms ?? null,
      dominant_worst_phase: dominantWorst,
      worst_phase_histogram: phaseCounts,
      l1_stabilization_signal:
        okCount > 0 && deltaJ != null && deltaJ < 0
          ? "compressing_toward_tolerance"
          : okCount === log.length
            ? "stable_within_budget"
            : "breach_persistent_or_flat",
      preflight_last: last.preflight?.l1_entry_gates,
      ssot_read: Object.freeze({
        temporal_truth: "organismRhythm.ok",
        not_primary: ["queue_depth_alone", "world_id", "drain_rate", "ingest_proxy"]
      })
    });
  }

  window.rhizohLabL1 = Object.freeze({
    preflight,
    read: readRhythmSurface,
    capture,
    report,
    resolveOrigin,
    mode: () =>
      Object.freeze({
        architecture: SRPOA,
        runtimeMode: rh.runtimeMode,
        observeMode: rh.observeMode,
        role: window.__rhizoh_lab?.role ?? "producer"
      })
  });

  console.log(
    "✅ rhizohLabL1 ready · SRPOA-v1 producer · capture({ origin:'runtime' }) · preflight() report()"
  );
})();
