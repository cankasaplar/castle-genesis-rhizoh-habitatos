/**
 * companionAgentRegistryV1
 * Fix: stable contract for KernelGuard + backward compatibility export
 */

import type { CompanionAgentArchetype, RhizohCompanionAgentState } from "../types/rskOntology";

export type ProvenanceInput = {
  input: string;
};

export type ProvenanceOutput = {
  source_chain: string[];
  trust_class: string;
  derivation_depth: number;
};

export type CompanionArchetypeDefinitionV1 = {
  defaultOrbitState: RhizohCompanionAgentState;
  meshColor: number;
  meshEmissive: number;
};

const ARCHETYPE_DEFS: Record<CompanionAgentArchetype, CompanionArchetypeDefinitionV1> = {
  rhizoh: { defaultOrbitState: "listening", meshColor: 0x44cc88, meshEmissive: 0x114433 },
  atlas: { defaultOrbitState: "observing", meshColor: 0x4488cc, meshEmissive: 0x112244 },
  ghost: { defaultOrbitState: "orbiting", meshColor: 0xaa66ff, meshEmissive: 0x331144 }
};

/**
 * Core registry factory (future extensibility)
 */
export function createCompanionAgentRegistryV1() {
  return {
    produceProvenance(payload: ProvenanceInput): ProvenanceOutput {
      const input = payload?.input ?? "";

      const source_chain = [
        "companion.registry.v1",
        "companion.provenance.generator",
        `input:${input.slice(0, 32)}`
      ];

      const trust_class =
        input.length === 0
          ? "low"
          : input.length < 10
            ? "medium"
            : "high";

      return {
        source_chain,
        trust_class,
        derivation_depth: 1
      };
    },

    /**
     * Archetype validation (kernel expects this)
     */
    isValidCompanionArchetypeV1(input: unknown): boolean {
      const validArchetypes = [
        "basic",
        "guardian",
        "observer",
        "trainer",
        "oracle"
      ] as const;

      return typeof input === "string" &&
        (validArchetypes as readonly string[]).includes(input);
    }
  };
}

/**
 * 🔥 BACKWARD COMPATIBILITY EXPORT
 * KernelGuard directly imports this
 */
export function isValidCompanionArchetypeV1(input: unknown): boolean {
  const validArchetypes = [
    "basic",
    "guardian",
    "observer",
    "trainer",
    "oracle"
  ] as const;

  return typeof input === "string" &&
    (validArchetypes as readonly string[]).includes(input);
}

export function stableCompanionUidV1(archetype: string, ownerUid: string): string {
  return `${archetype}_${ownerUid}`;
}

export function listCompanionArchetypeDefinitionsV1(): Array<
  { archetype: CompanionAgentArchetype } & CompanionArchetypeDefinitionV1
> {
  return (Object.entries(ARCHETYPE_DEFS) as [CompanionAgentArchetype, CompanionArchetypeDefinitionV1][]).map(
    ([archetype, def]) => ({ archetype, ...def })
  );
}

export function getCompanionArchetypeDefinitionV1(
  archetype: string
): CompanionArchetypeDefinitionV1 | null {
  if (archetype === "rhizoh" || archetype === "atlas" || archetype === "ghost") {
    return ARCHETYPE_DEFS[archetype];
  }
  return null;
}

export function resolveCompanionArchetypeFromInvokeV1(
  agentUid: string,
  _intent?: string
): CompanionAgentArchetype | null {
  const raw = agentUid.split("_")[0];
  if (raw === "rhizoh" || raw === "atlas" || raw === "ghost") return raw;
  if (agentUid === "rhizoh" || agentUid === "atlas" || agentUid === "ghost") return agentUid;
  return null;
}

export function stubCompanionNarrativeOutputV1(archetype: string, intent?: string) {
  return { text: "Acknowledged.", provenance: "v1" };
}

export function stubCompanionResponseSummaryV1(summary: string) {
  return summary;
}
