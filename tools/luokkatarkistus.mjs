#!/usr/bin/env node
/* ============================================================
   LUOKKATARKISTUS — etsii CSS-luokkia, jotka on määritelty useassa paikassa
   Käyttö:
     node tools/luokkatarkistus.mjs             raportti (ei virheitä)
     node tools/luokkatarkistus.mjs --tallenna  tallentaa nykytilan vertailukohdaksi
     node tools/luokkatarkistus.mjs --vertaa    epäonnistuu (exit 1), jos jokin luokka on
                                                nyt määritelty useammassa paikassa kuin
                                                tallennushetkellä (uusi törmäys)
   Paikka = linkitetty CSS-tiedosto tai sivun <style>-lohko.
   Ei riippuvuuksia. Raportoi myös !important-määrät ja inline-tyylit.
   ============================================================ */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const JUURI = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SIVUT = ["7luokka", "8luokka", "9luokka"];
const TALLENNUS = join(JUURI, "tools", "luokkatarkistus.perusta.json");
const tila = process.argv.includes("--tallenna") ? "tallenna" : process.argv.includes("--vertaa") ? "vertaa" : "raportti";

const poistaKommentit = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "");

function luokatCssSta(css) {
  const luokat = new Set();
  const teksti = poistaKommentit(css);
  // kaikki "valitsin {" -kohdat; @-säännöt ohitetaan, mutta niiden sisältö käydään läpi
  const re = /([^{}@;]+)\{/g;
  let m;
  while ((m = re.exec(teksti))) {
    const valitsin = m[1];
    for (const c of valitsin.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)) luokat.add(c[1]);
  }
  return luokat;
}

const tulokset = {}; // sivu -> { luokka -> [paikat] }
const tilastot = [];

for (const sivu of SIVUT) {
  const polku = join(JUURI, "sivut", `${sivu}.html`);
  const html = readFileSync(polku, "utf8");
  const paikat = new Map(); // nimi -> Set(luokat)

  for (const m of html.matchAll(/<link[^>]+rel=["']stylesheet["'][^>]*>/gi)) {
    const href = (m[0].match(/href=["']([^"']+)["']/i) || [])[1];
    if (!href || /^https?:/.test(href)) continue;
    const tiedosto = href.startsWith("/") ? join(JUURI, href) : join(JUURI, "sivut", href);
    // Rakennettu paketti (css/paketti-Nlk.css): analysoidaan sen lähteenä oleva manifesti (css/kerrokset-Nlk.css), jotta tiedostokohtaiset törmäykset näkyvät
    const luettava = /paketti-[^/]+\.css$/.test(tiedosto) ? tiedosto.replace("paketti-", "kerrokset-") : tiedosto;
    if (!existsSync(luettava)) continue;
    const css = readFileSync(luettava, "utf8");
    // Seurataan @import url("x.css") -tuonteja (esim. css/kerrokset-Nlk.css), jotta kerroksiin siirretyt tiedostot tarkistetaan edelleen
    const tuonnit = [...css.matchAll(/@import\s+url\(["']?([^"')]+)["']?\)/gi)].map((m) => m[1]).filter((u) => !/^https?:|^\//.test(u));
    if (tuonnit.length) {
      for (const u of tuonnit) {
        const t = join(dirname(tiedosto), u);
        if (existsSync(t)) paikat.set("css/" + u, luokatCssSta(readFileSync(t, "utf8")));
      }
    } else {
      paikat.set(href.replace(/^\.\.\//, ""), luokatCssSta(css));
    }
  }
  let n = 0;
  for (const m of html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)) {
    n++;
    paikat.set(`${sivu}.html <style> #${n}`, luokatCssSta(m[1]));
  }

  const kartta = {};
  for (const [nimi, luokat] of paikat) for (const l of luokat) (kartta[l] ||= []).push(nimi);
  tulokset[sivu] = kartta;

  const inline = (html.match(/\sstyle="/g) || []).length;
  const important = (html.match(/!important/g) || []).length;
  tilastot.push({ sivu, inline, styleLohkoja: n, importantSivulla: important, tyylitiedostoja: paikat.size - n });
}

// Perustason vertailu
let perusta = null;
if (tila === "vertaa") {
  if (!existsSync(TALLENNUS)) {
    console.error("Ei vertailukohtaa. Aja ensin: node tools/luokkatarkistus.mjs --tallenna");
    process.exit(2);
  }
  perusta = JSON.parse(readFileSync(TALLENNUS, "utf8"));
}

let uusia = 0;
for (const sivu of SIVUT) {
  const kartta = tulokset[sivu];
  const toistuvat = Object.entries(kartta).filter(([, p]) => p.length > 1).sort((a, b) => b[1].length - a[1].length);
  console.log(`\n=== ${sivu}: ${toistuvat.length} luokkaa määritelty useassa paikassa ===`);
  if (tila === "raportti") {
    for (const [l, p] of toistuvat.slice(0, 25)) console.log(`  .${l}  (${p.length}): ${p.join(", ")}`);
    if (toistuvat.length > 25) console.log(`  … ja ${toistuvat.length - 25} muuta (käytä --tallenna ja katso JSON)`);
  }
  if (perusta) {
    for (const [l, p] of toistuvat) {
      const ennen = (perusta[sivu] && perusta[sivu][l]) || [];
      const uudet = p.filter((x) => !ennen.includes(x));
      if (uudet.length) {
        uusia++;
        console.log(`  UUSI TÖRMÄYS .${l}: nyt myös ${uudet.join(", ")}  (ennestään: ${ennen.join(", ") || "ei yhtään"})`);
      }
    }
  }
}

console.log("\n=== Tilastot ===");
console.table(tilastot);

if (tila === "tallenna") {
  const data = {};
  for (const sivu of SIVUT) data[sivu] = Object.fromEntries(Object.entries(tulokset[sivu]).filter(([, p]) => p.length > 1));
  writeFileSync(TALLENNUS, JSON.stringify(data, null, 1) + "\n");
  console.log(`Tallennettu: ${TALLENNUS}`);
}
if (tila === "vertaa") {
  if (uusia) { console.error(`\n${uusia} uutta luokkatörmäystä.`); process.exit(1); }
  console.log("\nEi uusia luokkatörmäyksiä.");
}
