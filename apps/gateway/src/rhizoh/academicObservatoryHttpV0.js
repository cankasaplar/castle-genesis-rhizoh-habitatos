/**
 * HTTP surface for AOL export — ops / authenticated researcher only.
 * @see docs/RHIZOH_ACADEMIC_OBSERVATORY_LAYER_V0.md
 */

import {
  ACADEMIC_OBSERVATION_CONTRACT_V0,
  buildAcademicObservationExportV0,
  buildPaperBlocksFromExportV0,
  formatAcademicPaperMarkdownV0,
  isAcademicObservatoryEnabledV0
} from "./academicObservationExportV0.js";
import { buildAcademicPaperDocumentV0 } from "./academicPaperBuilderV0.js";

export function academicObservatoryAdminOk(req) {
  const expected = String(
    process.env.CASTLE_ACADEMIC_OBSERVATORY_KEY ||
      process.env.CASTLE_MODERATION_ADMIN_KEY ||
      ""
  ).trim();
  if (!expected) return false;
  const got = String(
    req.headers["x-castle-academic-observatory-key"] ||
      req.headers["x-castle-moderation-key"] ||
      ""
  ).trim();
  return got.length > 0 && got === expected;
}

/**
 * GET /rhizoh/academic/observatory/export?thread_id=&user_id=&trace_id=
 * @param {import('http').IncomingMessage} req
 * @param {{ ok: boolean, uid?: string }} auth
 */
export function handleAcademicObservatoryExportGetV0(req, auth) {
  if (!isAcademicObservatoryEnabledV0()) {
    return { status: 404, body: { ok: false, error: "observatory_disabled" } };
  }

  const url = new URL(req.url || "", "http://local");
  const thread_id = String(url.searchParams.get("thread_id") || "").trim();
  const trace_id = String(url.searchParams.get("trace_id") || "").trim();
  const requestedUid = String(url.searchParams.get("user_id") || "").trim();
  const paper = url.searchParams.get("paper") === "1";
  const mode = String(url.searchParams.get("mode") || "live").trim().toLowerCase();

  const admin = academicObservatoryAdminOk(req);
  let user_id = "";
  if (admin && requestedUid.length >= 8) {
    user_id = requestedUid;
  } else if (auth.ok && auth.uid) {
    user_id = auth.uid;
    if (requestedUid && requestedUid !== user_id && !admin) {
      return { status: 403, body: { ok: false, error: "observatory_user_scope" } };
    }
  } else if (admin && !requestedUid) {
    return {
      status: 400,
      body: { ok: false, error: "user_id_required_for_admin_export" }
    };
  } else {
    return {
      status: 403,
      body: {
        ok: false,
        error: "observatory_auth_required",
        hint: "Firebase auth for own export, or X-Castle-Academic-Observatory-Key + user_id"
      }
    };
  }

  const built = buildAcademicObservationExportV0({
    user_id,
    thread_id: thread_id || undefined,
    trace_id: trace_id || undefined,
    cohort_mode: String(url.searchParams.get("cohort_mode") || "").trim() || undefined
  });

  if (!built.ok) {
    return { status: 400, body: { ok: false, error: built.code } };
  }

  const paper_document = buildAcademicPaperDocumentV0(built.export);
  const paper_blocks = built.paper_blocks || buildPaperBlocksFromExportV0(built.export);
  const paper_markdown = formatAcademicPaperMarkdownV0(built.export, paper_blocks);

  /** @type {Record<string, unknown>} */
  const body = {
    ok: true,
    schema: ACADEMIC_OBSERVATION_CONTRACT_V0,
    mode,
    access: admin ? "admin" : "own_threads_only",
    export: built.export
  };

  if (mode === "export") {
    return { status: 200, body };
  }

  body.paper_document = paper_document;
  if (mode === "paper" || paper) {
    body.paper_blocks = paper_blocks;
    body.paper_markdown = paper_markdown;
  }

  return { status: 200, body };
}
