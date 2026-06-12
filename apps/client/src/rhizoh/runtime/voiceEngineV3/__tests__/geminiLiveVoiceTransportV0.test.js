import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WS_MESSAGE } from "@castle/protocol";
import { createGeminiLiveVoiceSessionV0 } from "../geminiLiveVoiceTransportV0.js";

vi.mock("../../../../castleFlight/castleFlightConfig.js", () => ({
  getCastleFlightConfig: () => ({
    gatewayWsUrl: "ws://gateway.test",
    gatewayToken: "test-token"
  })
}));

vi.mock("../voiceEngineTelemetryV3.js", () => ({
  emitVoiceEngineTelemetryV3: vi.fn(),
  setVoiceEngineStateV3: vi.fn()
}));

class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;
  static instances = [];

  constructor(url) {
    this.url = url;
    this.readyState = MockWebSocket.CONNECTING;
    this.sent = [];
    this.listeners = new Map();
    MockWebSocket.instances.push(this);
  }

  addEventListener(type, fn) {
    const arr = this.listeners.get(type) || [];
    arr.push(fn);
    this.listeners.set(type, arr);
  }

  removeEventListener(type, fn) {
    const arr = this.listeners.get(type) || [];
    this.listeners.set(
      type,
      arr.filter((item) => item !== fn)
    );
  }

  send(payload) {
    if (this.readyState !== MockWebSocket.OPEN) throw new Error("mock_ws_not_open");
    this.sent.push(String(payload));
  }

  close() {
    this.readyState = MockWebSocket.CLOSED;
    this.emit("close", {});
  }

  open() {
    this.readyState = MockWebSocket.OPEN;
    this.emit("open", {});
  }

  emit(type, event) {
    for (const fn of this.listeners.get(type) || []) fn(event);
  }

  message(payload) {
    this.emit("message", { data: JSON.stringify(payload) });
  }
}

function parseSent(ws, index) {
  return JSON.parse(ws.sent[index]);
}

function flushPromises() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe("geminiLiveVoiceTransportV0", () => {
  beforeEach(() => {
    MockWebSocket.instances = [];
    vi.stubGlobal("WebSocket", MockWebSocket);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("streams MediaRecorder chunks over the gateway live lane and resolves final", async () => {
    const pending = createGeminiLiveVoiceSessionV0({
      sessionId: "voice_live_test",
      traceId: "trace-1",
      mimeType: "audio/webm",
      languageCode: "tr-TR"
    });
    const ws = MockWebSocket.instances[0];
    ws.open();
    const session = await pending;

    expect(session.ok).toBe(true);
    expect(ws.url).toBe("ws://gateway.test?token=test-token");
    expect(parseSent(ws, 0).type).toBe(WS_MESSAGE.RHIZOH_VOICE_LIVE_START);

    session.sendChunk(new Blob([new Uint8Array([1, 2, 3])], { type: "audio/webm" }));
    await flushPromises();

    const chunk = parseSent(ws, 1);
    expect(chunk.type).toBe(WS_MESSAGE.RHIZOH_VOICE_LIVE_CHUNK);
    expect(chunk.payload.sessionId).toBe("voice_live_test");
    expect(chunk.payload.audioBase64).toBe("AQID");

    const finalPending = session.stopAndWaitFinal();
    await flushPromises();
    expect(parseSent(ws, 2).type).toBe(WS_MESSAGE.RHIZOH_VOICE_LIVE_STOP);

    ws.message({
      type: WS_MESSAGE.RHIZOH_VOICE_LIVE_FINAL,
      payload: {
        ok: true,
        merged: { text: "merhaba", confidence: 0.9, strategy: "gateway_ws_live" }
      }
    });

    const final = await finalPending;
    expect(final.ok).toBe(true);
    expect(final.transportPath).toBe("gateway_ws_live");
    expect(final.merged.text).toBe("merhaba");
  });

  it("returns a closed-WS result so the orchestrator can fall back to HTTP", async () => {
    const pending = createGeminiLiveVoiceSessionV0({ sessionId: "voice_live_closed" });
    const ws = MockWebSocket.instances[0];
    ws.open();
    const session = await pending;

    ws.close();
    const final = await session.stopAndWaitFinal();

    expect(final.ok).toBe(false);
    expect(final.error).toBe("gateway_ws_closed");
    expect(final.transportPath).toBe("gateway_ws_live");
  });
});
