from rhizoh_core import Proposal, RhizohExecutionRuntime

runtime = RhizohExecutionRuntime()
proposal = Proposal(
    proposer='robot-agent',
    action_type='TRANSFER_ASSET',
    payload={'target_asset': 'InventoryBin_1', 'amount': 80},
    confidence=0.84,
    observation='Warehouse dispatch request',
    causal_parent='observation:robot-sensor',
)
print(runtime.process_execution_proposal(proposal))
