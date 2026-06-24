/**
 * Rhizoh Output Engine v1 — assembly manifest for YouTube upload packaging.
 * Combines director programs into subtitle cues + upload checklist.
 * RESEARCH-ONLY — no video render · no upload API.
 */

import { buildRhizohChessObservationShortCaptureV0 } from "./rhizohChessObservationShortCaptureV0.js";
import { buildRhizohWorldSportsObservationShortCaptureV0 } from "./rhizohWorldSportsObservationShortCaptureV0.js";
import { buildRhizohDirectorTimelineV0 } from "./rhizohDirectorEngineV0.js";
import { buildRhizohStudioVisibilitySnapshotV0 } from "./rhizohStudioVisibilitySnapshotV0.js";

export const RHIZOH_OUTPUT_ENGINE_SCHEMA_V0 = "castle.rhizoh.output_engine.v0";

/**
 * @param {object[]} shotList
 */
export function buildSubtitleCuesFromShotListV0(shotList) {
  let offsetSec = 0;
  return Object.freeze(
    (shotList || []).map((beat) => {
      const startSec = offsetSec;
      const endSec = offsetSec + (beat.durationSec || 0);
      offsetSec = endSec;
      return Object.freeze({
        beat: beat.beat,
        beatId: beat.id,
        startSec,
        endSec,
        durationSec: beat.durationSec,
        text: beat.narratorLine,
        scene: beat.scene,
        captureUrl: beat.captureUrl
      });
    })
  );
}

/**
 * @param {object[]} cues
 */
export function buildVoiceSyncCuesFromSubtitlesV0(cues) {
  return Object.freeze(
    (cues || []).map((cue) =>
      Object.freeze({
        atSec: cue.startSec,
        durationSec: cue.durationSec,
        phrase: cue.text,
        intent: "narration",
        beatId: cue.beatId
      })
    )
  );
}

/**
 * @param {object} capture
 */
function buildProgramPackV0(capture) {
  const subtitles = buildSubtitleCuesFromShotListV0(capture.shotList);
  const voiceCues = buildVoiceSyncCuesFromSubtitlesV0(subtitles);

  return Object.freeze({
    id: capture.title.replace(/\s+/g, "_").toLowerCase(),
    title: capture.title,
    schema: capture.schema,
    readyToRecord: capture.readyToRecord,
    durationSecTarget: capture.durationSecTarget,
    shotCount: capture.shotList.length,
    shotList: capture.shotList,
    subtitles,
    voiceCues,
    suggestions: capture.suggestions || []
  });
}

/**
 * @param {"en"|"tr"} locale
 * @param {object} opts
 */
function buildUploadChecklistV0(locale, opts) {
  const tr = locale === "tr";
  const chessReady = opts.chessReady;
  const sportsReady = opts.sportsReady;

  return Object.freeze([
    Object.freeze({
      id: "format",
      label: tr ? "9:16 dikey · 60s/50s" : "9:16 vertical · 60s/50s",
      done: false
    }),
    Object.freeze({
      id: "chess_record",
      label: tr ? "Chess Short #001 kaydı" : "Record Chess Short #001",
      done: false,
      blocked: !chessReady,
      hint: chessReady
        ? tr
          ? "Studio kayıt rehberi"
          : "Studio record guide"
        : tr
          ? "31+ hamle bekleyin"
          : "Wait for 31+ moves"
    }),
    Object.freeze({
      id: "sports_record",
      label: tr ? "WorldSports Short #001 kaydı" : "Record WorldSports Short #001",
      done: false,
      blocked: !sportsReady,
      hint: sportsReady
        ? tr
          ? "Gateway beslemesi canlı"
          : "Gateway feed live"
        : tr
          ? "wireWorldSportsTube()"
          : "wireWorldSportsTube()"
    }),
    Object.freeze({
      id: "disclaimer",
      label: tr ? "Her karede dürüst disclaimer" : "Honest disclaimer on every frame",
      done: false
    }),
    Object.freeze({
      id: "youtube_meta",
      label: tr ? "Başlık + açıklama + #RhizohObservation" : "Title + description + #RhizohObservation",
      done: false
    }),
    Object.freeze({
      id: "upload",
      label: tr ? "YouTube yükleme (manuel)" : "YouTube upload (manual)",
      done: false
    })
  ]);
}

