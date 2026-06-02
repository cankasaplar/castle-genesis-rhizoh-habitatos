import { describe, expect, it, beforeEach } from "vitest";
import {
  buildRhizohLanguagePropagationBundleV0,
  buildRhizohLanguagePropagationHeadersV0,
  resolveRhizohLlmLanguageV0,
  RHIZOH_LANG_HEADER_LLM_V0,
  RHIZOH_LANG_HEADER_SPEECH_V0,
  RHIZOH_LANG_HEADER_TRACE_V0,
  RHIZOH_LANG_HEADER_UI_V0
} from "../rhizohLanguagePropagationV0.js";
import { writeRhizohSpeechProfileV0, RHIZOH_SPEECH_MODE_V0, clearRhizohSpeechProfileForTestV0 } from "../rhizohSpeechProfileV0.js";
import { clearUiLocalePickedForTestV0, writeUiLocaleV0 } from "../rhizohUiLocaleV0.js";
import { __resetOlpStateForTestV0 } from "../rhizohOutputLanguagePolicyV0.js";

describe("rhizohLanguagePropagationV0", () => {
  beforeEach(() => {
    clearRhizohSpeechProfileForTestV0();
    clearUiLocalePickedForTestV0();
    __resetOlpStateForTestV0();
  });

  it("headers align ui, speech, and llm planes", () => {
    writeUiLocaleV0("tr");
    writeRhizohSpeechProfileV0({ mode: RHIZOH_SPEECH_MODE_V0.MIRROR_UI });
    const h = buildRhizohLanguagePropagationHeadersV0();
    expect(h[RHIZOH_LANG_HEADER_UI_V0]).toBe("tr");
    expect(h[RHIZOH_LANG_HEADER_SPEECH_V0]).toBeTruthy();
    expect(h[RHIZOH_LANG_HEADER_LLM_V0]).toMatch(/^tr/i);
  });

  it("manual speech overrides llm language", () => {
    writeUiLocaleV0("en");
    writeRhizohSpeechProfileV0({ mode: RHIZOH_SPEECH_MODE_V0.MANUAL, manualLocale: "de" });
    const llm = resolveRhizohLlmLanguageV0();
    expect(llm.source).toBe("speech_manual");
    expect(llm.bcp47).toMatch(/^de/i);
  });

  it("bundle aligns trace id across headers and body", () => {
    writeUiLocaleV0("tr");
    writeRhizohSpeechProfileV0({ mode: RHIZOH_SPEECH_MODE_V0.MIRROR_UI });
    const bundle = buildRhizohLanguagePropagationBundleV0();
    expect(bundle.headers[RHIZOH_LANG_HEADER_TRACE_V0]).toBe(bundle.traceId);
    expect(bundle.bodyFields.rhizoh_language_trace_id).toBe(bundle.traceId);
    expect(bundle.bodyFields.rhizoh_language_snapshot.llm).toMatch(/^tr/i);
    expect(buildRhizohLanguagePropagationHeadersV0()[RHIZOH_LANG_HEADER_UI_V0]).toBe("tr");
  });
});
