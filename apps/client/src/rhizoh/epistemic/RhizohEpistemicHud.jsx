import { memo, useMemo } from "react";
import { buildEpistemicOrbSurface } from "./buildEpistemicOrbSurfaceV529.js";
import { useRhizohEpistemicSurface } from "./useRhizohEpistemicSurface.js";

/**
 * Tam ekran minimal epistemik cockpit: kenar vignette + köşe durum şeridi.
 * pointer-events-none — etkileşimi engellemez.
 */
export const RhizohEpistemicHud = memo(function RhizohEpistemicHud({
  gatewayPhase = "",
  uiEnv,
  firebaseUid = null,
  hydrateFromDisk,
  /** İleride ayar / kullanıcı tercihi için */
  visible = true
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

  const gov = String(uiEnv?.governanceState || "NORMAL").toUpperCase();
  const govStress = gov === "DEGRADED" || gov === "FROZEN" || gov === "CRITICAL";
  const pulseSec = govStress ? 2.4 : 5.2;

  const { insetShadow, rimColor, labelColor } = useMemo(() => {
    const realm = String(uiEnv?.realityMode || "GLOBE");
    let edge = "rgba(34, 211, 238, 0.14)";
    let deep = "rgba(34, 211, 238, 0.05)";
    let rim = "rgba(34, 211, 238, 0.55)";
    let lbl = "text-cyan-200/80";

    if (surface.sealTone === "ok") {
      edge = "rgba(52, 211, 153, 0.16)";
      deep = "rgba(52, 211, 153, 0.06)";
      rim = "rgba(52, 211, 153, 0.65)";
      lbl = "text-emerald-200/85";
    } else if (surface.sealTone === "warn") {
      edge = "rgba(251, 191, 36, 0.18)";
      deep = "rgba(251, 191, 36, 0.07)";
      rim = "rgba(251, 191, 36, 0.7)";
      lbl = "text-amber-200/85";
    }

    if (realm === "REAL_MAP") {
      deep = "rgba(16, 185, 129, 0.09)";
    } else if (realm === "GLOBE") {
      deep = "rgba(99, 102, 241, 0.08)";
    }

    const insetShadow = `inset 0 0 100px ${edge}, inset 0 0 220px ${deep}, inset 0 0 24px ${rim}`;
    return { insetShadow, rimColor: rim, labelColor: lbl };
  }, [surface.sealTone, uiEnv?.realityMode]);

  if (!visible) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-[2] overflow-hidden" aria-hidden>
      <div
        className="absolute inset-0 opacity-[0.38] motion-safe:animate-pulse"
        style={{
          animationDuration: `${pulseSec}s`,
          boxShadow: insetShadow
        }}
      />
      <div
        className="absolute inset-x-0 top-0 h-px opacity-50"
        style={{
          background: `linear-gradient(90deg, transparent, ${rimColor}, transparent)`
        }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-px opacity-45"
        style={{
          background: `linear-gradient(90deg, transparent, ${rimColor}, transparent)`
        }}
      />

      <div
        className={`absolute bottom-3 left-3 max-w-[min(92vw,28rem)] rounded-lg border border-white/10 bg-black/30 px-2.5 py-1.5 backdrop-blur-sm ${labelColor}`}
      >
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 font-mono text-[8px] leading-tight tracking-[0.14em] normal-case">
          <span className="text-white/50">SEAL</span>
          <span className="font-bold">{surface.sealLabel}</span>
          <span className="text-white/25">·</span>
          <span className="text-white/50">LAYER</span>
          <span>{surface.primaryLayer}</span>
          <span className="text-white/25">·</span>
          <span className="text-white/50">SURFACE</span>
          <span>L{uiEnv?.layerFocus ?? "—"}</span>
          <span className="text-white/25">·</span>
          <span className="text-white/50">REALITY</span>
          <span>{String(uiEnv?.realityMode || "—")}</span>
          <span className="text-white/25">·</span>
          <span className="text-white/50">GOV</span>
          <span>{gov}</span>
        </div>
        {Array.isArray(surface.timeline) && surface.timeline.length ? (
          <div className="mt-1.5 border-t border-white/10 pt-1 font-mono text-[7px] leading-tight normal-case text-white/62">
            {surface.timeline.slice(0, 2).map((it, idx) => {
              const layer = String(it?.primaryLayer || "L?");
              const seal = String(it?.sealState || "UNK").slice(0, 3).toUpperCase();
              const d = typeof it?.driftIndex === "number" ? Number(it.driftIndex).toFixed(3) : "—";
              const s = typeof it?.vectorScore === "number" ? Number(it.vectorScore).toFixed(2) : "—";
              const tag =
                String(it?.resonanceTag || "").toLowerCase() === "stable"
                  ? "stable"
                  : String(it?.resonanceTag || "").toLowerCase() === "oscillating"
                    ? "oscillating"
                    : String(it?.resonanceTag || "").toLowerCase() === "fragile"
                      ? "fragile"
                      : null;
              return (
                <div key={`${it?.timestamp || idx}-${idx}`}>
                  {layer} · {seal} · Δ{d} · ΣE{s}
                  {tag ? ` · ${tag}` : ""}
                </div>
              );
            })}
          </div>
        ) : null}
      </div>

      <div className="absolute top-3 right-3 h-16 w-px opacity-35" style={{ background: rimColor }} />
      <div className="absolute top-3 right-3 h-px w-16 opacity-35" style={{ background: rimColor }} />
    </div>
  );
});

RhizohEpistemicHud.displayName = "RhizohEpistemicHud";
