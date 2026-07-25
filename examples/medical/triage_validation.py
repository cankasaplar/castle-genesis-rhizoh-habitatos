from rhizoh_core import Observation, Proposal, RhizohExecutionRuntime

runtime = RhizohExecutionRuntime()
observation = Observation(
    source='medical-triage-sensor',
    raw_payload={'symptom': 'severe-pain'},
    confidence=0.88,
    modality='sensor',
    sensor_type='medical-monitor',
)
result = runtime.process_observation(observation, proposal_factory=lambda obs: Proposal(
    proposer='triage-agent',
    action_type='TRANSFER_ASSET',
    payload={'target_asset': 'MedicalSupply_A', 'amount': 120},
    confidence=obs.confidence,
    observation_id=obs.observation_id,
    observation='medical-triage',
))
print(result)
