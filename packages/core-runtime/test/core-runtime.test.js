import test from 'node:test';
import assert from 'node:assert/strict';
import { OntologicalConstraints, Proposal, RhizohExecutionRuntime } from '../src/index.js';

test('ontology constraints reject forbidden relationships and invalid transfers', () => {
    const [okHuman, msgHuman] = OntologicalConstraints.validateRelationship('Human', 'owns', 'Human');
    assert.equal(okHuman, false);
    assert.match(msgHuman, /Human owns Human/);

    const [okTransfer, msgTransfer] = OntologicalConstraints.validateAction('TRANSFER_ASSET', { amount: -1 });
    assert.equal(okTransfer, false);
    assert.match(msgTransfer, /Transfer/);
});

test('execution runtime approves valid proposals and rejects policy violations', () => {
    const runtime = new RhizohExecutionRuntime();
    const valid = new Proposal('autonomous_logistics_agent', 'TRANSFER_ASSET', { target_asset: 'Asset_X', amount: 2500 }, 0.95);
    const approved = runtime.processExecutionProposal(valid);
    assert.equal(approved.decision, 'approved_and_executed');

    const invalid = new Proposal('autonomous_logistics_agent', 'TRANSFER_ASSET', { target_asset: 'Asset_Y', amount: 8000 }, 0.99);
    const rejected = runtime.processExecutionProposal(invalid);
    assert.equal(rejected.decision, 'policy_violation_blocked');
});
