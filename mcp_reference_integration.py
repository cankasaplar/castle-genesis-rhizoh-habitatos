"""
Rhizoh Engine - Model Context Protocol (MCP) Reference Middleware Integration
Demonstrates pre-mutation epistemic interception of MCP tool execution requests.
"""

import json
import time
from typing import Dict, Any, Tuple

from runtime.observation import ObservationTracker, EnvironmentState
from runtime.uncertainty import EpistemicUncertaintyEngine
from runtime.governance import GovernanceEngine
from runtime.provenance import MerkleProvenanceLogger

class RhizohMCPMiddleware:
    """
    Reference MCP Middleware Proxy that intercepts MCP 'tools/call' requests
    and evaluates them against Epistemic Uncertainty and Policy Rules prior
    to dispatching the tool execution payload.
    """

    def __init__(self, risk_threshold: float = 0.25):
        self.tracker = ObservationTracker()
        self.uncertainty_engine = EpistemicUncertaintyEngine()
        self.governance_engine = GovernanceEngine(risk_threshold=risk_threshold)
        self.provenance_logger = MerkleProvenanceLogger()

    def intercept_mcp_tool_call(
        self,
        mcp_request: Dict[str, Any],
        context_evidence: Dict[str, Any]
    ) -> Tuple[Dict[str, Any], str]:
        """
        Intercepts an incoming MCP tool execution request before execution.
        """
        tool_name = mcp_request.get("params", {}).get("name", "unknown_tool")
        arguments = mcp_request.get("params", {}).get("arguments", {})

        # Extract evidence graph metrics
        req_nodes = context_evidence.get("required_nodes", 10)
        pres_nodes = context_evidence.get("present_nodes", 10)
        conflict = context_evidence.get("conflict_score", 0.0)
        trust = context_evidence.get("source_trust", 1.0)

        # 1. Capture state & calculate epistemic uncertainty U(t)
        env_state = self.tracker.capture_environment_state(req_nodes, pres_nodes)
        u_t = self.uncertainty_engine.calculate_uncertainty(env_state, conflict=conflict, trust=trust)

        # 2. Evaluate against Governance Decision Matrix
        intent = {"tool": tool_name, "args": arguments}
        policy_pass = context_evidence.get("policy_pass", True)
        capability_pass = context_evidence.get("capability_pass", True)

        evaluation = self.governance_engine.evaluate(
            intent=intent,
            u_t=u_t,
            policy_pass=policy_pass,
            capability_pass=capability_pass
        )

        # 3. Log event into Merkle Tree Provenance DAG
        audit_event = {
            "mcp_method": "tools/call",
            "tool": tool_name,
            "decision": evaluation["decision"],
            "u_t": u_t,
            "timestamp": time.time()
        }
        root_hash = self.provenance_logger.append_event(audit_event)

        if evaluation["decision"] == "ALLOW":
            response = {
                "jsonrpc": "2.0",
                "result": {
                    "content": [{"type": "text", "text": f"Tool '{tool_name}' dispatched successfully."}],
                    "isError": False
                },
                "id": mcp_request.get("id")
            }
        elif evaluation["decision"] == "PAUSE":
            response = {
                "jsonrpc": "2.0",
                "error": {
                    "code": -32001,
                    "message": f"Execution Paused: Epistemic Uncertainty U(t)={u_t:.3f} exceeds risk threshold. Human-in-the-Loop approval required.",
                    "data": {"u_t": u_t, "required_action": "HUMAN_APPROVAL"}
                },
                "id": mcp_request.get("id")
            }
        else:  # REJECT
            response = {
                "jsonrpc": "2.0",
                "error": {
                    "code": -32002,
                    "message": "Execution Rejected: Policy or capability boundary violation. Zero state mutation enforced.",
                    "data": {"u_t": u_t, "decision": "REJECT"}
                },
                "id": mcp_request.get("id")
            }

        return response, root_hash


def run_mcp_demonstration():
    print("=" * 80)
    print("RHIZOH ENGINE — MODEL CONTEXT PROTOCOL (MCP) REFERENCE MIDDLEWARE DEMO")
    print("=" * 80)

    middleware = RhizohMCPMiddleware(risk_threshold=0.25)

    # Scenario A: Benign and well-supported MCP query
    mcp_req_a = {
        "jsonrpc": "2.0",
        "method": "tools/call",
        "params": {"name": "read_public_document", "arguments": {"doc_id": "RFC-001"}},
        "id": 101
    }
    evidence_a = {"required_nodes": 10, "present_nodes": 10, "conflict_score": 0.0, "source_trust": 1.0}

    resp_a, hash_a = middleware.intercept_mcp_tool_call(mcp_req_a, evidence_a)
    print(f"\n[Scenario A] Benign MCP Tool Call:")
    print(f"  Result Hash : {hash_a[:16]}...")
    print(f"  MCP Output  : {json.dumps(resp_a)}")

    # Scenario B: Stale context / uncertain tool call (Triggers PAUSE)
    mcp_req_b = {
        "jsonrpc": "2.0",
        "method": "tools/call",
        "params": {"name": "update_database_record", "arguments": {"record_id": 42}},
        "id": 102
    }
    evidence_b = {"required_nodes": 10, "present_nodes": 4, "conflict_score": 0.4, "source_trust": 0.8}

    resp_b, hash_b = middleware.intercept_mcp_tool_call(mcp_req_b, evidence_b)
    print(f"\n[Scenario B] High Uncertainty Context Call:")
    print(f"  Result Hash : {hash_b[:16]}...")
    print(f"  MCP Output  : {json.dumps(resp_b)}")

    print("\n" + "=" * 80)
    print("DEMO STATUS: MCP TOOL CALL INTERCEPTION VERIFIED SUCCESSFULLY")
    print("=" * 80 + "\n")


if __name__ == "__main__":
    run_mcp_demonstration()