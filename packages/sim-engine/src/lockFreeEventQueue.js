/**
 * Lock-Free Single-Writer Event Queue
 * State mutasyonlarını sıralı ve deterministik olarak işlemek için append-only kuyruk
 */
export class LockFreeEventQueue {
    constructor(maxSize = 1024) {
        this.buffer = new Array(maxSize);
        this.maxSize = maxSize;
        this.writePointer = 0;
        this.readPointer = 0;
    }

    /**
     * Kuyruğa yeni bir simülasyon olayı ekler
     */
    enqueue(event) {
        const nextWrite = (this.writePointer + 1) % this.maxSize;
        if (nextWrite === this.readPointer) {
            console.warn("[SimEngine] Event Queue doldu, veri kaybını önlemek için boyut artırılmalı.");
            return false;
        }
        this.buffer[this.writePointer] = event;
        this.writePointer = nextWrite;
        return true;
    }

    /**
     * Kuyrukta bekleyen tüm olayları sıralı olarak boşaltıp işleme sokar
     */
    flush(handler) {
        while (this.readPointer !== this.writePointer) {
            const event = this.buffer[this.readPointer];
            if (event) {
                handler(event);
            }
            this.buffer[this.readPointer] = null;
            this.readPointer = (this.readPointer + 1) % this.maxSize;
        }
    }
}
