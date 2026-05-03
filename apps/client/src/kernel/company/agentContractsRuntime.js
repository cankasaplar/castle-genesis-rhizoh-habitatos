export const RHIZOH_COMPANY_AGENT_IDS = Object.freeze({
  RESEARCH: "RHIZOH_RESEARCH_AGENT",
  PRODUCT: "RHIZOH_PRODUCT_AGENT",
  PROOF: "RHIZOH_PROOF_AGENT",
  IP: "RHIZOH_IP_AGENT",
  GTM: "RHIZOH_GTM_AGENT",
  FUNDING: "RHIZOH_FUNDING_AGENT",
  GOVERNANCE: "RHIZOH_GOVERNANCE_AGENT"
});

function contract(agent_id, mission, tokenLimit = 250) {
  return Object.freeze({
    identity: { agent_id, owner_plane: "Governance" },
    mission,
    permissions: { read_docs: true, create_proposals: true },
    budget: { token_limit_daily: tokenLimit, compute_limit_hours: 2 },
    tools: { allowed: ["internal_docs", "task_queue"] },
    memory: { retention_days: 30, pii_policy: "no_pii" },
    proof_requirement: { evidence_level: "trace+metrics" },
    human_approval_threshold: { required_for: ["external_actions", "critical_policy_changes"] },
    kill_switch: { mode: "immediate_disable", escalation_to: RHIZOH_COMPANY_AGENT_IDS.GOVERNANCE }
  });
}

export function getDefaultRhizohCompanyAgentContractsV1() {
  return Object.freeze([
    contract(RHIZOH_COMPANY_AGENT_IDS.RESEARCH, "Continuous standards and market research", 350),
    contract(RHIZOH_COMPANY_AGENT_IDS.PRODUCT, "SKU/docs/api and release planning", 300),
    contract(RHIZOH_COMPANY_AGENT_IDS.PROOF, "Runtime truth and proof integrity validation", 400),
    contract(RHIZOH_COMPANY_AGENT_IDS.IP, "Prior art and claim tree support", 220),
    contract(RHIZOH_COMPANY_AGENT_IDS.GTM, "Lighthouse pipeline and outreach drafts", 300),
    contract(RHIZOH_COMPANY_AGENT_IDS.FUNDING, "Grant and funding queue management", 220),
    contract(RHIZOH_COMPANY_AGENT_IDS.GOVERNANCE, "Agent-of-agents control plane", 500)
  ]);
}

export function bootstrapRhizohCompanyContracts(substrate) {
  const contracts = getDefaultRhizohCompanyAgentContractsV1();
  for (const c of contracts) substrate.registerAgentContract(c);
  return { ok: true, count: contracts.length };
}

