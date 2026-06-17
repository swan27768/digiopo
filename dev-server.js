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
// - Jos haluat testata Claude-tekoälyä paikallisesti, aseta ANTHROPIC_API_KEY
//   ympäristömuuttuja, niin /v1/messages välitetään Anthropicin rajapintaan.
//
// Tämä tiedosto EI vaikuta tuotantoon eikä kuluta Vercelin julkaisurajaa.

const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 8000;
const ROOT = __dirname;
const API_KEY = process.env.ANTHROPIC_API_KEY || null;

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

  // ── Valinnainen: Claude-välitys (vain jos API-avain annettu) ───────────────
  if (url === "/v1/messages" && req.method === "POST") {
    if (!API_KEY) {
      return lahetaJSON(res, 503, {
        error:
          "ANTHROPIC_API_KEY ei asetettu – tekoälyä ei testata paikallisesti.",
      });
    }
    const body = await lueRunko(req);
    const optiot = {
      hostname: "api.anthropic.com",
      path: "/v1/messages",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Length": Buffer.byteLength(body),
      },
    };
    const apiReq = https.request(optiot, (apiRes) => {
      res.writeHead(apiRes.statusCode, {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      });
      apiRes.pipe(res);
    });
    apiReq.on("error", (err) => lahetaJSON(res, 500, { error: err.message }));
    apiReq.write(body);
    apiReq.end();
    return;
  }

  // ── Staattiset tiedostot ──────────────────────────────────────────────────
  let polku = turvallinenPolku(url);
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
  console.log(
    "  Tekoäly: " +
      (API_KEY ? "käytössä (API-avain löytyi)" : "ei testissä (ei tarpeen esikatselussa)")
  );
  console.log("  Pysäytä: paina Ctrl + C");
  console.log("");
});
