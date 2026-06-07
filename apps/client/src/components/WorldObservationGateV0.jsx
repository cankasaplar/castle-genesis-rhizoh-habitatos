import React, { memo, useCallback, useState } from "react";
import {
  executeWorldObservationGpsV0,
  executeWorldObservationSkipV0,
  publishWorldObservationStateV0
} from "../castleFlight/worldFirstObservationV0.js";
import { OBSERVE_INTENT_COPY_TR_V0 } from "../rhizoh/runtime/rhizohObserveFusionV0.js";

/**
 * İlk açılış: dünya gözlemi — konum isteğe bağlı. Castle bu kapıda yok.
 */
export const WorldObservationGateV0 = memo(function WorldObservationGateV0({
  open,
  onClose,
  setRealityMode,
  onProductShellSelect,
  readClientContinuity,
  writeClientContinuity
}) {
  const [busy, setBusy] = useState(null);
  const [note, setNote] = useState("");

  const deps = {
    setRealityMode,
    onProductShellSelect,
    readClientContinuity,
    writeClientContinuity
  };

  const run = useCallback(
    async (kind, fn) => {
      setBusy(kind);
      setNote("");
      try {
        publishWorldObservationStateV0({ phase: "gate", path: kind });
        const out = await fn();
        if (out?.message) setNote(out.message);
        if (out?.ok === false) {
          setNote(out.message || "Konum alınamadı.");
          return;
        }
        onClose?.();
      } catch (e) {
        setNote(String(e?.message || e));
      } finally {
        setBusy(null);
      }
    },
    [onClose]
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[310] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
      role="dialog"
      aria-labelledby="world-obs-title"
      data-rhizoh-world-observation-gate="1"
    >
      <div className="w-full max-w-md rounded-2xl border border-violet-400/30 bg-[#050812]/95 shadow-2xl p-4 space-y-4">
        <div>
          <h2 id="world-obs-title" className="text-sm font-black uppercase tracking-[0.18em] text-violet-200">
            {OBSERVE_INTENT_COPY_TR_V0.worldGateTitle}
          </h2>
          <p className="mt-2 text-[11px] text-white/75 leading-relaxed normal-case">
            {OBSERVE_INTENT_COPY_TR_V0.worldGateSubtitle} Konumunu paylaşırsan harita gerçek koordinatlara yaklaşır;
            paylaşmazsan soyut gözlem modunda kalırsın. Fiziksel Box kamera ve kale ayrı adımlardır.
          </p>
        </div>

        <div className="space-y-2">
          <button
            type="button"
            disabled={!!busy}
            className="w-full rounded-xl border border-cyan-400/40 bg-cyan-500/10 px-3 py-3 text-left hover:bg-cyan-500/20 disabled:opacity-50"
            onClick={() => run("gps", () => executeWorldObservationGpsV0(deps))}
          >
            <span className="text-[10px] font-bold text-cyan-100">Konumu aç</span>
            <span className="block text-[9px] text-white/50 mt-0.5 normal-case">
              Tarayıcı izin penceresi → gerçek dünya (REAL_MAP)
            </span>
          </button>

          <button
            type="button"
            disabled={!!busy}
            className="w-full rounded-xl border border-white/20 bg-white/5 px-3 py-3 text-left hover:bg-white/10 disabled:opacity-50"
            onClick={() => run("skip", () => executeWorldObservationSkipV0(deps))}
          >
            <span className="text-[10px] font-bold text-white/90">Konumsuz devam et</span>
            <span className="block text-[9px] text-white/50 mt-0.5 normal-case">
              Soyut dünya · Studio ve gateway çalışmaya devam eder
            </span>
          </button>
        </div>

        {note ? (
          <p className="text-[9px] text-amber-200/90 border border-amber-400/20 rounded-lg px-2 py-1.5 normal-case">
            {note}
          </p>
        ) : null}
      </div>
    </div>
  );
});
