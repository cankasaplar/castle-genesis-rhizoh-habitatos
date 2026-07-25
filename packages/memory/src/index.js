/**
 * Lightweight double-buffered memory model for deterministic state handling.
 */

export class DoubleBufferedMatrix {
    constructor(width = 1, height = 1, initialValue = 0) {
        this.width = width;
        this.height = height;
        this.front = Array.from({ length: width * height }, () => initialValue);
        this.back = Array.from({ length: width * height }, () => initialValue);
    }

    get(index) {
        return this.front[index];
    }

    set(index, value) {
        this.front[index] = value;
    }

    swap() {
        [this.front, this.back] = [this.back, this.front];
    }
}
