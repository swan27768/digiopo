// DigiOpo – Lisenssintarkistus
// POST /api/lisenssi  →  { koodi: "KOULU-2026" }
// Palauttaa: { ok: true, voimassa_asti: "2026-12-31" }
//         tai { ok: false, virhe: "vanhentunut" | "virheellinen" | "liikaa_yrityksia" }

import { kirjaaVirhe } from './_lib/virhelogi.js';
import { haeIp } from './_lib/turva.js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

// Redis-pohjainen rate limiter – toimii luotettavasti serverless-ympäristössä.
// Kolme kerrosta brute-forcea vastaan:
//   - per IP:     kaikki yritykset          (max 5 / 10 min)
//   - per koodi:  saman koodin EPÄonnistuneet yritykset (max 8 / 10 min)
//   - globaali:   EPÄonnistuneet yritykset yhteensä      (max 120 / 10 min)
// Onnistuneita kirjautumisia ei lasketa epäonnistumisiin, joten laillinen
// käyttö (koko koulu kirjautuu aamulla) ei laukaise koodi-/globaalirajaa.
const MAX_IP = 5;
const MAX_KOODI_FAIL = 8;
const MAX_GLOBAL_FAIL = 120;
const IKKUNA_S = 10 * 60; // 10 minuuttia sekunteina

const redisKaytossa = () => Boolean(UPSTASH_REDIS_REST_URL && UPSTASH_REDIS_REST_TOKEN);

// Kasvattaa Redis-laskuria ja palauttaa sen arvon, tai null jos Redis on
// poissa/virhetilassa (jolloin ei rangaista käyttäjää = fail-open).
async function incr(avain, ikkunaS) {
  if (!redisKaytossa()) return null;
  const headers = {
    Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}`,
    'Content-Type': 'application/json',
  };
  try {
    const r = await fetch(`${UPSTASH_REDIS_REST_URL}/incr/${encodeURIComponent(avain)}`, {
      method: 'POST', headers,
    });
    const { result: maara } = await r.json();
    if (maara === 1) {
      await fetch(`${UPSTASH_REDIS_REST_URL}/expire/${encodeURIComponent(avain)}/${ikkunaS}`, {
        method: 'POST', headers,
      });
    }
    return maara;
  } catch {
    return null;
  }
}

// Per-IP-raja: lasketaan jokainen yritys. False = raja ylitetty.
async function ipSallittu(ip) {
  const maara = await incr(`rl:lisenssi:ip:${ip}`, IKKUNA_S);
  return maara === null ? true : maara <= MAX_IP;
}

// Kirjaa epäonnistuneen kooditarkistuksen. Palauttaa true jos koodikohtainen
// tai globaali raja ylittyi (→ pyyntö kannattaa estää 429:llä).
async function kirjaaEpaonnistuminen(koodi) {
  const [g, k] = await Promise.all([
    incr('rl:lisenssi:fail:global', IKKUNA_S),
    incr(`rl:lisenssi:fail:koodi:${koodi}`, IKKUNA_S),
  ]);
  const globaaliYli = g !== null && g > MAX_GLOBAL_FAIL;
  const koodiYli = k !== null && k > MAX_KOODI_FAIL;
  return globaaliYli || koodiYli;
}

async function haeSupabasesta(koodi) {
  const baseUrl = SUPABASE_URL.replace(/\/$/, '');
  const url = `${baseUrl}/rest/v1/lisenssit?koodi=eq.${encodeURIComponent(koodi.toUpperCase())}&select=koodi,koulu,tyyppi,voimassa_asti,aktiivinen`;
  const vastaus = await fetch(url, {
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Prefer': 'return=representation',
    },
  });
  if (!vastaus.ok) {
    const teksti = await vastaus.text();
    throw new Error(`Tietokantavirhe: ${vastaus.status} – ${teksti}`);
  }
  const data = await vastaus.json();
  return data[0] || null;
}

// Tarkistaa Supabase JWT-tokenin ja palauttaa käyttäjän sähköpostin
async function tarkistaToken(token) {
  const baseUrl = SUPABASE_URL.replace(/\/$/, '');
  const vastaus = await fetch(`${baseUrl}/auth/v1/user`, {
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${token}`,
    },
  });
  if (!vastaus.ok) return null;
  const data = await vastaus.json();
  return data.email || null;
}

