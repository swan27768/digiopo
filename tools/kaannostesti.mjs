#!/usr/bin/env node
/* ============================================================
   KÄÄNNÖSTESTI — varmistaa, että käännökset pysyvät samoina, kun HTML tai kääntäjäkoodi muuttuu
   Ottaa jokaisesta sivusta ja kielestä "tekstikuvan" (kaikki näkyvät tekstit + aria-label/title/
   placeholder/alt kohdan polun kanssa) ja vertaa sitä perustaan.
     npm run kaannos:perusta        tallentaa perustan
     npm run kaannos:vertaa         vertaa perustaan (poistuu koodilla 1, jos eroja)
   Valinnat: --sivu 9   --kieli en   --url http://localhost:8000
   Tulokset: tools/kaannokset/{perusta,uusi}/
   ============================================================ */
import { chromium } from "playwright-core";
import { spawn } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync, readdirSync, rmSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const JUURI = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const KANSIO = join(JUURI, "tools", "kaannokset");
const arg = (n, o) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : o; };
const tila = process.argv[2];
if (!["perusta", "vertaa"].includes(tila)) { console.error("Käyttö: node tools/kaannostesti.mjs perusta|vertaa [--sivu 9] [--kieli en] [--url ...]"); process.exit(2); }
const SIVUT = arg("sivu") ? [arg("sivu")] : ["7", "8", "9"];
const KIELET = arg("kieli") ? [arg("kieli")] : ["fi", "en", "sv", "ru", "ar", "tr"];
const PORTTI = process.env.PORT || 8000;
const BASE = arg("url", `http://localhost:${PORTTI}`);

async function valmis(url) { try { const r = await fetch(url, { signal: AbortSignal.timeout(1500) }); return r.ok || r.status < 500; } catch { return false; } }
async function kaynnista() {
  if (await valmis(BASE)) return null;
  if (arg("url")) { console.error(`Palvelin ${BASE} ei vastaa.`); process.exit(2); }
  const p = spawn(process.execPath, ["dev-server.cjs"], { cwd: JUURI, env: { ...process.env, PORT: String(PORTTI) }, stdio: "ignore" });
  for (let i = 0; i < 40; i++) { if (await valmis(BASE)) return p; await new Promise((r) => setTimeout(r, 250)); }
  p.kill(); console.error("Palvelin ei käynnistynyt."); process.exit(2);
}

const KERAA = () => {
  const ohita = "script,style,noscript,#lisenssiportti,#i18n-wrapper,.maskotti-laatikko,.edist-polku";
  const polku = (e) => { const o = []; while (e && e.tagName !== "BODY") { const p = e.parentElement; const i = p ? [...p.children].indexOf(e) : 0; o.unshift(e.tagName.toLowerCase() + (e.id ? "#" + e.id : "") + ":" + i); e = p; } return o.join(">"); };
  const ulos = {};
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
  for (let e = w.currentNode; e; e = w.nextNode()) {
    if (e.matches && e.matches(ohita)) { continue; }
    if (e.closest && e.closest(ohita)) continue;
    const p = polku(e);
    let t = ""; for (const n of e.childNodes) if (n.nodeType === 3) t += n.nodeValue;
    t = t.replace(/\s+/g, " ").trim();
    if (t) ulos[p] = t;
    for (const a of ["aria-label", "title", "placeholder", "alt"]) { const v = e.getAttribute && e.getAttribute(a); if (v) ulos[p + "@" + a] = v.replace(/\s+/g, " ").trim(); }
  }
  return ulos;
};

const palvelin = await kaynnista();
const selain = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: "chrome" });
const kohde = join(KANSIO, tila === "perusta" ? "perusta" : "uusi");
mkdirSync(kohde, { recursive: true });
for (const sivu of SIVUT) for (const kieli of KIELET) { try { rmSync(join(kohde, `${sivu}lk-${kieli}.json`), { force: true }); } catch {} }
for (const sivu of SIVUT) for (const kieli of KIELET) {
  const ctx = await selain.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: "reduce" });
  await ctx.addInitScript((k) => {
    try { localStorage.setItem("digiopo-lang", k); } catch {}
    Math.random = () => 0.5;
    const R = Date, f = new R("2026-01-15T10:00:00Z").getTime();
    globalThis.Date = class extends R { constructor(...a) { if (a.length === 0) super(f); else super(...a); } static now() { return f; } };
  }, kieli);
  const page = await ctx.newPage();
  await page.goto(`${BASE}/sivut/${sivu}luokka.html`, { waitUntil: "load" });
  await page.evaluate(() => document.fonts && document.fonts.ready);
  await page.waitForTimeout(3000);
  const data = await page.evaluate(KERAA);
  writeFileSync(join(kohde, `${sivu}lk-${kieli}.json`), JSON.stringify(data, null, 1));
  await ctx.close();
}
await selain.close();
if (palvelin) palvelin.kill();

if (tila === "perusta") { console.log(`Käännösperusta tallennettu: ${SIVUT.length * KIELET.length} tekstikuvaa → tools/kaannokset/perusta/`); process.exit(0); }
let eroja = 0, tiedostoja = 0;
for (const sivu of SIVUT) for (const kieli of KIELET) {
  const nimi = `${sivu}lk-${kieli}.json`;
  const pp = join(KANSIO, "perusta", nimi);
  if (!existsSync(pp)) { console.log(`PUUTTUU perusta: ${nimi}`); continue; }
  tiedostoja++;
  const a = JSON.parse(readFileSync(pp, "utf8")), b = JSON.parse(readFileSync(join(kohde, nimi), "utf8"));
  const erot = [];
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) if (a[k] !== b[k]) erot.push([k, a[k], b[k]]);
  if (erot.length) {
    eroja++;
    console.log(`ERO ${nimi}: ${erot.length} kohtaa`);
    for (const [k, x, y] of erot.slice(0, 6)) console.log(`   ${k}\n     ennen:  ${x === undefined ? "(puuttuu)" : x.slice(0, 90)}\n     jälkeen: ${y === undefined ? "(puuttuu)" : y.slice(0, 90)}`);
  }
}
console.log(eroja ? `\n${eroja}/${tiedostoja} tekstikuvaa eroaa perustasta.` : `\nKaikki ${tiedostoja} tekstikuvaa vastaavat perustaa.`);
process.exit(eroja ? 1 : 0);
