/**

 * RHIZOH Auto Observation System v1 — paste once into Chrome console on rhizoh.com

 * Paste rhizohObserveGroundTruthV0_6.js first for Ground Truth Lock + Drift v0.7

 * NOT bundled in prod app · Phase 0 observation only · no mutation

 * @see docs/RHIZOH_OBSERVATION_PROTOCOL_V0.2.md §11

 */

(() => {

  const KEY = "__rhizoh_auto_observer";



  if (window[KEY]) {

    console.warn("Rhizoh auto observer already running");

    return window[KEY];

  }



  const core = () => window.rhizohObserveCore;



  const read = (label = "auto") => {

    const c = core();

    if (c) return { ...c.buildObserveSnapshot({ label, origin: "rhizohAuto" }), meta: { label } };

    return { t: Date.now(), meta: { label }, signal: {}, system: {}, phase0_guard: { degraded: true } };

  };



  const state = {

    history: [],

    max: 50,

    last: null,

    _timer: null,



    read,



    tick(label = "auto") {

      if (!window.__rhizoh) {

        console.warn("RHIZOH AUTO: no __rhizoh on this tab — consumer only");

      }



      const snap = read(label);

      const c = core();



      if (this.last?.signal && c) {

        snap.delta = c.computeGroundTruthDelta(this.last, snap);

      } else if (this.last?.signal) {

        snap.delta = {

          tick_diff: (snap.signal.scr_tick ?? 0) - (this.last.signal.scr_tick ?? 0),

          jitter_diff: (snap.signal.jitter_ms ?? 0) - (this.last.signal.jitter_ms ?? 0),

          ms_since_prev: (snap.ground_truth?.ts ?? Date.now()) - (this.last.ground_truth?.ts ?? this.last.t ?? 0)

        };

      }



      this.last = snap;

      this.history.push(snap);

      if (this.history.length > this.max) this.history.shift();



      window.__rhizoh_observe_log = window.__rhizoh_observe_log || [];

      window.__rhizoh_observe_log.push(snap);



      if (c && this.history.length >= 2) {

        snap.drift = c.classifyDriftMultiAxisV1(this.history);

      }



      console.log("🧪 RHIZOH AUTO SNAPSHOT:", label);

      console.table(snap.signal);

      if (snap.ground_truth) console.log("⛓️ ground_truth:", snap.ground_truth);

      if (snap.delta) console.log("📈 delta:", snap.delta);

      if (snap.drift) console.log("🧠 drift:", snap.drift);



      return snap;

    },



    report() {

      const h = this.history;

      if (h.length < 2) {

        console.warn("Need >= 2 samples for report()");

        return null;

      }



      const first = h[0];

      const last = h[h.length - 1];

      const c = core();



      const summary = {

        duration_ms: (last.ground_truth?.ts ?? last.t) - (first.ground_truth?.ts ?? first.t),

        tick_growth: (last.signal.scr_tick ?? 0) - (first.signal.scr_tick ?? 0),

        jitter_trend: (last.signal.jitter_ms ?? 0) - (first.signal.jitter_ms ?? 0),

        samples: h.length,

        gateway_first: first.session?.gateway_phase ?? first.system?.gateway_phase,

        gateway_last: last.session?.gateway_phase ?? last.system?.gateway_phase,

        readiness: this.readinessScore(),

        drift: c ? c.classifyDriftMultiAxisV1(h) : null

      };



      console.log("📊 RHIZOH AUTO REPORT");

      console.table(summary);

      return summary;

    },



    readinessScore() {

      const h = this.history;

      if (h.length < 3) {

        return { score: null, gate: "HOLD", reason: "need >= 3 samples" };

      }



      let score = 100;

      const notes = [];

      const c = core();

      const drift = c ? c.classifyDriftMultiAxisV1(h) : null;



      const tickDiffs = h.slice(1).map((s, i) => (s.signal.scr_tick ?? 0) - (h[i].signal.scr_tick ?? 0));

      const stalled = tickDiffs.filter((d) => d <= 0).length;

      if (stalled > 0) {

        score -= Math.min(40, stalled * 15);

        notes.push(`${stalled} interval(s) with no SCR tick growth`);

      }



      const jitterTrend = (h[h.length - 1].signal.jitter_ms ?? 0) - (h[0].signal.jitter_ms ?? 0);

      if (jitterTrend > 50) {

        score -= 20;

        notes.push(`jitter up ${jitterTrend}ms over window`);

      } else if (jitterTrend > 25) {

        score -= 10;

        notes.push(`jitter up ${jitterTrend}ms (watch)`);

      }



      if (drift?.axes?.idle_sample_ratio > 0.4 && stalled > 0) {

        score -= 5;

        notes.push("stall partly during idle tab — check visibility");

      }



      if (drift?.axes?.max_sampling_skew_ms > 500) {

        score -= 5;

        notes.push(`sampling skew ${drift.axes.max_sampling_skew_ms}ms — dual-clock correction applied`);

      }



      const badIdentity = h.filter((s) => !s.signal.identity_ok).length;

      if (badIdentity > 0) {

        score -= Math.min(30, badIdentity * 10);

        notes.push(`${badIdentity} sample(s) identity not clean`);

      }



      const forkHits = h.filter((s) => s.signal.fork_risk || s.signal.castle_split).length;

      if (forkHits > 0) {

        score -= 40;

        notes.push("fork_risk or castle_split detected");

      }



      const gw = h.map((s) => s.session?.gateway_phase ?? s.system?.gateway_phase);

      let gwFlips = 0;

      for (let i = 1; i < gw.length; i++) {

        if (gw[i] != null && gw[i - 1] != null && gw[i] !== gw[i - 1]) gwFlips++;

      }

      if (gwFlips > 2) {

        score -= Math.min(25, gwFlips * 5);

        notes.push(`${gwFlips} gateway status flips`);

      } else if (gwFlips > 0) {

        score -= 5;

        notes.push(`${gwFlips} gateway flip(s) (cold start ok)`);

      }



      if (h.every((s) => s.signal.rhythm_ok === false)) {

        score -= 10;

        notes.push("rhythm_ok false all samples (timing noise — watch)");

      }



      score = Math.max(0, Math.min(100, score));



      const gate =

        score >= 75 && stalled === 0 && badIdentity === 0 && forkHits === 0

          ? "WATCH"

          : score >= 50

            ? "HOLD"

            : "BLOCK";



      return { score, gate, notes, samples: h.length, drift_confidence: drift?.confidence ?? null };

    },



    exportLog() {

      return JSON.stringify(this.history, null, 2);

    },



    start(interval_ms = 120000) {

      if (this._timer) clearInterval(this._timer);

      this.tick("start-baseline");

      this._timer = setInterval(() => this.tick("auto"), interval_ms);

      console.log("🟢 RHIZOH AUTO OBSERVER STARTED:", interval_ms + "ms");

      return this;

    },



    stop() {

      if (this._timer) clearInterval(this._timer);

      this._timer = null;

      console.log("🔴 RHIZOH AUTO OBSERVER STOPPED");

      return this;

    }

  };



  window[KEY] = state;

  window.rhizohAuto = state;



  console.log("🧠 RHIZOH AUTO OBSERVER READY");

  console.log("→ paste rhizohObserveGroundTruthV0_6.js first");

  console.log("→ rhizohAuto.start(120000)");



  return state;

})();

