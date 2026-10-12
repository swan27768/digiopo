// ═══════════════════════════════════════════════════════════════════════════
// TILAPÄINEN – POISTETTAVA HETI KUN VIENTI ON TEHTY (Supabase-cutover, vko 42)
// ═══════════════════════════════════════════════════════════════════════════
// GET /api/vienti-tmp
// Header: x-admin-key: <ADMIN_DASHBOARD_KEY>
//
// Palauttaa vanhan tuotantokannan opetusryhmat-, jarjestykset- ja
// lukuvuosi_tapahtumat-taulujen sisällön valmiina SQL-upsert-lauseina
// (text/plain), jotka ajetaan uuden projektin SQL Editorissa.
//
// ⚠️ Vastaus sisältää opetusryhmat.avain_hash-arvot. Käsittele kuin salasanaa:
// älä liitä chattiin, älä jätä tiedostoa levylle viennin jälkeen.
//
// Vain luku. Ei kirjoita mitään kantaan.

import { sbFetch } from './_lib/supabase.js';
import { vertaaSalaisuus } from './_lib/turva.js';

const ADMIN_DASHBOARD_KEY = process.env.ADMIN_DASHBOARD_KEY;

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

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'GET') return res.status(405).end();

  const annettu = String(req.headers['x-admin-key'] || '');
  if (!vertaaSalaisuus(annettu, ADMIN_DASHBOARD_KEY)) {
    return res.status(401).end();
  }

  try {
    let ulos = '-- DigiOpo: opetusryhmien vienti vanhasta kannasta (upsert)\nbegin;\n\n';
    for (const t of TAULUT) {
      const rivit = await haeKaikki(t);
      ulos += upsertSql(t, rivit) + '\n';
    }
    ulos += 'commit;\n';
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.status(200).send(ulos);
  } catch (err) {
    console.error('vienti-tmp virhe:', err.message);
    return res.status(500).end();
  }
}
