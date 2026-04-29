/**
 * LLM = proposal engine; kernel = execution authority.
 * Akış: Perceive → Recall → Propose → Verify → Compile → Authorize → Execute → Observe → Learn
 */

export const SOVEREIGNTY_FLOW = [
  "perceive",
  "recall",
  "propose",
  "verify",
  "compile",
  "authorize",
  "execute",
  "observe",
  "learn"
];

/**
 * LLM çıktısı — ham JSON değil, yürütülebilir niyet + alt görevler (IR öncülü).
 * Kernel bunu deterministic action graph’e derler.
 */
export function createIntentRecord(intent, subtasks = [], risk = 0) {
  return {
    intent: String(intent),
    subtasks: Array.isArray(subtasks) ? subtasks : [],
    risk: Math.max(0, Math.min(1, Number(risk) || 0)),
    schema: "castle.intent.v1"
  };
}

export function isIntentRecord(x) {
  return x && typeof x === "object" && typeof x.intent === "string" && x.schema === "castle.intent.v1";
}
