// DigiOpo – Admin-paneelin tilastoendpoint
//
// GET /api/admin-tilastot
// Header: x-admin-key: <ADMIN_DASHBOARD_KEY>
//
// Palauttaa yhteen koottuna:
//   - lisenssit: kokonaismäärä, aktiiviset, tyypeittäin, pian vanhenevat
//   - kuorma: käyntimäärät (tänään / 7pv / taulukko sivuittain)
//   - virheet: viimeisimmät API-virheet (api_virheet-taulusta)
//   - deploy: viimeisimmän Vercel-julkaisun tila (jos VERCEL_API_TOKEN asetettu)
//
// Ympäristömuuttujat:
//   SUPABASE_URL, SUPABASE_SERVICE_KEY   – jo käytössä muissa funktioissa
//   ADMIN_DASHBOARD_KEY                  – suojausavain tälle endpointille (PAKOLLINEN)
//   VERCEL_API_TOKEN                     – valinnainen, Vercel-deploy-tilaa varten
//   VERCEL_PROJECT_ID                    – prj_Faadfq7ZHe3xsxJ4ZSfyoweGLnuj (digiopo)
//   VERCEL_TEAM_ID                       – team_o308vJFcrnS2dDWecH2xhjLh

import { kirjaaVirhe } from './_lib/virhelogi.js';
import { vertaaSalaisuus } from './_lib/turva.js';
import { sbFetch } from './_lib/supabase.js'; // TILAPÄINEN-VIENTI (poistettava)

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const ADMIN_DASHBOARD_KEY = process.env.ADMIN_DASHBOARD_KEY;
const VERCEL_API_TOKEN = process.env.VERCEL_API_TOKEN;
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID;
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID;

function sbHeaders(extra = {}) {
  return {
    apikey: SUPABASE_SERVICE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...extra,
  };
}

async function sb(polku, opts = {}) {
  const base = SUPABASE_URL.replace(/\/$/, '');
  return fetch(`${base}/rest/v1/${polku}`, { ...opts, headers: sbHeaders(opts.headers || {}) });
}

// ─── Lisenssit ────────────────────────────────────────────────────────────
async function haeLisenssit() {
  const r = await sb('lisenssit?select=tyyppi,aktiivinen,voimassa_asti');
  if (!r.ok) throw new Error(`lisenssit-haku epäonnistui: ${r.status}`);
  const rivit = await r.json();

  const nyt = new Date();
  const pian = new Date(nyt.getTime() + 30 * 24 * 60 * 60 * 1000);

  const yhteensa = rivit.length;
  const aktiiviset = rivit.filter(r => r.aktiivinen && new Date(r.voimassa_asti) > nyt).length;
  const vanhentuneet = rivit.filter(r => new Date(r.voimassa_asti) <= nyt).length;
  const pianVanhenevat = rivit.filter(r => {
    const va = new Date(r.voimassa_asti);
    return r.aktiivinen && va > nyt && va <= pian;
  }).length;

  const tyypeittain = {};
  for (const rivi of rivit) {
    tyypeittain[rivi.tyyppi] = (tyypeittain[rivi.tyyppi] || 0) + 1;
  }

  return { yhteensa, aktiiviset, vanhentuneet, pian_vanhenevat: pianVanhenevat, tyypeittain };
}

// ─── Kuorma (käyntimäärät) ────────────────────────────────────────────────
async function haeKuorma() {
  const [tanaan, viikko, sivuittain] = await Promise.all([
    sb(`page_views?paiva=eq.${new Date().toISOString().split('T')[0]}&select=maara`),
    sb(`viikon_kayntimaarat?select=*`),
    sb(`kayntimaarat?select=*&order=kaynteya_yhteensa.desc&limit=10`),
  ]);

  const tanaanRivit = tanaan.ok ? await tanaan.json() : [];
  const viikkoRivit = viikko.ok ? await viikko.json() : [];
  const sivuRivit = sivuittain.ok ? await sivuittain.json() : [];

  return {
    tanaan_yhteensa: tanaanRivit.reduce((s, r) => s + (r.maara || 0), 0),
    viikko_yhteensa: viikkoRivit.reduce((s, r) => s + (r.kaynteya || 0), 0),
    suosituimmat_sivut: sivuRivit,
  };
}

