from rhizoh_core import Proposal, RhizohExecutionRuntime

runtime = RhizohExecutionRuntime()
proposal = Proposal(
    proposer='calendar-agent',
    action_type='TRANSFER_ASSET',
    payload={'target_asset': 'CalendarSlot_1', 'amount': 1},
    confidence=0.78,
    observation='Scheduling request received',
    causal_parent='observation:calendar-event',
)
print(runtime.process_execution_proposal(proposal))
