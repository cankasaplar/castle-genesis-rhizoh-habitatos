import json
import hashlib
from typing import List, Dict, Any

class MerkleProvenanceLogger:
    def __init__(self):
        self.audit_events: List[Dict[str, Any]] = []
        self.root_hash: str = hashlib.sha256(b"ROOT_GENESIS").hexdigest()

    def append_event(self, event: Dict[str, Any]) -> str:
        event_bytes = json.dumps(event, sort_keys=True).encode('utf-8')
        event_hash = hashlib.sha256(event_bytes).hexdigest()
        combined = (self.root_hash + event_hash).encode('utf-8')
        self.root_hash = hashlib.sha256(combined).hexdigest()
        self.audit_events.append(event)
        return self.root_hash
