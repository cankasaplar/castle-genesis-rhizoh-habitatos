import { apiFetch } from "./client.js";

export const labApi = {
  /** Research Experiments */
  getExperiments: () =>
    apiFetch("/api/chess/research/experiments"),

  getExperimentsManifest: () =>
    apiFetch("/api/chess/research/experiments/manifest"),

  /** Time Control Calibration Matrix */
  getTcMatrixSummary: () =>
    apiFetch("/api/chess/research/tc-matrix/summary"),

  /** Search Forensics & Autopsy */
  getForensicsList: () =>
    apiFetch("/api/chess/research/forensics/list"),

  getHistoricalAutopsy: () =>
    apiFetch("/api/chess/research/forensics/historical-autopsy"),

  /** Candidates & Council */
  getCandidates: () =>
    apiFetch("/api/chess/puzzle/candidates"),

  getCouncil: () =>
    apiFetch("/api/chess/research/council")
};
