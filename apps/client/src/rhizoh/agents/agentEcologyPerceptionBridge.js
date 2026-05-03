/**
 * Agent ↔ Ghost Ecology perception bridge — READ ONLY.
 * Projects thread-local ecology slices for a user-agent subject without feedback into kernels.
 */

/**
 * @param {Record<string, unknown> | null | undefined} ghostEcology
 * @param {string | null | undefined} subjectThreadId — cognitive thread id (or future stable agent binding)
 */
export function buildUserAgentEcologyPerception(ghostEcology, subjectThreadId) {
  const id = String(subjectThreadId || "").trim();
  if (!id) return null;

  const ge = ghostEcology && typeof ghostEcology === "object" ? ghostEcology : {};
  const threadEcology = ge.threadEcology && typeof ge.threadEcology === "object" ? ge.threadEcology : {};
  const te = threadEcology[id];

  const empty = {
    subjectThreadId: id,
    readOnly: true,
    ecologyWriteBack: false,
    present: false,
    localAffinityMap: {},
    localRivalryMap: {},
    pollenExposure: {},
    coalitionId: null,
    dormancyClusterId: null,
    mimicryEcho: { weight: 0, towardTheme: "" },
    rivalryPressure: 0,
    affinityPulse: 0,
    pollenLoad: 0,
    edgesLocal: { affinity: [], rivalry: [] }
  };

  if (!te || typeof te !== "object") {
    return empty;
  }

  const aff = te.affinity && typeof te.affinity === "object" ? { ...te.affinity } : {};
  const riv = te.rivalry && typeof te.rivalry === "object" ? { ...te.rivalry } : {};
  const pollen = te.pollenSignature && typeof te.pollenSignature === "object" ? { ...te.pollenSignature } : {};
  const mimic = te.mimicry && typeof te.mimicry === "object" ? te.mimicry : {};

  const rivVals = Object.values(riv).map((x) => Number(x) || 0);
  const affVals = Object.values(aff).map((x) => Number(x) || 0);
  const pollenVals = Object.values(pollen).map((x) => Number(x) || 0);

  const rivalryPressure = rivVals.length ? Math.max(...rivVals) : 0;
  const affinityPulse = affVals.length ? Math.max(...affVals) : 0;
  const pollenLoad = pollenVals.length ? pollenVals.reduce((a, b) => a + b, 0) / pollenVals.length : 0;

  const affEdges = Array.isArray(ge.affinityEdges)
    ? ge.affinityEdges.filter((e) => e && (e.from === id || e.to === id))
    : [];
  const rivEdges = Array.isArray(ge.rivalryEdges)
    ? ge.rivalryEdges.filter((e) => e && (e.from === id || e.to === id))
    : [];

  return {
    subjectThreadId: id,
    readOnly: true,
    ecologyWriteBack: false,
    present: true,
    localAffinityMap: aff,
    localRivalryMap: riv,
    pollenExposure: pollen,
    coalitionId: te.coalition != null ? String(te.coalition) : null,
    dormancyClusterId: te.dormancyCluster != null ? String(te.dormancyCluster) : null,
    mimicryEcho: {
      weight: Math.round((Number(mimic.weight) || 0) * 1000) / 1000,
      towardTheme: String(mimic.towardTheme || "")
    },
    rivalryPressure: Math.round(rivalryPressure * 1000) / 1000,
    affinityPulse: Math.round(affinityPulse * 1000) / 1000,
    pollenLoad: Math.round(pollenLoad * 1000) / 1000,
    edgesLocal: {
      affinity: affEdges.slice(0, 12),
      rivalry: rivEdges.slice(0, 6)
    },
    source: "ghost_ecology_v1_1_read_only_bridge"
  };
}
