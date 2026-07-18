// DigiOpo – Koulukohtainen lukuvuoden aikataulu (Vaihe 2)
//
// GET  /api/aikataulu?ryhma=7A-K3M9
//      → { ok:true, tapahtumat:[ {id,otsikko,tyyppi,alku_pvm,loppu_pvm,kuvaus}, ... ] }
//        (julkinen luku, oppilaille; järjestetty alku_pvm:n mukaan nousevasti)
//
// POST /api/aikataulu   (JSON body, toiminto-kenttä ratkaisee — kaikki vaativat avaimen)
//   { toiminto:"lisaa",   ryhma, avain, otsikko, tyyppi, alku_pvm, loppu_pvm?, kuvaus? }
//        → { ok:true, id }
//   { toiminto:"muokkaa", ryhma, avain, id, otsikko, tyyppi, alku_pvm, loppu_pvm?, kuvaus? }
//        → { ok:true }
//   { toiminto:"poista",  ryhma, avain, id }
//        → { ok:true }
//
// Selain ei koskaan puhu suoraan Supabaseen — tämä funktio käyttää service_keytä.
// Sama opettaja-avain kuin järjestyksessä (opetusryhmat-taulu + JARJESTYS_PEPPER).

import crypto from 'node:crypto';
import { kirjaaVirhe } from './_lib/virhelogi.js';
import { haeIp } from './_lib/turva.js';
import { haeKirjautunutOpettaja } from './_lib/opettaja.js';
import { rateLimitSallittu } from './_lib/rate.js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const PEPPER = process.env.JARJESTYS_PEPPER || ''; // sama suola kuin jarjestys.js:ssä

const SALLITUT_TYYPIT = ['tet', 'yhteishaku', 'palautus', 'tapahtuma', 'muu'];
const SALLITUT_LUOKAT = ['7', '8', '9'];
const MAX_TAPAHTUMIA = 12; // tulevien enimmäismäärä per ryhmä JA luokka (menneet siivotaan automaattisesti)

// ─── Rate limit (Redis, jaettu instanssien kesken – ks. _lib/rate.js) ────────
const RL_MAX = 40;           // POST-toimintoja per IP
const RL_IKKUNA_S = 10 * 60; // 10 minuutin ikkuna

// ─── Apurit ──────────────────────────────────────────────────────────────────
function hashAvain(avain) {
  return crypto.createHash('sha256').update(`${PEPPER}:${avain}`).digest('hex');
}

function validiRyhma(r) {
  return /^[A-Z0-9-]{4,16}$/.test(r);
}

function validiId(id) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

