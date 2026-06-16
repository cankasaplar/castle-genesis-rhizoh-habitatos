import React, { memo, useCallback, useState } from "react";
import {
  canPersistUserTopologyN12V0,
  readRhizohPwaPermissionsN12V0,
  writeRhizohPwaPermissionsN12V0
} from "../pwa/rhizohPwaPermissionsN12V0.js";
import { initRhizohSimulationPersistenceV0 } from "../core/initRhizohSimulationPersistenceV0.js";
import { emitCodexBusV0 } from "../core/CodexBusV0.js";

/**
 * N12 persistence gate — memory must be authorized before event-sourced world runs.
 */
export const RhizohN12PersistenceGateV0 = memo(function RhizohN12PersistenceGateV0() {
  const [visible, setVisible] = useState(() => !canPersistUserTopologyN12V0());
  const [authorizing, setAuthorizing] = useState(false);

  const unlockN12 = useCallback(async () => {
    if (authorizing) return;
    setAuthorizing(true);
    try {
      const perms = readRhizohPwaPermissionsN12V0();
      writeRhizohPwaPermissionsN12V0({ ...perms, topology: true, memory: true });
      emitCodexBusV0("SYS_LOG", { msg: "N12 GATE UNLOCKED. IndexedDB Online.", class: "collapse" });
      await initRhizohSimulationPersistenceV0({ force: true });
      setVisible(false);
    } finally {
      setAuthorizing(false);
    }
  }, [authorizing]);

  if (!visible) return null;

  return (
    <div
      className="pointer-events-auto absolute inset-0 z-[200] flex items-center justify-center bg-[rgba(20,20,19,0.88)] backdrop-blur-sm"
      data-rhizoh-n12-gate="1"
      role="dialog"
      aria-modal="true"
      aria-labelledby="rhizoh-n12-gate-title"
    >
      <div className="mx-4 max-w-md rounded-xl bg-[#faf9f5] p-8 text-center shadow-2xl">
        <h2 id="rhizoh-n12-gate-title" className="mb-2 font-serif text-xl font-medium text-[#141413]">
          N12 Persistence Gate
        </h2>
        <p className="mb-6 text-xs leading-relaxed text-[#b0aea5]">
          To enable event sourcing and IndexedDB archiving, memory persistence must be authorized.
          Without this, the world lives but forgets.
        </p>
        <button
          type="button"
          className="rounded-md bg-[#d97757] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#c86641] disabled:opacity-60"
          onClick={() => void unlockN12()}
          disabled={authorizing}
        >
          {authorizing ? "AUTHORIZING…" : "AUTHORIZE MEMORY"}
        </button>
      </div>
    </div>
  );
});
