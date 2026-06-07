/**
 * Lab L1 A/B diff — read-only · uses __rhizoh_lab_l1_log (inline or official probe)
 * Paste after captures on A and/or B. No mutation.
 * @see docs/RHIZOH_DISTRIBUTED_OBSERVE_LAB_V0.md § Lab L1
 */
(function rhizohLabL1DiffV0() {
  const ARCHIVE_PIN_DEFAULT = Object.freeze({
    origin: "runtime",
    context: "archive",
    probe: "rhizohLabL1ProbeV0.js",
    ok_rate: 1,
    max_jitter_ms: 20,
    queue: 63,
    backpressure: true,
    timing: "snapshot (back-to-back)",
    note: "fresh session post re-login"
  });

  function summarizeLog(log, role) {
    const entries = log || [];
    const series = entries.map((s) => ({
      label: s.meta?.label ?? s.label,
      atMs: s.atMs ?? s.at,
      ok: s.rhythm_surface?.organismRhythm_ok ?? s.surface?.ok,
      jitter_ms: s.rhythm_surface?.max_jitter_ms ?? s.surface?.max_jitter_ms,
      worst_phase: s.rhythm_surface?.worst_layer?.phase ?? s.surface?.worst_layer?.phase,
      worst_jitter_ms: s.rhythm_surface?.worst_layer?.jitter_ms ?? s.surface?.worst_layer?.jitter_ms,
      queued: s.preflight?.anchors?.queued ?? s.preflight?.queued,
      bp: s.preflight?.anchors?.backpressure ?? s.preflight?.bp
    }));

    const waits = series.map((row, i) =>
      i && row.atMs != null && series[i - 1].atMs != null
        ? +(row.atMs - series[i - 1].atMs) / 1000
        : null
    ).filter((w) => w != null);

    const okCount = series.filter((r) => r.ok === true).length;
    const phases = series.map((r) => r.worst_phase).filter(Boolean);
    const phaseCounts = phases.reduce((acc, p) => {
      acc[p] = (acc[p] || 0) + 1;
      return acc;
    }, {});
    const dominant_worst_phase =
      Object.entries(phaseCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

    const j0 = series[0]?.jitter_ms;
    const j1 = series[series.length - 1]?.jitter_ms;

    return Object.freeze({
      role,
      origin: entries[0]?.meta?.origin ?? "runtime",
      observer_context: entries[0]?.meta?.context ?? null,
      probe: entries[0]?.meta?.phase === "L1" ? "rhizohLabL1ProbeV0.js" : "inline_or_mixed",
      captures: series.length,
      series,
      wait_sec_between: waits,
      ok_rate: series.length ? +(okCount / series.length).toFixed(3) : null,
      max_jitter_first_ms: j0,
      max_jitter_last_ms: j1,
      max_jitter_delta_ms: j0 != null && j1 != null ? +(j1 - j0).toFixed(1) : null,
      dominant_worst_phase,
      worst_phase_histogram: phaseCounts,
      l1_signal:
        okCount === series.length && series.length > 0
          ? "stable_within_budget"
          : okCount === 0
            ? "breach_persistent_or_flat"
            : "mixed_temporal_profile"
    });
  }

  function diff(archivePin, runtimeLog) {
    return Object.freeze({
      regime: "HEALTHY_OVERLOAD_EQUILIBRIUM",
      failure_class: "none",
      temporal_truth: "organismRhythm.ok",
      model: "single-runtime + archive compare",
      archive_pin: archivePin,
      runtime_log: runtimeLog,
      /** @deprecated */ A_L1: archivePin,
      /** @deprecated */ B_L1: runtimeLog,
      read: Object.freeze({
        queue_same_regime:
          archivePin.queue === runtimeLog.series?.[0]?.queued ||
          runtimeLog.series?.[runtimeLog.series.length - 1]?.queued,
        temporal_only:
          "semantic/CIS not compared here — L0.5 locked CIS ~0.9496 both"
      })
    });
  }

  const runtimeLog = summarizeLog(window.__rhizoh_lab_l1_log, "runtime");
  const archivePin =
    window.__rhizoh_lab_l1_archive_pin ||
    window.__rhizoh_lab_l1_A_archive ||
    ARCHIVE_PIN_DEFAULT;
  const out = diff(archivePin, runtimeLog);

  window.rhizohLabL1Diff = Object.freeze({
    summarizeLog,
    diff,
    last: out
  });

  console.log("✅ rhizohLabL1Diff ready");
  console.log(JSON.stringify(out, null, 2));
  return out;
})();
