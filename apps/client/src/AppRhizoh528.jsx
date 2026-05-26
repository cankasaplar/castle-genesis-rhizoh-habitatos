/**
 * CORE-ELIGIBLE — Rhizoh living world root (default `*` route after ingress).
 *
 * Single product shell: RLL-O (LocationSeed → WorldInstance → Atmosphere → Ribbon → Castle → WAL)
 * + experience ribbon fed from living loop frames.
 */
import React, { useCallback, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { RhizohAtmospherePresenceBridge } from "./rhizoh/runtime/RhizohAtmospherePresenceBridge.jsx";
import { RhizohExperienceRibbon } from "./components/RhizohExperienceRibbon.jsx";
import {
  buildRhizohCapabilitySurfaceRows,
  buildRhizohConversationGoals,
  buildRhizohPhaseStory
} from "./rhizoh/experience/rhizohExperienceLayerV1.js";
import {
  buildRhizohProductCapabilityEnvelope,
  rhizohConversationPhaseShortLabelTr,
  RHIZOH_CONVERSATION_PHASE
} from "./rhizoh/product/rhizohConversationOrchestratorV1.js";

export default function AppRhizoh528() {
  const location = useLocation();
  /** RLL-O frame — LocationSeed → WorldInstance → Atmosphere → Ribbon → Castle → WAL */
  const [livingFrame, setLivingFrame] = useState(/** @type {import("./rhizoh/runtime/rhizohLivingLoopOrchestratorV0.js").RhizohLivingLoopFrameV0 | null} */ (null));
  const onLivingFrame = useCallback((frame) => {
    setLivingFrame(frame);
  }, []);
  const worldInstance = livingFrame?.worldInstance ?? null;
  /** Product conversation phase — wire to real orchestrator when chat mounts. */
  const [conversationPhase] = useState(RHIZOH_CONVERSATION_PHASE.NEW_USER);

  const story = useMemo(() => {
    const base = buildRhizohPhaseStory(conversationPhase);
    if (!livingFrame?.ribbon) return base;
    return {
      whyHere: `${base.whyHere} ${livingFrame.ribbon.worldEcho}`.trim(),
      narrativeLead: livingFrame.ribbon.atmosphereLead || base.narrativeLead
    };
  }, [conversationPhase, livingFrame]);
  const goals = useMemo(() => {
    const base = buildRhizohConversationGoals(conversationPhase, {
      trust: 0,
      familiarity: 0,
      userTurnCount: 0,
      introSeen: false
    });
    if (!livingFrame?.ribbon?.affordanceHint) return base;
    return { ...base, headline: livingFrame.ribbon.affordanceHint };
  }, [conversationPhase, livingFrame]);
  const capabilityRows = useMemo(() => {
    const { surfaces } = buildRhizohProductCapabilityEnvelope(conversationPhase);
    return buildRhizohCapabilitySurfaceRows(surfaces);
  }, [conversationPhase]);

  const phaseLabel = rhizohConversationPhaseShortLabelTr(conversationPhase);

  return (
    <>
      <RhizohAtmospherePresenceBridge onLivingFrame={onLivingFrame} />
      <div
        className="min-h-screen bg-gradient-to-b from-[#0a0612] via-[#0d0818] to-black px-4 pb-10 pt-6 text-white"
        data-rhizoh-living-root="1"
      >
        <header className="mx-auto max-w-lg">
          <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-violet-300/80">Living world</p>
          <h1 className="mt-1 text-lg font-semibold tracking-tight text-white">Rhizoh</h1>
          <p className="mt-2 text-[11px] leading-relaxed text-white/60">
            Bu ekran ürünün yaşam kabuğudur: dünya örneği URL rotasından değil; saat dilimi ve dil tohumundan türetilir.
          </p>
          <dl className="mt-3 grid gap-1.5 rounded-lg border border-white/[0.08] bg-black/25 px-3 py-2 font-mono text-[9px] text-white/55">
            <div className="flex flex-wrap justify-between gap-2">
              <dt className="text-white/40">world_instance</dt>
              <dd className="text-violet-200/90">{worldInstance?.instanceId ?? "…"}</dd>
            </div>
            <div className="flex flex-wrap justify-between gap-2">
              <dt className="text-white/40">tz · locale</dt>
              <dd>
                {worldInstance?.timeZone ?? "—"} · {worldInstance?.locale ?? "—"}
              </dd>
            </div>
            {livingFrame?.castle ? (
              <div className="flex flex-wrap justify-between gap-2">
                <dt className="text-white/40">castle</dt>
                <dd className="text-emerald-200/80">
                  {livingFrame.castle.affordanceId.replace("castle.interact.", "")} · pulse{" "}
                  {Math.round(livingFrame.castle.metabolicPulse * 100)}%
                </dd>
              </div>
            ) : null}
            <div className="flex flex-wrap justify-between gap-2">
              <dt className="text-white/40">route (bilgi dışı)</dt>
              <dd className="truncate text-white/35" title={location.pathname}>
                {location.pathname || "/"}
              </dd>
            </div>
          </dl>
        </header>

        <div
          className="relative mx-auto mt-6 flex h-28 max-w-lg items-center justify-center rounded-2xl border border-violet-500/25 bg-violet-950/20"
          data-rhizoh-atmosphere-castle-surface="1"
          aria-hidden={!livingFrame?.castle?.surfaceReady}
        >
          <span className="pointer-events-none font-mono text-[9px] uppercase tracking-[0.2em] text-violet-200/50">
            Castle presence surface
          </span>
        </div>

        <div className="mx-auto mt-5 max-w-lg">
          <RhizohExperienceRibbon
            phaseLabel={phaseLabel}
            story={story}
            goals={goals}
            capabilityRows={capabilityRows}
            userGoalHint={null}
            closure={null}
            recentClosureMilestones={[]}
          />
        </div>

        <main className="mx-auto mt-8 max-w-lg space-y-3 text-[12px] leading-relaxed text-white/70">
          <p>
            Gözlem ve continuity laboratuvarı için{" "}
            <Link to="/genesis/hub" className="text-violet-300 underline-offset-2 hover:underline">
              Genesis hub
            </Link>{" "}
            ve{" "}
            <Link to="/academy/observe" className="text-violet-300 underline-offset-2 hover:underline">
              Academy observe
            </Link>{" "}
            rotalarını kullanabilirsin; varsayılan yaşam kökü burada kalır.
          </p>
        </main>
      </div>
    </>
  );
}
