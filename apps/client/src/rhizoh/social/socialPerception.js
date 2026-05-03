/**
 * Shared Field — odanın genel algısı (enerji, gerilim, uyum, gürültü, odak).
 */

/** @param {number} x */
function clamp01(x) {
  return Math.max(0, Math.min(1, Number(x) || 0));
}

/**
 * @param {{
 *   recentTurns?: unknown[],
 *   currentMessage?: string,
 *   intent?: string,
 *   assistantSnippet?: string
 * }} input
 */
export function perceiveSharedRoom(input = {}) {
  const msg = String(input.currentMessage || "");
  const intent = String(input.intent || "CHAT").toUpperCase();
  const turns = Array.isArray(input.recentTurns) ? input.recentTurns : [];
  const n = turns.length;

  let energy = 0.52 + Math.min(0.12, n * 0.015);
  let tension = 0.14;
  let cohesion = 0.72;
  let noise = 0.34 + Math.min(0.14, n * 0.012);

  if (/[!?]{2,}|sinir|öfke|kriz|panik|bozuk|çöktü/i.test(msg)) {
    tension += 0.16;
    energy += 0.06;
    cohesion -= 0.08;
  }
  if (/teşekkür|harika|süper|güzel|❤|👍|sevindim/i.test(msg)) {
    cohesion += 0.1;
    tension -= 0.08;
    energy += 0.03;
  }
  if (intent === "CRISIS") {
    tension += 0.12;
    energy += 0.05;
  }
  if (intent === "REFLECT" || intent === "SILENCE") {
    noise -= 0.06;
    energy -= 0.04;
  }

  let focusTopic = "";
  const topicM = msg.match(/\b(SpiralChip|spiral|chip|Castle|kale|Istanbul|REAL_MAP|Cesium)\b/i);
  if (topicM) focusTopic = topicM[1];
  else if (intent && intent !== "CHAT") focusTopic = intent;

  if (msg.length > 0 && msg.length < 4) noise -= 0.06;

  return {
    energy: clamp01(energy),
    tension: clamp01(tension),
    cohesion: clamp01(cohesion),
    noise: clamp01(noise),
    focusTopic: focusTopic || ""
  };
}
