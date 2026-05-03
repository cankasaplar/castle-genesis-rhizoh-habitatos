/**
 * Gateway çevrimdışıyken Rhizoh mesajlarını sıraya alır; bağlantı dönünce boşaltılır.
 */

const QKEY = "castle.rhizohMessageIntentQueue.v1";
const MAX = 24;

/**
 * @param {Record<string, unknown>} record
 */
export function enqueueRhizohMessageIntent(record) {
  try {
    const raw = window.sessionStorage.getItem(QKEY);
    const arr = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(arr)) return false;
    arr.push({ ...record, enqueuedAt: Date.now() });
    while (arr.length > MAX) arr.shift();
    window.sessionStorage.setItem(QKEY, JSON.stringify(arr));
    return true;
  } catch {
    return false;
  }
}

/**
 * @returns {Record<string, unknown>[]}
 */
export function drainRhizohMessageIntentQueue() {
  try {
    const raw = window.sessionStorage.getItem(QKEY);
    window.sessionStorage.removeItem(QKEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

/**
 * @returns {number}
 */
export function peekRhizohMessageIntentQueueLength() {
  try {
    const raw = window.sessionStorage.getItem(QKEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.length : 0;
  } catch {
    return 0;
  }
}
