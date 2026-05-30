import test from "node:test";
import assert from "node:assert/strict";
import { resolveVoiceTranscriptV3, runRhizohVoiceTranscribeV3 } from "../rhizohVoiceTranscribeV3.js";

test("resolveVoiceTranscriptV3 — high-confidence google wins", () => {
  const merged = resolveVoiceTranscriptV3(
    { text: "Merhaba dünya", confidence: 0.92 },
    { text: "Merhaba dunya", confidence: 0.85 }
  );
  assert.equal(merged.text, "Merhaba dünya");
  assert.equal(merged.strategy, "google_high_confidence");
  assert.equal(merged.source, "google");
});

test("resolveVoiceTranscriptV3 — whisper wins when google low confidence", () => {
  const merged = resolveVoiceTranscriptV3(
    { text: "meraba", confidence: 0.55 },
    { text: "Merhaba", confidence: 0.91 }
  );
  assert.equal(merged.text, "Merhaba");
  assert.equal(merged.strategy, "whisper_higher_confidence");
});

test("resolveVoiceTranscriptV3 — verified suffix when tie-ish", () => {
  const merged = resolveVoiceTranscriptV3(
    { text: "Rhizoh", confidence: 0.7 },
    { text: "Rhizoh", confidence: 0.68 }
  );
  assert.equal(merged.text, "Rhizoh (verified)");
  assert.equal(merged.strategy, "google_with_verified_suffix");
});

test("runRhizohVoiceTranscribeV3 — rejects missing audio", async () => {
  const result = await runRhizohVoiceTranscribeV3({ path: "both" });
  assert.equal(result.ok, false);
  assert.equal(result.error, "audio_base64_required");
});

test("runRhizohVoiceTranscribeV3 — rejects when no ASR keys", async () => {
  const prevOpenAi = process.env.OPENAI_API_KEY;
  const prevGoogle = process.env.GOOGLE_API_KEY;
  const prevGemini = process.env.GEMINI_API_KEY;
  const prevSpeech = process.env.GOOGLE_SPEECH_API_KEY;
  delete process.env.OPENAI_API_KEY;
  delete process.env.GOOGLE_API_KEY;
  delete process.env.GEMINI_API_KEY;
  delete process.env.GOOGLE_SPEECH_API_KEY;
  try {
    const b64 = Buffer.from("fake-audio").toString("base64");
    const result = await runRhizohVoiceTranscribeV3({ path: "both", audioBase64: b64 });
    assert.equal(result.ok, false);
    assert.equal(result.error, "voice_asr_not_configured");
  } finally {
    if (prevOpenAi !== undefined) process.env.OPENAI_API_KEY = prevOpenAi;
    if (prevGoogle !== undefined) process.env.GOOGLE_API_KEY = prevGoogle;
    if (prevGemini !== undefined) process.env.GEMINI_API_KEY = prevGemini;
    if (prevSpeech !== undefined) process.env.GOOGLE_SPEECH_API_KEY = prevSpeech;
  }
});
