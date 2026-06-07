/** Laptop A L0.5 — tek parça inline (rhizoh.com Console). Tam sürüm: rhizohLabL05MetricsV0.js */
(function () {
  const P = "__rhizoh_lab_l05_prev", JR = "__rhizoh_lab_l05_jitter_ring", TOL = 64, EPS = 2.5;
  const g = (p) => p.split(".").reduce((o, k) => (o ? o[k] : undefined), window.__rhizoh || {});
  const pct = (a, p) => {
    if (!a.length) return null;
    const s = [...a].sort((x, y) => x - y);
    return s[Math.min(s.length - 1, Math.floor((s.length - 1) * p))];
  };
  function capture(arg) {
    const label = typeof arg === "string" ? arg : String(arg?.label ?? "l05");
    const laptop = arg?.laptop != null ? String(arg.laptop) : null;
    const q = g("ingressQueue") || window.__rhizoh?.observe?.ingressQueue?.() || {};
    const now = Date.now(), seq = +q.lastAcceptedSeq, tick = +g("presenceFrame.tickSeq"), queued = +q.queued || 0;
    const prev = window[P];
    let drain = null, ingest = null, dms = null, dseq = null, dtick = null;
    if (prev?.lastAcceptedSeq != null && seq) {
      dms = now - prev.atMs;
      dseq = seq - prev.lastAcceptedSeq;
      if (dms > 0) drain = +(dseq / (dms / 1000)).toFixed(3);
    }
    if (prev?.tickSeq != null && tick && dms > 0) {
      dtick = tick - prev.tickSeq;
      ingest = +(dtick / (dms / 1000)).toFixed(3);
    }
    window[P] = { atMs: now, lastAcceptedSeq: seq, tickSeq: tick || prev?.tickSeq, queued };
    const maxJ = g("organismRhythm.max_jitter_ms");
    const ring = window[JR] || [];
    if (Number.isFinite(maxJ)) { ring.push(maxJ); while (ring.length > 48) ring.shift(); }
    window[JR] = ring;
    const layers = (g("organismStabilization.rhythm.layers") || []).map((l) => +l.jitter_ms).filter(Number.isFinite);
    let plateau = null;
    if (drain != null && ingest != null) {
      const gap = Math.abs(ingest - drain);
      plateau = { producer_approx_consumer: gap <= EPS, rate_gap_per_sec: +gap.toFixed(3), ingest, drain };
    }
    const snap = {
      schema: "castle.rhizoh.lab_l05_inline.v0",
      atMs: now,
      meta: { label, phase: "L0.5", ...(laptop ? { laptop } : {}) },
      anchors: {
        world_id: g("worldIdentity.world_identity_id"),
        identity_version: g("worldIdentity.identity_version") ?? null,
        chain_head_hash: g("worldIdentity.chain_head_hash") ?? null,
        last_episode_seq: g("worldIdentity.last_episode_seq") ?? null,
        cis01: g("continuityIntegrityScore.cis01"),
        identity_locked: g("castleCoherenceLock.ok") === true,
        world_id_note:
          "world_identity_id suffix tracks chain_head_hash — string may change each WAL fold; use identity_version + chain_head for continuity"
      },
      ingress: {
        queued, backpressure: q.backpressure === true, lastAcceptedSeq: seq || null,
        drain_rate_per_sec: drain, ingest_rate_per_sec_proxy: ingest, delta_ms: dms, delta_seq: dseq, plateau
      },
      rhythm: {
        ok: g("organismRhythm.ok") === true,
        max_jitter_ms: maxJ ?? null,
        jitter_p50_ms: pct(ring, 0.5),
        jitter_p95_ms: pct(ring, 0.95),
        layer_p95_ms: pct(layers, 0.95)
      },
      gateway: {
        phase: window.__CASTLE_GATEWAY_SESSION_KEEPER__?.lastPhase ?? null,
        boot_age_ms: performance.timeOrigin ? now - performance.timeOrigin : null
      },
      ssot: { STATE: "HEALTHY_OVERLOAD_EQUILIBRIUM", FAILURE_CLASS: "none_observed" }
    };
    (window.__rhizoh_lab_l05_log = window.__rhizoh_lab_l05_log || []).push(snap);
    return snap;
  }
  function report() {
    const log = window.__rhizoh_lab_l05_log || [];
    if (log.length < 2) return { ok: false, need: "2x capture", n: log.length };
    const b = log[log.length - 1];
    return {
      ok: true,
      from: log[log.length - 2].meta?.label,
      to: b.meta?.label,
      drain_rate_per_sec: b.ingress.drain_rate_per_sec,
      ingest_rate_per_sec_proxy: b.ingress.ingest_rate_per_sec_proxy,
      plateau: b.ingress.plateau,
      jitter_p95_ms: b.rhythm.jitter_p95_ms
    };
  }
  window.rhizohLabL05 = { capture, report };
  console.log("✅ rhizohLabL05 INLINE ready");
})();
