/**
 * Latest epistemic compression signature (read-only mirror).
 */

/** @type {import('./epistemicCompressionSignatureV0.js').EpistemicCompressionSignatureReportV0 | null} */
let latestSignatureV0 = null;

/**
 * @param {import('./epistemicCompressionSignatureV0.js').EpistemicCompressionSignatureReportV0} report
 */
export function setEpistemicCompressionSignatureV0(report) {
  latestSignatureV0 = report;
  if (typeof window !== "undefined") {
    window.__rhizoh_epistemic_compression_signature = report;
  }
}

export function getEpistemicCompressionSignatureV0() {
  return latestSignatureV0;
}

export function clearEpistemicCompressionSignatureV0() {
  latestSignatureV0 = null;
  if (typeof window !== "undefined") {
    try {
      delete window.__rhizoh_epistemic_compression_signature;
    } catch {
      /* noop */
    }
  }
}

export function resetEpistemicCompressionSignatureStoreForTestsV0() {
  clearEpistemicCompressionSignatureV0();
}
