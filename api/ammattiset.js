// DigiOpo – AmmattiSet API
// ─────────────────────────────────────────────────────────────
// GET  /api/ammattiset?toiminto=tulostaulu        → { ok, tulokset[] }
// GET  /api/ammattiset?toiminto=sanaryhmat        → { ok, ryhmat[] }
// POST /api/ammattiset
//   { toiminto:"tallenna",             id, nimi, koulu, luokka, pisteet }
//   { toiminto:"hae_kaikki_tulokset",  admin_key }
//   { toiminto:"poista_tulos",         admin_key, id }
//   { toiminto:"tyhjenna_tulostaulu",  admin_key }
//   { toiminto:"tallenna_sanaryhmat",  admin_key, ryhmat[] }

import { kirjaaVirhe } from './_lib/virhelogi.js';
import { haeIp, vertaaSalaisuus } from './_lib/turva.js';

const SUPABASE_URL         = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
// HUOM: ei kovakoodattua oletusarvoa enää (oli aiemmin "AlaSet#2026!" suoraan
// koodissa – poistettu tietoturvasyistä). Jos ympäristömuuttuja puuttuu,
// admin-toiminnot lukittuvat sen sijaan että käyttäisivät tunnettua salasanaa.
const ADMIN_KEY = process.env.AMMATTISET_ADMIN_KEY || null;

// ── Rate limiter ──────────────────────────────────────────────
const yritykset = new Map();
const MAX_YRITYKSIA = 60;
const IKKUNA_MS = 5 * 60 * 1000;

function tarkistaRateLimit(ip) {
  const nyt = Date.now();
  const m = yritykset.get(ip) || { maara: 0, alku: nyt };
  if (nyt - m.alku > IKKUNA_MS) {
    yritykset.set(ip, { maara: 1, alku: nyt });
    return true;
  }
  if (m.maara >= MAX_YRITYKSIA) return false;
  yritykset.set(ip, { maara: m.maara + 1, alku: m.alku });
  return true;
}

// ── Supabase REST helpers ─────────────────────────────────────
function sbHeaders(extra = {}) {
  return {
    apikey:        SUPABASE_SERVICE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
    "Content-Type": "application/json",
    Accept:        "application/json",
    ...extra,
  };
}

async function sb(polku, opts = {}) {
  const base = (SUPABASE_URL || "").replace(/\/$/, "");
  const r = await fetch(`${base}/rest/v1/${polku}`, {
    ...opts,
    headers: sbHeaders(opts.headers || {}),
  });
  return r;
}

// ── Tietokantarivi → frontend-muoto ──────────────────────────
function riviTulokseksi(r) {
  return {
    id:      r.id,
    name:    r.nimi,
    koulu:   r.koulu,
    luokka:  r.luokka,
    score:   r.pisteet,
    date:    r.pvm,
    updated: r.paivitetty,
  };
}

