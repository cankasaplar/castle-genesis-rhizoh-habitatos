import React, { useEffect, useMemo, useState } from "react";
import { PRODUCT_SHELL_ITEMS } from "../../studio/ui/UnifiedProductShellBar.jsx";
import { isRhizohCreativeSurfaceEnabledV0 } from "./castleCreativeSurfaceGateV0.js";
import {
  listT0SoftAffordancesV0,
  T0_CONTINUITY_SURFACE_DEFINITION_V0
} from "./t0ContinuitySurfaceV0.js";
import {
  readT0ContinuityPulseStreamV0,
  seedT0ContinuityPulseStreamV0,
  T0_CONTINUITY_PULSE_EVENT_V0
} from "./t0ContinuitySurfaceStreamV0.js";
import {
  readT0UserIntentV0,
  resolveT0ContextStripV0,
  resolveT0SurfaceForIntentV0,
  T0_INTENT_ANCHORS_V0,
  writeT0UserIntentV0
} from "./t0ContextStripV0.js";
import { emitNextActionAnchorV0, resolveNextActionAnchorV0 } from "./rhizohActionCoherenceV0.js";
import { RhizohNextActionAnchorV0 } from "./RhizohNextActionAnchorV0.jsx";
import { RhizohFlowContinuityStripV0 } from "./RhizohFlowContinuityStripV0.jsx";
import {
  isRhizohT0FirstMatchIdentityV0,
  RHIZOH_CHROME_TOGGLE_STRIP_H_REM_V0,
  RHIZOH_PRODUCT_SHELL_BAR_H_REM_V0
} from "./rhizohT0FirstMatchIdentityV0.js";
import { RHIZOH_INTENT_PLAIN_TR_V0 } from "./rhizohProductPlainCopyV0.js";

/**
 * T0 continuity surface — context strip (play call) + intent anchors + rail + optional stream.
 */
