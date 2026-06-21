import React, { useEffect, useState } from "react";
import { readUiLocaleV0 } from "../rhizoh/runtime/rhizohUiLocaleV0.js";

function readDashboardSnapshotV0() {
  if (typeof window === "undefined") return null;
  const r = window.__rhizoh;
  if (!r) return null;
  try {
    return {
      identity: r.identityManifest?.project?.() ?? null,
      meaning: null,
      visitor: r.visitorTrace?.snapshot?.() ?? null,
      lens: r.observerLens?.project?.() ?? null,
      narrative: r.narrativePlane?.build?.({ locale: readUiLocaleV0() }) ?? null,
      resonance: r.epistemicResonanceField?.measure?.({ locale: readUiLocaleV0() }) ?? null
    };
  } catch {
    return null;
  }
}

/**
 * Epistemic dashboard v1 — 3-layer read-only panel (spec: RHIZOH_EPISTEMIC_DASHBOARD_V1.md)
 */
export function RhizohEpistemicDashboardPanelV1({ defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const [snap, setSnap] = useState(() => readDashboardSnapshotV0());
  const tr = readUiLocaleV0() === "tr";

  useEffect(() => {
    const tick = () => setSnap(readDashboardSnapshotV0());
    tick();
    const id = window.setInterval(tick, 4000);
    return () => window.clearInterval(id);
  }, []);

  if (!snap) return null;

  return (
    <div
      className="pointer-events-auto fixed right-3 z-[28] max-w-[17rem] rounded-xl border border-cyan-400/25 bg-black/90 shadow-lg backdrop-blur-md"
      style={{ top: "calc(5.5rem + env(safe-area-inset-top, 0px))" }}
      data-rhizoh-epistemic-dashboard-v1="1"
    >
      <button
        type="button"
        className="flex w-full items-center justify-between px-3 py-2 text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-cyan-200/90">
          {tr ? "Epistemik panel" : "Epistemic dashboard"}
        </span>
        <span className="text-[10px] text-white/50">{open ? "−" : "+"}</span>
      </button>
      {open ? (
        <div className="space-y-2 border-t border-white/10 px-3 py-2 text-[9px] normal-case text-white/75">
          <section>
            <p className="mb-1 font-semibold uppercase tracking-wider text-white/45">
              {tr ? "1 · Sistem kimliği" : "1 · System identity"}
            </p>
            <p className="text-white/85">{snap.identity?.subjectId || "—"}</p>
            <p className="text-white/55">{snap.identity?.continuityVerdict || "—"}</p>
          </section>
          <section>
            <p className="mb-1 font-semibold uppercase tracking-wider text-white/45">
              {tr ? "2 · Anlam katmanı" : "2 · Ontology"}
            </p>
            <p className="text-white/70">
              {tr ? "Harita · Satranç · Kale koordinatları" : "Map · Chess · Castle coordinates"}
            </p>
            <p className="text-white/55">{snap.narrative?.youAreHere || "—"}</p>
          </section>
          <section>
            <p className="mb-1 font-semibold uppercase tracking-wider text-white/45">
              {tr ? "3 · Gözlem izi" : "3 · Observer echo"}
            </p>
            <p>
              {tr ? "Oturum" : "Sessions"}: {snap.visitor?.sessions ?? 0} ·{" "}
              {tr ? "Uyum" : "Coherence"}: {(snap.visitor?.coherence_alignment ?? 0).toFixed(2)}
            </p>
            <p className="text-white/55">
              {tr ? "Tanıma" : "Recognition"}: {snap.lens?.returnField?.recognition ?? "none"}
            </p>
            {snap.resonance?.primaryEntity ? (
              <p className="mt-1 text-amber-200/80">
                {tr ? "Ölçüm" : "Measure"}: {snap.resonance.primaryEntity} ·{" "}
                {(snap.resonance.peakResonance ?? 0).toFixed(2)}{" "}
                <span className="text-white/40">({tr ? "etkisiz" : "no influence"})</span>
              </p>
            ) : null}
          </section>
        </div>
      ) : null}
    </div>
  );
}
