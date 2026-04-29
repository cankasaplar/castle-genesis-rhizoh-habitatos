import { createSimulationCore } from "./index.js";

const sim = createSimulationCore();
setInterval(() => {
  sim.step(1 / 20);
  const world = sim.getWorldSnapshot();
  console.log(`[SIM] tick=${world.tick} agents=${world.agents.length}`);
}, 50);
