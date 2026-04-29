import React, { memo, useEffect, useState } from "react";
import { subscribeCastleDroneTelemetry } from "./telemetryHub.js";

/** REAL_MAP aktifken drone telemetri özet şeridi + manifest linki */
const CastleFlightHud = memo(() => {
  const [lines, setLines] = useState([]);
  const [cats, setCats] = useState({});
  const [labels, setLabels] = useState({});
  const [counts, setCounts] = useState({});
  const [selectedPoi, setSelectedPoi] = useState(null);
  const [sample, setSample] = useState([]);
  const [colors, setColors] = useState({});

  useEffect(() => {
    return subscribeCastleDroneTelemetry((p) => {
      setLines((prev) => [{ ...p, t: Date.now() }, ...prev].slice(0, 6));
    });
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      const c = window.__CASTLE_CESIUM__;
      if (!c?.getCategoryState) return;
      setCats(c.getCategoryState());
      setLabels(c.categoryLabels || {});
      setCounts(c.getCategoryCounts?.() || {});
      setSample(c.getImportantSample?.(12) || []);
      setColors(c.categoryColors || {});
      setSelectedPoi(c.selectedPoi || null);
    }, 500);
    return () => clearInterval(id);
  }, []);

  const toggleCat = (k) => {
    const c = window.__CASTLE_CESIUM__;
    if (!c?.setCategoryVisible) return;
    const next = !cats[k];
    c.setCategoryVisible(k, next);
    setCats((prev) => ({ ...prev, [k]: next }));
  };

  return (
    <div className="bg-slate-950/90 border border-sky-500/35 rounded-2xl p-3 text-[8px] font-mono normal-case">
      <div className="text-sky-400 font-black uppercase tracking-[0.25em] mb-2 flex justify-between gap-2">
        <span>Realtime flight · telemetry</span>
        <a
          href="/castle-flight-satellite.manifest.json"
          target="_blank"
          rel="noreferrer"
          className="text-cyan-400/90 underline underline-offset-2 font-semibold hover:text-cyan-300"
        >
          manifest
        </a>
      </div>
      <div className="flex flex-wrap gap-1 mb-2">
        {Object.keys(cats).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => toggleCat(k)}
            className={`px-1.5 py-0.5 rounded border text-[7px] ${cats[k] ? "border-emerald-400/60 text-emerald-300 bg-emerald-500/10" : "border-white/20 text-white/45"}`}
          >
            {labels[k] || k} ({counts[k] ?? 0})
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-1 mb-2 text-[7px] normal-case text-white/65">
        {Object.keys(counts)
          .filter((k) => counts[k] > 0)
          .slice(0, 8)
          .map((k) => (
            <div key={k} className="flex items-center gap-1 border border-white/10 rounded px-1 py-0.5">
              <span className="inline-block w-2 h-2 rounded-full" style={{ background: colors[k] || "#ddd" }} />
              <span>{labels[k] || k}</span>
              <span className="text-white/35">x{counts[k]}</span>
            </div>
          ))}
      </div>
      {lines.length === 0 ? (
        <span className="text-white/40 leading-relaxed">REAL CITY 3D (CESIUM) açıkken sim drone&apos;lar döner; `VITE_DRONE_TELEMETRY_WS` ile canlı pose.</span>
      ) : (
        <div className="space-y-1 max-h-28 overflow-y-auto no-scrollbar">
          {lines.map((l, i) => (
            <div key={`${l.t}-${i}-${l.id}`} className="text-white/75 border-b border-white/5 pb-1 leading-snug">
              <span className="text-cyan-500">{l.id}</span> · {l.lat != null ? l.lat.toFixed(5) : "?"} , {l.lon != null ? l.lon.toFixed(5) : "?"} · alt{" "}
              {l.alt != null ? Math.round(l.alt) : "?"} · <span className="text-white/45">{l.source}</span>
            </div>
          ))}
        </div>
      )}
      {selectedPoi ? (
        <div className="mt-2 p-2 rounded border border-cyan-400/35 bg-cyan-500/5 shadow-[0_0_20px_rgba(34,211,238,0.18)]">
          <div className="text-[7px] text-cyan-300/90 uppercase tracking-[0.2em] mb-1">Hologram Card · Selected POI</div>
          <div className="text-[9px] text-white">{selectedPoi.name}</div>
          <div className="text-[7px] text-white/55">{selectedPoi.categoryLabel}</div>
          <div className="text-[7px] text-white/45">
            {selectedPoi.lat?.toFixed?.(5)} , {selectedPoi.lon?.toFixed?.(5)}
          </div>
          <div className="text-[7px] text-white/35 mt-1 break-words">{Object.entries(selectedPoi.tags || {}).slice(0, 4).map(([k, v]) => `${k}:${v}`).join(" · ")}</div>
        </div>
      ) : (
        <div className="mt-2 p-2 rounded border border-fuchsia-400/20 bg-fuchsia-500/5">
          <div className="text-[7px] text-fuchsia-300/90 uppercase tracking-[0.2em] mb-1">Hologram Cards · Preview</div>
          <div className="space-y-1 max-h-20 overflow-y-auto no-scrollbar">
            {sample.slice(0, 4).map((p) => (
              <div key={p.id} className="text-[7px] text-white/70 border-b border-white/5 pb-1">
                <span className="text-cyan-400">{p.name}</span> · {labels[p.category] || p.category}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

export default CastleFlightHud;
