import { describe, expect, it, beforeEach } from "vitest";
import {
  emitProductBindingAction,
  emitProductBindingActionV0,
  initRhizohProductBindingV0,
  listProductBindingEventsV0,
  PRODUCT_BINDING_SCHEMA_V0,
  resetRhizohProductBindingForTestV0,
  RHIZOH_PRODUCT_BINDING_EVENT_V0
} from "../rhizohProductBindingV0.js";

describe("rhizohProductBindingV0", () => {
  beforeEach(() => {
    resetRhizohProductBindingForTestV0();
    initRhizohProductBindingV0();
  });

  it("emitProductBindingAction appends ring and publishes __rhizoh.productBinding", () => {
    const e = emitProductBindingActionV0({
      source: "cap_wheel",
      mode: "INTENT",
      action: "node:create",
      payload: { node: "create", seed: "Create" }
    });
    expect(e.schema).toBe(PRODUCT_BINDING_SCHEMA_V0);
    expect(e.source).toBe("cap_wheel");
    expect(window.__rhizoh.productBinding.count).toBe(1);
    expect(window.__rhizoh.capWheel.intent.node).toBe("create");
  });

  it("alias emitProductBindingAction matches V0 export", () => {
    emitProductBindingAction({ source: "drawer", mode: "READ", action: "open" });
    expect(listProductBindingEventsV0().length).toBe(1);
  });

  it("dispatches rhizoh:product-binding-v0", () => {
    let seen = null;
    const handler = (ev) => {
      seen = ev.detail;
    };
    window.addEventListener(RHIZOH_PRODUCT_BINDING_EVENT_V0, handler);
    emitProductBindingActionV0({ source: "shell_bar", mode: "SIM", action: "select:studio" });
    window.removeEventListener(RHIZOH_PRODUCT_BINDING_EVENT_V0, handler);
    expect(seen?.action).toBe("select:studio");
  });
});
