// DigiOpo – Paikallinen kehityspalvelin (esikatselu)
// ----------------------------------------------------
// Käynnistys:  node dev-server.js
// Avaa selaimessa:  http://localhost:8000
//
// Tämä palvelin on TARKOITETTU VAIN PAIKALLISEEN ESIKATSELUUN.
// - Tarjoaa kaikki sivuston staattiset tiedostot (HTML, CSS, JS, kuvat).
// - Vastaa /api/lisenssi paikallisesti: hyväksyy minkä tahansa koulukoodin,
//   jotta lisenssiportti ei estä sivujen näkymistä kehityksen aikana.
// - Vastaa /api/ping (käyttölaskuri) hiljaa OK:lla, ettei konsoliin tule virheitä.
//
// Tämä tiedosto EI vaikuta tuotantoon eikä kuluta Vercelin julkaisurajaa.

const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 8000;
const ROOT = __dirname;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".pdf": "application/pdf",
  ".mp3": "audio/mpeg",
  ".mp4": "video/mp4",
  ".map": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};

function lueRunko(req) {
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => resolve(body));
  });
}

function lahetaJSON(res, koodi, data) {
  const teksti = JSON.stringify(data);
  res.writeHead(koodi, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
  });
  res.end(teksti);
}

// Estä polkuhyökkäykset (../) ja pidä pyyntö ROOT-kansion sisällä
function turvallinenPolku(urlPolku) {
  const puhdas = decodeURIComponent(urlPolku.split("?")[0]);
  const koottu = path.normalize(path.join(ROOT, puhdas));
  if (!koottu.startsWith(ROOT)) return null;
  return koottu;
}

// ─── Fake Insta -muistikanta (nollautuu kun palvelin käynnistetään uudelleen) ─
const fakeInstaDB = [];

// ─── Maailma tarvitsee sinua -muistikanta ─────────────────────────────────────
const maailmaTauluDB = [];  // { id, koulu, ongelma, jasenet, idea, tila, tykkaukset, created_at }

// ─── Tiedon Temppeli -muistikanta ────────────────────────────────────────────
const tiedonTemppTulostaulu = [];   // { id, name, koulu, luokka, score, date, updated }

// ─── AmmattiSet -muistikanta ──────────────────────────────────────────────────
const ammattSetTulostaulu  = [];    // { id, name, koulu, luokka, score, date, updated }
const ammattSetSanaryhmat  = { ryhmat: [] };
const AMMATTISET_ADMIN_KEY = "AlaSet#2026!";

function fipMuoto(r) {
  return {
    id: r.id, username: r.kayttajanimi, name: r.nimi, avatar: r.avatar,
    bio1: r.bio1, bio2: r.bio2, bio3: r.bio3, hashtags: r.hashtags,
    likes: r.tykkayksiat,
    starredStrengths: { bio1: r.tahdet_bio1, bio2: r.tahdet_bio2, bio3: r.tahdet_bio3 },
    status: r.tila,
    timestamp: new Date(r.luotu_at).getTime(),
  };
}