/**
 * @param {ReturnType<typeof buildRhizohOutputPackV0>} pack
 */
export function formatRhizohOutputPackMarkdownV0(pack) {
  const lines = [
    `# Rhizoh Output Pack v1`,
    `locale: ${pack.locale} · programs: ${pack.programs.length} · total ~${pack.totalDurationSecTarget}s`,
    `lifeOs: ${pack.studio.lifeOsStatus} · director scenes: ${pack.director.sceneCount}`,
    "",
    "## Upload checklist",
    ...pack.uploadChecklist.map(
      (row) =>
        `- [ ] ${row.label}${row.blocked ? " (blocked)" : ""}${row.hint ? ` — ${row.hint}` : ""}`
    ),
    ""
  ];

  for (const program of pack.programs) {
    lines.push(`## ${program.title}`);
    lines.push(`ready: ${program.readyToRecord ? "YES" : "NO"} · ${program.durationSecTarget}s`);
    lines.push("");
    lines.push("### Subtitles / voice cues");
    for (const cue of program.subtitles) {
      lines.push(
        `[${cue.startSec}s–${cue.endSec}s] ${cue.scene}\n> ${cue.text}\n   ${cue.captureUrl}`
      );
    }
    lines.push("");
  }

  lines.push("## YouTube title templates");
  for (const t of pack.youtubeMeta.titleTemplates) {
    lines.push(`- ${t}`);
  }
  lines.push("");
  lines.push("## Disclaimer");
  lines.push(pack.youtubeMeta.disclaimer);
  return lines.join("\n");
}

/**
 * @param {{ locale?: string }} [opts]
 */
export function buildRhizohOutputPackV0(opts = {}) {
  const locale = opts.locale === "tr" ? "tr" : "en";
  const tr = locale === "tr";
  const chess = buildRhizohChessObservationShortCaptureV0({ locale });
  const sports = buildRhizohWorldSportsObservationShortCaptureV0({ locale });
  const director = buildRhizohDirectorTimelineV0({ locale });
  const studio = buildRhizohStudioVisibilitySnapshotV0();

  const programs = Object.freeze([
    buildProgramPackV0(chess),
    buildProgramPackV0(sports)
  ]);

  const uploadChecklist = buildUploadChecklistV0(locale, {
    chessReady: chess.readyToRecord,
    sportsReady: sports.readyToRecord
  });

  const youtubeMeta = Object.freeze({
    disclaimer:
      locale === "tr"
        ? "Yalnızca gözlem. Rhizoh hayatınızı yürütmez. mutationPermitted: false."
        : "Observation only. Rhizoh does not execute your life. mutationPermitted: false.",
    titleTemplates: Object.freeze([
      tr
        ? "Rhizoh Chess Observation #001 — AI gözlemler, yürütmez"
        : "Rhizoh Chess Observation #001 — AI observes, does not execute",
      tr
        ? "Rhizoh WorldSports Observation #001 — canlı maç gözlemi"
        : "Rhizoh WorldSports Observation #001 — live match observation"
    ]),
    hashtags: Object.freeze(["#RhizohObservation", "#WorldBridge", "#ChessAI"])
  });

  const pack = Object.freeze({
    schema: RHIZOH_OUTPUT_ENGINE_SCHEMA_V0,
    interpretationOnly: true,
    nonExecutive: true,
    locale,
    programs,
    director: Object.freeze({
      sceneCount: director.sceneCount,
      liveSceneCount: director.liveSceneCount,
      cutTriggers: director.cutTriggers
    }),
    studio: Object.freeze({
      lifeOsStatus: studio.lifeOsStatus,
      armedLearningCount: studio.armedLearningCount
    }),
    uploadChecklist,
    youtubeMeta,
    totalDurationSecTarget: programs.reduce((sum, p) => sum + p.durationSecTarget, 0),
    readyProgramCount: programs.filter((p) => p.readyToRecord).length,
    renderLayer: Object.freeze({
      videoAssembly: "manual_screen_record",
      soraApi: false,
      youtubeUploadApi: false
    }),
    atMs: Date.now()
  });

  return Object.freeze({
    ...pack,
    markdown: formatRhizohOutputPackMarkdownV0(pack)
  });
}
