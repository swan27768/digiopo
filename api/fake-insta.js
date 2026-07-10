// DigiOpo – Fake Insta -profiilinhallinta
//
// GET  /api/fake-insta?koulu=KOULU_NIMI
//      → { ok: true, profiilit: [...] }   (hyvaksytty-profiilit galleriaan)
//
// POST /api/fake-insta
//   { toiminto: "laheta",            koulu, profiili }       → { ok, id }
//   { toiminto: "tarkista_opettaja", koodi }                 → { ok, koulu }
//   { toiminto: "hae_kaikki",        koodi }                 → { ok, profiilit, koulu }
//   { toiminto: "hyvaksy",           koodi, id }             → { ok }
//   { toiminto: "poista",            koodi, id }             → { ok }
//   { toiminto: "tykkaa",            id }                    → { ok, tykkayksiat }
//   { toiminto: "tahti",             id, kentta }            → { ok, maara }
//   { toiminto: "tyhjenna",          koodi }                 → { ok }
//
// Selain ei koskaan puhu suoraan Supabaseen – tämä funktio käyttää service_keytä.

import { kirjaaVirhe } from './_lib/virhelogi.js';
import { haeIp } from './_lib/turva.js';

const SUPABASE_URL       = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

// ─── Rate limiter (muistipohjainen) ──────────────────────────────────────────
const yritykset   = new Map();
const MAX_YRITYKSIA = 30;
const IKKUNA_MS     = 5 * 60 * 1000;

function tarkistaRateLimit(ip) {
  const nyt = Date.now();
  const m   = yritykset.get(ip) || { maara: 0, alku: nyt };
  if (nyt - m.alku > IKKUNA_MS) { yritykset.set(ip, { maara: 1, alku: nyt }); return true; }
  if (m.maara >= MAX_YRITYKSIA) return false;
  yritykset.set(ip, { maara: m.maara + 1, alku: m.alku });
  return true;
}

// ─── Supabase-apuri ──────────────────────────────────────────────────────────
function sbHeaders(extra = {}) {
  return {
    apikey:        SUPABASE_SERVICE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
    'Content-Type': 'application/json',
    Accept:        'application/json',
    ...extra,
  };
}

async function sb(polku, opts = {}) {
  const base = SUPABASE_URL.replace(/\/$/, '');
  const r    = await fetch(`${base}/rest/v1/${polku}`, {
    ...opts,
    headers: sbHeaders(opts.headers || {}),
  });
  return r;
}

// ─── Koulukoodi → koulunimi (suoraan lisenssit-taulusta) ─────────────────────
async function tarkistaKoodi(koodi) {
  const r = await sb(
    `lisenssit?koodi=eq.${encodeURIComponent(koodi)}&select=koulu,voimassa_asti,aktiivinen&limit=1`
  );
  if (!r.ok) return null;
  const [lis] = await r.json();
  if (!lis || !lis.aktiivinen) return null;
  if (new Date(lis.voimassa_asti) <= new Date()) return null;
  return lis.koulu;
}

// ─── DB-rivi → API-muoto (kenttänimet yhteensopivat vanhan JS:n kanssa) ──────
function riviProfiiliksi(rivi) {
  return {
    id:       rivi.id,
    username: rivi.kayttajanimi,
    name:     rivi.nimi,
    avatar:   rivi.avatar,
    bio1:     rivi.bio1,
    bio2:     rivi.bio2,
    bio3:     rivi.bio3,
    hashtags: rivi.hashtags,
    likes:    rivi.tykkayksiat,
    starredStrengths: {
      bio1: rivi.tahdet_bio1,
      bio2: rivi.tahdet_bio2,
      bio3: rivi.tahdet_bio3,
    },
    status:    rivi.tila,           // 'odottaa' | 'hyvaksytty'
    timestamp: new Date(rivi.luotu_at).getTime(),
  };
}

