class GovernanceEngine:
    def __init__(self, risk_threshold: float = 0.25):
        self.risk_threshold = risk_threshold

    def evaluate(self, intent: dict, u_t: float, policy_pass: bool = True, capability_pass: bool = True) -> dict:
        if policy_pass and capability_pass and u_t <= self.risk_threshold:
            return {"decision": "ALLOW", "action": "EXECUTE"}
        elif policy_pass and u_t > self.risk_threshold:
            return {"decision": "PAUSE", "action": "HUMAN_IN_THE_LOOP"}
        else:
            return {"decision": "REJECT", "action": "ZERO_MUTATION"}
