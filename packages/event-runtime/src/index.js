/**
 * Deterministic priority event runtime primitives.
 */

export function createPriorityEnvelope(id, type, priority = 1, payload = {}) {
    return {
        id,
        type,
        priority,
        payload,
    };
}

export class PriorityQueue {
    constructor() {
        this.items = [];
    }

    enqueue(item) {
        const index = this.items.findIndex((entry) => entry.priority > item.priority);
        if (index === -1) {
            this.items.push(item);
            return;
        }
        this.items.splice(index, 0, item);
    }

    dequeue() {
        return this.items.shift();
    }

    size() {
        return this.items.length;
    }
}
