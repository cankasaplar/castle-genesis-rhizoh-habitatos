/**
 * Adversarial continuity suite — delegates to Hat B controlled chaos + scoreboard.
 */

import { runControlledChaosV0 } from "./chaosHarnessV0.js";

/**
 * @param {(diskKey: string) => import('./__tests__/inMemoryContinuityAdapterV0.js').createInMemoryContinuityAdapterV0} createAdapter
 */
export async function runAdversarialContinuitySuiteV0(createAdapter) {
  const report = await runControlledChaosV0({ createAdapter, print: false });
  const results = report.scoreboard.entries.map((e) => ({
    id: e.anomalyId,
    breach: e.breach,
    pass: e.pass
  }));
  return {
    schema: "castle.rhizoh.adversarial_continuity_suite.v0",
    passCount: report.scoreboard.passed,
    total: report.scoreboard.totalTests,
    allPassed: report.allPassed,
    results,
    scoreboard: report.scoreboard
  };
}
