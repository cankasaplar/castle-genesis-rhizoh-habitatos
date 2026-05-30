/**
 * Voice v3 — client-side gateway call spacing (ingress + transcribe).
 */

export const VOICE_THROTTLE_V3 = Object.freeze({
  ingressMs: 1200,
  transcribeMs: 1500
});

let lastIngressAtMs = 0;
let lastTranscribeAtMs = 0;

/**
 * @param {number} minGapMs
 * @param {number} lastAtMsRef — read/write via closure slot
 */
async function waitForThrottleSlotV3(minGapMs, getLast, setLast) {
  const now = Date.now();
  const waitMs = Math.max(0, minGapMs - (now - getLast()));
  if (waitMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }
  setLast(Date.now());
}

export async function throttleVoiceIngressPostV3() {
  await waitForThrottleSlotV3(
    VOICE_THROTTLE_V3.ingressMs,
    () => lastIngressAtMs,
    (t) => {
      lastIngressAtMs = t;
    }
  );
}

export async function throttleVoiceTranscribePostV3() {
  await waitForThrottleSlotV3(
    VOICE_THROTTLE_V3.transcribeMs,
    () => lastTranscribeAtMs,
    (t) => {
      lastTranscribeAtMs = t;
    }
  );
}

export function resetVoiceThrottleForTestV3() {
  lastIngressAtMs = 0;
  lastTranscribeAtMs = 0;
}
