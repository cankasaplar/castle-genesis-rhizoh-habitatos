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
/**
 * Yeni eklenmesi gereken eksik fonksiyonlar
 */
export function stableCompanionUidV1(archetype: string, ownerUid: string): string {
  // Örnek bir hash veya ID üretme mantığı (burası senin projenin standartlarına göre değişebilir)
  return `${archetype}_${ownerUid}`;
}

export function getCompanionArchetypeDefinitionV1(archetype: string) {
  // Kernel'in beklediği yapı
  return { defaultOrbitState: "listening" };
}

export function resolveCompanionArchetypeFromInvokeV1(agentUid: string, intent?: string): string {
  return agentUid.split('_')[0]; // Örnek mantık
}

export function stubCompanionNarrativeOutputV1(archetype: string, intent?: string) {
  return { text: "Acknowledged.", provenance: "v1" };
}

export function stubCompanionResponseSummaryV1(summary: string) {
  return summary;
}
