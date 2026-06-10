import React, { memo, useEffect, useState } from "react";
import {
  getFoxProactiveCalibrationV1,
  RHIZOH_FOX_PROACTIVE_CALIBRATION_EVENT_V1
} from "../rhizoh/runtime/foxProactiveAdaptationV1.js";
import { shouldShowFoxProactiveCalibrationChipV1 } from "../rhizoh/runtime/foxProactiveCalibrationVisibilityV1.js";
import { readUiLocaleV0 } from "../rhizoh/runtime/rhizohUiLocaleV0.js";

function readCalibrationSnap() {
  if (typeof window !== "undefined" && window.__rhizoh?.foxProactiveCalibration) {
    return window.__rhizoh.foxProactiveCalibration;
  }
  return getFoxProactiveCalibrationV1();
}

/**
 * Ghost proactive tolerance + Fox calibration debug chip.
 */
export const RhizohFoxProactiveCalibrationChipV0 = memo(function RhizohFoxProactiveCalibrationChipV0({
  uiLocale,
  className = ""
}) {
  const tr = String(uiLocale || readUiLocaleV0()).toLowerCase().startsWith("tr");
  const [cal, setCal] = useState(() => readCalibrationSnap());

  useEffect(() => {
    const refresh = () => setCal(readCalibrationSnap());
    refresh();
    window.addEventListener(RHIZOH_FOX_PROACTIVE_CALIBRATION_EVENT_V1, refresh);
    return () => window.removeEventListener(RHIZOH_FOX_PROACTIVE_CALIBRATION_EVENT_V1, refresh);
  }, []);

  const tolerancePct = Math.round((Number(cal.proactiveTolerance) || 0) * 100);
  const engagePct = Math.round((Number(cal.engagementRate) || 0) * 100);
  const dismissPct = Math.round((Number(cal.dismissRate) || 0) * 100);
  const drift = cal.calibrationDrift;
  const anchored =
    drift?.withinAnchor?.threshold &&
    drift?.withinAnchor?.cooldown &&
    drift?.withinAnchor?.initiations &&
    drift?.withinAnchor?.tolerance;

  return (
    <div
      className={`rounded-lg border ${anchored ? "border-violet-400/25" : "border-amber-400/35"} bg-violet-950/20 px-2.5 py-1.5 text-[9px] leading-snug text-violet-100/90 backdrop-blur-sm ${className}`}
      data-rhizoh-fox-proactive-calibration="1"
      role="status"
      aria-live="polite"
    >
      <p className="font-mono text-[8px] uppercase tracking-wider text-violet-300/80">
        {tr ? "Fox · kimlik ankrajı" : "Fox · identity anchor"}
        {!anchored ? (
          <span className="ml-1 text-amber-300/90">{tr ? "· drift sınırında" : "· at drift edge"}</span>
        ) : null}
      </p>
      <div className="mt-1 flex items-center gap-2">
        <span className="text-white/70">{tr ? "tolerans" : "tolerance"}</span>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-violet-400/80 transition-all duration-500"
            style={{ width: `${tolerancePct}%` }}
          />
        </div>
        <span className="font-mono text-[10px] text-violet-200">{tolerancePct}%</span>
      </div>
      <p className="mt-1 font-mono text-[8px] text-white/55">
        {tr ? "eşik" : "threshold"} {cal.significanceThreshold} · cooldown {cal.cooldownMinutes}
        {tr ? "dk" : "m"} · {cal.maxInitiationsPerHour}/{tr ? "sa" : "hr"}
      </p>
      <p className="mt-0.5 text-[8px] text-white/45">
        {tr ? "katılım" : "engage"} {engagePct}% · {tr ? "red" : "dismiss"} {dismissPct}% · n=
        {cal.outcomeCount}
        {cal.toneModulation?.active ? (
          <span className="ml-1 text-cyan-300/70">
            · {tr ? "ton elastik" : "tone elastic"}
          </span>
        ) : null}
      </p>
    </div>
  );
});

export function RhizohFoxProactiveCalibrationChipGateV0(props) {
  if (!shouldShowFoxProactiveCalibrationChipV1()) return null;
  return <RhizohFoxProactiveCalibrationChipV0 {...props} />;
}
