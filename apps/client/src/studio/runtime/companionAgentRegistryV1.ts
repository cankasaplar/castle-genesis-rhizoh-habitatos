/**
 * Studio companion archetype registry — Ghost, Rhizoh, Atlas (EFIR-α: suggestion-only).
 * @see docs/RHIZOH_CASTLE_GENESIS_PRODUCTION_ARCHITECTURE_V1.md §8.6
 */

import type {
  CompanionAgentArchetype,
  RhizohCompanionAgentState
} from "../types/rskOntology.js";
import { wrapNarrativeOutputV0 } from "../../rhizoh/runtime/narrativeSourceProvenanceV0.js";

export const COMPANION_AGENT_REGISTRY_SCHEMA_V1 = "castle.studio.companion_agent_registry.v1";

export interface CompanionArchetypeDefinitionV1 {
  archetype: CompanionAgentArchetype;
  displayName: string;
  /** Always false — companions never hold execution authority */
  executive: false;
  witnessWrite: false;
  suggestionOnly: true;
  stableUidPrefix: string;
  stubResponsePrefix: string;
  invokeAgentUidIncludes: readonly string[];
  /** Regex pattern strings (case-insensitive), e.g. `@atlas\\b` */
  invokeIntentPatterns: readonly string[];
  meshColor: number;
  meshEmissive: number;
  defaultOrbitState: RhizohCompanionAgentState;
}

const DEFINITIONS_V1: readonly CompanionArchetypeDefinitionV1[] = Object.freeze([
  Object.freeze({
    archetype: "rhizoh",
    displayName: "Rhizoh",
    executive: false,
    witnessWrite: false,
    suggestionOnly: true,
    stableUidPrefix: "rhizoh:companion",
    stubResponsePrefix: "Rhizoh",
    invokeAgentUidIncludes: Object.freeze(["rhizoh"]),
    invokeIntentPatterns: Object.freeze(["@rhizoh\\b"]),
    meshColor: 0xa78bfa,
    meshEmissive: 0x4c1d95,
    defaultOrbitState: "orbiting"
  }),
  Object.freeze({
    archetype: "atlas",
    displayName: "Atlas",
    executive: false,
    witnessWrite: false,
    suggestionOnly: true,
    stableUidPrefix: "atlas:companion",
    stubResponsePrefix: "Atlas",
    invokeAgentUidIncludes: Object.freeze(["atlas"]),
    invokeIntentPatterns: Object.freeze(["@atlas\\b"]),
    meshColor: 0x38bdf8,
    meshEmissive: 0x0c4a6e,
    defaultOrbitState: "guiding"
  }),
  Object.freeze({
    archetype: "ghost",
    displayName: "Ghost",
    executive: false,
    witnessWrite: false,
    suggestionOnly: true,
    stableUidPrefix: "ghost:companion",
    stubResponsePrefix: "Ghost",
    invokeAgentUidIncludes: Object.freeze(["ghost"]),
    invokeIntentPatterns: Object.freeze(["@ghost\\b"]),
    meshColor: 0xe2e8f0,
    meshEmissive: 0x334155,
    defaultOrbitState: "observing"
  })
]);

const BY_ARCHETYPE_V1 = new Map(
  DEFINITIONS_V1.map((d) => [d.archetype, d])
);

export function listCompanionArchetypeDefinitionsV1(): readonly CompanionArchetypeDefinitionV1[] {
  return DEFINITIONS_V1;
}

export function getCompanionArchetypeDefinitionV1(
  archetype: CompanionAgentArchetype
): CompanionArchetypeDefinitionV1 | null {
  return BY_ARCHETYPE_V1.get(archetype) ?? null;
}

export function isValidCompanionArchetypeV1(v: unknown): v is CompanionAgentArchetype {
  return typeof v === "string" && BY_ARCHETYPE_V1.has(v as CompanionAgentArchetype);
}

export function stableCompanionUidV1(
  archetype: CompanionAgentArchetype,
  ownerAvatarUid: string
): string {
  const def = getCompanionArchetypeDefinitionV1(archetype);
  const prefix = def?.stableUidPrefix ?? "companion:unknown";
  return `${prefix}:${ownerAvatarUid}`;
}

/**
 * Resolve which companion archetype an invoke targets (first match wins: rhizoh → atlas → ghost order in registry).
 */
export function resolveCompanionArchetypeFromInvokeV1(
  agentUid: string,
  intent?: string
): CompanionAgentArchetype | null {
  const uid = String(agentUid || "").toLowerCase();
  const intentStr = intent ?? "";
  for (const def of DEFINITIONS_V1) {
    if (def.invokeAgentUidIncludes.some((sub) => uid.includes(sub))) return def.archetype;
    for (const pat of def.invokeIntentPatterns) {
      try {
        if (new RegExp(pat, "i").test(intentStr)) return def.archetype;
      } catch {
        /* skip invalid pattern */
      }
    }
  }
  return null;
}

export function isCompanionArchetypeInvokeV1(agentUid: string, intent?: string): boolean {
  return resolveCompanionArchetypeFromInvokeV1(agentUid, intent) != null;
}

export function stubCompanionResponseSummaryV1(
  archetype: CompanionAgentArchetype,
  intent: string | undefined
): string {
  const def = getCompanionArchetypeDefinitionV1(archetype);
  const prefix = def?.stubResponsePrefix ?? "Companion";
  const t = (intent ?? "").trim().slice(0, 160);
  return t ? `${prefix} · ${t}` : `${prefix} · here.`;
}

/**
 * Narrative output with source provenance (EFIR-α D-layer; anti trust-creep).
 * @see apps/client/src/rhizoh/runtime/narrativeSourceProvenanceV0.js
 */
export function stubCompanionNarrativeOutputV1(
  archetype: CompanionAgentArchetype,
  intent: string | undefined,
  sourceChain?: readonly string[]
): {
  schema: string;
  text: string;
  provenance: {
    source_chain: readonly string[];
    trust_class: string;
    derivation_depth: number;
  };
  emittedAtMs: number;
} {
  const chain =
    sourceChain && sourceChain.length > 0
      ? sourceChain
      : Object.freeze([
          `companion.${archetype}`,
          "companion.policy",
          "baseline.no_signal"
        ]);
  return wrapNarrativeOutputV0({
    text: stubCompanionResponseSummaryV1(archetype, intent),
    sourceChain: chain
  });
}