// ─────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin",  "https://app.digiopo.fi");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return res.status(500).json({ ok: false, virhe: "palvelin_ei_konfiguroitu" });
  }

  // ── GET ─────────────────────────────────────────────────────
  if (req.method === "GET") {
    const toiminto = String(req.query.toiminto || "");

    if (toiminto === "tulostaulu") {
      try {
        const r = await sb("ammattiset_tulostaulu?order=pisteet.desc&limit=10&select=*");
        if (!r.ok) throw new Error(`DB ${r.status}`);
        const rivit = await r.json();
        return res.status(200).json({ ok: true, tulokset: rivit.map(riviTulokseksi) });
      } catch (err) {
        console.error("ammattiset GET tulostaulu:", err);
        await kirjaaVirhe('ammattiset GET tulostaulu', err);
        return res.status(500).json({ ok: false, virhe: "palvelinvirhe" });
      }
    }

    if (toiminto === "sanaryhmat") {
      try {
        const r = await sb("ammattiset_asetukset?avain=eq.sanaryhmat&select=arvo");
        if (!r.ok) throw new Error(`DB ${r.status}`);
        const rivit = await r.json();
        return res.status(200).json({ ok: true, ryhmat: rivit[0]?.arvo || [] });
      } catch (err) {
        console.error("ammattiset GET sanaryhmat:", err);
        await kirjaaVirhe('ammattiset GET sanaryhmat', err);
        return res.status(500).json({ ok: false, virhe: "palvelinvirhe" });
      }
    }

    return res.status(400).json({ ok: false, virhe: "tuntematon_toiminto" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, virhe: "metodi_ei_sallittu" });
  }

  // ── Rate limit ───────────────────────────────────────────────
  const ip = haeIp(req);
  if (!tarkistaRateLimit(ip)) {
    return res.status(429).json({ ok: false, virhe: "liikaa_yrityksia" });
  }

  let body;
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
  } catch {
    return res.status(400).json({ ok: false, virhe: "virheellinen_pyynto" });
  }

  const toiminto = String(body.toiminto || "");

  try {
    // ── TALLENNA TULOS ──────────────────────────────────────────
    if (toiminto === "tallenna") {
      const id      = String(body.id      || "").trim().slice(0, 80);
      const nimi    = String(body.nimi    || "").trim().slice(0, 30);
      const koulu   = String(body.koulu   || "").trim().slice(0, 40);
      const luokka  = String(body.luokka  || "").trim().slice(0, 10);
      const pisteet = parseInt(body.pisteet, 10);

      if (!id || !nimi || !koulu || isNaN(pisteet) || pisteet < 0) {
        return res.status(400).json({ ok: false, virhe: "virheelliset_parametrit" });
      }

      const r = await sb("rpc/ammattiset_tallenna_tulos", {
        method: "POST",
        body: JSON.stringify({
          p_id:        id,
          p_nimi:      nimi,
          p_koulu:     koulu,
          p_luokka:    luokka,
          p_pisteet:   pisteet,
          p_pvm:       new Date().toLocaleDateString("fi-FI"),
          p_paivitetty: Date.now(),
        }),
      });
      if (!r.ok) throw new Error(`DB ${r.status}: ${await r.text()}`);
      const tulos = await r.json();

      if (tulos === "aiempi_parempi") {
        return res.status(200).json({ ok: true, saved: false, reason: "Aiempi tulos on parempi" });
      }
      return res.status(200).json({ ok: true, saved: true });
    }

    // ── HAE KAIKKI TULOKSET (opettaja) ─────────────────────────
    if (toiminto === "hae_kaikki_tulokset") {
      if (!vertaaSalaisuus(String(body.admin_key || ""), ADMIN_KEY)) {
        return res.status(200).json({ ok: false, virhe: "virheellinen_avain" });
      }
      const r = await sb("ammattiset_tulostaulu?order=pisteet.desc&limit=50&select=*");
      if (!r.ok) throw new Error(`DB ${r.status}`);
      const rivit = await r.json();
      return res.status(200).json({ ok: true, tulokset: rivit.map(riviTulokseksi) });
    }

    // ── POISTA TULOS (opettaja) ─────────────────────────────────
    if (toiminto === "poista_tulos") {
      if (!vertaaSalaisuus(String(body.admin_key || ""), ADMIN_KEY)) {
        return res.status(200).json({ ok: false, virhe: "virheellinen_avain" });
      }
      const id = String(body.id || "").trim();
      if (!id) return res.status(400).json({ ok: false, virhe: "id_puuttuu" });

      const r = await sb(
        `ammattiset_tulostaulu?id=eq.${encodeURIComponent(id)}`,
        { method: "DELETE" }
      );
      if (!r.ok && r.status !== 404) throw new Error(`DB ${r.status}`);
      return res.status(200).json({ ok: true });
    }

    // ── TYHJENNÄ TULOSTAULU (opettaja) ─────────────────────────
    if (toiminto === "tyhjenna_tulostaulu") {
      if (!vertaaSalaisuus(String(body.admin_key || ""), ADMIN_KEY)) {
        return res.status(200).json({ ok: false, virhe: "virheellinen_avain" });
      }
      const r = await sb("rpc/ammattiset_tyhjenna_tulostaulu", {
        method: "POST",
        body: "{}",
      });
      if (!r.ok) throw new Error(`DB ${r.status}`);
      return res.status(200).json({ ok: true });
    }

    // ── TALLENNA SANARYHMÄT (opettaja) ──────────────────────────
    if (toiminto === "tallenna_sanaryhmat") {
      if (!vertaaSalaisuus(String(body.admin_key || ""), ADMIN_KEY)) {
        return res.status(200).json({ ok: false, virhe: "virheellinen_avain" });
      }
      if (!Array.isArray(body.ryhmat)) {
        return res.status(400).json({ ok: false, virhe: "virheelliset_parametrit" });
      }
      const puhdas = body.ryhmat
        .filter(r => r && typeof r.theme === "string" && Array.isArray(r.words))
        .map(r => ({
          theme: String(r.theme).slice(0, 80),
          words: r.words.map(w => String(w).slice(0, 40)).slice(0, 4),
        }));

      const r = await sb("ammattiset_asetukset?on_conflict=avain", {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify({
          avain:     "sanaryhmat",
          arvo:      puhdas,
          paivitetty: new Date().toISOString(),
        }),
      });
      if (r.status >= 300) throw new Error(`DB ${r.status}: ${await r.text()}`);
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ ok: false, virhe: "tuntematon_toiminto" });

  } catch (err) {
    console.error("ammattiset POST:", err);
    await kirjaaVirhe('ammattiset POST', err, { toiminto });
    return res.status(500).json({ ok: false, virhe: "palvelinvirhe" });
  }
}
