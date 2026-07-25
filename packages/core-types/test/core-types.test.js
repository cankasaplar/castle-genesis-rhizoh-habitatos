import test from 'node:test';
import assert from 'node:assert/strict';
import { createAction, createConfidence, createDecision } from '../src/index.js';

test('core types helpers create deterministic epistemic structures', () => {
    const action = createAction('move', { target: 'node:beşiktaş-u18' });
    assert.equal(action.type, 'move');
    assert.match(action.id, /^action:/);
    assert.deepEqual(action.payload, { target: 'node:beşiktaş-u18' });

    const confidence = createConfidence(1.42, 0.8);
    assert.equal(confidence.value, 1);
    assert.equal(confidence.weight, 0.8);

    const decision = createDecision(action, 'Deterministic path selected', confidence);
    assert.equal(decision.rationale, 'Deterministic path selected');
    assert.equal(decision.confidence.value, 1);
    assert.equal(decision.action.type, 'move');
});
