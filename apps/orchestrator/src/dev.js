import { createOrchestrator } from "./index.js";

const orchestrator = createOrchestrator();
setInterval(() => {
  const world = orchestrator.tick(1 / 20);
  console.log(`[ORCH] tick=${world.tick} castles=${world.castles.length} agents=${world.agents.length}`);
}, 50);
