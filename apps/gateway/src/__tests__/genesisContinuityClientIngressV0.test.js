import test from "node:test";
import assert from "node:assert/strict";
import {
  ingestGenesisWorldObservationV0,
  resetGenesisWorldObservationIngressForTestsV0
} from "../genesisContinuityClientIngressV0.js";
import {
  publishGenesisContinuityEvent,
  resetGenesisContinuityStreamHubForTests
} from "../genesisContinuityStreamHubV0.js";
import { resetGenesisContinuitySeqGapForTestsV0 } from "../genesisContinuitySeqGapV0.js";

test("duplicate ingressKey returns idempotent same seq", () => {
  resetGenesisContinuityStreamHubForTests();
  resetGenesisWorldObservationIngressForTestsV0();
  resetGenesisContinuitySeqGapForTestsV0();
  publishGenesisContinuityEvent({ type: "TickAdvanced", id: "tick:0", payload: { value: 0 } });

  const body = {
    schema: "castle.world_observation.ingress_envelope.v1",
    type: "world.tick",
    atMs: 1_700_000_000_000,
    ingressKey: "wt:1:1.0:1700000000000",
    payload: { simTime: 1, clientTickCount: 1 }
  };

  const a = ingestGenesisWorldObservationV0(body, { clientId: "guest:test" });
  const b = ingestGenesisWorldObservationV0(body, { clientId: "guest:test" });
  assert.equal(a.ok, true);
  assert.equal(b.ok, true);
  assert.equal(b.idempotent, true);
  assert.equal(b.seq, a.seq);
});
