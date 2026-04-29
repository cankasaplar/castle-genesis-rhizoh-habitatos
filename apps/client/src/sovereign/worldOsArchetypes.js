/**
 * World OS ajan arketipleri — şehir ölçeği görev ve yetenek profilleri.
 */

export const WORLD_OS_ARCHETYPES = [
  {
    id: "urban_resilience",
    name: "Urban Resilience Agent",
    domain: ["traffic", "energy", "utilities", "crowd_flow", "climate_anomalies"],
    ability: "topology_reconfiguration"
  },
  {
    id: "inventory_intelligence",
    name: "Inventory Intelligence",
    domain: ["parts", "consumables", "robot_health", "maintenance_windows", "supply_chain"],
    ability: "anticipatory_logistics"
  },
  {
    id: "compliance_sentinel",
    name: "Compliance Sentinel",
    domain: ["policy_drift", "memory_drift", "unsafe_action", "sandbox_escape"],
    ability: "kill_switch_quarantine"
  },
  {
    id: "manager",
    name: "Manager Agent",
    domain: ["delegation", "task_routing", "priority_mediation"],
    ability: "hierarchical_control"
  },
  {
    id: "synthesist",
    name: "Synthesist Agent",
    domain: ["multi_agent_consensus", "conflict_resolution", "evidence_fusion"],
    ability: "synthesize_contradictory_reports"
  },
  {
    id: "diplomat",
    name: "Diplomat Agent",
    domain: ["human_agent_interface", "policy_negotiation", "authorization_bridge"],
    ability: "stakeholder_alignment"
  }
];