const server = http.createServer(async (req, res) => {
  const url = req.url || "/";

  // ── API: fake-insta (paikallinen, muistipohjainen) ───────────────────────
  if (url.startsWith("/api/fake-insta")) {
    if (req.method === "OPTIONS") {
      res.writeHead(204, { "Access-Control-Allow-Origin": "*" });
      return res.end();
    }

    // GET – hae hyväksytyt profiilit galleriaan
    if (req.method === "GET") {
      const approved = fakeInstaDB.filter(p => p.tila === "hyvaksytty");
      return lahetaJSON(res, 200, { ok: true, profiilit: approved.map(fipMuoto) });
    }

    // POST – eri toiminnot
    const raw = await lueRunko(req);
    let body = {};
    try { body = JSON.parse(raw); } catch { return lahetaJSON(res, 400, { ok: false, virhe: "virheellinen_pyynto" }); }
    const toiminto = body.toiminto || "";

    if (toiminto === "tarkista_opettaja") {
      return lahetaJSON(res, 200, { ok: true, koulu: "Paikallinen esikatselu" });
    }
    if (toiminto === "laheta") {
      const p = body.profiili || {};
      const uusi = {
        id: Math.random().toString(36).slice(2),
        koulu: body.koulu || "Paikallinen esikatselu",
        kayttajanimi: (p.username || "").slice(0, 60),
        nimi: (p.name || "").slice(0, 60),
        avatar: p.avatar || "🙂",
        bio1: p.bio1 || "", bio2: p.bio2 || "", bio3: p.bio3 || "",
        hashtags: p.hashtags || "",
        post1: p.post1||"", post2: p.post2||"", post3: p.post3||"",
        post4: p.post4||"", post5: p.post5||"", post6: p.post6||"",
        tila: "odottaa",
        tykkayksiat: 0, tahdet_bio1: 0, tahdet_bio2: 0, tahdet_bio3: 0,
        luotu_at: new Date().toISOString(),
      };
      fakeInstaDB.push(uusi);
      return lahetaJSON(res, 200, { ok: true, id: uusi.id });
    }
    if (toiminto === "hae_kaikki") {
      return lahetaJSON(res, 200, { ok: true, koulu: "Paikallinen esikatselu", profiilit: fakeInstaDB.map(fipMuoto) });
    }
    if (toiminto === "hyvaksy") {
      const p = fakeInstaDB.find(r => r.id === body.id);
      if (p) p.tila = "hyvaksytty";
      return lahetaJSON(res, 200, { ok: true });
    }
    if (toiminto === "poista") {
      const idx = fakeInstaDB.findIndex(r => r.id === body.id);
      if (idx !== -1) fakeInstaDB.splice(idx, 1);
      return lahetaJSON(res, 200, { ok: true });
    }
    if (toiminto === "tykkaa") {
      const p = fakeInstaDB.find(r => r.id === body.id);
      if (p) p.tykkayksiat++;
      return lahetaJSON(res, 200, { ok: true, tykkayksiat: p ? p.tykkayksiat : 0 });
    }
    if (toiminto === "tahti") {
      const p = fakeInstaDB.find(r => r.id === body.id);
      const k = body.kentta;
      if (p && ["bio1","bio2","bio3"].includes(k)) p[`tahdet_${k}`]++;
      return lahetaJSON(res, 200, { ok: true, maara: p ? p[`tahdet_${k}`] : 0 });
    }
    if (toiminto === "tyhjenna") {
      fakeInstaDB.length = 0;
      return lahetaJSON(res, 200, { ok: true });
    }
    return lahetaJSON(res, 400, { ok: false, virhe: "tuntematon_toiminto" });
  }

  // ── API: maailma-taulu (paikallinen, muistipohjainen) ────────────────────
  if (url.startsWith("/api/maailma-taulu")) {
    if (req.method === "OPTIONS") {
      res.writeHead(204, { "Access-Control-Allow-Origin": "*" });
      return res.end();
    }

    if (req.method === "GET") {
      const hyv = maailmaTauluDB.filter(r => r.tila === "hyvaksytty");
      return lahetaJSON(res, 200, { ok: true, ilmoitukset: hyv });
    }

    const raw = await lueRunko(req);
    let body = {};
    try { body = JSON.parse(raw); } catch { return lahetaJSON(res, 400, { ok: false, virhe: "virheellinen_pyynto" }); }
    const toiminto = body.toiminto || "";

    if (toiminto === "tarkista_opettaja") {
      return lahetaJSON(res, 200, { ok: true, koulu: "Paikallinen esikatselu" });
    }
    if (toiminto === "laheta") {
      const il = body.ilmoitus || {};
      const uusi = {
        id: Math.random().toString(36).slice(2),
        koulu: body.koulu || "Paikallinen esikatselu",
        ongelma: il.ongelma || "",
        jasenet: il.jasenet || [],
        idea: il.idea || "",
        tila: "odottaa",
        tykkaukset: 0,
        created_at: new Date().toISOString(),
      };
      maailmaTauluDB.push(uusi);
      return lahetaJSON(res, 200, { ok: true, id: uusi.id });
    }
    if (toiminto === "hae_kaikki") {
      return lahetaJSON(res, 200, { ok: true, koulu: "Paikallinen esikatselu", ilmoitukset: maailmaTauluDB });
    }
    if (toiminto === "hyvaksy") {
      const r = maailmaTauluDB.find(x => x.id === body.id);
      if (r) r.tila = "hyvaksytty";
      return lahetaJSON(res, 200, { ok: true });
    }
    if (toiminto === "poista") {
      const idx = maailmaTauluDB.findIndex(x => x.id === body.id);
      if (idx !== -1) maailmaTauluDB.splice(idx, 1);
      return lahetaJSON(res, 200, { ok: true });
    }
    if (toiminto === "tykkaa") {
      const r = maailmaTauluDB.find(x => x.id === body.id);
      if (r) r.tykkaukset++;
      return lahetaJSON(res, 200, { ok: true, tykkaukset: r ? r.tykkaukset : 0 });
    }
    if (toiminto === "tyhjenna") {
      maailmaTauluDB.length = 0;
      return lahetaJSON(res, 200, { ok: true });
    }
    return lahetaJSON(res, 400, { ok: false, virhe: "tuntematon_toiminto" });
  }

  // ── API: tiedontemppeli (paikallinen, muistipohjainen) ───────────────────
  if (url.startsWith("/api/tiedontemppeli")) {
    if (req.method === "OPTIONS") {
      res.writeHead(204, { "Access-Control-Allow-Origin": "*" });
      return res.end();
    }

    if (req.method === "GET") {
      const top5 = [...tiedonTemppTulostaulu]
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);
      return lahetaJSON(res, 200, { ok: true, tulokset: top5 });
    }

    const raw = await lueRunko(req);
    let body = {};
    try { body = JSON.parse(raw); } catch { return lahetaJSON(res, 400, { ok: false, virhe: "virheellinen_pyynto" }); }

    if (body.toiminto === "tallenna") {
      const { id, nimi, koulu, luokka, pisteet } = body;
      const existing = tiedonTemppTulostaulu.find(r => r.id === id);
      if (existing && existing.score >= pisteet) {
        return lahetaJSON(res, 200, { ok: true, saved: false, reason: "Aiempi tulos on parempi" });
      }
      const pvm = new Date().toLocaleDateString("fi-FI");
      if (existing) {
        existing.name = nimi; existing.koulu = koulu; existing.luokka = luokka || "";
        existing.score = pisteet; existing.date = pvm; existing.updated = Date.now();
      } else {
        tiedonTemppTulostaulu.push({ id, name: nimi, koulu, luokka: luokka || "", score: pisteet, date: pvm, updated: Date.now() });
      }
      return lahetaJSON(res, 200, { ok: true, saved: true });
    }
    return lahetaJSON(res, 400, { ok: false, virhe: "tuntematon_toiminto" });
  }

  // ── API: ammattiset (paikallinen, muistipohjainen) ────────────────────────
  if (url.startsWith("/api/ammattiset")) {
    if (req.method === "OPTIONS") {
      res.writeHead(204, { "Access-Control-Allow-Origin": "*" });
      return res.end();
    }

    // GET
    if (req.method === "GET") {
      const params = new URL(url, "http://localhost").searchParams;
      const toiminto = params.get("toiminto") || "";

      if (toiminto === "tulostaulu") {
        const top10 = [...ammattSetTulostaulu]
          .sort((a, b) => b.score - a.score)
          .slice(0, 10);
        return lahetaJSON(res, 200, { ok: true, tulokset: top10 });
      }
      if (toiminto === "sanaryhmat") {
        return lahetaJSON(res, 200, { ok: true, ryhmat: ammattSetSanaryhmat.ryhmat });
      }
      return lahetaJSON(res, 400, { ok: false, virhe: "tuntematon_toiminto" });
    }

    // POST
    const raw = await lueRunko(req);
    let body = {};
    try { body = JSON.parse(raw); } catch { return lahetaJSON(res, 400, { ok: false, virhe: "virheellinen_pyynto" }); }
    const toiminto = body.toiminto || "";

    if (toiminto === "tallenna") {
      const { id, nimi, koulu, luokka, pisteet } = body;
      const existing = ammattSetTulostaulu.find(r => r.id === id);
      if (existing && existing.score >= pisteet) {
        return lahetaJSON(res, 200, { ok: true, saved: false, reason: "Aiempi tulos on parempi" });
      }
      const pvm = new Date().toLocaleDateString("fi-FI");
      if (existing) {
        existing.name = nimi; existing.koulu = koulu; existing.luokka = luokka || "";
        existing.score = pisteet; existing.date = pvm; existing.updated = Date.now();
      } else {
        ammattSetTulostaulu.push({ id, name: nimi, koulu, luokka: luokka || "", score: pisteet, date: pvm, updated: Date.now() });
      }
      return lahetaJSON(res, 200, { ok: true, saved: true });
    }
    if (toiminto === "hae_kaikki_tulokset") {
      if (body.admin_key !== AMMATTISET_ADMIN_KEY) return lahetaJSON(res, 200, { ok: false, virhe: "virheellinen_avain" });
      const top50 = [...ammattSetTulostaulu].sort((a, b) => b.score - a.score).slice(0, 50);
      return lahetaJSON(res, 200, { ok: true, tulokset: top50 });
    }
    if (toiminto === "poista_tulos") {
      if (body.admin_key !== AMMATTISET_ADMIN_KEY) return lahetaJSON(res, 200, { ok: false, virhe: "virheellinen_avain" });
      const idx = ammattSetTulostaulu.findIndex(r => r.id === body.id);
      if (idx !== -1) ammattSetTulostaulu.splice(idx, 1);
      return lahetaJSON(res, 200, { ok: true });
    }
    if (toiminto === "tyhjenna_tulostaulu") {
      if (body.admin_key !== AMMATTISET_ADMIN_KEY) return lahetaJSON(res, 200, { ok: false, virhe: "virheellinen_avain" });
      ammattSetTulostaulu.length = 0;
      return lahetaJSON(res, 200, { ok: true });
    }
    if (toiminto === "tallenna_sanaryhmat") {
      if (body.admin_key !== AMMATTISET_ADMIN_KEY) return lahetaJSON(res, 200, { ok: false, virhe: "virheellinen_avain" });
      ammattSetSanaryhmat.ryhmat = Array.isArray(body.ryhmat) ? body.ryhmat : [];
      return lahetaJSON(res, 200, { ok: true });
    }
    return lahetaJSON(res, 400, { ok: false, virhe: "tuntematon_toiminto" });
  }

  // ── API: lisenssi (paikallinen, hyväksyy kaiken) ──────────────────────────
  if (url === "/api/lisenssi") {
    if (req.method === "OPTIONS") {
      res.writeHead(204, { "Access-Control-Allow-Origin": "*" });
      return res.end();
    }
    await lueRunko(req); // kuluta runko
    const vuosiEteenpain = new Date();
    vuosiEteenpain.setFullYear(vuosiEteenpain.getFullYear() + 1);
    return lahetaJSON(res, 200, {
      ok: true,
      koulu: "Paikallinen esikatselu",
      voimassa_asti: vuosiEteenpain.toISOString(),
    });
  }

  // ── API: ping (käyttölaskuri) – hiljainen OK ──────────────────────────────
  if (url === "/api/ping") {
    if (req.method === "OPTIONS") {
      res.writeHead(204, { "Access-Control-Allow-Origin": "*" });
      return res.end();
    }
    await lueRunko(req);
    res.writeHead(200, { "Access-Control-Allow-Origin": "*" });
    return res.end();
  }

  // ── Siistit URLit (sama kuin vercel.json rewrites) ────────────────────────
  // Esim. /8luokka → /sivut/8luokka.html, jotta paikallinen esikatselu vastaa
  // tuotantoa. Yleistetty: /<nimi> (ilman päätettä) → /sivut/<nimi>.html jos on.
  const puhdasUrl = url.split("?")[0];
  const REWRITES = {
    "/7luokka": "/sivut/7luokka.html",
    "/8luokka": "/sivut/8luokka.html",
    "/9luokka": "/sivut/9luokka.html",
  };
  let reititettyUrl = url;
  if (REWRITES[puhdasUrl]) {
    reititettyUrl = REWRITES[puhdasUrl] + url.slice(puhdasUrl.length);
  } else if (/^\/[^./]+$/.test(puhdasUrl)) {
    const ehdokas = path.join(ROOT, "sivut", puhdasUrl.slice(1) + ".html");
    if (fs.existsSync(ehdokas)) reititettyUrl = "/sivut" + puhdasUrl + ".html" + url.slice(puhdasUrl.length);
  }

  // ── Staattiset tiedostot ──────────────────────────────────────────────────
  let polku = turvallinenPolku(reititettyUrl);
  if (!polku) {
    res.writeHead(403);
    return res.end("Kielletty");
  }

  fs.stat(polku, (err, stat) => {
    if (!err && stat.isDirectory()) {
      polku = path.join(polku, "index.html");
    }
    fs.readFile(polku, (err2, data) => {
      if (err2) {
        // Yritä 404-sivua, muuten yksinkertainen viesti
        fs.readFile(path.join(ROOT, "404.html"), (e3, d404) => {
          if (!e3) {
            res.writeHead(404, { "Content-Type": MIME[".html"] });
            return res.end(d404);
          }
          res.writeHead(404, { "Content-Type": MIME[".txt"] });
          res.end("404 – Tiedostoa ei löytynyt: " + url);
        });
        return;
      }
      const ext = path.extname(polku).toLowerCase();
      res.writeHead(200, {
        "Content-Type": MIME[ext] || "application/octet-stream",
        "Cache-Control": "no-cache",
      });
      res.end(data);
    });
  });
});

server.listen(PORT, () => {
  console.log("");
  console.log("  ✅  DigiOpo paikallinen esikatselu käynnissä");
  console.log("  →   http://localhost:" + PORT);
  console.log("");
  console.log("  Lisenssiportti hyväksyy paikallisesti minkä tahansa koodin.");
  console.log("  Pysäytä: paina Ctrl + C");
  console.log("");
});
