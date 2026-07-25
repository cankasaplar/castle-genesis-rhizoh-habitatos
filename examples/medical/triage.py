from rhizoh_core import Proposal, RhizohExecutionRuntime

runtime = RhizohExecutionRuntime()
proposal = Proposal(
    proposer='triage-agent',
    action_type='TRANSFER_ASSET',
    payload={'target_asset': 'MedicalSupply_A', 'amount': 150},
    confidence=0.91,
    observation='Triage request received',
    causal_parent='observation:medical-queue',
)
print(runtime.process_execution_proposal(proposal))
