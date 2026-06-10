/**
 * Voice command smoke harness — staging / DevTools regression for fast precheck + local commands.
 * Usage: await __RHIZOH_VOICE_SMOKE__()  or  __RHIZOH_VOICE_SMOKE_PRINT__()
 */

import { runFastPrecheckFromTextV0 } from "./rhizohFastPrecheckV0.js";
import { routeVoiceInputWithCommandGateV0, isHardSilentCommandRouteV0 } from "./rhizohCommandGateV0.js";
import { probeCanonicalIntentV1 } from "./rhizohCanonicalIntentV1.js";

export const RHIZOH_VOICE_SMOKE_SCHEMA_V0 = "castle.rhizoh.voice_command_smoke.v0";

export const VOICE_SMOKE_SCENARIOS_V0 = Object.freeze([
  Object.freeze({ id: "greeting_wake", utterance: "rhizoh merhaba", expectIntent: "greeting" }),
  Object.freeze({ id: "small_talk", utterance: "nasılsın", expectIntent: "wellbeing" }),
  Object.freeze({ id: "briefing", utterance: "kısa brifing", expectIntent: "briefing_query" }),
  Object.freeze({ id: "traffic", utterance: "trafik nasıl", expectIntent: "traffic_query" }),
  Object.freeze({ id: "weather", utterance: "hava nasıl", expectIntent: "weather_live" }),
  Object.freeze({ id: "thanks", utterance: "teşekkür ederim rhizoh", expectIntent: "thanks" }),
  Object.freeze({ id: "stop_listening_tr", utterance: "dinlemeyi durdur", expectCommand: "stop_listening" }),
  Object.freeze({ id: "stop_listening_en", utterance: "stop listening", expectCommand: "stop_listening" }),
  Object.freeze({ id: "map_open", utterance: "haritayı aç", expectCommand: "map_open" }),
  Object.freeze({ id: "memory_date", utterance: "bugünün tarihi", expectIntent: "date_today" })
]);

/**
 * @param {{ utterance: string, expectIntent?: string, expectCommand?: string }} scenario
 */
export function evaluateVoiceSmokeScenarioV0(scenario) {
  const utterance = String(scenario.utterance || "").trim();
  const precheck = runFastPrecheckFromTextV0(utterance);
  const route = routeVoiceInputWithCommandGateV0(utterance);
  const canonical = probeCanonicalIntentV1(utterance, { locale: "tr" });

  let ok = false;
  let reason = "";
  if (scenario.expectCommand) {
    ok =
      route.canonical === scenario.expectCommand &&
      isHardSilentCommandRouteV0(route);
    reason = ok ? "local_command" : `got=${route.canonical || route.execution}`;
  } else if (scenario.expectIntent) {
    const intent = precheck?.intent || canonical?.canonicalIntent;
    ok = intent === scenario.expectIntent;
    reason = ok ? "fast_precheck_or_canonical" : `got=${intent || "null"}`;
  }

  return Object.freeze({
    id: scenario.id,
    utterance,
    ok,
    reason,
    precheckIntent: precheck?.intent || null,
    canonicalIntent: canonical?.canonicalIntent || null,
    routeCanonical: route.canonical || null,
    routeExecution: route.execution
  });
}

/**
 * @param {typeof VOICE_SMOKE_SCENARIOS_V0} [scenarios]
 */
export function runVoiceCommandSmokeSuiteV0(scenarios = VOICE_SMOKE_SCENARIOS_V0) {
  const rows = scenarios.map((s) => evaluateVoiceSmokeScenarioV0(s));
  const passed = rows.filter((r) => r.ok).length;
  return Object.freeze({
    schema: RHIZOH_VOICE_SMOKE_SCHEMA_V0,
    atMs: Date.now(),
    total: rows.length,
    passed,
    failed: rows.length - passed,
    ok: passed === rows.length,
    rows: Object.freeze(rows)
  });
}

export function installRhizohVoiceSmokeGlobalsV0() {
  if (typeof window === "undefined") return;
  const run = () => runVoiceCommandSmokeSuiteV0();
  window.__RHIZOH_VOICE_SMOKE__ = run;
  window.__RHIZOH_VOICE_SMOKE_PRINT__ = () => {
    const report = run();
    console.table(report.rows);
    console.log(`[RHIZOH_VOICE_SMOKE] ${report.passed}/${report.total} passed`);
    return report;
  };
}
