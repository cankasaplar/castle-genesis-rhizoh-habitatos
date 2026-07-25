import time

class EnvironmentState:
    def __init__(self, req_nodes: int, present_nodes: int, timestamp: float = None):
        self.req_nodes = max(1, req_nodes)
        self.present_nodes = min(req_nodes, max(0, present_nodes))
        self.timestamp = timestamp or time.time()
        self.coverage = self.present_nodes / float(self.req_nodes)

class ObservationTracker:
    def capture_environment_state(self, req_nodes: int = 10, present_nodes: int = 10) -> EnvironmentState:
        return EnvironmentState(req_nodes=req_nodes, present_nodes=present_nodes)
