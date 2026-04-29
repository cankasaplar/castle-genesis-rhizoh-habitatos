/**
 * Sovereign: öncelikli zaman çizelgesi (Chronos) + yetenek jetonu (capability) iskelesi.
 * LLM ve asenkron eylemler tek deterministik kuyruğa bağlanabilir.
 */

export class CapabilityToken {
  /**
   * @param {object} o
   * @param {string} o.scope
   * @param {number} o.expiresAtSim - coreWorld.simTime üst sınırı
   * @param {string[]} o.actions İzinli eylem adları
   */
  constructor(o) {
    this.scope = o.scope || "default";
    this.expiresAtSim = o.expiresAtSim ?? Infinity;
    this.actions = new Set(o.actions || []);
  }

  allows(action, simTime) {
    if (simTime > this.expiresAtSim) return false;
    return this.actions.has("*") || this.actions.has(action);
  }
}

export class ChronosScheduler {
  constructor() {
    /** @type {Array<{ t: number, seq: number, id: string, run: () => void }>} */
    this._heap = [];
    this._seq = 0;
  }

  _swap(i, j) {
    const t = this._heap[i];
    this._heap[i] = this._heap[j];
    this._heap[j] = t;
  }

  _up(i) {
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this._heap[p].t > this._heap[i].t || (this._heap[p].t === this._heap[i].t && this._heap[p].seq > this._heap[i].seq)) {
        this._swap(p, i);
        i = p;
      } else break;
    }
  }

  _down(i) {
    const n = this._heap.length;
    while (true) {
      let m = i;
      const l = i * 2 + 1;
      const r = l + 1;
      if (l < n && (this._heap[l].t < this._heap[m].t || (this._heap[l].t === this._heap[m].t && this._heap[l].seq < this._heap[m].seq)))
        m = l;
      if (r < n && (this._heap[r].t < this._heap[m].t || (this._heap[r].t === this._heap[m].t && this._heap[r].seq < this._heap[m].seq)))
        m = r;
      if (m !== i) {
        this._swap(m, i);
        i = m;
      } else break;
    }
  }

  scheduleAt(simTime, id, run) {
    const seq = this._seq++;
    this._heap.push({ t: simTime, seq, id, run });
    this._up(this._heap.length - 1);
  }

  /** simTime’a kadar olan tüm görevleri çalıştır */
  flushDue(simTime) {
    while (this._heap.length && this._heap[0].t <= simTime) {
      const x = this._heap[0];
      const last = this._heap.pop();
      if (this._heap.length) {
        this._heap[0] = last;
        this._down(0);
      }
      try {
        x.run();
      } catch {
        /* sovereign: yutulan hata — üst katman loglayabilir */
      }
    }
  }
}
