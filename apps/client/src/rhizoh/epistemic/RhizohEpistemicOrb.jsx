import { memo, useMemo } from "react";
import { buildEpistemicOrbSurface } from "./buildEpistemicOrbSurfaceV529.js";
import { useRhizohEpistemicSurface } from "./useRhizohEpistemicSurface.js";

/**
 * Son turun epistemik sözleşmesi + mühür durumu (Intent Orb).
 * @param {{
 *   gatewayPhase?: string | null,
 *   uiEnv: { layerFocus: number, realityMode: string, governanceState: string, mapSurfaceActive: boolean },
 *   firebaseUid?: string | null,
 *   hydrateFromDisk?: () => { epistemic?: object, modelRoute?: object, source?: string, router?: object } | null
 * }} props
 */
export const RhizohEpistemicOrb = memo(function RhizohEpistemicOrb({
  gatewayPhase = "",
  uiEnv,
  firebaseUid = null,
  hydrateFromDisk
}) {
  const snapshot = useRhizohEpistemicSurface(hydrateFromDisk);

  const surface = useMemo(
    () =>
      buildEpistemicOrbSurface({
        snapshot,
        gatewayPhase,
        uiEnv,
        firebaseUid
      }),
    [snapshot, gatewayPhase, uiEnv, firebaseUid]
  );

  const borderGlow =
    surface.sealTone === "ok"
      ? "border-emerald-400/35 shadow-[0_0_28px_rgba(52,211,153,0.12)]"
      : surface.sealTone === "warn"
        ? "border-amber-400/40 shadow-[0_0_24px_rgba(251,191,36,0.1)]"
        : "border-cyan-400/25 shadow-[0_0_20px_rgba(34,211,238,0.08)]";
  const resonanceDot =
    surface.resonance === "stable"
      ? "bg-emerald-300/85 shadow-[0_0_10px_rgba(52,211,153,0.45)]"
      : surface.resonance === "oscillating"
        ? "bg-amber-300/85 animate-pulse shadow-[0_0_10px_rgba(251,191,36,0.4)]"
        : surface.resonance === "fragile"
          ? "bg-rose-300/70 animate-pulse shadow-[0_0_10px_rgba(251,113,133,0.35)]"
          : "bg-white/35";

  return (
    <div
      className={`rounded-2xl border bg-[#050810]/90 backdrop-blur-md px-3 py-2.5 ${borderGlow}`}
      role="status"
      aria-label="Rhizoh epistemic operating conditions"
    >
      <div className="mb-2 flex items-center justify-between">
        <div className="text-[8px] font-black uppercase tracking-[0.32em] text-cyan-200/85">Epistemic orb</div>
        <span className={`inline-block h-2 w-2 rounded-full ${resonanceDot}`} aria-hidden />
      </div>
      <div className="space-y-1 font-mono text-[9px] leading-tight normal-case">
        {surface.rows.map((row) => {
          const col =
            row.tone === "ok"
              ? "text-emerald-300/95"
              : row.tone === "warn"
                ? "text-amber-200/90"
                : row.tone === "accent"
                  ? "text-cyan-200/95"
                  : "text-white/72";
          return (
            <div key={row.k} className="flex gap-2 justify-between gap-x-3">
              <span className="shrink-0 text-white/45 uppercase tracking-wide">{row.k}</span>
              <span className={`text-right min-w-0 break-all ${col}`}>{row.v}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
});

RhizohEpistemicOrb.displayName = "RhizohEpistemicOrb";