// Hakee opettajalisenssin sähköpostin perusteella
async function haeOpettajaSupabasesta(email) {
  const baseUrl = SUPABASE_URL.replace(/\/$/, '');
  const url = `${baseUrl}/rest/v1/lisenssit?email=eq.${encodeURIComponent(email.toLowerCase())}&tyyppi=eq.opettaja&select=email,koulu,voimassa_asti,aktiivinen`;
  const vastaus = await fetch(url, {
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });
  if (!vastaus.ok) throw new Error(`Tietokantavirhe: ${vastaus.status}`);
  const data = await vastaus.json();
  return data[0] || null;
}

export default async function handler(req, res) {
  // CORS-otsikot
  res.setHeader('Access-Control-Allow-Origin', 'https://app.digiopo.fi');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ virhe: 'Metodi ei sallittu' });
  }

  // IP rate limiting (x-real-ip on Vercelissä luotettava, ei väärennettävissä)
  const ip = haeIp(req);

  if (!await ipSallittu(ip)) {
    return res.status(429).json({ ok: false, virhe: 'liikaa_yrityksia' });
  }

  // ── Opettajalisenssi: Bearer-token tarkistus ─────────────────────────────
  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    try {
      const email = await tarkistaToken(token);
      if (!email) return res.status(401).json({ ok: false, virhe: 'ei_valtuutusta' });

      const lisenssi = await haeOpettajaSupabasesta(email);
      if (!lisenssi || !lisenssi.aktiivinen) {
        return res.status(200).json({ ok: false, virhe: 'virheellinen' });
      }
      if (new Date() > new Date(lisenssi.voimassa_asti)) {
        return res.status(200).json({ ok: false, virhe: 'vanhentunut' });
      }
      return res.status(200).json({
        ok: true,
        tyyppi: 'opettaja',
        voimassa_asti: lisenssi.voimassa_asti,
        koulu: lisenssi.koulu,
      });
    } catch (err) {
      console.error('Opettajatarkistusvirhe:', err);
      await kirjaaVirhe('lisenssi opettaja', err);
      return res.status(500).json({ ok: false, virhe: 'palvelinvirhe' });
    }
  }

  // ── Koululisenssi: kooditarkistus ────────────────────────────────────────
  let koodi;
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    koodi = (body.koodi || '').trim();
  } catch {
    return res.status(400).json({ ok: false, virhe: 'virheellinen_pyynto' });
  }

  if (!koodi || koodi.length < 3 || koodi.length > 40) {
    return res.status(400).json({ ok: false, virhe: 'virheellinen' });
  }

  try {
    const lisenssi = await haeSupabasesta(koodi);

    if (!lisenssi || !lisenssi.aktiivinen) {
      // Virheellinen koodi = mahdollinen brute-force-yritys → kirjataan.
      if (await kirjaaEpaonnistuminen(koodi.toUpperCase())) {
        return res.status(429).json({ ok: false, virhe: 'liikaa_yrityksia' });
      }
      return res.status(200).json({ ok: false, virhe: 'virheellinen' });
    }

    const nyt = new Date();
    const voimassaAsti = new Date(lisenssi.voimassa_asti);

    if (nyt > voimassaAsti) {
      // Vanhentunut mutta oikea koodi – ei lasketa brute-force-yritykseksi.
      return res.status(200).json({ ok: false, virhe: 'vanhentunut' });
    }

    return res.status(200).json({
      ok: true,
      koodi: lisenssi.koodi,
      voimassa_asti: lisenssi.voimassa_asti,
      koulu: lisenssi.koulu,
    });
  } catch (err) {
    console.error('Supabase-virhe:', err);
    await kirjaaVirhe('lisenssi koulukoodi', err);
    return res.status(500).json({ ok: false, virhe: 'palvelinvirhe' });
  }
}
