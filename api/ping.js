// DigiOpo – Käyttölaskuri
// POST /api/ping  →  { sivu: "7luokka" }
// Kasvattaa sivukohtaista päivälaskuria Supabasessa.
// Ei tallenna henkilötietoja – vain sivun nimi ja lukumäärä.

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

// Sallitut sivunimet – estää roskadatan
const SALLITUT_SIVUT = new Set([
  "etusivu",
  "7luokka", "8luokka", "9luokka",
  "peli-vahvuusmatka", "peli-supervoimat", "peli-ala-set",
  "peli-amissanasto", "peli-lukiosanasto", "peli-ajattelutavat",
  "peli-koulutusalat", "peli-kadonnut-motivaatio", "peli-duunimina",
  "peli-oppimisen-pakopeli", "peli-tiedon-temppeli", "peli-robo-tarina",
  "sivu-vuosikello", "sivu-yhteishakulaskuri", "sivu-tet",
  "sivu-valinnat", "sivu-tulevaisuus",
]);

// Yksinkertainen rate limiter – max 60 pingiä / IP / minuutti
const ipLaskuri = new Map();
function tarkistaRateLimit(ip) {
  const nyt = Date.now();
  const data = ipLaskuri.get(ip) || { maara: 0, alku: nyt };
  if (nyt - data.alku > 60_000) {
    ipLaskuri.set(ip, { maara: 1, alku: nyt });
    return true;
  }
  if (data.maara >= 60) return false;
  ipLaskuri.set(ip, { maara: data.maara + 1, alku: data.alku });
  return true;
}

export default async function handler(req, res) {
  // CORS-otsikot
  res.setHeader('Access-Control-Allow-Origin', 'https://app.digiopo.fi');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).end();

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.socket?.remoteAddress || 'tuntematon';
  if (!tarkistaRateLimit(ip)) return res.status(429).end();

  let sivu;
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    sivu = (body.sivu || '').trim().toLowerCase();
  } catch {
    return res.status(400).end();
  }

  if (!sivu || !SALLITUT_SIVUT.has(sivu)) {
    return res.status(200).end(); // Hiljainen hylkäys – ei virhettä selaimelle
  }

  try {
    const baseUrl = SUPABASE_URL.replace(/\/$/, '');
    const vastaus = await fetch(`${baseUrl}/rest/v1/rpc/kasvata_laskuri`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ p_sivu: sivu }),
    });
    if (!vastaus.ok) {
      const teksti = await vastaus.text();
      console.error(`ping virhe [${sivu}]: ${vastaus.status} – ${teksti}`);
    } else {
      console.log(`ping ok [${sivu}]`);
    }
  } catch (err) {
    console.error(`ping catch [${sivu}]:`, err.message);
  }

  return res.status(200).end();
}