// ─── Lisenssien käyttö (laitepohjainen seuranta) ──────────────────────────
// Hakee lisenssi_kaytto-näkymän (laitteita per koodi vs. myydyt paikat).
// Jos näkymää ei ole vielä luotu, palautetaan tyhjä lista → ei kaada muuta.
async function haeLisenssikaytto() {
  const r = await sb('lisenssi_kaytto?select=*&order=laitteita_30pv.desc&limit=200');
  if (!r.ok) return [];
  return r.json();
}

// ─── Virheet ──────────────────────────────────────────────────────────────
async function haeVirheet() {
  const r = await sb('api_virheet?select=*&order=luotu_at.desc&limit=50');
  if (!r.ok) throw new Error(`api_virheet-haku epäonnistui: ${r.status}`);
  const rivit = await r.json();

  const vuorokausiSitten = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const viime24h = rivit.filter(v => new Date(v.luotu_at) > vuorokausiSitten).length;

  const endpointeittain = {};
  for (const v of rivit) {
    endpointeittain[v.endpoint] = (endpointeittain[v.endpoint] || 0) + 1;
  }

  return { viimeisimmat: rivit, viime_24h: viime24h, endpointeittain };
}

// ─── Vercel-deploy-status ─────────────────────────────────────────────────
async function haeDeployStatus() {
  if (!VERCEL_API_TOKEN || !VERCEL_PROJECT_ID) return null;
  const teamQ = VERCEL_TEAM_ID ? `&teamId=${VERCEL_TEAM_ID}` : '';
  const r = await fetch(
    `https://api.vercel.com/v6/deployments?projectId=${VERCEL_PROJECT_ID}&limit=1${teamQ}`,
    { headers: { Authorization: `Bearer ${VERCEL_API_TOKEN}` } }
  );
  if (!r.ok) throw new Error(`Vercel API -virhe: ${r.status}`);
  const data = await r.json();
  const d = data.deployments?.[0];
  if (!d) return null;
  return {
    tila: d.readyState,
    luotu: new Date(d.createdAt).toISOString(),
    url: d.url,
  };
}

// ═══ TILAPÄINEN-VIENTI-ALKU (Supabase-cutover vko 42) – POISTETTAVA ═══
// GET /api/admin-tilastot?vienti=1 palauttaa opetusryhmat/jarjestykset/
// lukuvuosi_tapahtumat SQL-upsert-lauseina (vain luku). Sisältää avain_hash-arvot.
// Omaa reittiä ei voi lisätä: Vercel Hobby sallii max 12 funktiota.
const SIVU = 1000;

// Taulu → sarakkeet (järjestys sama kuin skeemassa) ja pääavain upsertia varten
const TAULUT = [
  {
    nimi: 'opetusryhmat',
    sarakkeet: ['ryhmakoodi', 'avain_hash', 'koulukoodi', 'nimi', 'luotu_at', 'muokattu_at'],
    avain: ['ryhmakoodi'],
    jarjestys: 'ryhmakoodi.asc',
  },
  {
    nimi: 'jarjestykset',
    sarakkeet: ['ryhmakoodi', 'luokka', 'jarjestys', 'lukitut', 'muokattu_at'],
    avain: ['ryhmakoodi', 'luokka'],
    jarjestys: 'ryhmakoodi.asc,luokka.asc',
  },
  {
    nimi: 'lukuvuosi_tapahtumat',
    sarakkeet: ['id', 'ryhmakoodi', 'luokka', 'otsikko', 'tyyppi', 'alku_pvm', 'loppu_pvm', 'kuvaus', 'luotu_at', 'muokattu_at'],
    avain: ['id'],
    jarjestys: 'id.asc',
  },
];

