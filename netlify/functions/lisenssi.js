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
  if (!UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN) return true;

  const avain = `rl:lisenssi:${ip}`;
  const headers = {
    Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}`,
    'Content-Type': 'application/json',
  };

  try {
    const incrVastaus = await fetch(`${UPSTASH_REDIS_REST_URL}/incr/${avain}`, {
      method: 'POST', headers,
    });
    const { result: maara } = await incrVastaus.json();

    if (maara === 1) {
      await fetch(`${UPSTASH_REDIS_REST_URL}/expire/${avain}/${IKKUNA_S}`, {
        method: 'POST', headers,
      });
    }

    return maara <= MAX_YRITYKSIA;
  } catch {
    return true;
  }
}

async function kirjaaKirjautuminen(koodi, koulu, ip, userAgent) {
  try {
    const baseUrl = SUPABASE_URL.replace(/\/$/, '');
    await fetch(`${baseUrl}/rest/v1/lisenssi_kirjaukset`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({ koodi, koulu, ip, user_agent: userAgent }),
    });
  } catch (err) {
    // Kirjausvirhe ei saa kaataa koko kirjautumista
    console.error("Kirjausvirhe:", err);
  }
}

async function haeSupabasesta(koodi) {
  const baseUrl = SUPABASE_URL.replace(/\/$/, ''); // poista mahdollinen loppukauttaviiva
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

export const handler = async (event) => {
  // CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ virhe: "Metodi ei sallittu" }) };
  }

  // IP rate limiting
  const ip =
    event.headers["x-forwarded-for"]?.split(",")[0].trim() ||
    event.headers["client-ip"] ||
    "tuntematon";
  const userAgent = event.headers["user-agent"] || "";

  if (!await tarkistaRateLimit(ip)) {
    return {
      statusCode: 429,
      body: JSON.stringify({ ok: false, virhe: "liikaa_yrityksia" }),
    };
  }

  // Parsitaan koodi
  let koodi;
  try {
    const body = JSON.parse(event.body || "{}");
    koodi = (body.koodi || "").trim();
  } catch {
    return { statusCode: 400, body: JSON.stringify({ ok: false, virhe: "virheellinen_pyynto" }) };
  }

  if (!koodi || koodi.length < 3 || koodi.length > 40) {
    return { statusCode: 400, body: JSON.stringify({ ok: false, virhe: "virheellinen" }) };
  }

  // Tarkistetaan Supabasesta
  try {
    const lisenssi = await haeSupabasesta(koodi);

    if (!lisenssi || !lisenssi.aktiivinen) {
      return { statusCode: 200, body: JSON.stringify({ ok: false, virhe: "virheellinen" }) };
    }

    const nyt = new Date();
    const voimassaAsti = new Date(lisenssi.voimassa_asti);

    if (nyt > voimassaAsti) {
      return { statusCode: 200, body: JSON.stringify({ ok: false, virhe: "vanhentunut" }) };
    }

    // Kaikki ok – kirjataan kirjautuminen taustalla
    kirjaaKirjautuminen(lisenssi.koodi, lisenssi.koulu, ip, userAgent);

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        koodi: lisenssi.koodi,
        voimassa_asti: lisenssi.voimassa_asti,
        koulu: lisenssi.koulu,
      }),
    };
  } catch (err) {
    console.error("Supabase-virhe:", err);
    return { statusCode: 500, body: JSON.stringify({ ok: false, virhe: "palvelinvirhe" }) };
  }
};
