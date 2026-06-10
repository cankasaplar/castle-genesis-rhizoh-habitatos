import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import { CASTLE_OS_LOOP_EVENT_V1_9 } from "../castlePerception/castleStabilityLifecycleLoopV1_9.js";
import {
  getTraceDecisionPathV1_9,
  LEARNING_TRACE_REPLAY_EVENT_V1_9,
  previewPhysicsRewindV1_9,
  publishLearningTraceReplayV1_9
} from "../castlePerception/castleLearningTraceStripV1_9.js";
import {
  readStabilityLearningTraceFromWindowV1_9,
  shouldShowStabilityLearningTraceStripV1_9,
  shouldShowStabilityTraceReplayUiV1_9,
  isStabilityTraceSummaryOnlyV1_9,
  getStabilityTraceVisibilityTierV1_9
} from "../castlePerception/castleStabilityLearningTraceVisibilityV1_9.js";
import {
  formatTraceAtMsV1_9,
  summarizeLearningTraceStripV1_9
} from "../castlePerception/castleStabilityLearningTraceUiV1_9.js";

const TRIGGER_TONE_V1_9 = Object.freeze({
  mic_interrupt: "text-sky-300/85 border-sky-400/25",
  co_watch_override: "text-violet-300/85 border-violet-400/25",
  user_phase_change: "text-amber-200/85 border-amber-400/30",
  drift_event: "text-rose-200/85 border-rose-400/25",
  prior_applied: "text-emerald-300/85 border-emerald-400/25",
  cloud_reconcile: "text-cyan-300/85 border-cyan-400/25",
  physics_decay: "text-white/70 border-white/20"
});

/**
 * T0 mirror strip — last 3 stability learning events (traceable, no control path).
 * Hover → expand · Click → replay path · Scrub → rewind preview
 * @param {{ ownerId?: string, className?: string }} props
 */
export const StabilityLearningTraceStripV0 = memo(function StabilityLearningTraceStripV0({
  ownerId = "user_local",
  className = ""
}) {
  const [tick, setTick] = useState(0);
  const [expandedId, setExpandedId] = useState(null);
  const [scrubIndex, setScrubIndex] = useState(2);
  const bump = useCallback(() => setTick((n) => n + 1), []);

  useEffect(() => {
    window.addEventListener(CASTLE_OS_LOOP_EVENT_V1_9, bump);
    return () => window.removeEventListener(CASTLE_OS_LOOP_EVENT_V1_9, bump);
  }, [bump]);

  const summaryOnly = isStabilityTraceSummaryOnlyV1_9();
  const replayEnabled = shouldShowStabilityTraceReplayUiV1_9();
  const tier = getStabilityTraceVisibilityTierV1_9();
  void tick;

  const trace = useMemo(() => readStabilityLearningTraceFromWindowV1_9(ownerId), [ownerId, tick]);

  const scrubPreview = useMemo(() => {
    const item = strip.entries[scrubIndex];
    if (!item) return null;
    return previewPhysicsRewindV1_9(ownerId, {
      traceId: item.traceId,
      trigger: item.trigger,
      modality: item.modality
    });
  }, [ownerId, scrubIndex, strip.entries]);

  const strip = useMemo(() => summarizeLearningTraceStripV1_9(trace, 3), [trace]);

  const onEntryClick = useCallback(
    (entry) => {
      if (!replayEnabled) return;
      const path = getTraceDecisionPathV1_9(entry.traceId, trace);
      setExpandedId((prev) => (prev === entry.traceId ? null : entry.traceId));
      publishLearningTraceReplayV1_9(entry.traceId, path);
    },
    [trace, replayEnabled]
  );

  if (!strip.entries.length) return null;

  return (
    <div
      className={`pointer-events-auto select-none rounded-lg border border-white/10 bg-black/70 px-2.5 py-1.5 font-mono text-[8px] normal-case leading-snug backdrop-blur-sm ${className}`}
      data-rhizoh-stability-learning-trace="1"
      data-trace-tier={tier}
      data-trace-count={strip.totalCount}
      aria-label="Stability learning trace strip"
    >
      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 uppercase tracking-[0.14em] text-white/45">
        <span>{strip.title || "Last 3 Learning Events"}</span>
        <span>{summaryOnly ? "summary" : "observable"}</span>
        <span>count:{strip.totalCount}</span>
      </div>

      <div className="mt-1 grid gap-1">
        {strip.entries.map((entry, index) => {
          const tone = TRIGGER_TONE_V1_9[entry.trigger] || "text-white/72 border-white/15";
          const expanded = expandedId === entry.traceId;
          return (
            <div
              key={entry.traceId}
              className={`w-full rounded border px-1.5 py-0.5 text-left ${tone} ${replayEnabled ? "cursor-pointer transition-colors hover:bg-white/5" : ""}`}
              data-learning-trace-id={entry.traceId}
              data-learning-trace-trigger={entry.trigger}
              role={replayEnabled ? "button" : undefined}
              tabIndex={replayEnabled ? 0 : undefined}
              onClick={replayEnabled ? () => onEntryClick(entry) : undefined}
              onKeyDown={
                replayEnabled
                  ? (e) => {
                      if (e.key === "Enter" || e.key === " ") onEntryClick(entry);
                    }
                  : undefined
              }
            >
              <div className="flex flex-wrap items-center gap-x-1.5 text-[7px] uppercase tracking-[0.12em] opacity-80">
                <span>{index + 1}.</span>
                <span>{formatTraceAtMsV1_9(entry.atMs)}</span>
                <span>{entry.label}</span>
              </div>
              {entry.deltaLine ? (
                <div className="mt-0.5 text-[8px] normal-case tracking-normal text-white/82">→ {entry.deltaLine}</div>
              ) : null}
              <div className="mt-0.5 text-[8px] normal-case tracking-normal text-white/65">reason: {entry.detail}</div>
              {expanded && replayEnabled ? (
                <div className="mt-1 border-t border-white/10 pt-1 text-[7px] text-white/55">
                  replay path · {LEARNING_TRACE_REPLAY_EVENT_V1_9} · traceId:{entry.traceId}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {replayEnabled && strip.entries.length > 1 ? (
        <div className="mt-1.5 border-t border-white/10 pt-1">
          <label className="flex items-center gap-2 text-[7px] uppercase tracking-[0.12em] text-white/40">
            <span>timeline scrub</span>
            <input
              type="range"
              min={0}
              max={Math.max(0, strip.entries.length - 1)}
              value={scrubIndex}
              onChange={(e) => setScrubIndex(Number(e.target.value))}
              className="h-1 flex-1 accent-cyan-400/70"
            />
          </label>
          {scrubPreview ? (
            <div className="mt-0.5 text-[7px] text-white/55">
              rewind preview · speak:{scrubPreview.projectedSpeakShare?.toFixed(2)} · stability:
              {scrubPreview.projectedStabilityBias?.toFixed(2)} · {scrubPreview.note}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="mt-1 text-white/35">distributed cognitive physics · traceable · replayable · no execution authority</div>
    </div>
  );
});

export function StabilityLearningTraceStripGateV0(props) {
  if (!shouldShowStabilityLearningTraceStripV1_9()) return null;
  return <StabilityLearningTraceStripV0 {...props} />;
}
