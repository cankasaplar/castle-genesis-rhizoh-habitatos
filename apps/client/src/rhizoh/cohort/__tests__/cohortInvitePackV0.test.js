import test from "node:test";
import assert from "node:assert/strict";
import {
  buildCohortInviteUrlV0,
  COHORT_INVITE_PACK_SCHEMA_V0,
  FRIDAY_PROMPT_SCRIPT_V0
} from "../cohortInvitePackV0.js";
import { getFridayPromptRunnerStateV0, resetFridayPromptRunnerV0 } from "../cohortFridayPromptRunnerV0.js";

test("cohort invite URL encodes reviewer slot", () => {
  const url = buildCohortInviteUrlV0({ reviewerId: "metehan", cohort: "review" });
  assert.match(url, /cohort=review/);
  assert.match(url, /reviewer=metehan/);
});

test("Friday script has three ordered steps", () => {
  resetFridayPromptRunnerV0();
  assert.equal(FRIDAY_PROMPT_SCRIPT_V0.length, 3);
  const s = getFridayPromptRunnerStateV0();
  assert.equal(s.stepIndex, 0);
  assert.equal(s.current?.id, "friday_q1");
  assert.equal(COHORT_INVITE_PACK_SCHEMA_V0, "castle.rhizoh.cohort_invite_pack.v0");
});
