/**
 * Lab L1 — Controlled Hybrid Control Plane v0
 * READ (observe) + WRITE (capture/log) under single coordinator.
 * Paste AFTER rhizohLabL1ProbeV0.js on rhizoh.com — never use ensureL1/rebuilt stubs.
 *
 * @see docs/RHIZOH_DISTRIBUTED_OBSERVE_LAB_V0.md § Controlled hybrid
 * @see docs/RHIZOH_SRPOA_V1.md
 */
(function rhizohLabL1HybridControllerV0() {
  const LAB_KEY = "__rhizoh_lab";
  const rh = (window.__rhizoh = window.__rhizoh || {});
  if (rh.runtimeMode != null && rh.runtimeMode !== "single") {
    throw new Error("SRPOA VIOLATION: MULTI-RUNTIME DETECTED (hybrid:init)");
  }
  rh.runtimeMode = "single";

  function isStubProbe(p) {
    if (!p?.preflight || !p?.capture) return true;
    try {
      const r = p.preflight();
      return r?.schema === "castle.world_observation.ingress_queue.v0" || r?.mode === "rebuilt";
    } catch {
      return true;
    }
  }

  function isOfficialProbe(p) {
    if (!p?.preflight || !p?.capture || !p?.read) return false;
    try {
      const r = p.preflight();
      return r?.l1_entry_gates != null || r?.l1_entry_ok != null;
    } catch {
      return false;
    }
  }

  const raw = window.rhizohLabL1;

  if (!raw || isStubProbe(raw)) {
    console.error(
      "❌ L1 hybrid bind failed: load ONLY docs/scripts/rhizohLabL1ProbeV0.js first. " +
        "Remove stubs (ensureL1/rebuilt). Do not delete rhizohLabL1 after bind."
    );
    return null;
  }

  if (!isOfficialProbe(raw)) {
    console.warn("⚠️ rhizohLabL1 may be inline probe — prefer official rhizohLabL1ProbeV0.js for SSOT.");
  }

  const policy = Object.freeze({
    mode: "hybrid",
    allowWrite: true,
    allowReset: false,
    allowRebind: "controller-only",
    observe_only_runtime: true,
    note: "WRITE = capture/log append only; does not mutate organism scheduler"
  });

  function observe() {
    const pf = raw.preflight();
    const rhythm = raw.read();
    return Object.freeze({
      atMs: Date.now(),
      preflight: pf,
      rhythm_surface: rhythm,
      ingress: Object.freeze({
        queued: pf?.anchors?.queued ?? window.__rhizoh?.ingressQueue?.queued,
        backpressure:
          pf?.anchors?.backpressure ?? window.__rhizoh?.ingressQueue?.backpressure,
        lastAcceptedSeq:
          pf?.anchors?.lastAcceptedSeq ?? window.__rhizoh?.ingressQueue?.lastAcceptedSeq
      })
    });
  }

  function capture(arg) {
    if (!policy.allowWrite) {
      throw new Error("L1 hybrid: capture blocked by policy");
    }
    if (window.__rhizoh?.observeMode === true) {
      throw new Error("OBSERVERS ARE READ-ONLY (SRPOA-v1)");
    }
    if (arg?.context != null) {
      throw new Error(
        "SRPOA: context is a forbidden write field on runtime (observer computes only)"
      );
    }
    const payload =
      typeof arg === "string"
        ? { label: arg, origin: "runtime" }
        : { label: arg?.label, origin: arg?.origin ?? "runtime" };
    return raw.capture(payload);
  }

  const L1 = Object.freeze({
    schema: "castle.rhizoh.lab_l1_hybrid.v0",
    observe,
    read: raw.read,
    preflight: raw.preflight,
    capture,
    report: raw.report,
    policy
  });

  rh.observeMode = false;

  const lab = Object.freeze({
    version: "v0",
    architecture: "SRPOA-v1",
    mode: "hybrid",
    role: "producer",
    policy,
    L1,
    log: () => window.__rhizoh_lab_l1_log || [],
    bind_at_ms: Date.now()
  });

  window[LAB_KEY] = lab;
  window.rhizohLabL1 = L1;

  console.log("✅ __rhizoh_lab hybrid bound · observe() · capture() · report()");
  console.log("📌 Do NOT: delete rhizohLabL1 · ensureL1 · rebuilt · installL1Probe inline");
  return lab;
})();
