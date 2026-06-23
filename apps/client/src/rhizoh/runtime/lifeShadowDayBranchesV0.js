/**
 * Life Shadow Day A/B comparison v0 — counterfactual branch synthesis.
 * Combines calendar shadow (Day A/B) + media shadow (immersive/scattered).
 * RESEARCH-ONLY — observation-only; no execution authority.
 */

import {
  buildCalendarShadowTimelineViewV0,
  CALENDAR_SHADOW_BRANCH_ID_V0
} from "./calendarShadowTimelineV0.js";
import {
  buildMediaShadowTimelineViewV0,
  MEDIA_SHADOW_BRANCH_ID_V0
} from "./mediaShadowTimelineV0.js";

export const LIFE_SHADOW_DAY_BRANCH_SCHEMA_V0 = "castle.rhizoh.life_shadow_day_branches.v0";

/**
 * Synthesize Day A (continuity / immersive) vs Day B (void / scattered) counterfactual view.
 */
export function buildLifeShadowDayBranchComparisonV0() {
  const calendar = buildCalendarShadowTimelineViewV0();
  const media = buildMediaShadowTimelineViewV0();

  const dayACount =
    (calendar.branches?.[CALENDAR_SHADOW_BRANCH_ID_V0.DAY_A] ?? 0) +
    (media.branches?.[MEDIA_SHADOW_BRANCH_ID_V0.IMMERSIVE] ?? 0);
  const dayBCount =
    (calendar.branches?.[CALENDAR_SHADOW_BRANCH_ID_V0.DAY_B] ?? 0) +
    (media.branches?.[MEDIA_SHADOW_BRANCH_ID_V0.SCATTERED] ?? 0);

  const total = dayACount + dayBCount;
  const dayAShare01 = total > 0 ? Number((dayACount / total).toFixed(3)) : null;

  return Object.freeze({
    schema: LIFE_SHADOW_DAY_BRANCH_SCHEMA_V0,
    view: "life_shadow_day_ab",
    policyAuthority: "observation_only",
    dayA: Object.freeze({
      branchId: "day_a_continuity",
      label: "Day A — scheduled continuity + immersive attention",
      eventCount: dayACount,
      calendarBranchCount: calendar.branches?.[CALENDAR_SHADOW_BRANCH_ID_V0.DAY_A] ?? 0,
      mediaBranchCount: media.branches?.[MEDIA_SHADOW_BRANCH_ID_V0.IMMERSIVE] ?? 0,
      avgOutcomeScore01: calendar.avgOutcomeScore01,
      avgAttentionScore01: media.avgAttentionScore01
    }),
    dayB: Object.freeze({
      branchId: "day_b_void",
      label: "Day B — cancelled void + scattered attention",
      eventCount: dayBCount,
      calendarBranchCount: calendar.branches?.[CALENDAR_SHADOW_BRANCH_ID_V0.DAY_B] ?? 0,
      mediaBranchCount: media.branches?.[MEDIA_SHADOW_BRANCH_ID_V0.SCATTERED] ?? 0,
      narrative: "Counterfactual branch — what if continuity broke?"
    }),
    comparison: Object.freeze({
      totalEvents: total,
      dayAShare01,
      dominantBranch:
        dayAShare01 == null ? null : dayAShare01 > 0.5 ? "day_a" : dayAShare01 < 0.5 ? "day_b" : "tie"
    }),
    sources: Object.freeze({
      calendarShadow: calendar.schema,
      mediaShadow: media.schema
    }),
    atMs: Date.now(),
    interpretationOnly: true,
    nonExecutive: true
  });
}

export function ensureLifeShadowDayBranchDevToolsV0() {
  if (typeof window === "undefined") return null;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.lifeShadowDayBranches = () => buildLifeShadowDayBranchComparisonV0();
  return window.__rhizoh.lifeShadowDayBranches;
}
