"""
Rhizoh Runtime - Sandbox Execution Layer
Dispatches approved actions into WASM/Isolated Sandbox environment.
"""

from typing import Dict, Any
from runtime.governance import GovernanceDecision, GovernanceReport

class ExecutionDispatcher:
    def dispatch(self, intent: Dict[str, Any], gov_report: GovernanceReport) -> Dict[str, Any]:
        if gov_report.decision != GovernanceDecision.ALLOW:
            return {
                "status": "BLOCKED",
                "reason": f"Execution halted by Governance Layer. Status: {gov_report.decision.value}",
                "sandbox_id": None
            }

        # Simulated WASM Sandbox Dispatch
        action = intent.get("action", "unknown_action")
        return {
            "status": "SUCCESS",
            "action_executed": action,
            "sandbox_id": "wasm_sandbox_01_active",
            "execution_time_ms": 0.42
        }


if __name__ == "__main__":
    from runtime.governance import GovernanceEngine
    
    gov = GovernanceEngine()
    exec_engine = ExecutionDispatcher()
    
    mock_intent = {"action": "clear_cache"}
    report = gov.evaluate(mock_intent, u_t=0.02, policy_pass=True, capability_pass=True)
    
    res = exec_engine.dispatch(mock_intent, report)
    print("Execution Result:")
    print(res)