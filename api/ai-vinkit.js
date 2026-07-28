// DigiOpo – Luokan AI-taulu – oppilaiden vinkit tekoälyn käytöstä
//
// GET  /api/ai-vinkit?koulu=KOULU_NIMI
//      → { ok: true, vinkit: [...] }   (hyväksytyt galleriaan)
//
// POST /api/ai-vinkit
//   { toiminto: "laheta",   nimimerkki, aihe, vinkki }  → { ok, id }
//   { toiminto: "tarkista_opettaja" }                    → { ok, koulu }
//   { toiminto: "hae_kaikki" }                           → { ok, vinkit, koulu }
//   { toiminto: "hyvaksy",  id }                         → { ok }
//   { toiminto: "poista",   id }                         → { ok }
//   { toiminto: "tykkaa",   id, laite }                  → { ok, tykkaukset }
//   { toiminto: "tyhjenna" }                             → { ok }
//
// VALTUUTUS (kuten maailma-taulu):
//   Moderointi (hae_kaikki, hyvaksy, poista, tyhjenna) vaatii OPETTAJAISTUNNON.
//   Koulu luetaan aina istunnosta, ei pyynnön rungosta (varapolku vain jos
//   maksumuuri on pois päältä).

import { kirjaaVirhe } from './_lib/virhelogi.js';
import { haeIp } from './_lib/turva.js';
import { rateLimitSallittu } from './_lib/rate.js';
import { haeOpettajaIstunto, haeIstunnonKoulu } from './_lib/opettaja.js';

const SUPABASE_URL         = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

const RL_MAX = 120;          // POST-toimintoja per IP
const RL_IKKUNA_S = 5 * 60;  // 5 minuutin ikkuna

const AIHEET = ['Opiskelu', 'Harrastus'];

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
  const r = await fetch(`${base}/rest/v1/${polku}`, {
    ...opts,
    headers: sbHeaders(opts.headers || {}),
  });
  return r;
}

// Palauttaa kirjautuneen opettajan koulun tai null.
async function opettajanKoulu(req) {
  const istunto = await haeOpettajaIstunto(req);
  if (!istunto) return null;
  if (istunto.koulu) return istunto.koulu;

  const r = await sb(
    `lisenssit?email=eq.${encodeURIComponent(istunto.email)}&tyyppi=eq.opettaja` +
    `&select=koulu,voimassa_asti,aktiivinen&limit=1`
  );
  if (!r.ok) return null;
  const [lis] = await r.json();
  if (!lis || !lis.aktiivinen) return null;
  if (new Date(lis.voimassa_asti) <= new Date()) return null;
  return lis.koulu;
}

