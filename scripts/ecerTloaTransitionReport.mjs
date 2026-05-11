/**
 * TLOA → TTA giriş noktası (ETK-1).
 * "Report" adı tarihsel; işlev: transition verify + classify + ledger append — `ecerEpistemicTransitionKernel.mjs`.
 * @see docs/ECER_ADV_TLOA_TRANSITION_ALGEBRA_TTA_1.md
 */

import { pathToFileURL } from "node:url";
import { runEtKCli } from "./ecerEpistemicTransitionKernel.mjs";

export * from "./ecerEpistemicTransitionKernel.mjs";

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  runEtKCli();
}
