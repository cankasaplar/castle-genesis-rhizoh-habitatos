/**
 * RHIZOH Observe Button v0 — DOM injection when DevTools console is locked
 * Paste once on rhizoh.com (Sources snippet, bookmarklet, or any JS entry you have).
 * NOT in prod bundle · Phase 0 / Lab L0.5 · read-only · no mutation
 * @see docs/RHIZOH_OBSERVATION_PROTOCOL_V0.2.md
 */
(function rhizohObserveButtonV0() {
  const BTN_ID = "rhizoh-observe-btn-v0";
  const PANEL_ID = "rhizoh-observe-panel-v0";

  function buildSnapshot(label) {
    if (typeof window.rhizohObserve === "function") {
      return window.rhizohObserve(label);
    }
    const r = window.__rhizoh || {};
    const g = (p) => p.split(".").reduce((o, k) => (o ? o[k] : undefined), r);
    const structural = g("liveMonitor.identity.structural");
    const identityBreak = g("liveMonitor.identity.identity_break");
    const snap = {
      meta: { label, time: new Date().toISOString(), ts: Date.now(), origin: "rhizohObserveButton" },
      signal: {
        rhythm_ok: g("organismRhythm.ok"),
        jitter_ms: g("organismRhythm.max_jitter_ms"),
        scr_tick: g("liveMonitor.scr.tick_seq"),
        identity_ok: structural !== true && identityBreak !== true,
        fork_risk: g("liveMonitor.castle.fork_risk"),
        castle_split: g("liveMonitor.castle.castle_surface_split"),
        gateway_phase:
          window.__CASTLE_GATEWAY_SESSION_KEEPER__?.lastPhase
          ?? window.__CASTLE_BUILD_RUNTIME_SNAPSHOT__?.()?.gatewayState?.phase
          ?? null
      },
      system: {
        live: !!g("liveMonitor"),
        wal: !!g("worldActionLog"),
        memory: !!g("worldWalPersistence")
      },
      phase0_guard: { observation_only: true, ui_observe: true }
    };
    const prev = window.__rhizoh_last_snapshot;
    if (prev?.signal) {
      snap.delta = {
        tick_diff: (snap.signal.scr_tick ?? 0) - (prev.signal.scr_tick ?? 0),
        jitter_diff: (snap.signal.jitter_ms ?? 0) - (prev.signal.jitter_ms ?? 0),
        ms_since_prev: snap.meta.ts - (prev.meta?.ts ?? snap.meta.ts)
      };
    }
    window.__rhizoh_last_snapshot = snap;
    (window.__rhizoh_observe_log = window.__rhizoh_observe_log || []).push(snap);
    return snap;
  }

  function signalRows(snap) {
    const s = snap?.signal || {};
    const d = snap?.delta;
    return [
      ["rhythm_ok", s.rhythm_ok],
      ["jitter_ms", s.jitter_ms],
      ["scr_tick", s.scr_tick],
      ["identity_ok", s.identity_ok],
      ["gateway_phase", s.gateway_phase],
      ["fork_risk", s.fork_risk],
      ["castle_split", s.castle_split],
      ["tick_diff", d?.tick_diff],
      ["jitter_diff", d?.jitter_diff]
    ];
  }

  function showPanel(snap) {
    let panel = document.getElementById(PANEL_ID);
    if (!panel) {
      panel = document.createElement("div");
      panel.id = PANEL_ID;
      panel.style.cssText = [
        "position:fixed",
        "top:48px",
        "right:10px",
        "z-index:999998",
        "width:min(420px,92vw)",
        "max-height:70vh",
        "overflow:auto",
        "background:#0b0f14",
        "color:#d7e1ea",
        "border:1px solid #0f0",
        "font:12px/1.4 ui-monospace,Menlo,Consolas,monospace",
        "padding:10px",
        "box-shadow:0 8px 24px rgba(0,0,0,.5)"
      ].join(";");
      document.body.appendChild(panel);
    }

    const rows = signalRows(snap)
      .map(([k, v]) => `<tr><td style="color:#8a9bb0;padding:2px 8px 2px 0">${k}</td><td>${v ?? "—"}</td></tr>`)
      .join("");

    const json = JSON.stringify(snap, null, 2);
    panel.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <strong style="color:#0f0">RHIZOH OBSERVE</strong>
        <span style="color:#8a9bb0">${snap.meta?.time || ""}</span>
      </div>
      <table style="width:100%;border-collapse:collapse;margin-bottom:8px">${rows}</table>
      <div style="display:flex;gap:6px;margin-bottom:8px">
        <button type="button" data-act="copy" style="padding:6px 10px;background:#1e4d3a;color:#fff;border:0;border-radius:4px;cursor:pointer">Copy JSON</button>
        <button type="button" data-act="close" style="padding:6px 10px;background:#4d1e1e;color:#fff;border:0;border-radius:4px;cursor:pointer">Close</button>
      </div>
      <pre style="margin:0;white-space:pre-wrap;word-break:break-all;font-size:10px;color:#8a9bb0">${json.replace(/</g, "&lt;")}</pre>
    `;

    panel.querySelector('[data-act="close"]')?.addEventListener("click", () => panel.remove(), { once: true });
    panel.querySelector('[data-act="copy"]')?.addEventListener(
      "click",
      () => {
        const text = JSON.stringify(snap);
        if (navigator.clipboard?.writeText) {
          navigator.clipboard.writeText(text).then(() => {
            panel.querySelector('[data-act="copy"]').textContent = "Copied";
          });
        } else {
          window.prompt("Copy observe JSON:", text);
        }
      },
      { once: true }
    );
  }

  function onObserveClick() {
    const n = (window.__rhizoh_observe_log?.length || 0) + 1;
    const snap = buildSnapshot(`ui-${n}`);
    showPanel(snap);
    window.__rhizoh_last_ui_observe = snap;
    return snap;
  }

  function mountButton() {
    if (document.getElementById(BTN_ID)) return document.getElementById(BTN_ID);
    const btn = document.createElement("button");
    btn.id = BTN_ID;
    btn.type = "button";
    btn.innerText = "RHIZOH OBSERVE";
    btn.title = "Phase 0 read-only snapshot (no console required)";
    btn.style.cssText = [
      "position:fixed",
      "top:10px",
      "right:10px",
      "z-index:999999",
      "padding:8px 12px",
      "background:#000",
      "color:#0f0",
      "border:1px solid #0f0",
      "font:12px ui-monospace,Menlo,Consolas,monospace",
      "cursor:pointer",
      "border-radius:4px"
    ].join(";");
    btn.onclick = onObserveClick;
    document.body.appendChild(btn);
    return btn;
  }

  window.rhizohObserveButton = {
    mount: mountButton,
    tick: onObserveClick,
    unmount() {
      document.getElementById(BTN_ID)?.remove();
      document.getElementById(PANEL_ID)?.remove();
    }
  };

  mountButton();
})();
