import time
from runtime.observation import EnvironmentState

class EpistemicUncertaintyEngine:
    def __init__(self, weights=(0.4, 0.2, 0.2, 0.2)):
        self.w1, self.w2, self.w3, self.w4 = weights

    def calculate_uncertainty(self, state: EnvironmentState, conflict: float = 0.0, trust: float = 1.0) -> float:
        coverage = state.coverage
        now = time.time()
        staleness = min(1.0, max(0.0, now - state.timestamp) / 3600.0)
        u_val = (self.w1 * (1.0 - coverage)) + (self.w2 * staleness) + (self.w3 * conflict) + (self.w4 * (1.0 - trust))
        return max(0.0, min(1.0, u_val))
