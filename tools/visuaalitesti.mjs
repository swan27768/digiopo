#!/usr/bin/env node
/* ============================================================
   VISUAALITESTI — ottaa kuvat sivujen osioista ja vertaa niitä perustaan
   Käyttö (paikallinen esikatselupalvelin käynnistyy tarvittaessa itse):
     npm run kuvat:perusta        ottaa perustan (ennen muutoksia)
     npm run kuvat:vertaa         ottaa uudet kuvat ja vertaa perustaan
   Valinnat:
     --sivu 8          vain yksi luokka-aste (7, 8 tai 9)
     --leveys 1280     vain yksi leveys (oletus: 1280 ja 390)
     --url http://localhost:8000   jos palvelin on jo käynnissä muualla
     --raja 0.1        sallittu ero prosentteina per kuva (oletus 0.1)
   Kuvat: tools/vertailukuvat/{perusta,uusi,ero}/
   Selain: Playwright käyttää koneen Chromea (channel "chrome"). Toinen selain:
     CHROME_PATH=/polku/selaimeen npm run kuvat:perusta
   Kuvat otetaan niin, että kaikki osiot ovat auki, animaatiot ovat pois ja
   maskotti, etenemispolku ja navigointipalkki on piilotettu (ne vaihtelevat
   vierityksen mukaan ja tekisivät vertailusta epävakaan).
   ============================================================ */
import { chromium } from "playwright-core";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";
import { spawn } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync, readdirSync, rmSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const JUURI = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const KUVAT = join(JUURI, "tools", "vertailukuvat");
const arg = (nimi, oletus) => {
  const i = process.argv.indexOf(`--${nimi}`);
  return i > -1 ? process.argv[i + 1] : oletus;
};
const tila = process.argv[2] === "perusta" ? "perusta" : process.argv[2] === "vertaa" ? "vertaa" : null;
if (!tila) {
  console.error("Käyttö: node tools/visuaalitesti.mjs perusta|vertaa [--sivu 8] [--leveys 1280] [--url ...] [--raja 0.1]");
  process.exit(2);
}
const SIVUT = arg("sivu") ? [arg("sivu")] : ["7", "8", "9"];
const LEVEYDET = arg("leveys") ? [Number(arg("leveys"))] : [1280, 390];
const RAJA = Number(arg("raja", "0.1"));
const PORTTI = process.env.PORT || 8000;
let BASE = arg("url", `http://localhost:${PORTTI}`);

const TYYLI = `
  *, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; scroll-behavior: auto !important; }
  .navbar, .edist-polku, .maskotti-laatikko, #cookie-banner, .teoria-modal { display: none !important; }
  .aihe-osio { display: block !important; }
`;

async function palvelinValmis(url) {
  try { const r = await fetch(url, { signal: AbortSignal.timeout(1500) }); return r.ok || r.status < 500; } catch { return false; }
}
async function kaynnistaPalvelin() {
  if (await palvelinValmis(BASE)) return null;
  if (arg("url")) { console.error(`Palvelin ${BASE} ei vastaa.`); process.exit(2); }
  console.log("Käynnistetään esikatselupalvelin…");
  const p = spawn(process.execPath, ["dev-server.cjs"], { cwd: JUURI, env: { ...process.env, PORT: String(PORTTI) }, stdio: "ignore" });
  for (let i = 0; i < 40; i++) {
    if (await palvelinValmis(BASE)) return p;
    await new Promise((r) => setTimeout(r, 250));
  }
  p.kill(); console.error("Palvelin ei käynnistynyt."); process.exit(2);
}

async function otaKuvat(selain, kansio) {
  rmSync(kansio, { recursive: true, force: true });
  mkdirSync(kansio, { recursive: true });
  let lkm = 0;
  for (const sivu of SIVUT) for (const leveys of LEVEYDET) {
    const ctx = await selain.newContext({ viewport: { width: leveys, height: 900 }, reducedMotion: "reduce", deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    await page.addInitScript(() => { Math.random = () => 0.5; });
    await page.goto(`${BASE}/sivut/${sivu}luokka.html`, { waitUntil: "load" });
    await page.addStyleTag({ content: TYYLI });
    // lataa laiskat kuvat: vieritä sivu läpi
    await page.evaluate(async () => {
      document.querySelectorAll("img[loading=lazy]").forEach((i) => (i.loading = "eager"));
      const h = document.documentElement.scrollHeight;
      for (let y = 0; y < h; y += 700) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); }
      window.scrollTo(0, 0);
    });
    await page.evaluate(() => document.fonts && document.fonts.ready);
    await page.waitForTimeout(500);
    const osiot = await page.$$("#main-content > section.aihe-osio");
    for (const osio of osiot) {
      const id = (await osio.getAttribute("id")) || `osio${lkm}`;
      await osio.screenshot({ path: join(kansio, `${sivu}lk-${leveys}-${id}.png`) });
      lkm++;
    }
    await ctx.close();
  }
  return lkm;
}

function vertaa(a, b, eroPolku) {
  const A = PNG.sync.read(readFileSync(a)), B = PNG.sync.read(readFileSync(b));
  if (A.width !== B.width || A.height !== B.height) return { koko: `${A.width}x${A.height} → ${B.width}x${B.height}`, pros: 100 };
  const ero = new PNG({ width: A.width, height: A.height });
  const n = pixelmatch(A.data, B.data, ero.data, A.width, A.height, { threshold: 0.1 });
  const pros = (n / (A.width * A.height)) * 100;
  if (n) writeFileSync(eroPolku, PNG.sync.write(ero));
  return { pros };
}

const palvelin = await kaynnistaPalvelin();
const selain = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: "chrome" });
let koodi = 0;
try {
  if (tila === "perusta") {
    const n = await otaKuvat(selain, join(KUVAT, "perusta"));
    console.log(`Perusta tallennettu: ${n} kuvaa → tools/vertailukuvat/perusta/`);
  } else {
    if (!existsSync(join(KUVAT, "perusta"))) { console.error("Ei perustaa. Aja ensin: npm run kuvat:perusta"); process.exit(2); }
    const n = await otaKuvat(selain, join(KUVAT, "uusi"));
    const eroKansio = join(KUVAT, "ero");
    rmSync(eroKansio, { recursive: true, force: true }); mkdirSync(eroKansio, { recursive: true });
    const perusta = readdirSync(join(KUVAT, "perusta")).filter((f) => f.endsWith(".png"));
    const uudet = new Set(readdirSync(join(KUVAT, "uusi")).filter((f) => f.endsWith(".png")));
    let eroja = 0;
    for (const f of perusta) {
      if (!uudet.has(f)) { console.log(`PUUTTUU  ${f}`); eroja++; continue; }
      uudet.delete(f);
      const r = vertaa(join(KUVAT, "perusta", f), join(KUVAT, "uusi", f), join(eroKansio, f));
      if (r.pros > RAJA) { console.log(`ERO ${r.pros.toFixed(2)} %  ${f}${r.koko ? "  (koko " + r.koko + ")" : ""}`); eroja++; }
    }
    for (const f of uudet) { console.log(`UUSI     ${f}`); eroja++; }
    console.log(eroja ? `\n${eroja} kuvaa eroaa perustasta (raja ${RAJA} %). Katso tools/vertailukuvat/ero/` : `\nKaikki ${n} kuvaa vastaavat perustaa.`);
    if (eroja) koodi = 1;
  }
} finally {
  await selain.close();
  if (palvelin) palvelin.kill();
}
process.exit(koodi);
