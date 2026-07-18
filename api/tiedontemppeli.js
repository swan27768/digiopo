// DigiOpo – Tiedon Temppeli API
// ─────────────────────────────────────────────────────────────
// GET  /api/tiedontemppeli?toiminto=tulostaulu   → { ok, tulokset[] }
// POST /api/tiedontemppeli
//   { toiminto:"tallenna", id, nimi, koulu, luokka, pisteet }  → { ok, saved, reason? }

import { kirjaaVirhe } from './_lib/virhelogi.js';
import { haeIp } from './_lib/turva.js';
import { rateLimitSallittu } from './_lib/rate.js';

const SUPABASE_URL         = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

// ── Rate limit: jaettu Redis-laskuri (ks. _lib/rate.js) ───────
// Toimii serverless-instanssien kesken (aiempi Map nollautui cold startissa).
const RL_MAX = 120;          // POST-toimintoja per IP
const RL_IKKUNA_S = 5 * 60;  // 5 minuutin ikkuna

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

  // ── Rate limit (Redis, jaettu instanssien kesken) ────────────
  const ip = haeIp(req);
  if (!(await rateLimitSallittu(`rl:tiedontemppeli:ip:${ip}`, RL_MAX, RL_IKKUNA_S))) {
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
