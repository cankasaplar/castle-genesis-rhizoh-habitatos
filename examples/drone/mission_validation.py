from rhizoh_core import Observation, Proposal, RhizohExecutionRuntime

runtime = RhizohExecutionRuntime()
observation = Observation(
    source='drone-telemetry',
    raw_payload={'altitude': 120},
    confidence=0.82,
    modality='sensor',
    sensor_type='gps',
)
result = runtime.process_observation(observation, proposal_factory=lambda obs: Proposal(
    proposer='drone-agent',
    action_type='TRANSFER_ASSET',
    payload={'target_asset': 'DroneMission_A', 'amount': 1},
    confidence=obs.confidence,
    observation_id=obs.observation_id,
    observation='drone-mission',
))
print(result)
