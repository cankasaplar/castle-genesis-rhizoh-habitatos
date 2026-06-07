/**
 * Event axis tuple — shape only (V1.1 contract). No runtime graph or network.
 * @see docs/EVENT_SYSTEM_V1.md · docs/MULTI_CASTLE_SOCIAL_EVENT_ARCHITECTURE_V1.md
 */

export const CASTLE_EVENT_AXIS_SCHEMA_V0 = "castle.event_axis.v0";

export const EVENT_PARTICIPATION_AXIS_V0 = Object.freeze({
  SOLO: "EP_SOLO",
  DUO: "EP_DUO",
  MULTI: "EP_MULTI"
});

export const EVENT_LANGUAGE_AXIS_V0 = Object.freeze({
  MONO: "EL_MONO",
  MULTI: "EL_MULTI"
});

export const EVENT_TEMPORAL_AXIS_V0 = Object.freeze({
  PLANNED: "ET_PLANNED",
  LIVE: "ET_LIVE",
  PAST: "ET_PAST",
  REPLAY: "ET_REPLAY"
});

export const EVENT_MODALITY_AXIS_V0 = Object.freeze({
  TEXT: "EM_TEXT",
  VOICE: "EM_VOICE",
  VIDEO: "EM_VIDEO",
  VISIT: "EM_VISIT",
  CONCERT: "EM_CONCERT",
  WATCH: "EM_WATCH"
});

export const EVENT_SPACE_AXIS_V0 = Object.freeze({
  HOME: "ES_HOME",
  REMOTE: "ES_REMOTE",
  SHARED: "ES_SHARED"
});

/**
 * @param {{
 *   participation?: string,
 *   language?: string,
 *   temporal?: string,
 *   modality?: string,
 *   space?: string
 * }} [input]
 */
export function buildEventAxisV0(input = {}) {
  return Object.freeze({
    schema: CASTLE_EVENT_AXIS_SCHEMA_V0,
    participation: input.participation || EVENT_PARTICIPATION_AXIS_V0.SOLO,
    language: input.language || EVENT_LANGUAGE_AXIS_V0.MONO,
    temporal: input.temporal || EVENT_TEMPORAL_AXIS_V0.PLANNED,
    modality: input.modality || EVENT_MODALITY_AXIS_V0.TEXT,
    space: input.space || EVENT_SPACE_AXIS_V0.HOME,
    readOnly: true
  });
}

/**
 * @param {ReturnType<typeof buildEventAxisV0>} axis
 */
export function digestEventAxisV0(axis) {
  return [
    axis.participation,
    axis.language,
    axis.temporal,
    axis.modality,
    axis.space
  ].join("|");
}
