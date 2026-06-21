import React, { memo, useCallback, useState } from "react";
import {
  executeCastleInitGpsV0,
  executeCastleInitMapPickV0,
  executeCastleInitSkipV0,
  publishCastleInitStateV0
} from "../castleFlight/castleInitiationProtocolV0.js";

/**
 * İsteğe bağlı Castle anchor — kullanıcının dünyadaki merkezi (bina simülasyonu değil).
 * GPS · harita pin · soyut. Dünya gözlemi için WorldObservationGateV0 kullanılır.
 */
export const CastleInitiationGateV0 = memo(function CastleInitiationGateV0({
  open,
  onClose,
  owner = "GUEST",
  castleType = "SANCTUARY",
  applyPersonalCastleDsl,
  setRealityMode,
  onProductShellSelect,
  readClientContinuity,
  writeClientContinuity,
  onComplete
}) {
  const [busy, setBusy] = useState(null);
  const [note, setNote] = useState("");

  const deps = {
    owner,
    castleType,
    applyPersonalCastleDsl,
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
        publishCastleInitStateV0({ phase: "gate", path: kind });
        const out = await fn();
        if (out?.message) setNote(out.message);
        if (out?.reply) setNote(out.reply);
        if (out?.ok === false) {
          setNote(out.message || "İşlem tamamlanamadı.");
          return;
        }
        onComplete?.(out);
        if (kind !== "map") onClose?.();
      } catch (e) {
        setNote(String(e?.message || e));
      } finally {
        setBusy(null);
      }
    },
    [deps, onClose, onComplete]
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[450] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      data-rhizoh-v11-surface-modal="1"
      role="dialog"
      aria-labelledby="castle-init-title"
      data-rhizoh-castle-init-gate="1"
    >
      <div className="w-full max-w-md rounded-2xl border border-cyan-400/30 bg-[#050a14]/95 shadow-2xl p-4 space-y-4">
        <div>
          <h2 id="castle-init-title" className="text-sm font-black uppercase tracking-[0.2em] text-cyan-200">
            Castle anchor
          </h2>
          <p className="mt-2 text-[11px] text-white/70 leading-relaxed normal-case">
            Bu dünyada bir merkez (ev, park, masa veya soyut koordinat) oluşturmak ister misin? Zorunlu değil —
            dünya, studio ve pet castle olmadan da çalışır.
          </p>
        </div>

        <div className="space-y-2">
          <button
            type="button"
            disabled={!!busy}
            className="w-full text-left rounded-xl border border-cyan-400/40 bg-cyan-500/10 px-3 py-3 hover:bg-cyan-500/20 disabled:opacity-50"
            onClick={() => run("gps", () => executeCastleInitGpsV0(deps))}
          >
            <span className="text-[10px] font-bold text-cyan-100">📡 Konumunu kullan (önerilen)</span>
            <span className="block text-[9px] text-white/50 mt-0.5">GPS izni → otomatik anchor</span>
          </button>

          <button
            type="button"
            disabled={!!busy}
            className="w-full text-left rounded-xl border border-amber-400/35 bg-amber-500/10 px-3 py-3 hover:bg-amber-500/20 disabled:opacity-50"
            onClick={() => run("map", () => executeCastleInitMapPickV0(deps))}
          >
            <span className="text-[10px] font-bold text-amber-100">📍 Harita üzerinde seç</span>
            <span className="block text-[9px] text-white/50 mt-0.5">v11 harita · tek tık = castle anchor</span>
          </button>

          <button
            type="button"
            disabled={!!busy}
            className="w-full text-left rounded-xl border border-white/20 bg-white/5 px-3 py-3 hover:bg-white/10 disabled:opacity-50"
            onClick={() => run("skip", () => executeCastleInitSkipV0(deps))}
          >
            <span className="text-[10px] font-bold text-white/90">⛔ Konumsuz devam et</span>
            <span className="block text-[9px] text-white/50 mt-0.5">abstract_world_node · sistem çalışır kalır</span>
          </button>
        </div>

        {note ? (
          <p className="text-[9px] text-amber-200/90 border border-amber-400/20 rounded-lg px-2 py-1.5">{note}</p>
        ) : null}

        {busy === "map" ? (
          <p className="text-[9px] text-cyan-200/80 animate-pulse">Harita modu — globe üzerinde bir noktaya tıklayın…</p>
        ) : null}

        <button
          type="button"
          className="text-[9px] text-white/40 hover:text-white/70 w-full text-center"
          onClick={() => onClose?.()}
        >
          Kapat
        </button>
      </div>
    </div>
  );
});
