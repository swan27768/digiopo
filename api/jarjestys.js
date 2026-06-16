// DigiOpo – Osiojärjestyksen jako (Vaihe 2)
//
// GET  /api/jarjestys?ryhma=7A-K3M9&luokka=7
//      → { ok: true, jarjestys: ["johdanto", ...] | null }   (julkinen luku)
//
// POST /api/jarjestys   (JSON body, toiminto-kenttä ratkaisee)
//   { toiminto: "rekisteroi", avain, koulukoodi?, nimi? }
//      → { ok: true, ryhmakoodi: "7A-K3M9" }                 (luo ryhmän)
//   { toiminto: "tallenna", ryhma, avain, luokka, jarjestys }
//      → { ok: true }                                        (vaatii avaimen)
//
// Selain ei koskaan puhu suoraan Supabaseen — tämä funktio käyttää service_keytä.

import crypto from 'node:crypto';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const PEPPER = process.env.JARJESTYS_PEPPER || ''; // valinnainen lisäsuola avainhashille

const SALLITUT_LUOKAT = ['7', '8', '9'];
const KOODI_AAKKOSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // ei sekoittuvia (0/O, 1/I)

// ─── Rate limiter (muistipohjainen, kuten lisenssi.js) ───────────────────────
const yritykset = new Map();
const MAX_YRITYKSIA = 20;
const IKKUNA_MS = 10 * 60 * 1000;

function tarkistaRateLimit(ip) {
  const nyt = Date.now();
  const m = yritykset.get(ip) || { maara: 0, alku: nyt };
  if (nyt - m.alku > IKKUNA_MS) { yritykset.set(ip, { maara: 1, alku: nyt }); return true; }
  if (m.maara >= MAX_YRITYKSIA) return false;
  yritykset.set(ip, { maara: m.maara + 1, alku: m.alku });
  return true;
}

// ─── Apurit ──────────────────────────────────────────────────────────────────
function hashAvain(avain) {
  return crypto.createHash('sha256').update(`${PEPPER}:${avain}`).digest('hex');
}

function arvoRyhmakoodi() {
  const osa = (n) => Array.from(crypto.randomBytes(n))
    .map((b) => KOODI_AAKKOSET[b % KOODI_AAKKOSET.length]).join('');
  return `${osa(3)}-${osa(4)}`; // esim. "K3M-9PQ2"
}

function validiJarjestys(arr) {
  return Array.isArray(arr) && arr.length <= 40 &&
    arr.every((x) => typeof x === 'string' && /^[a-z0-9-]{1,40}$/.test(x));
}

async function sb(path, opts = {}) {
  const base = SUPABASE_URL.replace(/\/$/, '');
  const r = await fetch(`${base}/rest/v1/${path}`, {
    ...opts,
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(opts.headers || {}),
    },
  });
  return r;
}

async function haeRyhma(ryhmakoodi) {
  const r = await sb(`opetusryhmat?ryhmakoodi=eq.${encodeURIComponent(ryhmakoodi)}&select=ryhmakoodi,avain_hash`);
  if (!r.ok) throw new Error(`DB-virhe ${r.status}: ${await r.text()}`);
  return (await r.json())[0] || null;
}

