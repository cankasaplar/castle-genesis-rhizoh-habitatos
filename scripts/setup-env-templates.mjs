#!/usr/bin/env node
/**
 * Şablonları kopyalar — mevcut .env dosyalarının üzerine yazmaz.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function copyIfMissing(fromRel, toRel) {
  const from = path.join(root, fromRel);
  const to = path.join(root, toRel);
  if (!fs.existsSync(from)) {
    console.warn(`Atlanıyor (kaynak yok): ${fromRel}`);
    return;
  }
  if (fs.existsSync(to)) {
    console.log(`Zaten var, dokunulmadı: ${toRel}`);
    return;
  }
  fs.copyFileSync(from, to);
  console.log(`Oluşturuldu: ${toRel}  ←  ${fromRel}`);
}

console.log("Castle — ortam şablonları\n");
copyIfMissing("apps/client/.env.example", "apps/client/.env.local");
copyIfMissing("apps/gateway/.env.example", "apps/gateway/.env");
console.log("\nSonra düzenleyin: apps/client/.env.local ve apps/gateway/.env");
console.log("Rehber: ANAHTARLAR_BURAYA.txt\n");
