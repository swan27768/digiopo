// DigiOpo – Lisenssintarkistus
// POST /api/lisenssi  →  { koodi: "KOULU-2026" }
// Palauttaa: { ok: true, voimassa_asti: "2026-12-31" }
//         tai { ok: false, virhe: "vanhentunut" | "virheellinen" | "liikaa_yrityksia" }

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

// Redis-pohjainen rate limiter – toimii luotettavasti serverless-ympäristössä
// Max 5 yritystä / IP / 10 minuuttia
const MAX_YRITYKSIA = 5;
const IKKUNA_S = 10 * 60; // 10 minuuttia sekunteina

async function tarkistaRateLimit(ip) {
  // Jos Redis ei ole konfiguroitu, sallitaan pyyntö (ei kaada palvelua)
  if (!UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN) return true;

  const avain = `rl:lisenssi:${ip}`;
  const headers = {
    Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}`,
    'Content-Type': 'application/json',
  };

  try {
    // Kasvata laskuria
    const incrVastaus = await fetch(`${UPSTASH_REDIS_REST_URL}/incr/${avain}`, {
      method: 'POST', headers,
    });
    const { result: maara } = await incrVastaus.json();

    // Aseta vanhenemisaika vain ensimmäisellä kerralla
    if (maara === 1) {
      await fetch(`${UPSTASH_REDIS_REST_URL}/expire/${avain}/${IKKUNA_S}`, {
        method: 'POST', headers,
      });
    }

    return maara <= MAX_YRITYKSIA;
  } catch {
    // Redis-virhe: sallitaan pyyntö, ei rangaista käyttäjää
    return true;
  }
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

  // IP rate limiting
  const ip =
    (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    'tuntematon';

  if (!await tarkistaRateLimit(ip)) {
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
