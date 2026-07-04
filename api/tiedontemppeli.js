// DigiOpo – Tiedon Temppeli API
// ─────────────────────────────────────────────────────────────
// GET  /api/tiedontemppeli?toiminto=tulostaulu   → { ok, tulokset[] }
// POST /api/tiedontemppeli
//   { toiminto:"tallenna", id, nimi, koulu, luokka, pisteet }  → { ok, saved, reason? }

import { kirjaaVirhe } from './_lib/virhelogi.js';

const SUPABASE_URL         = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

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

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin",  "https://app.digiopo.fi");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return res.status(500).json({ ok: false, virhe: "palvelin_ei_konfiguroitu" });
  }

  // ── GET: tulostaulu ──────────────────────────────────────────
  if (req.method === "GET") {
    if (String(req.query.toiminto || "") !== "tulostaulu") {
      return res.status(400).json({ ok: false, virhe: "tuntematon_toiminto" });
    }
    try {
      const r = await sb("tiedontemppeli_tulostaulu?order=pisteet.desc&limit=5&select=*");
      if (!r.ok) throw new Error(`DB ${r.status}`);
      const rivit = await r.json();
      return res.status(200).json({ ok: true, tulokset: rivit.map(riviTulokseksi) });
    } catch (err) {
      console.error("tiedontemppeli GET:", err);
      await kirjaaVirhe('tiedontemppeli GET', err);
      return res.status(500).json({ ok: false, virhe: "palvelinvirhe" });
    }
  }

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, virhe: "metodi_ei_sallittu" });
  }

  // ── Rate limit ───────────────────────────────────────────────
  const ip =
    (req.headers["x-forwarded-for"] || "").split(",")[0].trim() ||
    req.socket?.remoteAddress ||
    "tuntematon";
  if (!tarkistaRateLimit(ip)) {
    return res.status(429).json({ ok: false, virhe: "liikaa_yrityksia" });
  }

  let body;
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
  } catch {
    return res.status(400).json({ ok: false, virhe: "virheellinen_pyynto" });
  }

  if (String(body.toiminto || "") !== "tallenna") {
    return res.status(400).json({ ok: false, virhe: "tuntematon_toiminto" });
  }

  // ── POST: tallenna tulos ─────────────────────────────────────
  const id      = String(body.id      || "").trim().slice(0, 80);
  const nimi    = String(body.nimi    || "").trim().slice(0, 30);
  const koulu   = String(body.koulu   || "").trim().slice(0, 40);
  const luokka  = String(body.luokka  || "").trim().slice(0, 10);
  const pisteet = parseInt(body.pisteet, 10);

  if (!id || !nimi || !koulu || isNaN(pisteet) || pisteet < 0) {
    return res.status(400).json({ ok: false, virhe: "virheelliset_parametrit" });
  }

  try {
    const r = await sb("rpc/tiedontemppeli_tallenna_tulos", {
      method: "POST",
      body: JSON.stringify({
        p_id:         id,
        p_nimi:       nimi,
        p_koulu:      koulu,
        p_luokka:     luokka,
        p_pisteet:    pisteet,
        p_pvm:        new Date().toLocaleDateString("fi-FI"),
        p_paivitetty: Date.now(),
      }),
    });
    if (!r.ok) throw new Error(`DB ${r.status}: ${await r.text()}`);
    const tulos = await r.json();

    if (tulos === "aiempi_parempi") {
      return res.status(200).json({ ok: true, saved: false, reason: "Aiempi tulos on parempi" });
    }
    return res.status(200).json({ ok: true, saved: true });
  } catch (err) {
    console.error("tiedontemppeli POST:", err);
    await kirjaaVirhe('tiedontemppeli POST', err);
    return res.status(500).json({ ok: false, virhe: "palvelinvirhe" });
  }
}
