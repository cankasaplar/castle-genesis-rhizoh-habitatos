/**
 * Studio observation demo seed v0 — sample ingest for investor / Studio UI.
 * RESEARCH-ONLY — interpretation only; no execution authority.
 */

import {
  ingestCalendarEventV0,
  normalizeCalendarEventV0
} from "./calendarEventAdapterV0.js";
import {
  ingestMediaTimelineEventV0,
  normalizeMediaTimelineEventV0
} from "./mediaEventAdapterV0.js";
import {
  ingestUserActivityEventV0,
  normalizeUserActivityEventV0
} from "./userActivityEventAdapterV0.js";
import { buildRhizohStudioVisibilitySnapshotV0 } from "./rhizohStudioVisibilitySnapshotV0.js";
import { buildLifeOsV01StatusSnapshotV0 } from "./lifeOsV01StatusV0.js";

export const RHIZOH_STUDIO_DEMO_SEED_SCHEMA_V0 = "castle.rhizoh.studio_demo_seed.v0";

/**
 * Run one-shot observation demo seed — calendar + media + activity + fusion.
 * @param {{ locale?: string }} [opts]
 */
export function runStudioObservationDemoSeedV0(opts = {}) {
  const locale = String(opts.locale || "en");

  const calendar = ingestCalendarEventV0(
    normalizeCalendarEventV0({
      title: locale === "tr" ? "Odak bloğu" : "Focus block",
      eventType: "scheduled"
    }),
    { dispatchEvent: true, fuse: true }
  );

  const media = ingestMediaTimelineEventV0(
    normalizeMediaTimelineEventV0({
      title: locale === "tr" ? "Studio demo oynatma" : "Studio demo playback",
      eventType: "playhead",
      positionSec: 42,
      source: "studio_demo_seed"
    }),
    { dispatchEvent: true, fuse: true }
  );

  const activity = ingestUserActivityEventV0(
    normalizeUserActivityEventV0({
      activityType: "focus",
      title: locale === "tr" ? "Gözlem oturumu" : "Observation session",
      source: "studio_demo_seed"
    }),
    { dispatchEvent: true, fuse: true }
  );

  const visibility = buildRhizohStudioVisibilitySnapshotV0();
  const lifeOs = buildLifeOsV01StatusSnapshotV0();

  return Object.freeze({
    schema: RHIZOH_STUDIO_DEMO_SEED_SCHEMA_V0,
    ok: true,
    interpretationOnly: true,
    nonExecutive: true,
    feedbackToExecution: false,
    calendarOk: Boolean(calendar?.normalized?.eventId),
    mediaOk: Boolean(media?.normalized?.mediaId),
    activityOk: Boolean(activity?.normalized?.activityId),
    lifeOsStatus: lifeOs.status,
    visibility,
    atMs: Date.now()
  });
}
