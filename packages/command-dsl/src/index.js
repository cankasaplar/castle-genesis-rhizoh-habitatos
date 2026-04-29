import { COMMAND } from "@castle/protocol";

const COMMAND_SYNONYMS = new Map([
  ["spawn agent", COMMAND.SPAWN_AGENT],
  ["spawn", COMMAND.SPAWN_AGENT],
  ["birim olustur", COMMAND.SPAWN_AGENT],
  ["birim oluştur", COMMAND.SPAWN_AGENT],
  ["agent olustur", COMMAND.SPAWN_AGENT],
  ["agent oluştur", COMMAND.SPAWN_AGENT],
  ["creer agent", COMMAND.SPAWN_AGENT],
  ["créer agent", COMMAND.SPAWN_AGENT],
  ["新しいエージェント", COMMAND.SPAWN_AGENT],
  ["list castles", COMMAND.LIST_CASTLES],
  ["kaleleri listele", COMMAND.LIST_CASTLES],
  ["spawn entity", COMMAND.SPAWN_ENTITY],
  ["entity olustur", COMMAND.SPAWN_ENTITY],
  ["entity oluştur", COMMAND.SPAWN_ENTITY],
  ["create castle", COMMAND.CREATE_CASTLE],
  ["kale olustur", COMMAND.CREATE_CASTLE],
  ["kale oluştur", COMMAND.CREATE_CASTLE]
]);

function normalizeText(input) {
  return String(input || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export function parseTextToCommand(inputText) {
  const normalized = normalizeText(inputText);
  const known = COMMAND_SYNONYMS.get(normalized);

  if (!known && normalized.startsWith("spawn agent")) {
    return { command: COMMAND.SPAWN_AGENT, params: extractSpawnParams(normalized) };
  }
  if (!known && normalized.startsWith("spawn entity")) {
    return { command: COMMAND.SPAWN_ENTITY, params: extractEntityParams(normalized) };
  }
  if (!known && normalized.startsWith("create castle")) {
    return { command: COMMAND.CREATE_CASTLE, params: extractCastleParams(normalized) };
  }

  if (!known) return null;

  if (known === COMMAND.SPAWN_AGENT) {
    return { command: known, params: extractSpawnParams(normalized) };
  }
  if (known === COMMAND.SPAWN_ENTITY) {
    return { command: known, params: extractEntityParams(normalized) };
  }
  if (known === COMMAND.CREATE_CASTLE) {
    return { command: known, params: extractCastleParams(normalized) };
  }
  return { command: known, params: {} };
}

function extractSpawnParams(text) {
  const shardMatch = text.match(/(castle-[0-9]+)/i);
  return {
    targetCastleId: shardMatch ? shardMatch[1].toLowerCase() : "castle-01"
  };
}

function extractEntityParams(text) {
  const shardMatch = text.match(/(castle-[0-9]+)/i);
  const typeMatch = text.match(/type[:= ]([a-z0-9_-]+)/i);
  return {
    targetCastleId: shardMatch ? shardMatch[1].toLowerCase() : "castle-01",
    entityType: typeMatch ? typeMatch[1].toUpperCase() : "NODE"
  };
}

function extractCastleParams(text) {
  const nameMatch = text.match(/name[:= ]([a-z0-9_-]+)/i);
  return {
    name: nameMatch ? nameMatch[1].toUpperCase() : `CASTLE-${Date.now().toString().slice(-4)}`
  };
}
