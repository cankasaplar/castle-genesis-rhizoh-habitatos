import { describe, expect, it } from "vitest";
import { extractSpeechRecognitionTranscriptV0 } from "../extractSpeechRecognitionTranscriptV0.js";

function mockResults(rows) {
  const list = rows.map(([transcript, isFinal]) => ({
    0: { transcript },
    isFinal,
    length: 1
  }));
  list.item = (i) => list[i];
  return list;
}

describe("extractSpeechRecognitionTranscriptV0", () => {
  it("concatenates segments from resultIndex onward", () => {
    const results = mockResults([
      ["merhaba", false],
      ["merhaba rhizoh", true]
    ]);
    const out = extractSpeechRecognitionTranscriptV0({ resultIndex: 1, results });
    expect(out.text).toBe("merhaba rhizoh");
    expect(out.isFinal).toBe(true);
  });

  it("returns empty when no results", () => {
    expect(extractSpeechRecognitionTranscriptV0({ results: [] })).toEqual({ text: "", isFinal: false });
  });
});
