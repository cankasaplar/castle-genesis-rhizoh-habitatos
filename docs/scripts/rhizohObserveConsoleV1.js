/**

 * RHIZOH Observation Control System v1 — paste once into Chrome console on rhizoh.com

 * Requires runtime on same tab. Paste rhizohObserveGroundTruthV0_6.js first for full lock.

 * NOT bundled in prod app · Phase 0 observation only · no mutation

 * @see docs/RHIZOH_OBSERVATION_PROTOCOL_V0.2.md

 */

window.rhizohObserve = (label = "manual") => {

  const core = window.rhizohObserveCore;



  if (!window.__rhizoh) {

    console.warn("RHIZOH OBSERVE: no __rhizoh — panel is consumer; runtime required");

  }



  const snap = core

    ? { ...core.buildObserveSnapshot({ label, origin: "rhizohObserve" }), meta: { label } }

    : (() => {

        const r = window.__rhizoh || {};

        const g = (p) => p.split(".").reduce((o, k) => (o ? o[k] : undefined), r);

        const structural = g("liveMonitor.identity.structural");

        const identityBreak = g("liveMonitor.identity.identity_break");

        return {

          meta: { label, time: new Date().toISOString(), ts: Date.now() },

          ground_truth: {

            ts: Date.now(),

            wall_ts: performance.now?.() ?? null,

            scr_tick: g("liveMonitor.scr.tick_seq"),

            runtime_present: !!window.__rhizoh,

            lock: "degraded — paste rhizohObserveGroundTruthV0_6.js"

          },

          signal: {

            rhythm_ok: g("organismRhythm.ok"),

            jitter_ms: g("organismRhythm.max_jitter_ms"),

            scr_tick: g("liveMonitor.scr.tick_seq"),

            identity_ok: structural !== true && identityBreak !== true,

            fork_risk: g("liveMonitor.castle.fork_risk"),

            castle_split: g("liveMonitor.castle.castle_surface_split")

          },

          system: { live: !!g("liveMonitor") },

          phase0_guard: { observation_only: true, panel_is_consumer: true }

        };

      })();



  const deltaKey = "__rhizoh_last_snapshot";

  const prev = window[deltaKey];



  if (prev?.signal && core) {

    snap.delta = core.computeGroundTruthDelta(prev, snap);

    snap.drift = core.classifyDriftMultiAxisV1(

      [...(window.__rhizoh_observe_log || []), snap].slice(-20)

    );

  } else if (prev?.signal) {

    snap.delta = {

      tick_diff: (snap.signal.scr_tick ?? 0) - (prev.signal.scr_tick ?? 0),

      jitter_diff: (snap.signal.jitter_ms ?? 0) - (prev.signal.jitter_ms ?? 0),

      ms_since_prev: (snap.ground_truth?.ts ?? snap.meta?.ts) - (prev.ground_truth?.ts ?? prev.meta?.ts ?? 0)

    };

  }



  window[deltaKey] = snap;

  window.__rhizoh_observe_log = window.__rhizoh_observe_log || [];

  window.__rhizoh_observe_log.push(snap);



  console.log("🧪 RHIZOH OBSERVE:", label);

  console.table(snap.signal);

  if (snap.ground_truth) console.log("⛓️ ground_truth:", snap.ground_truth);

  if (snap.delta) console.log("📈 DELTA:", snap.delta);

  if (snap.drift) console.log("🧠 DRIFT:", snap.drift);

  console.log("📦 FULL:", snap);

  return snap;

};



console.log("✅ rhizohObserve ready — paste rhizohObserveGroundTruthV0_6.js first · try rhizohObserve('t0')");

