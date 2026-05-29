import test from "node:test";
import assert from "node:assert/strict";
import { initRhizoh } from "../rhizohProductionBootstrap.js";

test("production bootstrap exposes genesis runtime + SSE paths (mount contract)", () => {
  const r = initRhizoh().routes;
  assert.equal(r.genesisRuntime, "/rhizoh/genesis/runtime");
  assert.equal(r.genesisStream, "/rhizoh/genesis/stream");
  assert.equal(r.genesisIngress, "/rhizoh/genesis/ingress");
  assert.equal(r.genesisContinuityEvents, "/rhizoh/genesis/continuity/events");
  assert.equal(r.genesisReplay, "/rhizoh/genesis/replay");
  assert.equal(r.genesisReplayEquivalence, "/rhizoh/genesis/replay/equivalence");
  assert.equal(r.genesisReplayEvolution, "/rhizoh/genesis/replay/evolution");
});
