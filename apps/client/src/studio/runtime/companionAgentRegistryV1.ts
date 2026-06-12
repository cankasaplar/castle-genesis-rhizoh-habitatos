/**
 * companionAgentRegistryV1
 * Fix: provenance contract stabilized (no legacy field removal mismatch)
 */

export type ProvenanceInput = {
  input: string;
};

export type ProvenanceOutput = {
  source_chain: string[];
  trust_class: string;
  derivation_depth: number;
};

export function createCompanionAgentRegistryV1() {
  return {
    produceProvenance(payload: ProvenanceInput): ProvenanceOutput {
      const input = payload?.input ?? "";

      // deterministic minimal provenance chain
      const source_chain = [
        "companion.registry.v1",
        "companion.provenance.generator",
        `input:${input.slice(0, 32)}`
      ];

      // simple trust heuristic (stable for tests)
      const trust_class =
        input.length === 0
          ? "low"
          : input.length < 10
            ? "medium"
            : "high";

      // derivation depth fixed deterministic
      const derivation_depth = 1;

      return {
        source_chain,
        trust_class,
        derivation_depth
      };
    }
  };
}
