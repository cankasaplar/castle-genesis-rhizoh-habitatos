import { patchRuntime } from "../store/runtimeSlice";
import type { BootstrapContext } from "../types/rskOntology";
import {
  registerMindDefinition,
  registerSoul,
  registerSoulMindBinding,
  spawnMindInstance
} from "../store/registrySlice.js";
import { getStudioKernelState } from "../store/internalStore";

export const RSK_DEFAULT_SEED_UID = "rsk.default.seed";

function ensureDefaultSeedDefinition(): void {
  const s = getStudioKernelState();
  if (s.registry.mind.definition[RSK_DEFAULT_SEED_UID]) return;
  registerMindDefinition({
    uid: RSK_DEFAULT_SEED_UID,
    label: "Seed Mind",
    metadata: { alias: "RSK Default Seed" },
    engine: {
      model: "gpt-4o",
      temperature: 0.55,
      maxTokens: 2048,
      routingLogic: "intelligence_heavy"
    },
    dna: {
      curiosity: 0.5,
      resonance: 0.5,
      stability: 0.8,
      creativity: 0.4,
      empathy: 0.6
    },
    capabilities: { toolIds: [], perceptions: [] }
  });
}

function hasRootSoulForOwner(ownerId: string): boolean {
  const souls = Object.values(getStudioKernelState().registry.soul);
  return souls.some((x) => x.ownerId === ownerId);
}

/**
 * First-login continuity: default MindDefinition + root Soul + seed MindInstance + SoulMind bind.
 */
export function bootstrapKernelRootIfNeeded(ownerId: string, ctx?: BootstrapContext): void {
  if (!ownerId) return;
  if (hasRootSoulForOwner(ownerId)) return;

  const env = ctx?.environment ?? "default";

  ensureDefaultSeedDefinition();

  const soulUid = `soul:${ownerId}:root`;
  const mindUid = `mind:${ownerId}:seed`;
  const bindUid = `smb:${ownerId}:root`;

  const soulRes = registerSoul({
    uid: soulUid,
    ownerId,
    continuityHash: "",
    resonance: 1,
    history: ["bootstrap:root"],
    metadata: { name: "Root continuity", origin: `kernel.bootstrap.${env}` },
    linkedMindIds: [mindUid],
    linkedEntityIds: []
  });
  if (!soulRes.ok) return;

  const instRes = spawnMindInstance({
    uid: mindUid,
    definitionUid: RSK_DEFAULT_SEED_UID,
    soulUid,
    ownerId,
    metadata: { alias: "Seed instance" }
  });
  if (!instRes.ok) return;

  const bindRes = registerSoulMindBinding({
    uid: bindUid,
    soulUid,
    mindInstanceUid: mindUid,
    state: "active"
  });
  if (!bindRes.ok) return;

  patchRuntime({ activeSoul: soulUid, activeMind: mindUid });
}