function validiPvm(s) {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

// Lukee ja normalisoi tapahtuman kentät bodystä
function lueKentat(body) {
  return {
    otsikko: String(body.otsikko || '').trim(),
    tyyppi: String(body.tyyppi || 'muu').trim(),
    alku_pvm: String(body.alku_pvm || '').trim(),
    loppu_pvm: body.loppu_pvm == null || body.loppu_pvm === '' ? null : String(body.loppu_pvm).trim(),
    kuvaus: body.kuvaus == null || body.kuvaus === '' ? null : String(body.kuvaus).trim(),
  };
}

// Palauttaa virhekoodin tai null jos kentät ovat kelvolliset
function validoiKentat(k) {
  if (!k.otsikko || k.otsikko.length > 80) return 'otsikko_virheellinen';
  if (!SALLITUT_TYYPIT.includes(k.tyyppi)) return 'tyyppi_virheellinen';
  if (!validiPvm(k.alku_pvm)) return 'pvm_virheellinen';
  if (k.loppu_pvm !== null && !validiPvm(k.loppu_pvm)) return 'pvm_virheellinen';
  if (k.loppu_pvm !== null && k.loppu_pvm < k.alku_pvm) return 'pvm_jarjestys';
  if (k.kuvaus !== null && k.kuvaus.length > 200) return 'kuvaus_liian_pitka';
  return null;
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

// Poistaa menneet tapahtumat (viimeinen pvm eilinen tai vanhempi).
// Pitää taulun siistinä ja vapauttaa tilaa enimmäismäärästä. Sama menneen
// määritelmä kuin näkymässä: viimeinen pvm = loppu_pvm tai (jos ei ole) alku_pvm.
async function poistaMenneet(ryhma, luokka) {
  const nyt = new Date().toISOString().slice(0, 10);
  const r = await sb(
    `lukuvuosi_tapahtumat?ryhmakoodi=eq.${encodeURIComponent(ryhma)}&luokka=eq.${luokka}` +
    `&or=(loppu_pvm.lt.${nyt},and(loppu_pvm.is.null,alku_pvm.lt.${nyt}))`,
    { method: 'DELETE', headers: { Prefer: 'return=minimal' } }
  );
  // Siivouksen epäonnistuminen ei saa kaataa varsinaista toimintoa — vain kirjataan.
  if (r.status >= 300) {
    console.warn('aikataulu: menneiden tapahtumien poisto epäonnistui', r.status);
  }
}

async function haeRyhma(ryhmakoodi) {
  const r = await sb(`opetusryhmat?ryhmakoodi=eq.${encodeURIComponent(ryhmakoodi)}&select=ryhmakoodi,avain_hash,omistaja_email`);
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

  // ── GET: hae ryhmän tapahtumat (julkinen luku) ──
  if (req.method === 'GET') {
    const ryhma = String(req.query.ryhma || '').trim().toUpperCase();
    const luokka = String(req.query.luokka || '9').trim();
    if (!validiRyhma(ryhma) || !SALLITUT_LUOKAT.includes(luokka)) {
      return res.status(400).json({ ok: false, virhe: 'virheellinen_pyynto' });
    }
    try {
      const r = await sb(
        `lukuvuosi_tapahtumat?ryhmakoodi=eq.${encodeURIComponent(ryhma)}` +
        `&luokka=eq.${luokka}` +
        '&select=id,otsikko,tyyppi,alku_pvm,loppu_pvm,kuvaus' +
        '&order=alku_pvm.asc'
      );
      if (!r.ok) throw new Error(`DB-virhe ${r.status}`);
      const tapahtumat = await r.json();
      // Edge-välimuisti: sama ryhmä+luokka on kaikilla luokan oppilailla identtinen.
      // s-maxage=30 → CDN palvelee 30 s välimuistista (opettajan muutos näkyy
      // ~30 s viiveellä). Pitkä stale-while-revalidate (1 h): 30 s jälkeen CDN
      // palauttaa vanhan vastauksen HETI ja päivittää taustalla → oppilaan pyyntö
      // ei jää odottamaan funktion cold startia piikissä.
      res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=3600');
      return res.status(200).json({ ok: true, tapahtumat });
    } catch (err) {
      console.error('aikataulu GET:', err);
      await kirjaaVirhe('aikataulu GET', err);
      return res.status(500).json({ ok: false, virhe: 'palvelinvirhe' });
    }
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, virhe: 'metodi_ei_sallittu' });
  }

  // ── Rate limit POST-toiminnoille (Redis, jaettu instanssien kesken) ──
  const ip = haeIp(req);
  if (!(await rateLimitSallittu(`rl:aikataulu:ip:${ip}`, RL_MAX, RL_IKKUNA_S))) {
    return res.status(429).json({ ok: false, virhe: 'liikaa_yrityksia' });
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
  } catch {
    return res.status(400).json({ ok: false, virhe: 'virheellinen_pyynto' });
  }

  const toiminto = body.toiminto;
  const ryhma = String(body.ryhma || '').trim().toUpperCase();
  const luokka = String(body.luokka || '').trim();
  if (!validiRyhma(ryhma)) {
    return res.status(400).json({ ok: false, virhe: 'virheellinen_pyynto' });
  }

  try {
    // Valtuutus kirjoituksiin: kirjautunut omistaja (istunto) TAI oikea PIN.
    // Jos ryhmällä on omistaja, PIN-fallbackia EI sallita — tilipohjaiset ryhmät
    // muokataan vain istunnolla. PIN käy vain omistajattomille (legacy) ryhmille.
    const opettaja = await haeKirjautunutOpettaja(req);
    const rivi = await haeRyhma(ryhma);
    if (!rivi) return res.status(404).json({ ok: false, virhe: 'ryhmaa_ei_loydy' });
    let valtuutettu = !!opettaja && rivi.omistaja_email === opettaja;
    if (!valtuutettu) {
      if (rivi.omistaja_email) {
        // Omistettu ryhmä → vain istunto kelpaa.
        return res.status(403).json({ ok: false, virhe: 'ei_omistaja' });
      }
      const avain = String(body.avain || '');
      if (avain.length < 4 || avain.length > 64) {
        return res.status(400).json({ ok: false, virhe: 'avain_virheellinen' });
      }
      if (rivi.avain_hash !== hashAvain(avain)) {
        return res.status(200).json({ ok: false, virhe: 'avain_ei_tasmaa' });
      }
    }

    // ── LISÄÄ: uusi tapahtuma ──
    if (toiminto === 'lisaa') {
      if (!SALLITUT_LUOKAT.includes(luokka)) {
        return res.status(400).json({ ok: false, virhe: 'luokka_virheellinen' });
      }
      const k = lueKentat(body);
      const virhe = validoiKentat(k);
      if (virhe) return res.status(400).json({ ok: false, virhe });

      // Siivoa menneet ennen laskentaa: raja koskee vain tulevia tapahtumia.
      await poistaMenneet(ryhma, luokka);

      // Tarkista ryhmän JA luokan tapahtumamäärä (roskaamisen esto)
      const lask = await sb(
        `lukuvuosi_tapahtumat?ryhmakoodi=eq.${encodeURIComponent(ryhma)}&luokka=eq.${luokka}&select=id`
      );
      if (!lask.ok) throw new Error(`DB-virhe ${lask.status}`);
      if ((await lask.json()).length >= MAX_TAPAHTUMIA) {
        return res.status(400).json({ ok: false, virhe: 'liikaa_tapahtumia' });
      }

      const r = await sb('lukuvuosi_tapahtumat', {
        method: 'POST',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify({
          ryhmakoodi: ryhma,
          luokka: luokka,
          otsikko: k.otsikko,
          tyyppi: k.tyyppi,
          alku_pvm: k.alku_pvm,
          loppu_pvm: k.loppu_pvm,
          kuvaus: k.kuvaus,
        }),
      });
      if (r.status >= 300) throw new Error(`DB-virhe ${r.status}: ${await r.text()}`);
      const luotu = (await r.json())[0];
      return res.status(200).json({ ok: true, id: luotu ? luotu.id : null });
    }

    // ── MUOKKAA: päivitä olemassa oleva tapahtuma ──
    if (toiminto === 'muokkaa') {
      const id = String(body.id || '').trim();
      if (!validiId(id)) return res.status(400).json({ ok: false, virhe: 'virheellinen_pyynto' });
      const k = lueKentat(body);
      const virhe = validoiKentat(k);
      if (virhe) return res.status(400).json({ ok: false, virhe });

      // Rajaa sekä id:llä ETTÄ ryhmällä → ei voi muokata toisen ryhmän tapahtumaa
      const r = await sb(
        `lukuvuosi_tapahtumat?id=eq.${encodeURIComponent(id)}&ryhmakoodi=eq.${encodeURIComponent(ryhma)}`,
        {
          method: 'PATCH',
          headers: { Prefer: 'return=minimal' },
          body: JSON.stringify({
            otsikko: k.otsikko,
            tyyppi: k.tyyppi,
            alku_pvm: k.alku_pvm,
            loppu_pvm: k.loppu_pvm,
            kuvaus: k.kuvaus,
          }),
        }
      );
      if (r.status >= 300) throw new Error(`DB-virhe ${r.status}: ${await r.text()}`);
      return res.status(200).json({ ok: true });
    }

    // ── POISTA: poista tapahtuma ──
    if (toiminto === 'poista') {
      const id = String(body.id || '').trim();
      if (!validiId(id)) return res.status(400).json({ ok: false, virhe: 'virheellinen_pyynto' });

      const r = await sb(
        `lukuvuosi_tapahtumat?id=eq.${encodeURIComponent(id)}&ryhmakoodi=eq.${encodeURIComponent(ryhma)}`,
        { method: 'DELETE', headers: { Prefer: 'return=minimal' } }
      );
      if (r.status >= 300) throw new Error(`DB-virhe ${r.status}: ${await r.text()}`);
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ ok: false, virhe: 'tuntematon_toiminto' });
  } catch (err) {
    console.error('aikataulu POST:', err);
    await kirjaaVirhe('aikataulu POST', err, { toiminto });
    return res.status(500).json({ ok: false, virhe: 'palvelinvirhe' });
  }
}
