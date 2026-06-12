/**
 * companionAgentRegistryV1
 * Fix: stable contract for KernelGuard + backward compatibility export
 */

export type ProvenanceInput = {
  input: string;
};

export type ProvenanceOutput = {
  source_chain: string[];
  trust_class: string;
  derivation_depth: number;
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
