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
//   { toiminto: "admin_nollaa_pin", ryhma }   + header x-admin-key: <ADMIN_DASHBOARD_KEY>
//      → { ok: true, ryhmakoodi, uusiPin }    (vaihtaa PIN:n, järjestys säilyy)
//
// Selain ei koskaan puhu suoraan Supabaseen — tämä funktio käyttää service_keytä.

import crypto from 'node:crypto';
import { kirjaaVirhe } from './_lib/virhelogi.js';
import { haeIp, vertaaSalaisuus } from './_lib/turva.js';
import { haeKirjautunutOpettaja } from './_lib/opettaja.js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const ADMIN_DASHBOARD_KEY = process.env.ADMIN_DASHBOARD_KEY; // sama admin-avain kuin admin-tilastoissa
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

// Arpoo pelkistä numeroista koostuvan PIN:n (sama sääntö kuin opettajan valitsema:
// vähintään 6 numeroa, vain numeroita). Käytetään admin-PIN-nollauksessa.
function arvoNumeroPin(pituus = 8) {
  return Array.from(crypto.randomBytes(pituus)).map((b) => b % 10).join('');
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
  const r = await sb(`opetusryhmat?ryhmakoodi=eq.${encodeURIComponent(ryhmakoodi)}&select=ryhmakoodi,avain_hash,omistaja_email`);
  if (!r.ok) throw new Error(`DB-virhe ${r.status}: ${await r.text()}`);
  return (await r.json())[0] || null;
}

