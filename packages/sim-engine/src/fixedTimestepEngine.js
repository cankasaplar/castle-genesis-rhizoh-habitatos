/**
 * Fixed Timestep Simulation Loop Engine
 * Garanti edilen deterministik zaman adımı işletimi (L10)
 */
export class FixedTimestepEngine {
    constructor(updateCallback, hz = 60) {
        this.update = updateCallback;
        this.fixedDeltaTime = 1000 / hz;
        this.accumulatedTime = 0;
        this.lastTimestamp = 0;
        this.isRunning = false;
        this.animationFrameId = null;
    }

    get requestFrame() {
        if (typeof requestAnimationFrame !== "undefined") {
            return requestAnimationFrame.bind(globalThis);
        }
        return (cb) => setTimeout(cb, this.fixedDeltaTime);
    }

    get cancelFrame() {
        if (typeof cancelAnimationFrame !== "undefined") {
            return cancelAnimationFrame.bind(globalThis);
        }
        return clearTimeout.bind(globalThis);
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.lastTimestamp = typeof performance !== "undefined" ? performance.now() : Date.now();
        this.loop();
    }

    stop() {
        this.isRunning = false;
        if (this.animationFrameId !== null) {
            this.cancelFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    loop = () => {
        if (!this.isRunning) return;

        const now = typeof performance !== "undefined" ? performance.now() : Date.now();
        let frameTime = now - this.lastTimestamp;

        if (frameTime > 250) {
            frameTime = 250;
        }

        this.lastTimestamp = now;
        this.accumulatedTime += frameTime;

        while (this.accumulatedTime >= this.fixedDeltaTime) {
            this.update(this.fixedDeltaTime / 1000);
            this.accumulatedTime -= this.fixedDeltaTime;
        }

        this.animationFrameId = this.requestFrame(this.loop);
    };
}
