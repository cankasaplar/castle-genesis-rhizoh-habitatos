from rhizoh_core import Observation, Proposal, RhizohExecutionRuntime

runtime = RhizohExecutionRuntime()
observation = Observation(
    source='factory-sensor',
    raw_payload={'temperature': 85},
    confidence=0.87,
    modality='sensor',
    sensor_type='thermal',
)
result = runtime.process_observation(observation, proposal_factory=lambda obs: Proposal(
    proposer='industrial-agent',
    action_type='TRANSFER_ASSET',
    payload={'target_asset': 'FactoryLine_A', 'amount': 1},
    confidence=obs.confidence,
    observation_id=obs.observation_id,
    observation='industrial-control',
))
print(result)
