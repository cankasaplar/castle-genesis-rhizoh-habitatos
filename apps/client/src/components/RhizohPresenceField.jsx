import React, { useEffect, useLayoutEffect, useRef } from "react";
import { useRhizohPresenceAnimation } from "../rhizoh/presence/useRhizohPresenceAnimation.js";

const STYLE_ID = "rhizoh-presence-field-keyframes";

function ensurePresenceKeyframes() {
  if (typeof document === "undefined") return;
  if (document.getElementById(STYLE_ID)) return;
  const s = document.createElement("style");
  s.id = STYLE_ID;
  s.textContent = `
@keyframes qpp-ring-expand {
  0% { transform: translate(-50%, -50%) scale(0.35); opacity: 0.55; }
  100% { transform: translate(-50%, -50%) scale(1.35); opacity: 0; }
}
@keyframes qpp-trace-breathe {
  0%, 100% { opacity: 0.42; letter-spacing: 0.22em; }
  50% { opacity: 0.78; letter-spacing: 0.28em; }
}
@keyframes qpp-resonance-flow {
  0% { stroke-dashoffset: 48; opacity: 0.2; }
  40% { opacity: 0.85; }
  100% { stroke-dashoffset: 0; opacity: 0.35; }
}
@keyframes qpp-orbit-drift {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
  `;
  document.head.appendChild(s);
}

/**
 * FSM + bus ile beslenen görünür presence alanı (renderer katmanı).
 */
function csilAuraFromTelemetry(presenceTelemetry) {
  const tel = presenceTelemetry && typeof presenceTelemetry === "object" ? presenceTelemetry : null;
  if (!tel) return null;
  const kin = tel.qppKinetics && typeof tel.qppKinetics === "object" ? tel.qppKinetics : {};
  const driftScale = Math.max(0.55, Math.min(1.5, Number(kin.orbitDriftScale) || 1));
  const colorTension = Math.max(0, Math.min(1, Number(kin.colorTension) || 0));
  const mode = String(tel.qppMode || "");
  const ql = String(tel.qppLabel || "").toLowerCase();
  let pack = null;
  if (mode === "cautious" || ql.includes("observ") || ql.includes("reconcile")) {
    pack = {
      core: "rgba(251,191,36,0.5)",
      rim: "rgba(245,158,11,0.14)",
      orbit: "border-amber-300/40 bg-amber-400/12",
      driftSec: 36
    };
  } else if (mode === "soft_pulse" || ql.includes("noticing") || ql.includes("drift")) {
    pack = {
      core: "rgba(167,139,250,0.48)",
      rim: "rgba(139,92,246,0.14)",
      orbit: "border-violet-300/45 bg-violet-400/14",
      driftSec: 28
    };
  } else if (mode === "open" || ql.includes("welcom")) {
    pack = {
      core: "rgba(52,211,153,0.48)",
      rim: "rgba(16,185,129,0.14)",
      orbit: "border-emerald-300/40 bg-emerald-400/12",
      driftSec: 40
    };
  } else if (ql.includes("ambient")) {
    pack = {
      core: "rgba(148,163,184,0.35)",
      rim: "rgba(100,116,139,0.1)",
      orbit: "border-slate-400/30 bg-slate-500/10",
      driftSec: 56
    };
  }
  if (!pack) {
    return {
      colorTension,
      driftScale,
      driftSec: Math.round(48 * driftScale),
      traceBreathSec: Number(kin.traceBreathSec) || 5.2,
      resonanceLineSecScale: Number(kin.resonanceLineSecScale) || 1
    };
  }
  return {
    ...pack,
    driftSec: Math.max(18, Math.round(pack.driftSec * driftScale)),
    colorTension,
    traceBreathSec: Number(kin.traceBreathSec) || 5.2,
    resonanceLineSecScale: Math.max(0.72, Math.min(1.45, Number(kin.resonanceLineSecScale) || 1))
  };
}

