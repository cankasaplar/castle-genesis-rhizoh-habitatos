import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../castleFlight/castleFlightConfig.js", () => ({
  resolveGenesisGatewayHttpBaseV0: () => "https://rhizoh.com/api/gatewayProxy",
  resolveGenesisDirectGatewayOriginV0: () => "https://castle-genesis-rhizoh-habitatos.onrender.com"
}));

describe("ontologicalRepairProtocolV1", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    if (typeof window !== "undefined") delete window.__rhizoh;
  });

  it("runs full repair bundle and reports temporal spam fix path", async () => {
    const mod = await import("../ontologicalRepairProtocolV1.js");
    const report = mod.runOntologicalRepairProtocolV1({
      nodeRows: [
        { id: "tr_mqhxkmjp_e6y1e_256", atMs: 1000, tier: "temporal" },
        { id: "tr_mqhxkmjp_e6y1e_256", atMs: 2000, tier: "temporal" }
      ],
      skipWorldSpace: true
    });
    expect(report.schema).toContain("ontological_repair_protocol");
    expect(report.diagnosis.temporalSpam).toBe(true);
    expect(report.genesisAuthority.lockActive).toBe(true);
    expect(report.nodeEvolution.fissionApplied).toBeGreaterThan(0);
  });
});
