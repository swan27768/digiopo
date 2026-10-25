#!/usr/bin/env node
/**
 * Näyttää tiedollisten osioiden "tarkistettu"-tilan (js/tarkistettu.json).
 *   node tools/tarkistus.mjs             tulostaa tilan
 *   node tools/tarkistus.mjs --tarkista  poistuu koodilla 1, jos jokin osio on tarkistamatta tai vanhentunut
 * Osio on vanhentunut, jos viimeisin tarkistus on ennen viimeisintä 1.8. (vuosittainen elokuun tarkistus).
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const JUURI = join(dirname(fileURLToPath(import.meta.url)), "..");
const data = JSON.parse(readFileSync(join(JUURI, "js", "tarkistettu.json"), "utf8"));
const nyt = new Date();
const raja = new Date(nyt.getMonth() >= 7 ? nyt.getFullYear() : nyt.getFullYear() - 1, 7, 1);

let huonoja = 0;
for (const [avain, t] of Object.entries(data.osiot)) {
  let tila;
  if (!t.pvm) tila = "EI TARKISTETTU";
  else if (new Date(t.pvm + "T00:00:00") < raja) tila = "VANHENTUNUT  ";
  else tila = "ok            ";
  if (tila.startsWith("ok") === false) huonoja++;
  console.log(`${tila} ${(t.pvm || "-").padEnd(10)} ${avain}\n               ${t.nimi}${t.huom ? "\n               HUOM: " + t.huom : ""}`);
}
console.log(`\n${huonoja} osiota vaatii tarkistuksen (raja: ${raja.toISOString().slice(0, 10)}).`);
if (huonoja && process.argv.includes("--tarkista")) process.exit(1);
