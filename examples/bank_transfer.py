from rhizoh_core import Proposal, RhizohExecutionRuntime

runtime = RhizohExecutionRuntime()
proposal = Proposal(
    proposer='bank-agent',
    action_type='TRANSFER_ASSET',
    payload={'target_asset': 'Asset_X', 'amount': 2500},
    confidence=0.95,
    observation='Bank transfer request received',
    causal_parent='observation:bank-portal',
)
print(runtime.process_execution_proposal(proposal))
