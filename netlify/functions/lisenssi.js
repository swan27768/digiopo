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

  // Nollaa ikkuna jos se on vanhentunut
  if (nyt - merkinta.alku > IKKUNA_MS) {
    yritykset.set(ip, { maara: 1, alku: nyt });
    return true;
  }

  if (merkinta.maara >= MAX_YRITYKSIA) return false;

  yritykset.set(ip, { maara: merkinta.maara + 1, alku: merkinta.alku });
  return true;
}

async function haeSupabasesta(koodi) {
  const url = `${SUPABASE_URL}/rest/v1/lisenssit?koodi=eq.${encodeURIComponent(koodi.toUpperCase())}&select=koodi,koulu,tyyppi,voimassa_asti,aktiivinen`;
  const vastaus = await fetch(url, {
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
    },
  });
  if (!vastaus.ok) throw new Error("Tietokantavirhe");
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

  if (!tarkistaRateLimit(ip)) {
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

    // Kaikki ok
    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        voimassa_asti: lisenssi.voimassa_asti,
        koulu: lisenssi.koulu,
      }),
    };
  } catch (err) {
    console.error("Supabase-virhe:", err);
    return { statusCode: 500, body: JSON.stringify({ ok: false, virhe: "palvelinvirhe" }) };
  }
};
