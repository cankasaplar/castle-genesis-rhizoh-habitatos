import React, { memo, useEffect, useState } from "react";
import {
  RHIZOH_FOX_FIRST_CONTACT_METRICS_EVENT_V1,
  shouldShowFoxFirstContactStripV1
} from "../rhizoh/runtime/foxProactiveFirstContactCohortV1.js";
import { readUiLocaleV0 } from "../rhizoh/runtime/rhizohUiLocaleV0.js";

function readObservation() {
  if (typeof window !== "undefined" && window.__rhizoh?.foxFirstContact) {
    return window.__rhizoh.foxFirstContact;
  }
  return null;
}

function metricDot(ok) {
  return ok ? "bg-emerald-400" : "bg-amber-400";
}

/**
 * First-contact stability strip — 3 metrics only (Fox stability · tolerance · identity).
 */
export const RhizohFoxFirstContactStripV0 = memo(function RhizohFoxFirstContactStripV0({
  uiLocale,
  className = ""
}) {
  const tr = String(uiLocale || readUiLocaleV0()).toLowerCase().startsWith("tr");
  const [obs, setObs] = useState(() => readObservation());

  useEffect(() => {
    const refresh = () => setObs(readObservation());
    refresh();
    window.addEventListener(RHIZOH_FOX_FIRST_CONTACT_METRICS_EVENT_V1, refresh);
    return () => window.removeEventListener(RHIZOH_FOX_FIRST_CONTACT_METRICS_EVENT_V1, refresh);
  }, []);

  if (!obs?.deployment?.active) return null;

  const m = obs.metrics;
  const phase = obs.deployment.phase;

  return (
    <div
      className={`rounded-lg border border-sky-400/30 bg-sky-950/25 px-2.5 py-1.5 text-[9px] leading-snug text-sky-100/90 ${className}`}
      data-rhizoh-fox-first-contact="1"
      role="status"
    >
      <p className="font-mono text-[8px] uppercase tracking-wider text-sky-300/85">
        {tr ? "İlk temas" : "First contact"} · {phase}
        {m?.overallStable ? (
          <span className="ml-1 text-emerald-300/90">{tr ? "· stabil" : "· stable"}</span>
        ) : (
          <span className="ml-1 text-amber-300/90">{tr ? "· izle" : "· watch"}</span>
        )}
      </p>
      <ul className="mt-1 space-y-0.5 text-[8px] text-white/70">
        <li className="flex items-center gap-1.5">
          <span className={`h-1.5 w-1.5 rounded-full ${metricDot(m?.foxStability?.ok)}`} />
          {tr ? "Fox eşik drift" : "Fox threshold drift"}: {m?.foxStability?.thresholdDrift ?? "—"}
        </li>
        <li className="flex items-center gap-1.5">
          <span className={`h-1.5 w-1.5 rounded-full ${metricDot(m?.proactiveToleranceDrift?.ok)}`} />
          {tr ? "Tolerans / red" : "Tolerance / dismiss"}: {m?.proactiveToleranceDrift?.dismissRate ?? "—"}
        </li>
        <li className="flex items-center gap-1.5">
          <span className={`h-1.5 w-1.5 rounded-full ${metricDot(m?.identityConsistency?.ok)}`} />
          {tr ? "Aynı varlık hissi" : "Same-entity feel"}:{" "}
          {m?.identityConsistency?.sameEntityFeel ? (tr ? "evet" : "yes") : (tr ? "hayır" : "no")}
        </li>
      </ul>
      {obs.deployment.proactiveHardCapPerHour != null ? (
        <p className="mt-1 font-mono text-[7px] text-white/40">
          {tr ? "proaktif cap" : "proactive cap"}: {obs.deployment.proactiveHardCapPerHour}/hr
          {!obs.deployment.calibrationPersistWrite
            ? tr
              ? " · persist kapalı"
              : " · persist off"
            : null}
        </p>
      ) : null}
    </div>
  );
});

export function RhizohFoxFirstContactStripGateV0(props) {
  if (!shouldShowFoxFirstContactStripV1()) return null;
  return <RhizohFoxFirstContactStripV0 {...props} />;
}