function riviVinkiksi(rivi) {
  return {
    id:         rivi.id,
    nimimerkki: rivi.nimimerkki || '',
    aihe:       rivi.aihe,
    vinkki:     rivi.vinkki,
    tykkaukset: rivi.tykkaukset || 0,
    tila:       rivi.tila,
    luotu:      rivi.created_at,
  };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://app.digiopo.fi');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return res.status(500).json({ ok: false, virhe: 'palvelin_ei_konfiguroitu' });
  }

  // ── GET: hae hyväksytyt galleriaan ──────────────────────────────────────
  if (req.method === 'GET') {
    const koulu = String(req.query.koulu || '').trim();
    if (!koulu || koulu.length > 100) {
      return res.status(400).json({ ok: false, virhe: 'virheellinen_pyynto' });
    }
    try {
      const r = await sb(
        `ai_vinkit?koulu=eq.${encodeURIComponent(koulu)}&tila=eq.hyvaksytty&order=tykkaukset.desc,created_at.desc&select=*`
      );
      if (!r.ok) throw new Error(`DB ${r.status}: ${await r.text()}`);
      const rivit = await r.json();
      return res.status(200).json({ ok: true, vinkit: rivit.map(riviVinkiksi) });
    } catch (err) {
      console.error('ai-vinkit GET:', err);
      await kirjaaVirhe('ai-vinkit GET', err);
      return res.status(500).json({ ok: false, virhe: 'palvelinvirhe' });
    }
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, virhe: 'metodi_ei_sallittu' });
  }

  const ip = haeIp(req);
  if (!(await rateLimitSallittu(`rl:aivinkit:ip:${ip}`, RL_MAX, RL_IKKUNA_S))) {
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

    // ── LÄHETÄ: oppilas lähettää vinkin ─────────────────────────────────
    if (toiminto === 'laheta') {
      const koulu = (await haeIstunnonKoulu(req)) || String(body.koulu || '').trim();
      if (!koulu || koulu.length > 100) {
        return res.status(400).json({ ok: false, virhe: 'virheellinen_koulu' });
      }

      const nimimerkki = String(body.nimimerkki || '').trim().slice(0, 40);
      const aihe       = String(body.aihe || '').trim();
      const vinkki     = String(body.vinkki || '').trim().slice(0, 200);

      if (!AIHEET.includes(aihe)) return res.status(400).json({ ok: false, virhe: 'virheellinen_aihe' });
      if (!vinkki)                return res.status(400).json({ ok: false, virhe: 'vinkki_puuttuu' });

      const rivi = { koulu, nimimerkki, aihe, vinkki, tila: 'odottaa', tykkaukset: 0 };

      const r = await sb('ai_vinkit', {
        method:  'POST',
        headers: { Prefer: 'return=representation' },
        body:    JSON.stringify(rivi),
      });
      if (r.status !== 201) throw new Error(`DB ${r.status}: ${await r.text()}`);
      const [tallennettu] = await r.json();
      return res.status(200).json({ ok: true, id: tallennettu.id });
    }

    // ── TARKISTA OPETTAJA ────────────────────────────────────────────────
    if (toiminto === 'tarkista_opettaja') {
      const koulu = await opettajanKoulu(req);
      if (!koulu) return res.status(200).json({ ok: false, virhe: 'ei_opettajaistuntoa' });
      return res.status(200).json({ ok: true, koulu });
    }

    // ── HAE KAIKKI: opettajan näkymä ────────────────────────────────────
    if (toiminto === 'hae_kaikki') {
      const koulu = await opettajanKoulu(req);
      if (!koulu) return res.status(200).json({ ok: false, virhe: 'ei_opettajaistuntoa' });

      const r = await sb(
        `ai_vinkit?koulu=eq.${encodeURIComponent(koulu)}&order=created_at.asc&select=*`
      );
      if (!r.ok) throw new Error(`DB ${r.status}: ${await r.text()}`);
      const rivit = await r.json();
      return res.status(200).json({ ok: true, koulu, vinkit: rivit.map(riviVinkiksi) });
    }

    // ── HYVÄKSY ─────────────────────────────────────────────────────────
    if (toiminto === 'hyvaksy') {
      const id = String(body.id || '').trim();
      if (!id) return res.status(400).json({ ok: false, virhe: 'puuttuvat_parametrit' });
      const koulu = await opettajanKoulu(req);
      if (!koulu) return res.status(200).json({ ok: false, virhe: 'ei_opettajaistuntoa' });

      const r = await sb(
        `ai_vinkit?id=eq.${encodeURIComponent(id)}&koulu=eq.${encodeURIComponent(koulu)}`,
        { method: 'PATCH', body: JSON.stringify({ tila: 'hyvaksytty' }) }
      );
      if (!r.ok) throw new Error(`DB ${r.status}: ${await r.text()}`);
      return res.status(200).json({ ok: true });
    }

    // ── POISTA ──────────────────────────────────────────────────────────
    if (toiminto === 'poista') {
      const id = String(body.id || '').trim();
      if (!id) return res.status(400).json({ ok: false, virhe: 'puuttuvat_parametrit' });
      const koulu = await opettajanKoulu(req);
      if (!koulu) return res.status(200).json({ ok: false, virhe: 'ei_opettajaistuntoa' });

      const r = await sb(
        `ai_vinkit?id=eq.${encodeURIComponent(id)}&koulu=eq.${encodeURIComponent(koulu)}`,
        { method: 'DELETE' }
      );
      if (!r.ok && r.status !== 404) throw new Error(`DB ${r.status}: ${await r.text()}`);
      return res.status(200).json({ ok: true });
    }

    // ── TYKKÄÄ ──────────────────────────────────────────────────────────
    if (toiminto === 'tykkaa') {
      const id = String(body.id || '').trim();
      if (!id) return res.status(400).json({ ok: false, virhe: 'id_puuttuu' });

      const laite = String(body.laite || '').trim().slice(0, 64);
      const r = await sb('rpc/av_kasvata_tykkays', {
        method: 'POST',
        body:   JSON.stringify({ p_id: id, p_laite: laite || null }),
      });
      if (!r.ok) throw new Error(`DB ${r.status}: ${await r.text()}`);
      const uusi = await r.json();
      return res.status(200).json({ ok: true, tykkaukset: uusi });
    }

    // ── TYHJENNÄ ────────────────────────────────────────────────────────
    if (toiminto === 'tyhjenna') {
      const koulu = await opettajanKoulu(req);
      if (!koulu) return res.status(200).json({ ok: false, virhe: 'ei_opettajaistuntoa' });

      const r = await sb(
        `ai_vinkit?koulu=eq.${encodeURIComponent(koulu)}`,
        { method: 'DELETE' }
      );
      if (!r.ok) throw new Error(`DB ${r.status}: ${await r.text()}`);
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ ok: false, virhe: 'tuntematon_toiminto' });

  } catch (err) {
    console.error('ai-vinkit POST:', err);
    await kirjaaVirhe('ai-vinkit POST', err, { toiminto });
    return res.status(500).json({ ok: false, virhe: 'palvelinvirhe' });
  }
}
