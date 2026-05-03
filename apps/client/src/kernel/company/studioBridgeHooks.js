export function createRhizohStudioBridgeHooks(substrate) {
  return Object.freeze({
    onSimulationEvent(event) {
      const type = String(event?.type ?? "simulation_event");
      const requiresApproval = type.includes("publish") || type.includes("external");
      return substrate.submitTaskProposal({
        agentId: event?.agentId ?? "RHIZOH_GTM_AGENT",
        kind: `studio_${type}`,
        payload: event ?? {},
        requiresApproval,
        traceId: event?.traceId
      });
    }
  });
}