// ─── Handler ─────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  // Sama kuin admin-tilastot/admin-viesti: sallitaan kaikki alkuperät, jotta
  // paikallinen admin-paneeli (file://) voi kutsua admin_nollaa_pin-toimintoa.
  // Kirjoitustoiminnot on suojattu PIN:llä tai x-admin-key:llä, ei evästeellä,
  // joten '*' ei avaa CSRF-riskiä (ei ambient-tunnistautumista).
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-key');
  if (req.method === 'OPTIONS') return res.status(204).end();

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return res.status(500).json({ ok: false, virhe: 'palvelin_ei_konfiguroitu' });
  }

  // ── GET: hae ryhmän järjestys (julkinen luku) ──
  if (req.method === 'GET') {
    const ryhma = String(req.query.ryhma || '').trim().toUpperCase();

    // GET ?ryhma=KOODI&luokat=1  →  mitkä luokat ryhmällä on tallennettuja järjestyksiä
    if (req.query.luokat === '1') {
      if (!/^[A-Z0-9-]{4,16}$/.test(ryhma)) {
        return res.status(400).json({ ok: false, virhe: 'virheellinen_pyynto' });
      }
      try {
        const r = await sb(`jarjestykset?ryhmakoodi=eq.${encodeURIComponent(ryhma)}&select=luokka`);
        if (!r.ok) throw new Error(`DB-virhe ${r.status}`);
        const rivit = await r.json();
        return res.status(200).json({ ok: true, luokat: rivit.map((rv) => rv.luokka) });
      } catch (err) {
        console.error('jarjestys GET luokat:', err);
        await kirjaaVirhe('jarjestys GET luokat', err);
        return res.status(500).json({ ok: false, virhe: 'palvelinvirhe' });
      }
    }

    const luokka = String(req.query.luokka || '').trim();
    if (!/^[A-Z0-9-]{4,16}$/.test(ryhma) || !SALLITUT_LUOKAT.includes(luokka)) {
      return res.status(400).json({ ok: false, virhe: 'virheellinen_pyynto' });
    }
    try {
      const r = await sb(`jarjestykset?ryhmakoodi=eq.${encodeURIComponent(ryhma)}&luokka=eq.${luokka}&select=jarjestys,lukitut`);
      if (!r.ok) throw new Error(`DB-virhe ${r.status}`);
      const rivi = (await r.json())[0];
      return res.status(200).json({
        ok: true,
        jarjestys: rivi ? rivi.jarjestys : null,
        lukitut: rivi ? (rivi.lukitut || []) : [],
      });
    } catch (err) {
      console.error('jarjestys GET:', err);
      await kirjaaVirhe('jarjestys GET', err);
      return res.status(500).json({ ok: false, virhe: 'palvelinvirhe' });
    }
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, virhe: 'metodi_ei_sallittu' });
  }

  // ── Rate limit POST-toiminnoille ──
  const ip = haeIp(req);
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

  // ── ADMIN-toiminnot (x-admin-key-suojatut, sama avain kuin admin-tilastot) ──
  // Ryhmien hallinta admin-paneelista: listaa, nimeä, nollaa PIN, poista.
  const ADMIN_TOIMINNOT = ['admin_nollaa_pin', 'admin_ryhmat_lista', 'admin_nimea', 'admin_poista'];
  if (ADMIN_TOIMINNOT.includes(toiminto)) {
    if (!ADMIN_DASHBOARD_KEY || !vertaaSalaisuus(req.headers['x-admin-key'] || '', ADMIN_DASHBOARD_KEY)) {
      return res.status(403).json({ ok: false, virhe: 'ei_oikeutta' });
    }
    try {
      // LISTA: kaikki ryhmät hallintanäkymälle (uusin ensin)
      if (toiminto === 'admin_ryhmat_lista') {
        const r = await sb('opetusryhmat?select=ryhmakoodi,nimi,koulukoodi,luotu_at&order=luotu_at.desc');
        if (!r.ok) throw new Error(`DB-virhe ${r.status}: ${await r.text()}`);
        return res.status(200).json({ ok: true, ryhmat: await r.json() });
      }

      // Loput toiminnot koskevat yhtä ryhmää
      const ryhma = String(body.ryhma || '').trim().toUpperCase();
      if (!/^[A-Z0-9-]{4,16}$/.test(ryhma)) {
        return res.status(400).json({ ok: false, virhe: 'virheellinen_pyynto' });
      }
      if (!(await haeRyhma(ryhma))) {
        return res.status(404).json({ ok: false, virhe: 'ryhmaa_ei_loydy' });
      }

      // NIMEÄ (Update): aseta ryhmän nimi (esim. "7A")
      if (toiminto === 'admin_nimea') {
        const nimi = body.nimi == null ? null : (String(body.nimi).trim().slice(0, 80) || null);
        const r = await sb(`opetusryhmat?ryhmakoodi=eq.${encodeURIComponent(ryhma)}`, {
          method: 'PATCH',
          headers: { Prefer: 'return=minimal' },
          body: JSON.stringify({ nimi }),
        });
        if (r.status >= 300) throw new Error(`DB-virhe ${r.status}: ${await r.text()}`);
        return res.status(200).json({ ok: true, ryhmakoodi: ryhma, nimi });
      }

      // NOLLAA PIN: vaihda avain_hash, palauta uusi numeerinen PIN opettajalle
      if (toiminto === 'admin_nollaa_pin') {
        const uusiPin = arvoNumeroPin(8);
        const r = await sb(`opetusryhmat?ryhmakoodi=eq.${encodeURIComponent(ryhma)}`, {
          method: 'PATCH',
          headers: { Prefer: 'return=minimal' },
          body: JSON.stringify({ avain_hash: hashAvain(uusiPin) }),
        });
        if (r.status >= 300) throw new Error(`DB-virhe ${r.status}: ${await r.text()}`);
        return res.status(200).json({ ok: true, ryhmakoodi: ryhma, uusiPin });
      }

      // POISTA (Delete): poistaa ryhmän + sen järjestykset ja aikataulut (ON DELETE
      // CASCADE). Tuplavarmistus: body.vahvista täytyy olla sama kuin ryhmäkoodi.
      if (toiminto === 'admin_poista') {
        if (String(body.vahvista || '').trim().toUpperCase() !== ryhma) {
          return res.status(400).json({ ok: false, virhe: 'vahvistus_puuttuu' });
        }
        const r = await sb(`opetusryhmat?ryhmakoodi=eq.${encodeURIComponent(ryhma)}`, {
          method: 'DELETE',
          headers: { Prefer: 'return=minimal' },
        });
        if (r.status >= 300) throw new Error(`DB-virhe ${r.status}: ${await r.text()}`);
        return res.status(200).json({ ok: true, ryhmakoodi: ryhma, poistettu: true });
      }
    } catch (err) {
      console.error('jarjestys admin CRUD:', err);
      await kirjaaVirhe('jarjestys admin CRUD', err, { toiminto });
      return res.status(500).json({ ok: false, virhe: 'palvelinvirhe' });
    }
  }

  const avain = String(body.avain || '');
  if (avain.length < 4 || avain.length > 64) {
    return res.status(400).json({ ok: false, virhe: 'avain_virheellinen' });
  }

  try {
    // ── REKISTERÖI: luo uusi opetusryhmä ──
    if (toiminto === 'rekisteroi') {
      // Uudet PIN:it: väh. 6 numeroa (vain numerot, kuten puhelimen PIN).
      // Suoja oppilaiden arvailua vastaan. Vanhojen ryhmien tarkistus
      // (tarkista/tallenna) jää sallivaksi, jottei ketään lukita ulos.
      if (!/^\d{6,}$/.test(avain)) {
        return res.status(400).json({ ok: false, virhe: 'avain_liian_lyhyt' });
      }
      const koulukoodi = body.koulukoodi ? String(body.koulukoodi).trim().slice(0, 40) : null;
      const nimi = body.nimi ? String(body.nimi).trim().slice(0, 80) : null;
      const avain_hash = hashAvain(avain);
      // Jos opettaja on kirjautunut tililleen, leimaa ryhmä hänen omistamakseen.
      // Ilman kirjautumista (esim. koulukoodilla) omistaja jää tyhjäksi.
      const omistaja_email = await haeKirjautunutOpettaja(req);

      // Yritä luoda uniikki ryhmäkoodi (max 5 yritystä törmäyksen varalta)
      for (let i = 0; i < 5; i++) {
        const ryhmakoodi = arvoRyhmakoodi();
        const r = await sb('opetusryhmat', {
          method: 'POST',
          headers: { Prefer: 'return=representation' },
          body: JSON.stringify({ ryhmakoodi, avain_hash, koulukoodi, nimi, omistaja_email }),
        });
        if (r.status === 201) {
          return res.status(200).json({ ok: true, ryhmakoodi, omistaja_email });
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
      const lukitut = body.lukitut == null ? [] : body.lukitut;
      if (!/^[A-Z0-9-]{4,16}$/.test(ryhma) || !SALLITUT_LUOKAT.includes(luokka)) {
        return res.status(400).json({ ok: false, virhe: 'virheellinen_pyynto' });
      }
      if (!validiJarjestys(jarjestys) || !validiJarjestys(lukitut)) {
        return res.status(400).json({ ok: false, virhe: 'jarjestys_virheellinen' });
      }

      const ryhmaRivi = await haeRyhma(ryhma);
      if (!ryhmaRivi || ryhmaRivi.avain_hash !== hashAvain(avain)) {
        return res.status(200).json({ ok: false, virhe: 'avain_ei_tasmaa' });
      }

      const r = await sb('jarjestykset?on_conflict=ryhmakoodi,luokka', {
        method: 'POST',
        headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
        body: JSON.stringify({ ryhmakoodi: ryhma, luokka, jarjestys, lukitut }),
      });
      if (r.status >= 300) throw new Error(`DB-virhe ${r.status}: ${await r.text()}`);
      return res.status(200).json({ ok: true });
    }

    // ── OTA HALTUUN: liitä olemassa oleva ryhmä kirjautuneen opettajan tiliin ──
    // Vaatii kirjautuneen opettajan (eväste) + oikean PIN:n. Asettaa omistajan
    // vain jos ryhmällä ei vielä ole omistajaa → ei kaappausta.
    if (toiminto === 'ota_haltuun') {
      const opettaja = await haeKirjautunutOpettaja(req);
      if (!opettaja) return res.status(403).json({ ok: false, virhe: 'ei_kirjautunut' });
      const ryhma = String(body.ryhma || '').trim().toUpperCase();
      if (!/^[A-Z0-9-]{4,16}$/.test(ryhma)) {
        return res.status(400).json({ ok: false, virhe: 'virheellinen_pyynto' });
      }
      const rivi = await haeRyhma(ryhma);
      if (!rivi) return res.status(404).json({ ok: false, virhe: 'ryhmaa_ei_loydy' });
      if (rivi.avain_hash !== hashAvain(avain)) {
        return res.status(200).json({ ok: false, virhe: 'avain_ei_tasmaa' });
      }
      if (rivi.omistaja_email && rivi.omistaja_email !== opettaja) {
        return res.status(200).json({ ok: false, virhe: 'jo_omistettu' });
      }
      if (rivi.omistaja_email === opettaja) {
        return res.status(200).json({ ok: true, ryhmakoodi: ryhma, omistaja_email: opettaja });
      }
      const r = await sb(`opetusryhmat?ryhmakoodi=eq.${encodeURIComponent(ryhma)}`, {
        method: 'PATCH',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({ omistaja_email: opettaja }),
      });
      if (r.status >= 300) throw new Error(`DB-virhe ${r.status}: ${await r.text()}`);
      return res.status(200).json({ ok: true, ryhmakoodi: ryhma, omistaja_email: opettaja });
    }

    return res.status(400).json({ ok: false, virhe: 'tuntematon_toiminto' });
  } catch (err) {
    console.error('jarjestys POST:', err);
    await kirjaaVirhe('jarjestys POST', err, { toiminto });
    return res.status(500).json({ ok: false, virhe: 'palvelinvirhe' });
  }
}
