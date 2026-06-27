// DigiOpo – Lisenssintarkistus
// POST /api/lisenssi  →  { koodi: "KOULU-2026" }
// Palauttaa: { ok: true, voimassa_asti: "2026-12-31" }
//         tai { ok: false, virhe: "vanhentunut" | "virheellinen" | "liikaa_yrityksia" }

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

// Yksinkertainen muistipohjainen rate limiter
// (nollautuu funktiokäynnistyksen yhteydessä – riittävä suoja brute forceen)
const yritykset = new Map();
const MAX_YRITYKSIA = 5;
const IKKUNA_MS = 10 * 60 * 1000; // 10 minuuttia

function tarkistaRateLimit(ip) {
  const nyt = Date.now();
  const merkinta = yritykset.get(ip) || { maara: 0, alku: nyt };

  if (nyt - merkinta.alku > IKKUNA_MS) {
    yritykset.set(ip, { maara: 1, alku: nyt });
    return true;
  }

  if (merkinta.maara >= MAX_YRITYKSIA) return false;

  yritykset.set(ip, { maara: merkinta.maara + 1, alku: merkinta.alku });
  return true;
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

  // IP rate limiting
  const ip =
    (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    'tuntematon';

  if (!tarkistaRateLimit(ip)) {
    return res.status(429).json({ ok: false, virhe: 'liikaa_yrityksia' });
  }

  // Parsitaan koodi
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

  // Tarkistetaan Supabasesta
  try {
    const lisenssi = await haeSupabasesta(koodi);

    if (!lisenssi || !lisenssi.aktiivinen) {
      return res.status(200).json({ ok: false, virhe: 'virheellinen' });
    }

    const nyt = new Date();
    const voimassaAsti = new Date(lisenssi.voimassa_asti);

    if (nyt > voimassaAsti) {
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
    return res.status(500).json({ ok: false, virhe: 'palvelinvirhe' });
  }
}
