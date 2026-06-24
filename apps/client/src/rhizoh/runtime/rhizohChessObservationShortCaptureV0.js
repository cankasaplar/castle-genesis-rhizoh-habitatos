/**
 * Chess Observation Short #001 — capture manifest for 60s YouTube short.
 * Packages live runtime into shot list + narrator brief. RESEARCH-ONLY.
 */

import { buildRhizohChessLearningReportV0 } from "./rhizohChessLearningReportV0.js";
import { getChessLearningMonitorSnapshotV0 } from "./chessLearningMonitorV0.js";
import { isChessGameClusterRunningV0 } from "./chessGameClusterV0.js";
import { buildRhizohAcademyLearningUnionReportV0 } from "./rhizohAcademyLearningUnionReportV0.js";
import { buildRhizohStudioVisibilitySnapshotV0 } from "./rhizohStudioVisibilitySnapshotV0.js";
import { buildLifeOsV01StatusSnapshotV0 } from "./lifeOsV01StatusV0.js";
import { buildStudioObservationAdapterFrameV0 } from "./rhizohStudioObservationAdapterRegistryV0.js";

export const RHIZOH_CHESS_OBSERVATION_SHORT_001_SCHEMA_V0 =
  "castle.rhizoh.chess_observation_short_001.v0";

/** Minimum moves before short is record-ready (prod-verified threshold). */
export const CHESS_OBSERVATION_SHORT_001_MIN_MOVES_V0 = 31;

export const CHESS_OBSERVATION_SHORT_001_DISCLAIMER_EN_V0 =
  "Observation only. Rhizoh does not execute your life. mutationPermitted: false.";

export const CHESS_OBSERVATION_SHORT_001_DISCLAIMER_TR_V0 =
  "Yalnızca gözlem. Rhizoh hayatınızı yürütmez. mutationPermitted: false.";

/**
 * @param {"en"|"tr"} locale
 */
function buildShotListV0(locale, digest) {
  const tr = locale === "tr";
  return Object.freeze([
    Object.freeze({
      id: "opening",
      beat: 1,
      durationSec: 5,
      scene: tr ? "Studio dashboard açılış" : "Studio dashboard opening",
      captureUrl: "/studio",
      consoleHook: "__rhizoh.studioVisibility()",
      narratorLine: tr
        ? "Rhizoh gözlemler — yürütmez."
        : "Rhizoh observes — it does not execute."
    }),
    Object.freeze({
      id: "learning_session",
      beat: 2,
      durationSec: 20,
      scene: tr ? "Chess arena · canlı cluster" : "Chess arena · live cluster",
      captureUrl: "/world/space?channel=chess",
      consoleHook: "__rhizoh.chessLearningCamera()",
      narratorLine: tr
        ? `${digest.movesSeen} hamlelik öğrenme oturumu — Stockfish gölgesi.`
        : `${digest.movesSeen}-move learning session — Stockfish shadow.`
    }),
    Object.freeze({
      id: "drift",
      beat: 3,
      durationSec: 10,
      scene: tr ? "Drift gözlemleri" : "Drift observations",
      captureUrl: "/academy/observe",
      consoleHook: "__rhizoh.learningReport()",
      narratorLine: tr
        ? `Ortalama drift ${digest.avgDrift ?? "—"} · uyum ${digest.alignmentRate ?? "—"}.`
        : `Average drift ${digest.avgDrift ?? "—"} · alignment ${digest.alignmentRate ?? "—"}.`
    }),
    Object.freeze({
      id: "memory",
      beat: 4,
      durationSec: 10,
      scene: tr ? "Hafıza oluşumu" : "Memory formation",
      captureUrl: "/studio",
      consoleHook: digest.lifeOsStatus === "DORMANT" ? "__rhizoh.studioDemoSeed()" : "__rhizoh.worldBridgeMemory()",
      narratorLine: tr
        ? `${digest.memoryNodeCount} hafıza düğümü · World Bridge.`
        : `${digest.memoryNodeCount} memory nodes · World Bridge.`
    }),
    Object.freeze({
      id: "habitat",
      beat: 5,
      durationSec: 10,
      scene: tr ? "Habitat iklimi" : "Habitat climate",
      captureUrl: "/academy/observe",
      consoleHook: "__rhizoh.habitatClimate()",
      narratorLine: tr
        ? `İklim: ${digest.climateLabel || "henüz farklılaşmadı"}.`
        : `Climate: ${digest.climateLabel || "not yet differentiated"}.`
    }),
    Object.freeze({
      id: "close",
      beat: 6,
      durationSec: 5,
      scene: tr ? "Dürüst kapanış" : "Honest close",
      captureUrl: "/academy/observe",
      consoleHook: "__rhizoh.lifeOsStatus()",
      narratorLine: tr
        ? CHESS_OBSERVATION_SHORT_001_DISCLAIMER_TR_V0
        : CHESS_OBSERVATION_SHORT_001_DISCLAIMER_EN_V0
    })
  ]);
}

