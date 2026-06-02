import React, { useMemo, useState } from "react";
import {
  getLanguagePickerCopyV0
} from "./ingressCopyI18nV0.js";
import { INGRESS_SURFACE_V0 } from "./ingressFlowStylesV0.js";
import {
  RHIZOH_UI_LAUNCH_LOCALES_V0,
  resolveLaunchLocaleLabelV0,
  writeUiLocaleV0
} from "../runtime/rhizohUiLocaleV0.js";

/**
 * Pre-legal language picker — first ingress surface.
 * @param {{ onProceed: () => void }} props
 */
export function LanguagePickerScreen({ onProceed }) {
  const [selected, setSelected] = useState(() => {
    if (typeof localStorage !== "undefined") {
      const raw = localStorage.getItem("rhizoh.user.language.v0");
      if (raw && RHIZOH_UI_LAUNCH_LOCALES_V0.includes(String(raw).toLowerCase())) {
        return String(raw).toLowerCase();
      }
    }
    return "en";
  });

  const copy = useMemo(() => getLanguagePickerCopyV0(selected), [selected]);

  return (
    <div style={INGRESS_SURFACE_V0.page}>
      <p style={INGRESS_SURFACE_V0.kicker}>{copy.kicker}</p>
      <h1 style={INGRESS_SURFACE_V0.title}>{copy.title}</h1>
      <p style={INGRESS_SURFACE_V0.lead}>{copy.lead}</p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
          gap: 10,
          marginBottom: 24
        }}
      >
        {RHIZOH_UI_LAUNCH_LOCALES_V0.map((code) => {
          const active = selected === code;
          return (
            <button
              key={code}
              type="button"
              onClick={() => setSelected(code)}
              style={{
                ...INGRESS_SURFACE_V0.primaryBtn(true),
                background: active ? "#38bdf8" : "rgba(15,23,42,0.85)",
                color: active ? "#041018" : "#e2e8f0",
                border: active ? "none" : "1px solid #334155",
                textAlign: "left",
                padding: "12px 14px"
              }}
              aria-pressed={active}
            >
              <span style={{ display: "block", fontSize: 15, fontWeight: 600 }}>
                {resolveLaunchLocaleLabelV0(code)}
              </span>
              <span style={{ display: "block", fontSize: 11, opacity: 0.65, marginTop: 4 }}>{code}</span>
            </button>
          );
        })}
      </div>
      <button
        type="button"
        style={INGRESS_SURFACE_V0.primaryBtn(true)}
        onClick={() => {
          writeUiLocaleV0(selected);
          onProceed?.();
        }}
      >
        {copy.continueLabel}
      </button>
    </div>
  );
}
