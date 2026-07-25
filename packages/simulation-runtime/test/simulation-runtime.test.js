import test from 'node:test';
import assert from 'node:assert/strict';
import { FixedTimestepEngine } from '../src/index.js';

test('fixed timestep engine executes deterministic number of steps', () => {
    const engine = new FixedTimestepEngine({ tickMs: 16, maxSteps: 3 });
    let ticks = 0;
    engine.run((tick) => {
        ticks += tick + 1;
    });
    assert.equal(ticks, 6);
});
