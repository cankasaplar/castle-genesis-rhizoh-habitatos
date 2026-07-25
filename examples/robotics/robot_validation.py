from rhizoh_core import Observation, Proposal, RhizohExecutionRuntime

runtime = RhizohExecutionRuntime()
observation = Observation(
    source='robot-sensor',
    raw_payload={'distance': 2.4},
    confidence=0.85,
    modality='sensor',
    sensor_type='lidar',
)
result = runtime.process_observation(observation, proposal_factory=lambda obs: Proposal(
    proposer='robot-agent',
    action_type='TRANSFER_ASSET',
    payload={'target_asset': 'RobotTask_A', 'amount': 1},
    confidence=obs.confidence,
    observation_id=obs.observation_id,
    observation='robotics-task',
))
print(result)
