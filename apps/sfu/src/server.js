import mediasoup from "mediasoup";
import { WebSocketServer } from "ws";

const PORT = Number(process.env.CASTLE_SFU_PORT || 5005);

const peers = new Map();
let worker;
let router;

const mediaCodecs = [
  { kind: "audio", mimeType: "audio/opus", clockRate: 48000, channels: 2 },
  {
    kind: "video",
    mimeType: "video/VP8",
    clockRate: 90000,
    parameters: { "x-google-start-bitrate": 1000 }
  }
];

async function createWorker() {
  worker = await mediasoup.createWorker({
    rtcMinPort: Number(process.env.CASTLE_SFU_RTC_MIN_PORT || 40000),
    rtcMaxPort: Number(process.env.CASTLE_SFU_RTC_MAX_PORT || 49999)
  });
  worker.on("died", () => {
    process.exit(1);
  });
  router = await worker.createRouter({ mediaCodecs });
}

function getPeer(peerId) {
  if (!peers.has(peerId)) {
    peers.set(peerId, {
      id: peerId,
      transports: new Map(),
      producers: new Map(),
      consumers: new Map()
    });
  }
  return peers.get(peerId);
}

async function createTransport() {
  const transport = await router.createWebRtcTransport({
    listenInfos: [{ protocol: "udp", ip: "0.0.0.0", announcedAddress: process.env.CASTLE_SFU_ANNOUNCED_IP || undefined }],
    enableUdp: true,
    enableTcp: true,
    preferUdp: true
  });
  return transport;
}

function send(ws, type, payload = {}) {
  ws.send(JSON.stringify({ type, payload }));
}

function broadcastPeerList(wss) {
  const list = [...peers.keys()];
  for (const client of wss.clients) {
    if (client.readyState === 1) send(client, "SFU_PEERS", { peers: list });
  }
}

await createWorker();

const wss = new WebSocketServer({ port: PORT });

wss.on("connection", (ws) => {
  const peerId = `peer-${Math.random().toString(36).slice(2, 8)}`;
  ws.peerId = peerId;
  const peer = getPeer(peerId);
  send(ws, "SFU_WELCOME", { peerId, rtpCapabilities: router.rtpCapabilities });
  broadcastPeerList(wss);

  ws.on("message", async (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      send(ws, "SFU_ERROR", { error: "Invalid JSON." });
      return;
    }

    try {
      if (msg.type === "SFU_CREATE_TRANSPORT") {
        const transport = await createTransport();
        peer.transports.set(transport.id, transport);
        send(ws, "SFU_TRANSPORT_CREATED", {
          id: transport.id,
          iceParameters: transport.iceParameters,
          iceCandidates: transport.iceCandidates,
          dtlsParameters: transport.dtlsParameters
        });
        return;
      }

      if (msg.type === "SFU_CONNECT_TRANSPORT") {
        const transport = peer.transports.get(msg.payload?.transportId);
        if (!transport) throw new Error("Transport not found.");
        await transport.connect({ dtlsParameters: msg.payload?.dtlsParameters });
        send(ws, "SFU_TRANSPORT_CONNECTED", { transportId: transport.id });
        return;
      }

      if (msg.type === "SFU_PRODUCE") {
        const transport = peer.transports.get(msg.payload?.transportId);
        if (!transport) throw new Error("Transport not found.");
        const producer = await transport.produce({
          kind: msg.payload?.kind,
          rtpParameters: msg.payload?.rtpParameters,
          appData: { peerId }
        });
        peer.producers.set(producer.id, producer);
        send(ws, "SFU_PRODUCED", { producerId: producer.id });
        for (const c of wss.clients) {
          if (c !== ws && c.readyState === 1) send(c, "SFU_NEW_PRODUCER", { producerId: producer.id, peerId });
        }
        return;
      }

      if (msg.type === "SFU_CONSUME") {
        const { transportId, producerId, rtpCapabilities } = msg.payload || {};
        if (!router.canConsume({ producerId, rtpCapabilities })) throw new Error("Cannot consume.");
        const transport = peer.transports.get(transportId);
        if (!transport) throw new Error("Transport not found.");
        const consumer = await transport.consume({
          producerId,
          rtpCapabilities,
          paused: false
        });
        peer.consumers.set(consumer.id, consumer);
        send(ws, "SFU_CONSUMER_CREATED", {
          id: consumer.id,
          producerId,
          kind: consumer.kind,
          rtpParameters: consumer.rtpParameters
        });
        return;
      }
    } catch (e) {
      send(ws, "SFU_ERROR", { error: e.message });
    }
  });

  ws.on("close", () => {
    const current = peers.get(peerId);
    if (current) {
      current.transports.forEach((t) => t.close());
      current.producers.forEach((p) => p.close());
      current.consumers.forEach((c) => c.close());
    }
    peers.delete(peerId);
    broadcastPeerList(wss);
  });
});

console.log(`[SFU] ws://localhost:${PORT}`);