/**
 * @param {{ locale?: string }} [opts]
 */
export function buildRhizohChessObservationShortCaptureV0(opts = {}) {
  const locale = opts.locale === "tr" ? "tr" : "en";
  const report = buildRhizohChessLearningReportV0();
  const monitor = getChessLearningMonitorSnapshotV0("short_001");
  const academy = buildRhizohAcademyLearningUnionReportV0();
  const studio = buildRhizohStudioVisibilitySnapshotV0();
  const lifeOs = buildLifeOsV01StatusSnapshotV0();
  const chessAdapter = buildStudioObservationAdapterFrameV0("chess_arena");

  const movesSeen = Math.max(
    Number(report.totalMovesSeen) || 0,
    Number(report.clusterMovesSeen) || 0,
    Number(chessAdapter.movesSeen) || 0
  );
  const clusterRunning = isChessGameClusterRunningV0() || Boolean(monitor.clusterRunning);
  const readyToRecord = movesSeen >= CHESS_OBSERVATION_SHORT_001_MIN_MOVES_V0;

  const digest = Object.freeze({
    movesSeen,
    minMovesRequired: CHESS_OBSERVATION_SHORT_001_MIN_MOVES_V0,
    movesDeficit: Math.max(0, CHESS_OBSERVATION_SHORT_001_MIN_MOVES_V0 - movesSeen),
    clusterRunning,
    unionLabel: academy.unionLabel,
    avgDrift: report.avgDrift,
    alignmentRate: monitor.measurement?.alignmentRate ?? report.stockfishAgreement,
    memoryNodeCount: studio.worldBridge?.memoryNodeCount ?? 0,
    climateLabel: studio.habitatClimate?.climateLabel ?? null,
    lifeOsStatus: lifeOs.status,
    recentMoves: Object.freeze(
      (monitor.recentMoves || [])
        .slice(-6)
        .map((m) => m.san)
        .filter(Boolean)
    )
  });

  const shotList = buildShotListV0(locale, digest);

  const suggestions = Object.freeze(
    [
      !readyToRecord
        ? locale === "tr"
          ? `Cluster çalışırken ${digest.movesDeficit} hamle daha bekleyin.`
          : `Wait ${digest.movesDeficit} more moves while cluster runs.`
        : null,
      digest.lifeOsStatus === "DORMANT"
        ? locale === "tr"
          ? "Memory beat için: await __rhizoh.studioDemoSeed()"
          : "For memory beat: await __rhizoh.studioDemoSeed()"
        : null
    ].filter(Boolean)
  );

  return Object.freeze({
    schema: RHIZOH_CHESS_OBSERVATION_SHORT_001_SCHEMA_V0,
    interpretationOnly: true,
    nonExecutive: true,
    title: "Rhizoh Chess Observation #001",
    locale,
    durationSecTarget: 60,
    readyToRecord,
    digest,
    shotList,
    suggestions,
    captureSurfaces: Object.freeze([
      "/studio",
      "/world/space?channel=chess",
      "/academy/observe"
    ]),
    disclaimer:
      locale === "tr"
        ? CHESS_OBSERVATION_SHORT_001_DISCLAIMER_TR_V0
        : CHESS_OBSERVATION_SHORT_001_DISCLAIMER_EN_V0,
    atMs: Date.now()
  });
}

/**
 * @param {ReturnType<typeof buildRhizohChessObservationShortCaptureV0>} capture
 */
export function formatChessObservationShortBriefV0(capture) {
  const lines = [
    `# ${capture.title}`,
    `ready: ${capture.readyToRecord ? "YES" : "NO"} · moves ${capture.digest.movesSeen}/${capture.digest.minMovesRequired}`,
    `union: ${capture.digest.unionLabel} · cluster: ${capture.digest.clusterRunning ? "live" : "idle"}`,
    `lifeOs: ${capture.digest.lifeOsStatus} · memory: ${capture.digest.memoryNodeCount} · climate: ${capture.digest.climateLabel || "—"}`,
    "",
    "## Shot list (60s)",
    ...capture.shotList.map(
      (s) =>
        `${s.beat}. [${s.durationSec}s] ${s.scene}\n   ${s.captureUrl}\n   ${s.consoleHook}\n   > ${s.narratorLine}`
    ),
    "",
    capture.suggestions.length ? `## Suggestions\n${capture.suggestions.map((s) => `- ${s}`).join("\n")}` : "",
    "",
    capture.disclaimer
  ].filter(Boolean);
  return lines.join("\n");
}
