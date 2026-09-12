// Duuniskaba – pelikoodi-lukko (toinen portti maksumuurin päälle)
//
// POST /api/pelikoodi   body: { ryhma: "9A-K3M9" }
//   → jos ryhmäkoodi löytyy opetusryhmat-taulusta, asettaa allekirjoitetun
//     evästeen digiopo_peli ja palauttaa { ok:true, ryhma }.
//   → muuten { ok:false, virhe:"virheellinen" }.
//
// Middleware (middleware.js) päästää pelisivulle vain tämän evästeen kanssa,
// LISÄKSI koulun lisenssievästeen (maksumuuri) vaatimuksen päälle.
// Käyttää samaa allekirjoitusmekanismia (token.js, LISENSSI_JWT_SECRET) kuin muuri.

import { haeIp } from './_lib/turva.js';
import { rateLimitSallittu } from './_lib/rate.js';
import { sbFetch } from './_lib/supabase.js';
import { luoToken } from './_lib/token.js';

const LISENSSI_JWT_SECRET = process.env.LISENSSI_JWT_SECRET;

// Pelikoodi-evästeen ikä. Kohtuullinen: oppilas syöttää koodin kerran per laite.
// Jos opettaja vaihtaa/poistaa ryhmäkoodin, vanha eväste vanhenee tässä ajassa.
const EVASTE_IKA_S = 30 * 24 * 60 * 60; // 30 vrk

const RL_MAX = 20;           // koodinsyöttöyrityksiä per IP / ikkuna
const RL_IKKUNA_S = 10 * 60; // 10 min

// Ryhmäkoodin muoto (sama kuin aikataulu.js/jarjestys.js -käytännössä)
function validiRyhma(k) { return /^[A-Z0-9-]{4,20}$/.test(k); }

async function haeRyhma(ryhmakoodi) {
  const r = await sbFetch(
    `opetusryhmat?ryhmakoodi=eq.${encodeURIComponent(ryhmakoodi)}&select=ryhmakoodi&limit=1`
  );
  if (!r.ok) throw new Error(`Tietokantavirhe: ${r.status} – ${await r.text()}`);
  const d = await r.json();
  return d[0] || null;
}

async function asetaPeliEvaste(res, ryhma) {
  if (!LISENSSI_JWT_SECRET) return; // muuri pois päältä → ei evästettä
  const token = await luoToken(
    { typ: 'peli', ryhma, exp: Date.now() + EVASTE_IKA_S * 1000 },
    LISENSSI_JWT_SECRET
  );
  res.setHeader(
    'Set-Cookie',
    `digiopo_peli=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${EVASTE_IKA_S}`
  );
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, virhe: 'metodi_ei_sallittu' });

  const ip = haeIp(req);
  if (!(await rateLimitSallittu(`rl:pelikoodi:ip:${ip}`, RL_MAX, RL_IKKUNA_S))) {
    return res.status(429).json({ ok: false, virhe: 'liikaa_yrityksia' });
  }

  let body;
  try { body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {}); }
  catch { return res.status(400).json({ ok: false, virhe: 'virheellinen_pyynto' }); }

  const ryhma = String(body.ryhma || '').trim().toUpperCase();
  if (!validiRyhma(ryhma)) return res.status(400).json({ ok: false, virhe: 'virheellinen' });

  // Jos maksumuuri on pois päältä (ei secretiä), lukkokin on pois päältä → päästetään läpi.
  if (!LISENSSI_JWT_SECRET) return res.status(200).json({ ok: true, ryhma });

  try {
    const rivi = await haeRyhma(ryhma);
    if (!rivi) return res.status(200).json({ ok: false, virhe: 'virheellinen' });
    await asetaPeliEvaste(res, ryhma);
    return res.status(200).json({ ok: true, ryhma });
  } catch (err) {
    console.error('pelikoodi-virhe:', err);
    return res.status(500).json({ ok: false, virhe: 'palvelinvirhe' });
  }
}
