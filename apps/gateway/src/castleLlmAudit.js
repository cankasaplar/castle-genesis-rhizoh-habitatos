/**
 * LLM erişim satırı — istek gövdesi / tam prompt loglanmaz.
 * CASTLE_LLM_ACCESS_LOG=0 ile kapatılabilir.
 */

function maskUid(uid) {
  const u = String(uid || "");
  if (u.length <= 6) return u ? "[uid]" : "anon";
  return `${u.slice(0, 4)}…${u.slice(-3)}`;
}

/**
 * @param {object} o
 * @param {string} o.route
 * @param {string} [o.uid]
 * @param {string} o.llmKeyBillingOwner server | user | external_test | connection_test
 * @param {string} o.llmKeyOrigin
 * @param {string} o.provider
 * @param {string} o.model
 * @param {string} [o.connectionId]
 */
export function logLlmAccess(o) {
  if (process.env.CASTLE_LLM_ACCESS_LOG === "0") return;
  const line = {
    ts: new Date().toISOString(),
    route: o.route,
    uid: maskUid(o.uid),
    billingOwner: o.llmKeyBillingOwner,
    keyOrigin: o.llmKeyOrigin,
    provider: o.provider,
    model: o.model,
    connectionId: o.connectionId ? `${String(o.connectionId).slice(0, 4)}…` : null
  };
  console.info("[castle.llm.access]", JSON.stringify(line));
}
