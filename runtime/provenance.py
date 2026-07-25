"""
Rhizoh Runtime - Cryptographic Provenance & Merkle DAG Engine
Ensures tamper-proof execution chains for Paper 1 & Paper 2.
"""

import hashlib
import json
from typing import Dict, Any, List

class ProvenanceDAG:
    def __init__(self):
        self.nodes: List[Dict[str, Any]] = []

    def add_node(self, stage: str, data: Dict[str, Any]) -> str:
        """Adds a state node to the DAG, linking it cryptographically to the previous hash."""
        prev_hash = self.nodes[-1]["hash"] if self.nodes else "0" * 64
        
        node_content = {
            "stage": stage,
            "data": data,
            "prev_hash": prev_hash
        }
        
        # Calculate SHA-256 hash for this node
        node_json = json.dumps(node_content, sort_keys=True)
        node_hash = hashlib.sha256(node_json.encode('utf-8')).hexdigest()
        
        record = {
            "stage": stage,
            "hash": node_hash,
            "prev_hash": prev_hash,
            "data": data
        }
        self.nodes.append(record)
        return node_hash

    def compute_merkle_root(self) -> str:
        """Computes the cryptographic Merkle root of all recorded execution steps."""
        if not self.nodes:
            return hashlib.sha256(b"empty").hexdigest()
        
        current_level = [node["hash"] for node in self.nodes]
        
        while len(current_level) > 1:
            next_level = []
            for i in range(0, len(current_level), 2):
                left = current_level[i]
                right = current_level[i+1] if i + 1 < len(current_level) else left
                combined = left + right
                parent_hash = hashlib.sha256(combined.encode('utf-8')).hexdigest()
                next_level.append(parent_hash)
            current_level = next_level
            
        return current_level[0]

    def format_dag_log(self) -> str:
        """Generates academic provenance chain visualization."""
        log = []
        log.append("================================================================================")
        log.append("PROVENANCE DAG ZİNCİRİ (CRYPTOGRAPHIC PROOF)")
        log.append("================================================================================")
        
        chain_visual = []
        for node in self.nodes:
            stage_name = node["stage"]
            short_hash = node["hash"][:6]
            chain_visual.append(f"{stage_name} [{short_hash}..]")
            
        log.append(" ──► ".join(chain_visual))
        log.append("--------------------------------------------------------------------------------")
        merkle_root = self.compute_merkle_root()
        log.append(f"MERKLE ROOT HASH     : {merkle_root}")
        return "\n".join(log)


if __name__ == "__main__":
    # Test
    dag = ProvenanceDAG()
    dag.add_node("Observation", {"source": "sensor_feed_01"})
    dag.add_node("Intent", {"intent": "clear_cache"})
    dag.add_node("Uncertainty", {"u_t": 0.0206})
    dag.add_node("PolicyResult", {"status": "PASS"})
    dag.add_node("Capability", {"token": "CACHE_CLEAR"})
    dag.add_node("Execution", {"sandbox": "WASM_OK"})
    
    print(dag.format_dag_log())