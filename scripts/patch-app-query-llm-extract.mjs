import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const p = path.join(root, "apps/client/src/AppRhizoh528T0.jsx");
let src = fs.readFileSync(p, "utf8");

const blocks = [
  [/function priorAssistantRepliesFromContinuity[\s\S]*?^}\r?\n\r?\n\/\*\* LLM-friendly/m, "/** LLM-friendly"],
  [/function logRhizohHealth[\s\S]*?^}\r?\n\r?\nasync function rhizohPersistTraceFromOut/m, "async function rhizohPersistTraceFromOut"]
];

for (const [re, rep] of blocks) {
  const next = src.replace(re, rep);
  if (next === src) {
    console.error("block not removed", re);
    process.exit(1);
  }
  src = next;
}

src = src.replace(
  `const VOICE_LLM_TIMEOUT_MS = 22_000;\nconst TEXT_LLM_TIMEOUT_MS = 32_000;`,
  `const VOICE_LLM_TIMEOUT_MS = 22_000;`
);

src = src.replace(
  `} from "./rhizoh/runtime/rhizohLlmReplyNormalizeV0.js";`,
  `} from "./rhizoh/runtime/rhizohLlmReplyNormalizeV0.js";
import {
  queryRhizohLLM,
  TEXT_LLM_TIMEOUT_MS,
  logRhizohHealth,
  registerRhizohQueryLlmDepsV0
} from "./rhizoh/runtime/rhizohQueryLlmV1.js";`
);

src = src.replace(
  `};\n\nconst ARCHETYPE_NAMES = ["", "SCOUT", "GUARD", "HACKER", "BUILDER", "HEALER", "HUNTER"];`,
  `};

registerRhizohQueryLlmDepsV0({
  applyPersonalCastleDsl,
  readClientContinuity,
  patchRhizohEmotionDisk,
  getUiRuntimeHints: () => {
    try {
      const st = uiStore.getState();
      return {
        realityMode: st.realityMode,
        mapSurfaceActive: st.mapSurfaceActive,
        layerFocus: st.layerFocus,
        governanceState: st.governanceState
      };
    } catch {
      return {};
    }
  }
});

const ARCHETYPE_NAMES = ["", "SCOUT", "GUARD", "HACKER", "BUILDER", "HEALER", "HUNTER"];`
);

fs.writeFileSync(p, src);
console.log("patched AppRhizoh528T0.jsx");
