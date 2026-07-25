from rhizoh_core import Observation, Proposal, RhizohExecutionRuntime

runtime = RhizohExecutionRuntime()
observation = Observation(
    source='finance-approval',
    raw_payload={'amount': 5000},
    confidence=0.91,
    modality='sensor',
    sensor_type='approval-workflow',
)
result = runtime.process_observation(observation, proposal_factory=lambda obs: Proposal(
    proposer='finance-agent',
    action_type='TRANSFER_ASSET',
    payload={'target_asset': 'LedgerEntry_A', 'amount': 5000},
    confidence=obs.confidence,
    observation_id=obs.observation_id,
    observation='financial-approval',
))
print(result)
