import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildProposalQueueV0,
  createThresholdProposalV0,
  transitionProposalGovernanceV0,
  validateProposalQueueV0,
  resolveGovernanceTransitionV0,
  GOVERNANCE_STATE_V0,
  GOVERNANCE_EVENT_V0,
  GOVERNANCE_ACTOR_ROLE_V0,
  PROPOSAL_KIND_V0,
  HUMAN_APPROVAL_GOVERNANCE_MACHINE_V0
} from "../ops/phase3DProposalQueueV0.js";
import { runPhase3ExecutionSpecHarnessV0 } from "../ops/phase3HarnessExportV0.js";

describe("phase3DProposalQueueV0", () => {
  it("governance machine is frozen and feedsExecution false", () => {
    assert.equal(HUMAN_APPROVAL_GOVERNANCE_MACHINE_V0.feedsExecution, false);
    assert.ok(HUMAN_APPROVAL_GOVERNANCE_MACHINE_V0.transitions.length >= 10);
  });

  it("happy path draft → pending → review → approved → applied_config", () => {
    let p = createThresholdProposalV0({
      kind: PROPOSAL_KIND_V0.ENTROPY_LIMIT_DELTA,
      delta: { key: "entropyLimit", step: -0.05 },
      evidence: { exportRef: "test" },
      rationale: "test"
    });
    assert.equal(p.feedsExecution, false);

    let r = transitionProposalGovernanceV0(p, GOVERNANCE_EVENT_V0.SUBMIT, {
      actorRole: GOVERNANCE_ACTOR_ROLE_V0.SYSTEM_SHADOW
    });
    assert.equal(r.ok, true);
    p = r.proposal;
    assert.equal(p.state, GOVERNANCE_STATE_V0.PENDING_HUMAN);

    r = transitionProposalGovernanceV0(p, GOVERNANCE_EVENT_V0.CLAIM_REVIEW, {
      actorRole: GOVERNANCE_ACTOR_ROLE_V0.OPS_REVIEWER
    });
    p = r.proposal;
    assert.equal(p.state, GOVERNANCE_STATE_V0.UNDER_REVIEW);

    r = transitionProposalGovernanceV0(p, GOVERNANCE_EVENT_V0.APPROVE, {
      actorRole: GOVERNANCE_ACTOR_ROLE_V0.OPS_APPROVER
    });
    p = r.proposal;
    assert.equal(p.state, GOVERNANCE_STATE_V0.APPROVED);

    r = transitionProposalGovernanceV0(p, GOVERNANCE_EVENT_V0.APPLY_CONFIG, {
      actorRole: GOVERNANCE_ACTOR_ROLE_V0.DEPLOY_OPERATOR,
      harnessPass: true
    });
    assert.equal(r.proposal.state, GOVERNANCE_STATE_V0.APPLIED_CONFIG);
    assert.equal(r.proposal.auditTrail.length, 4);
  });

  it("blocks apply_config without harness pass and monitoring_hold approve", () => {
    let p = createThresholdProposalV0({
      kind: PROPOSAL_KIND_V0.ENTROPY_LIMIT_DELTA,
      delta: {},
      evidence: {},
      rationale: "x"
    });
    let r = transitionProposalGovernanceV0(p, GOVERNANCE_EVENT_V0.SUBMIT, {
      actorRole: GOVERNANCE_ACTOR_ROLE_V0.SYSTEM_SHADOW
    });
    p = r.proposal;
    r = transitionProposalGovernanceV0(p, GOVERNANCE_EVENT_V0.CLAIM_REVIEW, {
      actorRole: GOVERNANCE_ACTOR_ROLE_V0.OPS_REVIEWER
    });
    p = r.proposal;
    r = transitionProposalGovernanceV0(p, GOVERNANCE_EVENT_V0.APPROVE, {
      actorRole: GOVERNANCE_ACTOR_ROLE_V0.OPS_APPROVER
    });
    p = r.proposal;
    r = transitionProposalGovernanceV0(p, GOVERNANCE_EVENT_V0.APPLY_CONFIG, {
      actorRole: GOVERNANCE_ACTOR_ROLE_V0.DEPLOY_OPERATOR,
      harnessPass: false
    });
    assert.equal(r.ok, false);

    const hold = createThresholdProposalV0({
      kind: PROPOSAL_KIND_V0.MONITORING_HOLD,
      delta: { action: "hold" },
      evidence: {},
      rationale: "hold"
    });
    r = transitionProposalGovernanceV0(hold, GOVERNANCE_EVENT_V0.SUBMIT, {
      actorRole: GOVERNANCE_ACTOR_ROLE_V0.SYSTEM_SHADOW
    });
    p = r.ok ? r.proposal : hold;
    r = transitionProposalGovernanceV0(p, GOVERNANCE_EVENT_V0.CLAIM_REVIEW, {
      actorRole: GOVERNANCE_ACTOR_ROLE_V0.OPS_REVIEWER
    });
    if (r.ok) {
      p = r.proposal;
      r = transitionProposalGovernanceV0(p, GOVERNANCE_EVENT_V0.APPROVE, {
        actorRole: GOVERNANCE_ACTOR_ROLE_V0.OPS_APPROVER
      });
      assert.equal(r.ok, false);
    }
  });

  it("harness observation export includes valid proposal queue", () => {
    const h = runPhase3ExecutionSpecHarnessV0();
    const q = h.phase3Observation.proposalQueue;
    assert.equal(q.feedsExecution, false);
    assert.equal(q.cannotBeInterpretedAsGuidance, true);
    assert.equal(validateProposalQueueV0(q).ok, true);
    assert.ok(resolveGovernanceTransitionV0(GOVERNANCE_STATE_V0.APPROVED, GOVERNANCE_EVENT_V0.APPLY_CONFIG));
  });
});
