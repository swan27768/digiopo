#!/usr/bin/env node
/**
 * Yhdistää kerrosmanifestit (css/kerrokset-Nlk.css) sivukohtaisiksi paketeiksi (css/paketti-Nlk.css).
 *
 *   node tools/yhdista-css.mjs            rakentaa paketit
 *   node tools/yhdista-css.mjs --tarkista ei kirjoita; poistuu koodilla 1, jos paketti on vanhentunut
 *
 * Manifestin rivit:
 *   @layer a, b, c;                  -> kopioidaan paketin alkuun
 *   @import url("x.css") layer(a);   -> x.css liitetään lohkoon "@layer a { ... }" samassa järjestyksessä
 *   @import url("x.css");            -> x.css liitetään kerrosten ulkopuolelle
 * Tiedostot ovat samassa kansiossa kuin paketti, joten url()-polut eivät muutu.
 * Pakettiin ei lisätä muuta kuin otsikko, joten selaimen tulkinta on sama kuin @import-ketjulla.
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const JUURI = join(dirname(fileURLToPath(import.meta.url)), "..");
const CSS = join(JUURI, "css");
const tarkista = process.argv.includes("--tarkista");

const manifestit = readdirSync(CSS).filter((f) => /^kerrokset-.+\.css$/.test(f));
let vanhentuneita = 0;

for (const m of manifestit) {
  const nimi = m.replace(/^kerrokset-/, "");
  const ulos = join(CSS, `paketti-${nimi}`);
  const teksti = readFileSync(join(CSS, m), "utf8");
  const sisalto = teksti.replace(/\/\*[\s\S]*?\*\//g, "");

  const kerrosLause = sisalto.match(/@layer\s+[^{;]+;/);
  const osat = [];
  const lahteet = [];
  for (const r of sisalto.matchAll(/@import\s+url\(["']([^"']+)["']\)\s*(?:layer\(([^)]+)\))?\s*;/g)) {
    const [, tiedosto, kerros] = r;
    const polku = join(CSS, tiedosto);
    if (!existsSync(polku)) throw new Error(`${m}: tiedostoa ei löydy: ${tiedosto}`);
    let css = readFileSync(polku, "utf8").replace(/^﻿/, "").trimEnd();
    if (/@import\b/i.test(css.replace(/\/\*[\s\S]*?\*\//g, ""))) {
      throw new Error(`${tiedosto}: sisältää @import-säännön, jota ei voi liittää pakettiin. Siirrä se HTML:n <link>-tagiksi.`);
    }
    if (/@charset\b/i.test(css)) css = css.replace(/@charset[^;]*;\s*/i, "");
    lahteet.push(tiedosto);
    osat.push(kerros ? `/* ${tiedosto} */\n@layer ${kerros.trim()} {\n${css}\n}\n` : `/* ${tiedosto} (ei kerrosta) */\n${css}\n`);
  }

  const otsikko =
    `/* AUTOMAATTISESTI RAKENNETTU — älä muokkaa tätä tiedostoa.\n` +
    `   Lähde: css/${m}. Rakenna uudelleen: npm run css\n` +
    `   Sisältää ${lahteet.length} tiedostoa: ${lahteet.join(", ")} */\n`;
  const paketti = otsikko + (kerrosLause ? kerrosLause[0] + "\n\n" : "\n") + osat.join("\n");

  const vanha = existsSync(ulos) ? readFileSync(ulos, "utf8") : null;
  if (tarkista) {
    if (vanha !== paketti) {
      console.error(`VANHENTUNUT: css/paketti-${nimi} — aja: npm run css`);
      vanhentuneita++;
    } else console.log(`ajan tasalla: css/paketti-${nimi}`);
  } else {
    if (vanha !== paketti) writeFileSync(ulos, paketti);
    console.log(`${vanha === paketti ? "ennallaan" : "rakennettu"}: css/paketti-${nimi}  (${(Buffer.byteLength(paketti) / 1024).toFixed(1)} kt, ${lahteet.length} tiedostoa)`);
  }
}
if (vanhentuneita) process.exit(1);
