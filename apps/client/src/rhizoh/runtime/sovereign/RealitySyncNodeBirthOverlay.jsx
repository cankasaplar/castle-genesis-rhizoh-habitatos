import React, { useEffect, useState } from "react";
import {
  clearRealitySyncBirthSessionV0,
  REALITY_SYNC_PHASE_V0
} from "./realitySyncUxV0.js";

const PHASE_MS = {
  [REALITY_SYNC_PHASE_V0.SEAL_PULSE]: 1200,
  [REALITY_SYNC_PHASE_V0.NODE_BIRTH]: 1400,
  [REALITY_SYNC_PHASE_V0.SIGNATURE_REVEAL]: 2200,
  [REALITY_SYNC_PHASE_V0.COMPLETE]: 800
};

const PHASE_ORDER = [
  REALITY_SYNC_PHASE_V0.SEAL_PULSE,
  REALITY_SYNC_PHASE_V0.NODE_BIRTH,
  REALITY_SYNC_PHASE_V0.SIGNATURE_REVEAL,
  REALITY_SYNC_PHASE_V0.COMPLETE
];

/**
 * Reality Sync UX — friend-first node birth cinematic + epi_sig reveal (read-only).
 */
export function RealitySyncNodeBirthOverlay({ payload, onDone }) {
  const [phase, setPhase] = useState(REALITY_SYNC_PHASE_V0.SEAL_PULSE);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (!payload) return undefined;
    const current = PHASE_ORDER[idx];
    if (!current) {
      clearRealitySyncBirthSessionV0();
      onDone?.();
      return undefined;
    }
    setPhase(current);
    const t = setTimeout(() => setIdx((i) => i + 1), PHASE_MS[current] || 1000);
    return () => clearTimeout(t);
  }, [idx, payload, onDone]);

  if (!payload) return null;

  const placeLabel = payload.anchor?.label
    ? String(payload.anchor.label)
    : `${payload.anchor.lat.toFixed(2)}°, ${payload.anchor.lon.toFixed(2)}°`;

  return (
    <div className="pointer-events-none fixed inset-0 z-[220] flex items-center justify-center bg-black/80">
      {phase === REALITY_SYNC_PHASE_V0.SEAL_PULSE ? (
        <div
          className="epistemic-seal-ring absolute h-[200px] w-[200px] rounded-full border border-amber-400/35"
          aria-hidden
        />
      ) : null}

      <div className="relative z-10 max-w-lg w-full px-6 text-center">
        {phase === REALITY_SYNC_PHASE_V0.SEAL_PULSE ? (
          <div className="animate-pulse text-sm uppercase tracking-[0.25em] text-amber-300/90 font-sans">
            Mühür oluşuyor…
          </div>
        ) : null}

        {phase === REALITY_SYNC_PHASE_V0.NODE_BIRTH ? (
          <>
            <div className="text-xs uppercase tracking-widest text-emerald-400/90 font-sans">
              Kalen doğuyor
            </div>
            <div className="mt-4 text-xl font-medium text-emerald-100 font-sans normal-case">
              {placeLabel}
            </div>
          </>
        ) : null}

        {phase === REALITY_SYNC_PHASE_V0.SIGNATURE_REVEAL ||
        phase === REALITY_SYNC_PHASE_V0.COMPLETE ? (
          <>
            <p className="text-base font-medium text-violet-100/95 font-sans normal-case leading-relaxed">
              Kaleniz Serencebey Genesis ağına kilitlendi.
            </p>
            <div className="mt-3 text-[10px] uppercase tracking-widest text-violet-300/70 font-mono">
              senin imzan
            </div>
            <div
              className="mt-3 break-all rounded-lg border border-violet-500/35 bg-violet-950/40 px-4 py-3 text-xs text-violet-100/95 font-mono"
              title={payload.composedSignature || ""}
            >
              {payload.composedSignature || "epi_sig_pending…"}
            </div>
            {phase === REALITY_SYNC_PHASE_V0.COMPLETE ? (
              <p className="mt-5 text-sm text-emerald-300/85 font-sans normal-case">
                Bitti Kaptan! diyebilirsin.
              </p>
            ) : null}
          </>
        ) : null}
      </div>

      <style>{`
        @keyframes epistemicSealRing {
          0% { transform: scale(0.6); opacity: 0; }
          50% { opacity: 0.5; }
          100% { transform: scale(1.4); opacity: 0; }
        }
        .epistemic-seal-ring {
          animation: epistemicSealRing 1.2s ease-out infinite;
        }
      `}</style>
    </div>
  );
}