// ─── Handler ─────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://app.digiopo.fi');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return res.status(500).json({ ok: false, virhe: 'palvelin_ei_konfiguroitu' });
  }

  // ── GET: hae ryhmän järjestys (julkinen luku) ──
  if (req.method === 'GET') {
    const ryhma = String(req.query.ryhma || '').trim().toUpperCase();
    const luokka = String(req.query.luokka || '').trim();
    if (!/^[A-Z0-9-]{4,16}$/.test(ryhma) || !SALLITUT_LUOKAT.includes(luokka)) {
      return res.status(400).json({ ok: false, virhe: 'virheellinen_pyynto' });
    }
    try {
      const r = await sb(`jarjestykset?ryhmakoodi=eq.${encodeURIComponent(ryhma)}&luokka=eq.${luokka}&select=jarjestys`);
      if (!r.ok) throw new Error(`DB-virhe ${r.status}`);
      const rivi = (await r.json())[0];
      return res.status(200).json({ ok: true, jarjestys: rivi ? rivi.jarjestys : null });
    } catch (err) {
      console.error('jarjestys GET:', err);
      return res.status(500).json({ ok: false, virhe: 'palvelinvirhe' });
    }
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, virhe: 'metodi_ei_sallittu' });
  }

  // ── Rate limit POST-toiminnoille ──
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim()
    || req.socket?.remoteAddress || 'tuntematon';
  if (!tarkistaRateLimit(ip)) {
    return res.status(429).json({ ok: false, virhe: 'liikaa_yrityksia' });
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
  } catch {
    return res.status(400).json({ ok: false, virhe: 'virheellinen_pyynto' });
  }

  const toiminto = body.toiminto;
  const avain = String(body.avain || '');
  if (avain.length < 4 || avain.length > 64) {
    return res.status(400).json({ ok: false, virhe: 'avain_virheellinen' });
  }

  try {
    // ── REKISTERÖI: luo uusi opetusryhmä ──
    if (toiminto === 'rekisteroi') {
      const koulukoodi = body.koulukoodi ? String(body.koulukoodi).trim().slice(0, 40) : null;
      const nimi = body.nimi ? String(body.nimi).trim().slice(0, 80) : null;
      const avain_hash = hashAvain(avain);

      // Yritä luoda uniikki ryhmäkoodi (max 5 yritystä törmäyksen varalta)
      for (let i = 0; i < 5; i++) {
        const ryhmakoodi = arvoRyhmakoodi();
        const r = await sb('opetusryhmat', {
          method: 'POST',
          headers: { Prefer: 'return=representation' },
          body: JSON.stringify({ ryhmakoodi, avain_hash, koulukoodi, nimi }),
        });
        if (r.status === 201) {
          return res.status(200).json({ ok: true, ryhmakoodi });
        }
        if (r.status !== 409) { // 409 = törmäys, kokeile uutta koodia
          throw new Error(`DB-virhe ${r.status}: ${await r.text()}`);
        }
      }
      return res.status(500).json({ ok: false, virhe: 'koodin_luonti_epaonnistui' });
    }

    // ── TARKISTA: vahvista avain avaamatta/kirjoittamatta mitään ──
    if (toiminto === 'tarkista') {
      const ryhma = String(body.ryhma || '').trim().toUpperCase();
      if (!/^[A-Z0-9-]{4,16}$/.test(ryhma)) {
        return res.status(400).json({ ok: false, virhe: 'virheellinen_pyynto' });
      }
      const rivi = await haeRyhma(ryhma);
      const tasmaa = !!rivi && rivi.avain_hash === hashAvain(avain);
      return res.status(200).json(tasmaa ? { ok: true } : { ok: false, virhe: 'avain_ei_tasmaa' });
    }

    // ── TALLENNA: päivitä ryhmän järjestys (vaatii oikean avaimen) ──
    if (toiminto === 'tallenna') {
      const ryhma = String(body.ryhma || '').trim().toUpperCase();
      const luokka = String(body.luokka || '').trim();
      const jarjestys = body.jarjestys;
      if (!/^[A-Z0-9-]{4,16}$/.test(ryhma) || !SALLITUT_LUOKAT.includes(luokka)) {
        return res.status(400).json({ ok: false, virhe: 'virheellinen_pyynto' });
      }
      if (!validiJarjestys(jarjestys)) {
        return res.status(400).json({ ok: false, virhe: 'jarjestys_virheellinen' });
      }

      const ryhmaRivi = await haeRyhma(ryhma);
      if (!ryhmaRivi || ryhmaRivi.avain_hash !== hashAvain(avain)) {
        return res.status(200).json({ ok: false, virhe: 'avain_ei_tasmaa' });
      }

      const r = await sb('jarjestykset?on_conflict=ryhmakoodi,luokka', {
        method: 'POST',
        headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
        body: JSON.stringify({ ryhmakoodi: ryhma, luokka, jarjestys }),
      });
      if (r.status >= 300) throw new Error(`DB-virhe ${r.status}: ${await r.text()}`);
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ ok: false, virhe: 'tuntematon_toiminto' });
  } catch (err) {
    console.error('jarjestys POST:', err);
    return res.status(500).json({ ok: false, virhe: 'palvelinvirhe' });
  }
}
