import React, { memo } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

/**
 * @typedef {{
 *   rewardHeadline: string,
 *   achievementLine: string,
 *   whatChangedForYou: string[],
 *   unlockedLabelsTr: string[]
 * }} RhizohClosurePayload
 */

/**
 * @param {{
 *   phaseLabel: string,
 *   story: { whyHere: string, narrativeLead: string },
 *   goals: { headline: string, progress01: number, nextStopLabel: string, bondScore?: number, turnsLogged?: number },
 *   capabilityRows: { key: string, label: string, enabled: boolean, lockedHint?: string }[],
 *   userGoalHint?: { bucket?: string, label?: string } | null,
 *   closure?: RhizohClosurePayload | null,
 *   recentClosureMilestones?: { atMs?: number, headline?: string, toPhase?: string }[],
 *   className?: string
 * }} props
 */
export const RhizohExperienceRibbon = memo(function RhizohExperienceRibbon({
  phaseLabel,
  story,
  goals,
  capabilityRows,
  userGoalHint,
  closure,
  recentClosureMilestones = [],
  className = ""
}) {
  const [open, setOpen] = React.useState(false);
  const pct = Math.round(Math.max(0, Math.min(1, Number(goals?.progress01) || 0)) * 100);
  const compactPhase = String(phaseLabel || "").replace(/\s+/g, " ").trim() || "TRUST BUILD";

  return (
    <section
      role="region"
      aria-label="Rhizoh konuşma deneyimi"
      className={`rounded-2xl border border-violet-400/20 bg-black/35 px-3 py-2.5 text-left normal-case ${className}`}
    >
      <div className="flex items-center gap-2 text-[10px]">
        <span className="rounded-md border border-violet-400/35 bg-violet-950/40 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-violet-100">
          {compactPhase}
        </span>
        <span className="text-white/70">• birlikte düşünme modu</span>
        <span className="ml-auto font-mono text-[9px] text-white/45">{pct}%</span>
      </div>
      <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-500/70 to-emerald-400/70 transition-[width] duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-2 space-y-1 rounded-lg border border-white/[0.06] bg-black/15 px-2 py-1.5">
        <p className="text-[9px] leading-snug text-white/72">
          <span className="font-semibold text-white/50">Neden burada · </span>
          {story?.whyHere || "—"}
        </p>
        <p className="text-[9px] leading-snug text-white/65">
          <span className="font-semibold text-white/50">Şu an · </span>
          {story?.narrativeLead || "—"}
        </p>
        <p className="text-[9px] leading-snug text-emerald-200/85">
          <span className="font-semibold text-emerald-200/50">Ne yapabilirsin · </span>
          {goals?.headline || "—"}
        </p>
      </div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mt-2 inline-flex items-center gap-1 text-[9px] font-semibold text-white/55 hover:text-white/80"
      >
        {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        {open ? "Detayı gizle" : "Detayı aç"}
      </button>
      {open ? (
        <div className="mt-2 space-y-2 rounded-lg border border-white/8 bg-black/20 p-2.5">
          {closure?.achievementLine ? <p className="text-[10px] text-white/85">{closure.achievementLine}</p> : null}
          {story?.whyHere ? <p className="text-[9px] text-white/70">{story.whyHere}</p> : null}
          {userGoalHint?.label ? <p className="text-[9px] text-cyan-100/80">Sohbet yönü: {userGoalHint.label}</p> : null}
          {recentClosureMilestones.length > 0 ? (
            <p className="text-[8px] text-white/45">
              Son adım: {String(recentClosureMilestones[0]?.headline || "").slice(0, 120)}
            </p>
          ) : null}
          <ul className="space-y-1">
            {capabilityRows.map((row) => (
              <li key={row.key} className="text-[9px] text-white/75">
                {row.enabled ? "✓" : "○"} {row.label}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
});
