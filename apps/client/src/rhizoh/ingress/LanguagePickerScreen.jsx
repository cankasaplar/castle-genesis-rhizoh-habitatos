import React, { useMemo, useState } from "react";
import { getLanguagePickerCopyV0 } from "./ingressCopyI18nV0.js";
import { INGRESS_SURFACE_V0 } from "./ingressFlowStylesV0.js";
import {
  RHIZOH_UI_LAUNCH_LOCALES_V0,
  resolveLaunchLocaleLabelV0,
  writeUiLocaleV0
} from "../runtime/rhizohUiLocaleV0.js";
import {
  RHIZOH_SPEECH_MODE_V0,
  RHIZOH_SPEECH_WHEEL_LOCALES_V0,
  writeRhizohSpeechProfileV0
} from "../runtime/rhizohSpeechProfileV0.js";
import { resolveRhizohLanguageCatalogRowV0 } from "../runtime/rhizohMultilingualBridgeV0.js";

/**
 * Pre-legal ingress: App language → Rhizoh speech profile → legal (localized).
 * @param {{ onProceed: () => void }} props
 */
export function LanguagePickerScreen({ onProceed }) {
  const [step, setStep] = useState(0);
  const [appLocale, setAppLocale] = useState(() => {
    if (typeof localStorage !== "undefined") {
      const raw = localStorage.getItem("rhizoh.user.language.v0");
      if (raw && RHIZOH_UI_LAUNCH_LOCALES_V0.includes(String(raw).toLowerCase())) {
        return String(raw).toLowerCase();
      }
    }
    return "en";
  });
  const [speechMode, setSpeechMode] = useState(RHIZOH_SPEECH_MODE_V0.AUTO);
  const [speechLocale, setSpeechLocale] = useState("tr");

  const copy = useMemo(() => getLanguagePickerCopyV0(appLocale), [appLocale]);

  const finish = () => {
    writeUiLocaleV0(appLocale);
    if (speechMode === RHIZOH_SPEECH_MODE_V0.MANUAL) {
      writeRhizohSpeechProfileV0({ mode: RHIZOH_SPEECH_MODE_V0.MANUAL, manualLocale: speechLocale });
    } else if (speechMode === RHIZOH_SPEECH_MODE_V0.MIRROR_UI) {
      writeRhizohSpeechProfileV0({ mode: RHIZOH_SPEECH_MODE_V0.MIRROR_UI });
    } else {
      writeRhizohSpeechProfileV0({ mode: RHIZOH_SPEECH_MODE_V0.AUTO });
    }
    onProceed?.();
  };

  if (step === 0) {
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
            const active = appLocale === code;
            return (
              <button
                key={code}
                type="button"
                onClick={() => setAppLocale(code)}
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
        <button type="button" style={INGRESS_SURFACE_V0.primaryBtn(true)} onClick={() => setStep(1)}>
          {copy.continueLabel}
        </button>
      </div>
    );
  }

  return (
    <div style={INGRESS_SURFACE_V0.page}>
      <p style={INGRESS_SURFACE_V0.kicker}>{copy.rhizohKicker || "RHIZOH SPEECH"}</p>
      <h1 style={INGRESS_SURFACE_V0.title}>{copy.rhizohTitle || "How should Rhizoh listen?"}</h1>
      <p style={INGRESS_SURFACE_V0.lead}>{copy.rhizohLead || copy.lead}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
        {[
          { id: RHIZOH_SPEECH_MODE_V0.AUTO, label: copy.rhizohAutoLabel || "Auto (recommended)" },
          { id: RHIZOH_SPEECH_MODE_V0.MIRROR_UI, label: copy.rhizohMirrorLabel || "Same as app language" },
          { id: RHIZOH_SPEECH_MODE_V0.MANUAL, label: copy.rhizohManualLabel || "Choose speech language" }
        ].map((row) => (
          <button
            key={row.id}
            type="button"
            onClick={() => setSpeechMode(row.id)}
            style={{
              ...INGRESS_SURFACE_V0.primaryBtn(speechMode === row.id),
              background: speechMode === row.id ? "#38bdf8" : "rgba(15,23,42,0.85)",
              color: speechMode === row.id ? "#041018" : "#e2e8f0",
              border: speechMode === row.id ? "none" : "1px solid #334155",
              textAlign: "left",
              padding: "12px 14px"
            }}
            aria-pressed={speechMode === row.id}
          >
            {row.label}
          </button>
        ))}
      </div>
      {speechMode === RHIZOH_SPEECH_MODE_V0.MANUAL ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
            gap: 8,
            marginBottom: 20
          }}
        >
          {RHIZOH_SPEECH_WHEEL_LOCALES_V0.map((code) => {
            const active = speechLocale === code;
            return (
              <button
                key={code}
                type="button"
                onClick={() => setSpeechLocale(code)}
                style={{
                  ...INGRESS_SURFACE_V0.primaryBtn(active),
                  background: active ? "#0ea5e9" : "rgba(15,23,42,0.7)",
                  color: active ? "#041018" : "#e2e8f0",
                  border: active ? "none" : "1px solid #334155",
                  padding: "10px 12px"
                }}
              >
                {resolveRhizohLanguageCatalogRowV0(code).label}
              </button>
            );
          })}
        </div>
      ) : null}
      <button type="button" style={INGRESS_SURFACE_V0.primaryBtn(true)} onClick={finish}>
        {copy.rhizohFinishLabel || copy.continueLabel}
      </button>
    </div>
  );
}
