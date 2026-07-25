/**
 * Minimal deterministic simulation loop primitives.
 */

export class FixedTimestepEngine {
    constructor({ tickMs = 16, maxSteps = 10 } = {}) {
        this.tickMs = tickMs;
        this.maxSteps = maxSteps;
        this.tick = 0;
    }

    run(step) {
        let steps = 0;
        while (steps < this.maxSteps) {
            step(this.tick, this.tickMs);
            this.tick += 1;
            steps += 1;
        }
    }
}