// ─── Handler ─────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://app.digiopo.fi');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return res.status(500).json({ ok: false, virhe: 'palvelin_ei_konfiguroitu' });
  }

  // ── GET: hae hyväksytyt profiilit oppilaan galleriaan ────────────────────
  if (req.method === 'GET') {
    const koulu = String(req.query.koulu || '').trim();
    if (!koulu || koulu.length > 100) {
      return res.status(400).json({ ok: false, virhe: 'virheellinen_pyynto' });
    }
    try {
      const r = await sb(
        `fake_insta_profiilit?koulu=eq.${encodeURIComponent(koulu)}&tila=eq.hyvaksytty&order=luotu_at.asc&select=*`
      );
      if (!r.ok) throw new Error(`DB ${r.status}: ${await r.text()}`);
      const rivit = await r.json();
      return res.status(200).json({ ok: true, profiilit: rivit.map(riviProfiiliksi) });
    } catch (err) {
      console.error('fake-insta GET:', err);
      await kirjaaVirhe('fake-insta GET', err);
      return res.status(500).json({ ok: false, virhe: 'palvelinvirhe' });
    }
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, virhe: 'metodi_ei_sallittu' });
  }

  // ── Rate limit POST-toiminnoille ──────────────────────────────────────────
  const ip = haeIp(req);
  if (!tarkistaRateLimit(ip)) {
    return res.status(429).json({ ok: false, virhe: 'liikaa_yrityksia' });
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
  } catch {
    return res.status(400).json({ ok: false, virhe: 'virheellinen_pyynto' });
  }

  const toiminto = String(body.toiminto || '');

  try {

    // ── LÄHETÄ: oppilas lähettää profiilin ─────────────────────────────────
    if (toiminto === 'laheta') {
      const koulu = String(body.koulu || '').trim();
      const p     = body.profiili || {};

      if (!koulu || koulu.length > 100) {
        return res.status(400).json({ ok: false, virhe: 'virheellinen_koulu' });
      }
      const unimi = String(p.username || '').trim();
      const nimi  = String(p.name     || '').trim();
      if (!unimi) return res.status(400).json({ ok: false, virhe: 'kayttajanimi_puuttuu' });
      if (!nimi)  return res.status(400).json({ ok: false, virhe: 'nimi_puuttuu' });

      const rivi = {
        koulu,
        kayttajanimi: unimi.slice(0, 60),
        nimi:         nimi.slice(0, 60),
        avatar:       String(p.avatar || '🙂').slice(0, 10),
        bio1:         String(p.bio1 || '').trim().slice(0, 60),
        bio2:         String(p.bio2 || '').trim().slice(0, 60),
        bio3:         String(p.bio3 || '').trim().slice(0, 60),
        hashtags:     String(p.hashtags || '').trim().slice(0, 80),
        post1:        String(p.post1 || '').trim().slice(0, 120),
        post2:        String(p.post2 || '').trim().slice(0, 120),
        post3:        String(p.post3 || '').trim().slice(0, 120),
        post4:        String(p.post4 || '').trim().slice(0, 120),
        post5:        String(p.post5 || '').trim().slice(0, 120),
        post6:        String(p.post6 || '').trim().slice(0, 120),
        tila: 'odottaa',
      };

      const r = await sb('fake_insta_profiilit', {
        method:  'POST',
        headers: { Prefer: 'return=representation' },
        body:    JSON.stringify(rivi),
      });
      if (r.status !== 201) throw new Error(`DB ${r.status}: ${await r.text()}`);
      const [tallennettu] = await r.json();
      return res.status(200).json({ ok: true, id: tallennettu.id });
    }

    // ── TARKISTA OPETTAJA: vahvista koulukoodi ────────────────────────────
    if (toiminto === 'tarkista_opettaja') {
      const koodi = String(body.koodi || '').trim().toUpperCase();
      if (!koodi) return res.status(400).json({ ok: false, virhe: 'koodi_puuttuu' });
      const koulu = await tarkistaKoodi(koodi);
      if (!koulu) return res.status(200).json({ ok: false, virhe: 'virheellinen_koodi' });
      return res.status(200).json({ ok: true, koulu });
    }

    // ── HAE KAIKKI: opettaja hakee kaikki koulunsa profiilit ──────────────
    if (toiminto === 'hae_kaikki') {
      const koodi = String(body.koodi || '').trim().toUpperCase();
      if (!koodi) return res.status(400).json({ ok: false, virhe: 'koodi_puuttuu' });
      const koulu = await tarkistaKoodi(koodi);
      if (!koulu) return res.status(200).json({ ok: false, virhe: 'virheellinen_koodi' });

      const r = await sb(
        `fake_insta_profiilit?koulu=eq.${encodeURIComponent(koulu)}&order=luotu_at.asc&select=*`
      );
      if (!r.ok) throw new Error(`DB ${r.status}: ${await r.text()}`);
      const rivit = await r.json();
      return res.status(200).json({ ok: true, koulu, profiilit: rivit.map(riviProfiiliksi) });
    }

    // ── HYVÄKSY: opettaja hyväksyy profiilin galleriaan ──────────────────
    if (toiminto === 'hyvaksy') {
      const koodi = String(body.koodi || '').trim().toUpperCase();
      const id    = String(body.id    || '').trim();
      if (!koodi || !id) return res.status(400).json({ ok: false, virhe: 'puuttuvat_parametrit' });
      const koulu = await tarkistaKoodi(koodi);
      if (!koulu) return res.status(200).json({ ok: false, virhe: 'virheellinen_koodi' });

      // Varmistetaan että profiili kuuluu tälle koululle
      const r = await sb(
        `fake_insta_profiilit?id=eq.${encodeURIComponent(id)}&koulu=eq.${encodeURIComponent(koulu)}`,
        { method: 'PATCH', body: JSON.stringify({ tila: 'hyvaksytty' }) }
      );
      if (!r.ok) throw new Error(`DB ${r.status}: ${await r.text()}`);
      return res.status(200).json({ ok: true });
    }

    // ── POISTA: opettaja poistaa profiilin ───────────────────────────────
    if (toiminto === 'poista') {
      const koodi = String(body.koodi || '').trim().toUpperCase();
      const id    = String(body.id    || '').trim();
      if (!koodi || !id) return res.status(400).json({ ok: false, virhe: 'puuttuvat_parametrit' });
      const koulu = await tarkistaKoodi(koodi);
      if (!koulu) return res.status(200).json({ ok: false, virhe: 'virheellinen_koodi' });

      const r = await sb(
        `fake_insta_profiilit?id=eq.${encodeURIComponent(id)}&koulu=eq.${encodeURIComponent(koulu)}`,
        { method: 'DELETE' }
      );
      if (!r.ok && r.status !== 404) throw new Error(`DB ${r.status}: ${await r.text()}`);
      return res.status(200).json({ ok: true });
    }

    // ── TYKKÄÄ: oppilas tykkää profiilista (atominen) ─────────────────────
    if (toiminto === 'tykkaa') {
      const id = String(body.id || '').trim();
      if (!id) return res.status(400).json({ ok: false, virhe: 'id_puuttuu' });

      const r = await sb('rpc/fip_kasvata_tykkays', {
        method: 'POST',
        body:   JSON.stringify({ p_id: id }),
      });
      if (!r.ok) throw new Error(`DB ${r.status}: ${await r.text()}`);
      const uusi = await r.json();
      return res.status(200).json({ ok: true, tykkayksiat: uusi });
    }

    // ── TÄHTI: oppilas antaa vahvuustähden (atominen) ─────────────────────
    if (toiminto === 'tahti') {
      const id     = String(body.id     || '').trim();
      const kentta = String(body.kentta || '').trim();
      if (!id || !['bio1', 'bio2', 'bio3'].includes(kentta)) {
        return res.status(400).json({ ok: false, virhe: 'virheelliset_parametrit' });
      }

      const r = await sb('rpc/fip_kasvata_tahti', {
        method: 'POST',
        body:   JSON.stringify({ p_id: id, p_kentta: kentta }),
      });
      if (!r.ok) throw new Error(`DB ${r.status}: ${await r.text()}`);
      const uusi = await r.json();
      return res.status(200).json({ ok: true, maara: uusi });
    }

    // ── TYHJENNÄ: opettaja tyhjentää koulun kaikki profiilit ──────────────
    if (toiminto === 'tyhjenna') {
      const koodi = String(body.koodi || '').trim().toUpperCase();
      if (!koodi) return res.status(400).json({ ok: false, virhe: 'koodi_puuttuu' });
      const koulu = await tarkistaKoodi(koodi);
      if (!koulu) return res.status(200).json({ ok: false, virhe: 'virheellinen_koodi' });

      const r = await sb(
        `fake_insta_profiilit?koulu=eq.${encodeURIComponent(koulu)}`,
        { method: 'DELETE' }
      );
      if (!r.ok) throw new Error(`DB ${r.status}: ${await r.text()}`);
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ ok: false, virhe: 'tuntematon_toiminto' });

  } catch (err) {
    console.error('fake-insta POST:', err);
    await kirjaaVirhe('fake-insta POST', err, { toiminto });
    return res.status(500).json({ ok: false, virhe: 'palvelinvirhe' });
  }
}
