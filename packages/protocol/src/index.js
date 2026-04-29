export const WS_MESSAGE = {
  HELLO: "HELLO",
  WORLD_SNAPSHOT: "WORLD_SNAPSHOT",
  WORLD_DELTA: "WORLD_DELTA",
  WORLD_DELTA_PACKED: "WORLD_DELTA_PACKED",
  WORLD_TICK: "WORLD_TICK",
  NETWORK_TICK: "NETWORK_TICK",
  INPUT_FRAME: "INPUT_FRAME",
  SIGNAL: "SIGNAL",
  PEERS: "PEERS",
  OPEN_DATA_QUERY: "OPEN_DATA_QUERY",
  OPEN_DATA_RESULT: "OPEN_DATA_RESULT",
  RHIZOH_QUERY: "RHIZOH_QUERY",
  RHIZOH_RESULT: "RHIZOH_RESULT",
  BROADCAST_REGISTER: "BROADCAST_REGISTER",
  STUDIO_CUE: "STUDIO_CUE",
  BROADCAST_STATE: "BROADCAST_STATE",
  SPIRAL_JOIN_ROOM: "SPIRAL_JOIN_ROOM",
  SPIRAL_CREATE_CHARACTER: "SPIRAL_CREATE_CHARACTER",
  SPIRAL_STATE: "SPIRAL_STATE",
  COMMAND_TEXT: "COMMAND_TEXT",
  COMMAND: "COMMAND",
  COMMAND_RESULT: "COMMAND_RESULT",
  /** İHA telemetri yayını (gateway relay — batch veya tek pose) */
  DRONE_TELEMETRY: "DRONE_TELEMETRY",
  ERROR: "ERROR"
};

export const COMMAND = {
  SPAWN_AGENT: "SPAWN_AGENT",
  LIST_CASTLES: "LIST_CASTLES",
  SPAWN_ENTITY: "SPAWN_ENTITY",
  CREATE_CASTLE: "CREATE_CASTLE"
};

export function createEnvelope(type, payload = {}) {
  return { type, payload, ts: Date.now() };
}

export function safeJsonParse(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function quantize2(value) {
  return Math.round(value * 100) / 100;
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
