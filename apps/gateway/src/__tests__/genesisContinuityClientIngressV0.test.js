import test from "node:test";
import assert from "node:assert/strict";
import {
  ingestGenesisWorldObservationV0,
  resetGenesisWorldObservationIngressForTestsV0,
  validateGenesisWorldObservationIngressBodyV0
} from "../genesisContinuityClientIngressV0.js";
import {
  getGenesisContinuitySeq,
  publishGenesisContinuityEvent,
  resetGenesisContinuityStreamHubForTests
} from "../genesisContinuityStreamHubV0.js";

test("validate rejects unknown observation types", () => {
  const out = validateGenesisWorldObservationIngressBodyV0({ type: "genesis.wire", payload: {} });
  assert.equal(out.ok, false);
  assert.equal(out.error, "type_not_allowed");
});

test("ingest publishes WorldObservation into continuity seq line", () => {
  resetGenesisContinuityStreamHubForTests();
  resetGenesisWorldObservationIngressForTestsV0();
  publishGenesisContinuityEvent({ type: "TickAdvanced", id: "tick:0", payload: { value: 0 } });
  const before = getGenesisContinuitySeq();

  const out = ingestGenesisWorldObservationV0(
    {
      schema: "castle.world_observation.v0",
      type: "world.tick",
      atMs: 1_700_000_000_000,
      payload: { simTime: 12.3, activeCount: 2 }
    },
    { clientId: "guest:test" }
  );

  assert.equal(out.ok, true);
  assert.equal(out.observationType, "world.tick");
  assert.equal(out.seq, before + 1);
});
