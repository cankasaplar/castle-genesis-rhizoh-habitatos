/**
 * Tek cognitive focus — birincil konuşmacı, dinleyiciler, mod.
 */

/**
 * @param {{
 *   operatorId: string,
 *   operatorLabel: string,
 *   recentTurns?: unknown[],
 *   roomState: { tension?: number, cohesion?: number, focusTopic?: string },
 *   intent: string,
 *   mentions?: string[]
 * }} input
 */
export function computeAttention(input) {
  const intent = String(input.intent || "CHAT").toUpperCase();
  const label = String(input.operatorLabel || "you").slice(0, 48);
  const id = String(input.operatorId || "local-operator");

  /** @type {string[]} */
  const listeners = [];
  const mentions = Array.isArray(input.mentions) ? input.mentions.map((m) => String(m).slice(0, 32)) : [];

  for (const m of mentions) {
    if (m && !listeners.includes(m) && m.toLowerCase() !== label.toLowerCase()) listeners.push(m);
  }

  let mode = "dialogue";
  if (intent === "REFLECT") mode = "deep_listen";
  else if (intent === "SILENCE") mode = "room_observe";
  else if (intent === "CRISIS") mode = "stabilize";
  else if (Number(input.roomState?.tension) > 0.55) mode = "stabilize";
  else if (Number(input.roomState?.cohesion) > 0.82 && listeners.length > 0) mode = "mediation_ready";

  return {
    primarySpeaker: label,
    primaryId: id,
    listeners: listeners.slice(0, 6),
    interruptedBy: null,
    mode
  };
}

/**
 * Son kullanıcı mesajından @ad yakalar (ASCII isim).
 * @param {string} text
 * @returns {string[]}
 */
export function extractMentions(text) {
  const t = String(text || "");
  const out = [];
  const re = /@([a-zA-ZğüşıöçĞÜŞİÖÇ][a-zA-ZğüşıöçĞÜŞİÖÇ0-9_-]{0,24})/g;
  let m;
  while ((m = re.exec(t)) !== null) {
    if (!out.includes(m[1])) out.push(m[1]);
  }
  return out;
}