export function RhizohPresenceField({
  phase = "idle",
  intensity = 0.4,
  resonance = 0.5,
  label = "present",
  pulseNonce = 0,
  resonanceActive = false,
  soundEnabled = false,
  onSoundEnabledChange = null,
  presenceTelemetry = null,
  csilVisualActive = false
}) {
  const wrapRef = useRef(null);
  const kineticsRef = useRef({});

  useEffect(() => {
    ensurePresenceKeyframes();
  }, []);

  useLayoutEffect(() => {
    const k =
      presenceTelemetry?.qppKinetics && typeof presenceTelemetry.qppKinetics === "object"
        ? presenceTelemetry.qppKinetics
        : {};
    kineticsRef.current = k;
  }, [presenceTelemetry]);

  useRhizohPresenceAnimation(wrapRef, { enabled: true, kineticsRef });

  const csilAura = csilVisualActive ? csilAuraFromTelemetry(presenceTelemetry) : null;
  const ringClass =
    csilAura && csilAura.orbit ? csilAura.orbit : "border-cyan-300/35 bg-cyan-400/15";
  const tension = csilAura && typeof csilAura.colorTension === "number" ? csilAura.colorTension : 0;
  const traceSec =
    csilAura && typeof csilAura.traceBreathSec === "number" ? csilAura.traceBreathSec : 5.2;
  const lineScale =
    csilAura && typeof csilAura.resonanceLineSecScale === "number" ? csilAura.resonanceLineSecScale : 1;

  const orbitNodes = [0, 72, 144, 216, 288].map((deg, i) => {
    const rad = (deg * Math.PI) / 180;
    const r = 46;
    const x = Math.cos(rad) * r;
    const y = Math.sin(rad) * r;
    return (
      <div
        key={i}
        className={`absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border ${ringClass}`}
        style={{
          transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
          opacity: 0.35 + intensity * 0.35
        }}
      />
    );
  });

  return (
    <div
      className="relative rounded-2xl border border-cyan-400/15 bg-black/30 px-3 py-3 overflow-hidden"
      data-qpp-phase={phase}
      data-csil-qpp={presenceTelemetry?.qppLabel || ""}
      data-csil-mode={presenceTelemetry?.qppMode || ""}
      data-qpp-physics-phase={presenceTelemetry?.qppPhysics?.phase || ""}
      data-qpp-bias-quiet-p={String(presenceTelemetry?.qppPhysics?.quietStateProbability ?? "")}
      data-qpp-bias-observe={String(presenceTelemetry?.qppPhysics?.observationMode ?? "")}
    >
      <div
        ref={wrapRef}
        className="relative mx-auto flex h-[132px] w-full max-w-sm flex-col items-center justify-center"
        style={{
          ["--qpp-scale"]: "1",
          ["--qpp-opacity"]: "0.2",
          ["--qpp-blur"]: "16px"
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 rounded-full"
          style={{
            background: csilAura?.core
              ? `radial-gradient(circle at 50% 48%, ${csilAura.core} 0%, ${csilAura.rim} 40%, transparent 70%)`
              : `radial-gradient(circle at 50% 48%, rgba(34,211,238,0.42) 0%, rgba(6,182,212,0.12) 38%, transparent 68%)`,
            boxShadow:
              tension > 0.04
                ? `inset 0 0 48px rgba(180,83,9,${0.06 + tension * 0.14})`
                : undefined,
            transform: `scale(var(--qpp-scale, 1))`,
            opacity: `var(--qpp-opacity, 0.2)`,
            filter: `blur(var(--qpp-blur, 16px))`,
            transition: "opacity 0.12s linear, background 0.35s ease, box-shadow 0.4s ease"
          }}
        />

        <div
          className="pointer-events-none absolute left-1/2 top-[42%] h-[118px] w-[118px] -translate-x-1/2 -translate-y-1/2 opacity-[0.12]"
          style={{
            animation: `qpp-orbit-drift ${csilAura?.driftSec != null ? csilAura.driftSec : 48}s linear infinite`
          }}
        >
          {orbitNodes}
        </div>

        <div className="pointer-events-none absolute left-1/2 top-[42%] z-[1] h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(34,211,238,0.85)]" />

        {pulseNonce > 0 ? (
          <div className="pointer-events-none absolute left-1/2 top-[42%] z-0" key={pulseNonce}>
            <div
              className="absolute left-1/2 top-1/2 h-14 w-14 rounded-full border border-cyan-300/50"
              style={{ animation: "qpp-ring-expand 1.15s ease-out forwards", animationDelay: "0ms" }}
            />
            <div
              className="absolute left-1/2 top-1/2 h-10 w-10 rounded-full border border-cyan-200/40"
              style={{ animation: "qpp-ring-expand 1s ease-out forwards", animationDelay: "320ms" }}
            />
            <div
              className="absolute left-1/2 top-1/2 h-8 w-8 rounded-full border border-cyan-100/35"
              style={{ animation: "qpp-ring-expand 0.85s ease-out forwards", animationDelay: "620ms" }}
            />
          </div>
        ) : null}

        <svg
          className="pointer-events-none absolute bottom-2 left-2 right-2 h-8 w-[calc(100%-1rem)] overflow-visible opacity-90"
          viewBox="0 0 200 32"
          aria-hidden
        >
          <circle cx="14" cy="16" r="3.5" fill="rgba(34,211,238,0.35)" stroke="rgba(34,211,238,0.5)" strokeWidth="0.6" />
          <line
            x1="20"
            y1="16"
            x2="100"
            y2="16"
            stroke="rgba(34,211,238,0.55)"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeDasharray="48 48"
            style={{
              animation: resonanceActive
                ? `qpp-resonance-flow ${(1.1 + resonance * 0.6) * lineScale}s ease-in-out infinite`
                : "none",
              opacity: resonanceActive ? 0.75 : 0.15
            }}
          />
          <circle cx="100" cy="16" r="4" fill="rgba(34,211,238,0.5)" style={{ opacity: 0.4 + resonance * 0.45 }} />
          <circle cx="168" cy="16" r="2.2" fill="rgba(165,243,252,0.35)" style={{ opacity: resonanceActive ? 0.85 : 0.2 }} />
        </svg>
      </div>

      <div
        className="mt-1 text-center text-[9px] font-medium uppercase tracking-[0.25em] text-cyan-200/80"
        style={{ animation: `qpp-trace-breathe ${traceSec}s ease-in-out infinite` }}
      >
        {label}
      </div>

      {typeof onSoundEnabledChange === "function" ? (
        <div className="mt-2 flex justify-center">
          <button
            type="button"
            onClick={() => onSoundEnabledChange(!soundEnabled)}
            className="rounded-lg border border-white/10 bg-black/25 px-2 py-1 text-[7px] font-bold uppercase tracking-wider text-white/45 hover:border-cyan-400/30 hover:text-cyan-200/80"
          >
            Presence sound: {soundEnabled ? "on" : "off"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

RhizohPresenceField.displayName = "RhizohPresenceField";
