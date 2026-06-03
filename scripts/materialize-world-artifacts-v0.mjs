#!/usr/bin/env node
/**
 * Materialize world runtime artifact layout after client build.
 * Creates dist/{ui,scr,studio,castle,pet} manifest dirs for deploy verification.
 */
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const clientDist = join(root, "apps/client/dist");
const worldDist = join(root, "dist");

const SURFACES = Object.freeze({
  ui: { role: "ingress_ui", source: "apps/client/dist" },
  scr: { role: "scr_runtime", modules: ["rhizohT0UnifiedPresenceFrameV0", "rhizohExperienceContinuityCompilerV0"] },
  studio: { role: "studio_organism", modules: ["rhizohStudioProductionOrganismV0", "rhizohStudioExecutionLoopV0"] },
  castle: { role: "castle_projection", modules: ["rhizohCastleProjectionLayerV0", "rhizohMultiInhabitantCoPresenceV0"] },
  pet: { role: "pet_inhabitant", modules: ["rhizohPetCitizenRuntimeV0"] }
});

if (!existsSync(clientDist)) {
  console.error("Client dist missing — run npm run build first");
  process.exit(1);
}

mkdirSync(worldDist, { recursive: true });

for (const [name, meta] of Object.entries(SURFACES)) {
  const target = join(worldDist, name);
  mkdirSync(target, { recursive: true });

  if (name === "ui" && existsSync(clientDist)) {
    for (const entry of ["index.html", "assets"]) {
      const src = join(clientDist, entry);
      if (existsSync(src)) {
        cpSync(src, join(target, entry), { recursive: true });
      }
    }
  }

  writeFileSync(
    join(target, "world-artifact.v0.json"),
    JSON.stringify(
      Object.freeze({
        schema: "castle.rhizoh.world_artifact.v0",
        surface: name,
        ...meta,
        materialized_at_ms: Date.now()
      }),
      null,
      2
    )
  );
}

writeFileSync(
  join(worldDist, "world-manifest.v0.json"),
  JSON.stringify(
    Object.freeze({
      schema: "castle.rhizoh.world_manifest.v0",
      atMs: Date.now(),
      surfaces: Object.keys(SURFACES),
      client_dist: "apps/client/dist",
      boot: Object.freeze({
        mode: "t0",
        source: "studio",
        hydrate: true
      })
    }),
    null,
    2
  )
);

console.log("World artifacts materialized:", worldDist);