function sqlArvo(v) {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (typeof v === 'object') return `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`;
  return `'${String(v).replace(/'/g, "''")}'`;
}

async function haeKaikki(t) {
  const rivit = [];
  for (let offset = 0; ; offset += SIVU) {
    const polku = `${t.nimi}?select=${t.sarakkeet.join(',')}&order=${t.jarjestys}&limit=${SIVU}&offset=${offset}`;
    const r = await sbFetch(polku);
    if (!r.ok) throw new Error(`${t.nimi}: ${r.status}`);
    const sivu = await r.json();
    rivit.push(...sivu);
    if (sivu.length < SIVU) break;
  }
  return rivit;
}

function upsertSql(t, rivit) {
  if (rivit.length === 0) return `-- ${t.nimi}: 0 riviä\n`;
  const arvot = rivit
    .map((r) => `  (${t.sarakkeet.map((s) => sqlArvo(r[s])).join(', ')})`)
    .join(',\n');
  const paivitettavat = t.sarakkeet.filter((s) => !t.avain.includes(s));
  const paivitys = paivitettavat.map((s) => `${s} = excluded.${s}`).join(', ');
  return (
    `-- ${t.nimi}: ${rivit.length} riviä\n` +
    `insert into ${t.nimi} (${t.sarakkeet.join(', ')}) values\n${arvot}\n` +
    `on conflict (${t.avain.join(', ')}) do update set ${paivitys};\n`
  );
}

async function vientiSql() {
  let ulos = '-- DigiOpo: opetusryhmien vienti vanhasta kannasta (upsert)\nbegin;\n\n';
  for (const t of TAULUT) {
    const rivit = await haeKaikki(t);
    ulos += upsertSql(t, rivit) + '\n';
  }
  return ulos + 'commit;\n';
}
// ═══ TILAPÄINEN-VIENTI-LOPPU ═══

export default async function handler(req, res) {
  // CORS: sallitaan mikä tahansa origin (myös paikallinen file://-sivu), koska
  // tämä endpoint on joka tapauksessa suojattu x-admin-key-avaimella eikä
  // palauta mitään ilman sitä.
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'x-admin-key, Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, virhe: 'metodi_ei_sallittu' });
  }

  // ── Suojaus ──────────────────────────────────────────────────────────
  if (!ADMIN_DASHBOARD_KEY) {
    return res.status(500).json({ ok: false, virhe: 'admin_avainta_ei_konfiguroitu' });
  }
  const annettuAvain = req.headers['x-admin-key'] || '';
  if (!vertaaSalaisuus(annettuAvain, ADMIN_DASHBOARD_KEY)) {
    return res.status(401).json({ ok: false, virhe: 'virheellinen_avain' });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return res.status(500).json({ ok: false, virhe: 'palvelin_ei_konfiguroitu' });
  }

  // ═══ TILAPÄINEN-VIENTI-ALKU ═══
  if (req.query && req.query.vienti === '1') {
    try {
      res.setHeader('Cache-Control', 'no-store');
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      return res.status(200).send(await vientiSql());
    } catch (err) {
      console.error('vienti virhe:', err.message);
      return res.status(500).end();
    }
  }
  // ═══ TILAPÄINEN-VIENTI-LOPPU ═══

  try {
    const [lisenssit, kuorma, virheet, deploy, lisenssikaytto] = await Promise.all([
      haeLisenssit(),
      haeKuorma(),
      haeVirheet(),
      haeDeployStatus().catch(() => null),
      haeLisenssikaytto().catch(() => []),
    ]);

    return res.status(200).json({
      ok: true,
      haettu: new Date().toISOString(),
      lisenssit,
      kuorma,
      virheet,
      deploy,
      lisenssikaytto,
    });
  } catch (err) {
    console.error('admin-tilastot:', err);
    await kirjaaVirhe('admin-tilastot', err);
    return res.status(500).json({ ok: false, virhe: 'palvelinvirhe' });
  }
}