export function T0ContinuitySurfaceRailV0({
  activeSurface = "world",
  rhizohFieldState = "IDLE",
  localeTr = true,
  anchorEmphasisOverride,
  flowContinuity,
  ceol,
  onFlowReturn,
  onSoftAffordance,
  onSelectSurface,
  onIntentChange
}) {
  const [pulses, setPulses] = useState(() => readT0ContinuityPulseStreamV0());
  const [streamOpen, setStreamOpen] = useState(false);
  const [userIntent, setUserIntent] = useState(() => readT0UserIntentV0());

  const context = useMemo(
    () =>
      resolveT0ContextStripV0({
        activeSurface,
        userIntent,
        creativeEnabled: isRhizohCreativeSurfaceEnabledV0()
      }),
    [activeSurface, userIntent]
  );

  const nextActionAnchor = useMemo(
    () =>
      resolveNextActionAnchorV0({
        activeSurface,
        userIntent,
        rhizohFieldState,
        localeTr
      }),
    [activeSurface, userIntent, rhizohFieldState, localeTr]
  );

  useEffect(() => {
    emitNextActionAnchorV0(nextActionAnchor);
  }, [nextActionAnchor]);

  useEffect(() => {
    seedT0ContinuityPulseStreamV0();
    setPulses(readT0ContinuityPulseStreamV0());
    const onPulse = () => setPulses(readT0ContinuityPulseStreamV0());
    const onIntent = (ev) => {
      const id = ev?.detail?.intent;
      if (id) setUserIntent(String(id));
    };
    window.addEventListener(T0_CONTINUITY_PULSE_EVENT_V0, onPulse);
    window.addEventListener("rhizoh:t0-intent", onIntent);
    window.addEventListener("rhizoh:emotional-anchor", onPulse);
    window.addEventListener("rhizoh:memory-anchor", onPulse);
    return () => {
      window.removeEventListener(T0_CONTINUITY_PULSE_EVENT_V0, onPulse);
      window.removeEventListener("rhizoh:t0-intent", onIntent);
      window.removeEventListener("rhizoh:emotional-anchor", onPulse);
      window.removeEventListener("rhizoh:memory-anchor", onPulse);
    };
  }, []);

  useEffect(() => {
    setUserIntent(readT0UserIntentV0());
  }, [activeSurface]);

  const compactIdentity = isRhizohT0FirstMatchIdentityV0();
  const affordances = listT0SoftAffordancesV0();
  const recent = pulses.slice(-3).reverse();

  const vis = Object.freeze({
    show_world_substrate: true,
    show_context_strip: true,
    show_soft_affordances: !compactIdentity,
    show_flow_continuity: !compactIdentity,
    show_intent_anchors: true,
    show_surface_rail: !compactIdentity,
    show_next_action_anchor: true,
    allow_input_focus: true
  });

  const fade = (on) =>
    `transition-opacity duration-500 ease-out ${on ? "opacity-100" : "opacity-0 max-h-0 overflow-hidden pointer-events-none"}`;

  const pickIntent = (intentId) => {
    writeT0UserIntentV0(intentId);
    setUserIntent(intentId);
    onIntentChange?.(intentId);
    const surface = resolveT0SurfaceForIntentV0(intentId);
    if (surface && surface !== activeSurface) {
      onSelectSurface?.(surface);
    }
  };

  return (
    <div
      className={`pointer-events-auto fixed left-0 right-0 z-[58] border-t border-white/8 bg-[#030711]/88 backdrop-blur-xl ${
        compactIdentity ? "max-h-[5.75rem] overflow-y-auto no-scrollbar" : ""
      }`}
      style={{
        bottom: `calc(${RHIZOH_PRODUCT_SHELL_BAR_H_REM_V0}rem + ${RHIZOH_CHROME_TOGGLE_STRIP_H_REM_V0}rem)`
      }}
      data-rhizoh-t0-continuity-surface="1"
      data-ceol-state={ceol?.choreography_state || "PLAY_READY"}
      data-compact-identity={compactIdentity ? "1" : "0"}
      aria-label="T0 continuity surface"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-1 px-2 py-1 sm:px-3 sm:py-1.5">
        <div className={`flex flex-wrap items-center gap-2 min-h-[1.25rem] ${fade(vis.show_context_strip)}`}>
          <p
            className="text-[10px] font-semibold text-teal-100/95 normal-case tracking-wide"
            data-rhizoh-context-strip="1"
            title={context.play_call}
          >
            {context.strip}
          </p>
          <span
            className="ml-auto shrink-0 rounded-md border border-white/12 bg-white/5 px-1.5 py-0.5 text-[8px] font-medium text-white/70 normal-case"
            data-rhizoh-active-locale={context.language_code}
            title="Active language"
          >
            {context.language_label}
          </span>
        </div>

        <div className={fade(vis.show_next_action_anchor)}>
          <RhizohNextActionAnchorV0
            anchor={nextActionAnchor}
            emphasisOverride={anchorEmphasisOverride}
          />
        </div>

        {!compactIdentity ? (
          <div className={fade(vis.show_flow_continuity)}>
            <RhizohFlowContinuityStripV0 flow={flowContinuity} onReturn={onFlowReturn} />
          </div>
        ) : null}

        <div
          className={`flex flex-wrap items-center gap-1 ${fade(vis.show_intent_anchors)}`}
          data-rhizoh-intent-anchors="1"
        >
          <span className="text-[8px] font-semibold text-white/55 shrink-0 normal-case">
            Ne yapmak istersin?
          </span>
          {T0_INTENT_ANCHORS_V0.map((item) => {
            const on = userIntent === item.id;
            const plain = RHIZOH_INTENT_PLAIN_TR_V0[item.id];
            return (
              <button
                key={item.id}
                type="button"
                title={plain?.hint || item.label_tr}
                onClick={() => pickIntent(item.id)}
                className={`touch-manipulation rounded-md border px-2 py-0.5 text-[9px] font-semibold normal-case transition-colors ${
                  on
                    ? "border-teal-400/45 bg-teal-500/20 text-teal-100"
                    : "border-white/10 bg-black/25 text-white/50 hover:border-white/20 hover:text-white/75"
                }`}
              >
                {plain?.label || item.label_tr}
              </button>
            );
          })}
        </div>

        {!compactIdentity ? (
        <div className={`flex flex-wrap items-center gap-1.5 ${fade(vis.show_surface_rail)}`}>
          <span className="text-[7px] font-black uppercase tracking-[0.2em] text-cyan-200/60 shrink-0">
            Yüzey
          </span>
          {PRODUCT_SHELL_ITEMS.map((item) => {
            const on = activeSurface === item.id;
            return (
              <button
                key={`breath-${item.id}`}
                type="button"
                title={item.label}
                onClick={() => onSelectSurface?.(item.id)}
                className={`touch-manipulation rounded-md border px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-wider transition-colors ${
                  on
                    ? "border-cyan-400/40 bg-cyan-500/15 text-cyan-100"
                    : "border-white/8 bg-black/30 text-white/45 hover:text-white/70"
                }`}
              >
                {item.label.split(" ")[0]}
              </button>
            );
          })}
        </div>
        ) : null}

        {!compactIdentity ? (
        <div className={`flex flex-wrap items-center gap-1.5 ${fade(vis.show_soft_affordances)}`}>
          {affordances.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => onSoftAffordance?.(a.id)}
              className="rounded-lg border border-amber-400/20 bg-amber-950/30 px-2 py-0.5 text-[8px] font-semibold text-amber-100/90 normal-case hover:bg-amber-900/45"
            >
              {a.label_tr}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setStreamOpen((v) => !v)}
            className="ml-auto text-[8px] text-white/40 uppercase tracking-wider hover:text-white/65"
          >
            {streamOpen ? "Akışı gizle" : "Akış"}
          </button>
        </div>
        ) : null}

        {!compactIdentity && streamOpen && recent.length > 0 ? (
          <div
            className="max-h-[3.25rem] overflow-y-auto no-scrollbar rounded-lg border border-white/6 bg-black/35 px-2 py-1 space-y-0.5"
            data-rhizoh-continuity-stream="1"
          >
            {recent.map((p) => (
              <p
                key={`${p.at}-${p.line.slice(0, 24)}`}
                className="text-[8px] text-white/55 normal-case leading-snug font-mono"
              >
                <span className="text-white/25 mr-1">·</span>
                {p.line}
              </p>
            ))}
          </div>
        ) : null}

        <p className="sr-only">{T0_CONTINUITY_SURFACE_DEFINITION_V0}</p>
      </div>
    </div>
  );
}
