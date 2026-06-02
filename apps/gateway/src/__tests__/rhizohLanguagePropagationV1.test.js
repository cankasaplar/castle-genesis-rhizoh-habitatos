import test from "node:test";
import assert from "node:assert/strict";
import {
  applyLanguagePropagationToLlmPayloadV1,
  applyLanguagePropagationToVoiceBodyV1,
  buildRhizohLanguagePropagationEchoV1,
  parseRhizohLanguagePropagationV1
} from "../rhizohLanguagePropagationV1.js";

test("parse headers — no silent EN when ui=tr", () => {
  const req = {
    headers: {
      "x-rhizoh-ui-lang": "tr",
      "x-rhizoh-speech-lang": "auto",
      "x-rhizoh-llm-lang": "tr-TR",
      "x-rhizoh-language-trace-id": "TRC-test-1"
    }
  };
  const p = parseRhizohLanguagePropagationV1(req, {});
  assert.equal(p.uiLang, "tr");
  assert.equal(p.speechLang, "auto");
  assert.equal(p.llmBcp47, "tr-TR");
  assert.equal(p.traceId, "TRC-test-1");
  assert.equal(p.partialPropagation, false);
});

test("partial propagation when headers and body missing", () => {
  const p = parseRhizohLanguagePropagationV1({ headers: {} }, {});
  assert.equal(p.partialPropagation, true);
  assert.ok(p.propagationGaps.includes("missing_ui_signal"));
  assert.ok(p.propagationGaps.includes("missing_trace_id"));
  assert.equal(p.usedDefaultUi, true);
  assert.equal(p.uiLang, "tr");
});

test("voice body uses ui bcp47 when speech auto", () => {
  const p = parseRhizohLanguagePropagationV1(
    { headers: { "x-rhizoh-ui-lang": "tr", "x-rhizoh-speech-lang": "auto" } },
    {}
  );
  const body = applyLanguagePropagationToVoiceBodyV1({}, p);
  assert.equal(body.languageCode, "tr-TR");
  assert.deepEqual(body.rhizoh_language_snapshot, p.languageSnapshot);
});

test("llm payload injects options.language from propagation", () => {
  const p = parseRhizohLanguagePropagationV1(
    { headers: { "x-rhizoh-ui-lang": "en", "x-rhizoh-llm-lang": "en-US" } },
    {}
  );
  const payload = applyLanguagePropagationToLlmPayloadV1({ message: "hi", context: {} }, p);
  assert.equal(payload.options.language, "en-US");
  assert.equal(payload.context.languagePropagation.uiLang, "en");
});

test("echo helper surfaces trace + snapshot on errors", () => {
  const p = parseRhizohLanguagePropagationV1(
    {
      headers: {
        "x-rhizoh-ui-lang": "tr",
        "x-rhizoh-language-trace-id": "TRC-echo"
      }
    },
    {}
  );
  const echo = buildRhizohLanguagePropagationEchoV1(p);
  assert.equal(echo.rhizoh_language_trace_id, "TRC-echo");
  assert.equal(echo.rhizoh_language_snapshot.ui, "tr");
  assert.equal(echo.partialPropagation, true);
});
