import WebSocket from "ws";
import { WS_MESSAGE } from "@castle/protocol";

const GATEWAY_WS_URL = process.env.CASTLE_GATEWAY_WS_URL || "ws://localhost:8090";
const GATEWAY_TOKEN = process.env.CASTLE_GATEWAY_TOKEN || "";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const CUE_INTERVAL_MS = Number(process.env.CASTLE_BROADCAST_CUE_MS || 20_000);
const STREAM_TARGET = process.env.CASTLE_STREAM_TARGET || "https://www.youtube.com/@CastleGenesis/live";

const wsUrl = GATEWAY_TOKEN ? `${GATEWAY_WS_URL}?token=${encodeURIComponent(GATEWAY_TOKEN)}` : GATEWAY_WS_URL;
const ws = new WebSocket(wsUrl);

let latestWorld = { tick: 0, castles: [], agents: [], entities: [] };

function log(msg) {
  console.log(`[GENESIS-BROADCASTER] ${msg}`);
}

async function generateCue(world) {
  const fallback = {
    kind: "GENESIS_SCENE",
    preset: ["underwater", "neon", "desert", "space"][world.tick % 4],
    speakerIndex: world.tick % 4,
    line: `Genesis stream pulse #${world.tick}. Castles:${world.castles.length} Agents:${world.agents.length} Entities:${world.entities?.length || 0}`,
    camera: ["MainEye", "DroneView", "Mirror", "Ghost"][world.tick % 4],
    bpm: 110 + (world.tick % 30),
    streamTarget: STREAM_TARGET
  };
  if (!OPENAI_API_KEY) return fallback;

  try {
    const prompt = `Create one short cinematic cue JSON for a shared livestream.
Constraints:
- return strictly JSON with keys: kind,preset,speakerIndex,line,camera,bpm,streamTarget
- preset in [underwater,neon,desert,space]
- speakerIndex in [0,1,2,3]
- camera in [MainEye,DroneView,Mirror,Ghost]
- bpm integer 60..200
World summary: tick=${world.tick}, castles=${world.castles.length}, agents=${world.agents.length}, entities=${world.entities?.length || 0}
Target stream: ${STREAM_TARGET}`;
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        temperature: 0.5,
        messages: [
          { role: "system", content: "You are Genesis Broadcast Director AI. Output JSON only." },
          { role: "user", content: prompt }
        ]
      })
    });
    if (!res.ok) return fallback;
    const json = await res.json();
    const text = json.choices?.[0]?.message?.content || "";
    const parsed = JSON.parse(text);
    return {
      kind: "GENESIS_SCENE",
      preset: parsed.preset || fallback.preset,
      speakerIndex: Number.isInteger(parsed.speakerIndex) ? parsed.speakerIndex : fallback.speakerIndex,
      line: String(parsed.line || fallback.line).slice(0, 200),
      camera: parsed.camera || fallback.camera,
      bpm: Math.max(60, Math.min(200, Number(parsed.bpm) || fallback.bpm)),
      streamTarget: STREAM_TARGET
    };
  } catch {
    return fallback;
  }
}

async function pushCue() {
  if (ws.readyState !== 1) return;
  const cue = await generateCue(latestWorld);
  ws.send(JSON.stringify({ type: WS_MESSAGE.STUDIO_CUE, payload: cue }));
  log(`cue sent :: ${cue.preset} | speaker ${cue.speakerIndex} | ${cue.camera} | bpm ${cue.bpm}`);
}

ws.on("open", () => {
  log(`connected ${wsUrl}`);
  ws.send(JSON.stringify({ type: WS_MESSAGE.BROADCAST_REGISTER, payload: { role: "GENESIS_BROADCAST_AGENT" } }));
  setInterval(() => {
    void pushCue();
  }, CUE_INTERVAL_MS);
});

ws.on("message", (raw) => {
  try {
    const msg = JSON.parse(raw.toString());
    if (msg.type === WS_MESSAGE.WORLD_TICK && msg.payload) {
      latestWorld = msg.payload;
    }
    if (msg.type === WS_MESSAGE.BROADCAST_STATE) {
      log(`state :: broadcaster=${msg.payload?.broadcasterClientId || "none"} viewers=${msg.payload?.viewers || 0}`);
    }
    if (msg.type === WS_MESSAGE.ERROR) {
      log(`error :: ${msg.payload?.error || "unknown"}`);
    }
  } catch {
    // ignore parse errors
  }
});

ws.on("close", () => log("disconnected"));
ws.on("error", (e) => log(`socket error :: ${e.message}`));
