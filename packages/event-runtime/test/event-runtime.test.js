import test from 'node:test';
import assert from 'node:assert/strict';
import { PriorityQueue, createPriorityEnvelope } from '../src/index.js';

test('priority queue orders deterministic high-priority events first', () => {
    const queue = new PriorityQueue();
    queue.enqueue(createPriorityEnvelope('obs:1', 'sensor', 3, { value: 0.2 }));
    queue.enqueue(createPriorityEnvelope('obs:2', 'constitution', 0, { reason: 'crisis' }));
    queue.enqueue(createPriorityEnvelope('obs:3', 'llm', 6, { suggestion: true }));

    const first = queue.dequeue();
    assert.equal(first.id, 'obs:2');
    const second = queue.dequeue();
    assert.equal(second.id, 'obs:1');
    const third = queue.dequeue();
    assert.equal(third.id, 'obs:3');
    assert.equal(queue.dequeue(), undefined);
});
