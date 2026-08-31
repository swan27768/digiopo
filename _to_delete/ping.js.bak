// DigiOpo – Käyttölaskuri
// POST /api/ping  →  { sivu: "7luokka" }
// Kasvattaa sivukohtaista päivälaskuria Supabasessa.
// Ei tallenna henkilötietoja – vain sivun nimi ja lukumäärä.

import { kirjaaVirhe } from './_lib/virhelogi.js';
import { haeIp } from './_lib/turva.js';
import { rateLimitSallittu } from './_lib/rate.js';

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
  "sivu-vuosikello", "sivu-tet",
  "sivu-valinnat", "sivu-tulevaisuus",
]);

// Rate limit: jaettu Redis-laskuri (ks. _lib/rate.js) – toimii luotettavasti
// serverless-instanssien kesken. Aiempi Map-laskuri nollautui joka cold startissa
// eikä pätenyt instanssien yli, joten raja oli käytännössä olematon piikissä.
// Ping on best-effort-analytiikkaa ja deduploidaan selaimessa (kerran per sivu
// per päivä), joten raja on väljä: se estää vain yksittäisen IP:n roskaliikenteen,
// ei koulun jaetun NAT-IP:n normaalia yhteiskäyttöä.
const RL_MAX = 300;      // pingiä per IP
const RL_IKKUNA_S = 60;  // per minuutti

export default async function handler(req, res) {
  // CORS-otsikot
  res.setHeader('Access-Control-Allow-Origin', 'https://app.digiopo.fi');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).end();

  const ip = haeIp(req);
  if (!(await rateLimitSallittu(`rl:ping:ip:${ip}`, RL_MAX, RL_IKKUNA_S))) {
    return res.status(429).end();
  }

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
      await kirjaaVirhe('ping', new Error(`${vastaus.status}: ${teksti}`), { sivu });
    } else {
      console.log(`ping ok [${sivu}]`);
    }
  } catch (err) {
    console.error(`ping catch [${sivu}]:`, err.message);
    await kirjaaVirhe('ping', err, { sivu });
  }

  return res.status(200).end();
}
