/**
 * SRPOA-v1 — passive observer shell (read-only).
 * @see docs/RHIZOH_SRPOA_V1.md
 */
(function rhizohLabObserverShellV0() {
  const ARCHIVE_KEY = "__rhizoh_lab_l1_archive";
  const SRPOA = "SRPOA-v1";
  const READ_ONLY_ERR = "OBSERVERS ARE READ-ONLY (SRPOA-v1)";
  const INJECTION_ERR = "SRPOA: observer must not write into runtime state";

  function assertSrpoaSingleRuntime(where) {
    const rh = window.__rhizoh || {};
    if (rh.runtimeMode != null && rh.runtimeMode !== "single") {
      throw new Error(`SRPOA VIOLATION: MULTI-RUNTIME DETECTED (${where})`);
    }
  }

  function blockCapture() {
    throw new Error(READ_ONLY_ERR);
  }

  function inferObserverContext() {
    return window[ARCHIVE_KEY] ? "archive" : "mirror";
  }

  function normalizeCaptureEntry(s) {
    const layers = s.rhythm_surface?.layers || [];
    const jitters = layers.map((l) => l.jitter_ms).filter(Number.isFinite);
    const uniform =
      jitters.length > 0 && jitters.every((j) => j === jitters[0]);
    return Object.freeze({
      label: s.meta?.label ?? null,
      origin: s.meta?.origin ?? "runtime",
      at_ms: s.atMs ?? null,
      organismRhythm_ok: s.rhythm_surface?.organismRhythm_ok ?? null,
      max_jitter_ms: s.rhythm_surface?.max_jitter_ms ?? null,
      worst_phase: s.rhythm_surface?.worst_layer?.phase ?? null,
      queue_plateau: s.preflight?.l1_entry_gates?.queue_plateau ?? null,
      layers_n: layers.length,
      layers_uniform_jitter: uniform,
      layer_jitter_ms: uniform ? jitters[0] : null
    });
  }

  const rh = (window.__rhizoh = window.__rhizoh || {});
  assertSrpoaSingleRuntime("observer:init");
  rh.runtimeMode = "single";
  rh.observeMode = true;

  const runtimeSealAtBind = Object.freeze({
    organismRhythm_ok: window.__rhizoh?.organismRhythm?.ok,
    note: "observer must not mutate __rhizoh production fields"
  });

  function assertObserverIsolation() {
    assertSrpoaSingleRuntime("observer:isolation");
    if (window.__rhizoh_lab?.role === "producer") {
      throw new Error(INJECTION_ERR + " (__rhizoh_lab.role=producer on observer tab)");
    }
  }

  function viewLog() {
    assertObserverIsolation();
    return window[ARCHIVE_KEY]?.log || [];
  }

  function importArchive(payload) {
    assertObserverIsolation();
    const data = typeof payload === "string" ? JSON.parse(payload) : payload;
    window[ARCHIVE_KEY] = Object.freeze({
      schema: data?.schema ?? "castle.rhizoh.lab_l1_archive.v0",
      architecture: SRPOA,
      origin: data?.origin ?? "runtime",
      observer_context: "archive",
      exported_at_ms: data?.exported_at_ms ?? Date.now(),
      report: data?.report ?? null,
      log: data?.log ?? []
    });
    console.log("✅ archive imported · entries:", window[ARCHIVE_KEY].log?.length ?? 0);
    return window[ARCHIVE_KEY];
  }

  /** Serialization only — no inference/aggregation (SRPOA-v1 lock). */
  function snapshot() {
    assertObserverIsolation();
    const log = viewLog();
    const frames = log.map(normalizeCaptureEntry);
    return Object.freeze({
      schema: "castle.rhizoh.srpoa_observer_snapshot.v1",
      architecture: SRPOA,
      at_ms: Date.now(),
      observer_context: inferObserverContext(),
      read_only: true,
      frames,
      n: frames.length,
      report: window[ARCHIVE_KEY]?.report ?? null,
      runtime_seal_hint: runtimeSealAtBind
    });
  }

  function summarizeArchive() {
    const snap = snapshot();
    if (!snap.n) {
      return Object.freeze({
        ok: false,
        need: "importArchive() from producer export",
        observer_context: snap.observer_context
      });
    }
    const series = snap.frames;
    return Object.freeze({
      ok: true,
      architecture: SRPOA,
      observer_context: snap.observer_context,
      captures: series.length,
      series,
      report: snap.report
    });
  }

  function diffView(pin) {
    assertObserverIsolation();
    const snap = snapshot();
    const reference =
      pin ||
      window.__rhizoh_lab_l1_archive_pin ||
      window.__rhizoh_lab_l1_A_archive ||
      null;
    return Object.freeze({
      ok: snap.n > 0,
      architecture: SRPOA,
      model: "single-runtime + archive projection",
      observer_context: snap.observer_context,
      snapshot: snap,
      reference_pin: reference,
      note: "diffView uses snapshot() — no live runtime merge on observer tab"
    });
  }

  function installReadOnlyGuards() {
    assertSrpoaSingleRuntime("observer:guards");
    if (window.rhizohLabL1?.capture) {
      console.warn("[SRPOA] rhizohLabL1 on observer tab — use readonly facade or producer tab only");
    }
  }

  window.__rhizoh_lab = Object.freeze({
    schema: "castle.rhizoh.srpoa_observer.v1",
    architecture: SRPOA,
    role: "observer",
    policy: Object.freeze({
      allowWrite: false,
      allowCapture: false,
      allowRuntimeInjection: false,
      allowStub: false
    }),
    bind_at_ms: Date.now()
  });

  window.rhizohLabObserver = Object.freeze({
    capture: blockCapture,
    importArchive,
    snapshot,
    summarizeArchive,
    diffView,
    viewLog,
    inferContext: inferObserverContext
  });

  installReadOnlyGuards();

  console.log(
    "✅ rhizohLabObserver · SRPOA-v1 · snapshot · importArchive · summarizeArchive · diffView"
  );
  console.log("📌 capture() throws · context = computed only · no runtime injection");
})();
