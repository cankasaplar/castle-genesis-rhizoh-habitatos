"""
Rhizoh Runtime v0.1 - Reference Implementation Demo
Uçtan Uca Epistemic Governance Akışı (Paper 1 & Paper 2)
"""

from runtime.observation import ObservationTracker
from runtime.uncertainty import EpistemicUncertaintyEngine
from runtime.provenance import ProvenanceDAG
from runtime.governance import GovernanceEngine
from runtime.execution import ExecutionDispatcher


def run_test_case(tc_id: str, tc_name: str, intent_data: dict, evidence_override: dict, policy_pass: bool, cap_pass: bool):
    print("\n" + "#" * 80)
    print(f"  TEST CASE: {tc_id} - {tc_name}")
    print("#" * 80)

    # 1. Pipeline Başlatıcıları
    dag = ProvenanceDAG()
    obs_tracker = ObservationTracker()
    uncertainty_engine = EpistemicUncertaintyEngine()
    gov_engine = GovernanceEngine(risk_threshold=0.2500)
    exec_dispatcher = ExecutionDispatcher()

    # 2. Observation Layer
    env_state = obs_tracker.capture_environment_state()
    env_state.update(evidence_override)  # Test vakasına özel kanıtlar
    dag.add_node("Observation", {"state": "captured", "present_nodes": env_state["present_nodes"]})

    # 3. Intent Processing
    dag.add_node("Intent", intent_data)

    # 4. Epistemic Uncertainty U(t) Calculation
    u_breakdown = uncertainty_engine.calculate_uncertainty(env_state)
    dag.add_node("Uncertainty", {"u_t": u_breakdown.computed_u})

    # Log - Epistemic Breakdown
    print(u_breakdown.format_log())

    # 5. Governance Decision Matrix
    gov_report = gov_engine.evaluate(
        intent=intent_data,
        u_t=u_breakdown.computed_u,
        policy_pass=policy_pass,
        capability_pass=cap_pass
    )
    dag.add_node("PolicyResult", {"policy": gov_report.policy_check})
    dag.add_node("Capability", {"capability": gov_report.capability_check})

    # Log - Governance Matrix
    print("\n" + gov_report.format_log())

    # 6. Execution Dispatcher
    exec_result = exec_dispatcher.dispatch(intent_data, gov_report)
    dag.add_node("Execution", {"status": exec_result["status"]})

    # 7. Cryptographic Merkle Root Log
    print("\n" + dag.format_dag_log())


if __name__ == "__main__":
    # -------------------------------------------------------------------------
    # SENARYO 1: Safe Request (Legitimate Action) -> EXPECTED: ALLOW
    # -------------------------------------------------------------------------
    run_test_case(
        tc_id="TC-03",
        tc_name="Legitimate Safe Request",
        intent_data={"action": "clear_temp_cache", "user_id": 1042},
        evidence_override={
            "required_nodes": 43,
            "present_nodes": 42,
            "newest_evidence_age_sec": 17.0,
            "conflict_score": 0.0,
            "trust_score": 1.0
        },
        policy_pass=True,
        cap_pass=True
    )

    # -------------------------------------------------------------------------
    # SENARYO 2: High Uncertainty / Context Poisoning -> EXPECTED: PAUSE
    # -------------------------------------------------------------------------
    run_test_case(
        tc_id="TC-02",
        tc_name="Context Poisoning / Stale Evidence Scenario",
        intent_data={"action": "wipe_database_logs", "user_id": 1042},
        evidence_override={
            "required_nodes": 43,
            "present_nodes": 18,            # Eksik kanıt düğümleri (Low Coverage)
            "newest_evidence_age_sec": 450.0, # Eskimiş veri (High Staleness)
            "conflict_score": 0.40,          # Çelişkili bilgi (Conflict)
            "trust_score": 0.80
        },
        policy_pass=True,
        cap_pass=True
    )

    # -------------------------------------------------------------------------
    # SENARYO 3: Privilege Escalation Attack -> EXPECTED: REJECT
    # -------------------------------------------------------------------------
    run_test_case(
        tc_id="TC-04",
        tc_name="Privilege Escalation Attempt",
        intent_data={"action": "grant_root_privileges", "target": "attacker"},
        evidence_override={
            "required_nodes": 43,
            "present_nodes": 43,
            "newest_evidence_age_sec": 5.0,
            "conflict_score": 0.0,
            "trust_score": 1.0
        },
        policy_pass=False,  # OPA Policy Fail!
        cap_pass=False     # Capability Token Invalid!
    )