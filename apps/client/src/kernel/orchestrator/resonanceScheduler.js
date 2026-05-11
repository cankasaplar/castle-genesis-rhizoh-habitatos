import { clamp01 } from "../constitutional/constitutionalState.js";

/**
 * @param {object} o
 * @param {"LOW" | "NORMAL" | "URGENT" | "SOVEREIGN"} [o.basePriority]
 * @param {{ truthResonance: number, contradictionResonance: number, memoryResonance: number, legitimacyResonance: number, noveltyResonance: number }} o.resonanceField
 * @param {number[]} o.pressure
 * @param {number} [o.sovereignTier]
 */
export function scheduleByResonance(o) {
  const basePriority = o.basePriority || "NORMAL";
  const tier = clamp01(o.sovereignTier ?? 0.33);
  const contradictionPressure = o.pressure[1] ?? 0;
  const legitimacyPressure = o.pressure[2] ?? 0;
  const contradictionUrgency = clamp01(
    o.resonanceField.contradictionResonance * 0.55 + contradictionPressure * 0.35 + tier * 0.1
  );
  const legitimacyCalm = clamp01(
    o.resonanceField.legitimacyResonance * 0.55 + legitimacyPressure * 0.35 + o.resonanceField.memoryResonance * 0.1
  );
  const dominance = contradictionUrgency - legitimacyCalm;

  let priorityShift = 0;
  if (dominance >= 0.08) priorityShift += 1;
  if (dominance >= 0.28) priorityShift += 1;
  if (dominance <= -0.08) priorityShift -= 1;
  if (dominance <= -0.28) priorityShift -= 1;
  if (o.resonanceField.contradictionResonance >= 0.72 || contradictionPressure >= 0.74) priorityShift += 1;
  if (o.resonanceField.legitimacyResonance >= 0.8 && legitimacyPressure >= 0.72) priorityShift -= 1;
  if (tier >= 0.84) priorityShift = 2;

  const priorityOrder = ["LOW", "NORMAL", "URGENT", "SOVEREIGN"];
  const baseIdx = Math.max(0, priorityOrder.indexOf(basePriority));
  const nextIdx = Math.max(0, Math.min(3, baseIdx + priorityShift));
  const nextPriority = priorityOrder[nextIdx];

  const wakeMultiplier =
    nextPriority === "LOW"
      ? 1.25
      : nextPriority === "NORMAL"
        ? 1
        : nextPriority === "URGENT"
          ? 0.72
          : 0.5;

  return Object.freeze({
    contradictionUrgency,
    legitimacyCalm,
    priorityShift,
    nextPriority,
    wakeMultiplier
  });
}
