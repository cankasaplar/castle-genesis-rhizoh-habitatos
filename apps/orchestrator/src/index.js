import { COMMAND } from "@castle/protocol";
import { createSimulationCore } from "@castle/sim-core";

export function createOrchestrator() {
  const sim = createSimulationCore("rhizoh-world-seed");
  const inputBuffer = new Map();
  let networkFrame = 0;
  let lastSnapshot = null;

  function queueInputFrame(clientId, frame, commands = []) {
    const safeFrame = Number.isFinite(frame) ? frame : networkFrame;
    inputBuffer.set(`${clientId}:${safeFrame}`, { clientId, frame: safeFrame, commands });
  }

  function consumeInputsForFrame(frame) {
    const accepted = [];
    for (const [key, entry] of inputBuffer.entries()) {
      if (entry.frame <= frame) {
        accepted.push(entry);
        inputBuffer.delete(key);
      }
    }
    accepted.sort((a, b) => (a.clientId < b.clientId ? -1 : 1));
    return accepted;
  }

  function tick(dt = 1 / 20) {
    networkFrame += 1;
    const readyInputs = consumeInputsForFrame(networkFrame);
    for (const inputFrame of readyInputs) {
      for (const cmd of inputFrame.commands || []) {
        applyCommand(cmd);
      }
    }

    sim.step(dt);
    const snapshot = sim.getWorldSnapshot();
    const delta = makeDelta(lastSnapshot, snapshot);
    const packedDelta = packDelta(delta);
    lastSnapshot = snapshot;
    return { frame: networkFrame, snapshot, delta, packedDelta };
  }

  function applyCommand(canonicalCommand) {
    if (!canonicalCommand?.command) {
      return { ok: false, error: "Missing command." };
    }

    if (canonicalCommand.command === COMMAND.SPAWN_AGENT) {
      const targetCastleId = canonicalCommand.params?.targetCastleId || "castle-01";
      const spawned = sim.spawnAgent(targetCastleId);
      if (!spawned) return { ok: false, error: `Unknown castle: ${targetCastleId}` };
      return { ok: true, event: "AGENT_SPAWNED", data: spawned };
    }

    if (canonicalCommand.command === COMMAND.LIST_CASTLES) {
      const world = sim.getWorldSnapshot();
      return { ok: true, event: "CASTLES_LIST", data: world.castles };
    }

    if (canonicalCommand.command === COMMAND.SPAWN_ENTITY) {
      const targetCastleId = canonicalCommand.params?.targetCastleId || "castle-01";
      const entityType = canonicalCommand.params?.entityType || "NODE";
      const spawned = sim.spawnEntity(targetCastleId, entityType);
      if (!spawned) return { ok: false, error: `Unknown castle/entity: ${targetCastleId}` };
      return { ok: true, event: "ENTITY_SPAWNED", data: spawned };
    }

    if (canonicalCommand.command === COMMAND.CREATE_CASTLE) {
      const name = canonicalCommand.params?.name || "NEW-CASTLE";
      const lat = Number(canonicalCommand.params?.lat);
      const lng = Number(canonicalCommand.params?.lng);
      const weather = canonicalCommand.params?.weather || null;
      const traffic = canonicalCommand.params?.traffic || null;
      const castle = sim.createCastle(name, {
        lat: Number.isFinite(lat) ? lat : undefined,
        lng: Number.isFinite(lng) ? lng : undefined,
        weather,
        traffic
      });
      return { ok: true, event: "CASTLE_CREATED", data: castle };
    }

    return { ok: false, error: `Unsupported command: ${canonicalCommand.command}` };
  }

  function worldSnapshot() {
    const snapshot = sim.getWorldSnapshot();
    lastSnapshot = snapshot;
    return snapshot;
  }

  return { tick, applyCommand, worldSnapshot, queueInputFrame };
}

function makeDelta(prev, next) {
  if (!prev) {
    return {
      full: true,
      frame: next.tick,
      agents: next.agents,
      entities: next.entities,
      castles: next.castles
    };
  }

  const prevById = new Map((prev.agents || []).map((a) => [a.id, a]));
  const prevEntityById = new Map((prev.entities || []).map((e) => [e.id, e]));
  const changedAgents = [];
  const changedEntities = [];
  for (const agent of next.agents) {
    const old = prevById.get(agent.id);
    if (!old) {
      changedAgents.push(agent);
      continue;
    }
    const moved =
      old.pos[0] !== agent.pos[0] ||
      old.pos[1] !== agent.pos[1] ||
      old.pos[2] !== agent.pos[2];
    const changedState = old.state !== agent.state || old.v !== agent.v;
    if (moved || changedState) changedAgents.push(agent);
  }
  for (const entity of next.entities || []) {
    const old = prevEntityById.get(entity.id);
    if (!old) {
      changedEntities.push(entity);
      continue;
    }
    const moved = old.pos[0] !== entity.pos[0] || old.pos[1] !== entity.pos[1] || old.pos[2] !== entity.pos[2];
    const changed = old.v !== entity.v || old.type !== entity.type;
    if (moved || changed) changedEntities.push(entity);
  }
  return {
    full: false,
    frame: next.tick,
    agents: changedAgents,
    entities: changedEntities,
    castles: next.castles
  };
}

function packDelta(delta) {
  const agents = delta.agents || [];
  const fieldsPerAgent = 6; // id,v,x,y,z,state
  const packed = new Int32Array(agents.length * fieldsPerAgent);
  for (let i = 0; i < agents.length; i += 1) {
    const a = agents[i];
    const base = i * fieldsPerAgent;
    const numericId = Number(String(a.id || "0").replace(/[^\d]/g, "")) || i;
    packed[base] = numericId;
    packed[base + 1] = a.v || 0;
    packed[base + 2] = Math.round((a.pos?.[0] || 0) * 100);
    packed[base + 3] = Math.round((a.pos?.[1] || 0) * 100);
    packed[base + 4] = Math.round((a.pos?.[2] || 0) * 100);
    packed[base + 5] = a.state === "LOW_POWER" ? 2 : 1;
  }
  return {
    frame: delta.frame,
    full: delta.full,
    castles: delta.castles,
    schema: ["id", "v", "x100", "y100", "z100", "state"],
    bufferB64: Buffer.from(packed.buffer).toString("base64"),
    count: agents.length
  };
}
