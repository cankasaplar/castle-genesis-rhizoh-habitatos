import test from 'node:test';
import assert from 'node:assert/strict';
import { DoubleBufferedMatrix } from '../src/index.js';

test('double buffered matrix swaps state safely', () => {
    const matrix = new DoubleBufferedMatrix(2, 2, 0);
    matrix.set(0, 7);
    matrix.swap();
    assert.equal(matrix.get(0), 0);
    assert.equal(matrix.back[0], 7);
});
