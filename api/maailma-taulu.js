// DigiOpo – Maailma tarvitsee sinua – Luokan taulu
//
// GET  /api/maailma-taulu?koulu=KOULU_NIMI
//      → { ok: true, ilmoitukset: [...] }   (hyvaksytty-ilmoitukset galleriaan)
//
// POST /api/maailma-taulu
//   { toiminto: "laheta",            ilmoitus }   → { ok, id }
//   { toiminto: "tarkista_opettaja" }             → { ok, koulu }
//   { toiminto: "hae_kaikki" }                    → { ok, ilmoitukset, koulu }
//   { toiminto: "hyvaksy",           id }         → { ok }
//   { toiminto: "poista",            id }         → { ok }
//   { toiminto: "tykkaa",            id }         → { ok, tykkaukset }
//   { toiminto: "tyhjenna" }                      → { ok }
//
// VALTUUTUS (muutettu 19.7.2026):
//   Moderointitoiminnot vaativat OPETTAJAISTUNNON (typ === 'opettaja').
//   Aiemmin riitti koulukoodi – sama koodi, jonka jokainen oppilas kirjoittaa
//   päästäkseen sivustolle. Kuka tahansa oppilas pystyi siis hyväksymään omat
//   työnsä, poistamaan toisten töitä tai tyhjentämään koko luokan taulun.
//
//   Koulu luetaan aina istunnosta, ei pyynnön rungosta – myös lähetyksessä.

import { kirjaaVirhe } from './_lib/virhelogi.js';
import { haeIp } from './_lib/turva.js';
import { rateLimitSallittu } from './_lib/rate.js';
import { haeOpettajaIstunto, haeIstunnonKoulu } from './_lib/opettaja.js';

const SUPABASE_URL        = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

// ─── Rate limit: jaettu Redis-laskuri (ks. _lib/rate.js) ─────────────────────
// Toimii luotettavasti serverless-instanssien kesken (aiempi Map-laskuri
// nollautui joka cold startissa eikä pätenyt instanssien yli). Raja on väljähkö,
// koska koko luokka voi lähettää ja tykätä yhden koulun jaetun NAT-IP:n takaa –
// liian tiukka raja estäisi laillisen yhteiskäytön.
const RL_MAX = 120;          // POST-toimintoja per IP
const RL_IKKUNA_S = 5 * 60;  // 5 minuutin ikkuna

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

// ─── Koulukoodi → koulunimi ───────────────────────────────────────────────────
// Palauttaa kirjautuneen opettajan koulun tai null.
//
// Valtuutus tulee allekirjoitetusta istuntoevästeestä (typ === 'opettaja').
// Koulukoodilla kirjautunut oppilas EI läpäise tätä, vaikka eväste on sama.
//
// Koulu luetaan ensisijaisesti tokenista. Vanhoissa tokeneissa kenttää ei
// välttämättä ole, joten varalla haetaan se lisenssistä sähköpostilla.
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

// ─── DB-rivi → API-muoto ──────────────────────────────────────────────────────
function riviIlmoitukseksi(rivi) {
  return {
    id:         rivi.id,
    ongelma:    rivi.ongelma,
    jasenet:    rivi.jasenet,      // JSONB: [{nimi, rooli}, ...]
    idea:       rivi.idea,
    tykkaukset: rivi.tykkaukset || 0,
    tila:       rivi.tila,
    luotu:      rivi.created_at,
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

  // ── GET: hae hyväksytyt galleriaan ──────────────────────────────────────
  if (req.method === 'GET') {
    const koulu = String(req.query.koulu || '').trim();
    if (!koulu || koulu.length > 100) {
      return res.status(400).json({ ok: false, virhe: 'virheellinen_pyynto' });
    }
    try {
      const r = await sb(
        `maailma_ratkaisut?koulu=eq.${encodeURIComponent(koulu)}&tila=eq.hyvaksytty&order=created_at.asc&select=*`
      );
      if (!r.ok) throw new Error(`DB ${r.status}: ${await r.text()}`);
      const rivit = await r.json();
      return res.status(200).json({ ok: true, ilmoitukset: rivit.map(riviIlmoitukseksi) });
    } catch (err) {
      console.error('maailma-taulu GET:', err);
      await kirjaaVirhe('maailma-taulu GET', err);
      return res.status(500).json({ ok: false, virhe: 'palvelinvirhe' });
    }
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, virhe: 'metodi_ei_sallittu' });
  }

  // ── Rate limit POST ──────────────────────────────────────────────────────
  const ip = haeIp(req);
  if (!(await rateLimitSallittu(`rl:maailma:ip:${ip}`, RL_MAX, RL_IKKUNA_S))) {
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

    // ── LÄHETÄ: oppilas lähettää ilmoituksen ────────────────────────────
    if (toiminto === 'laheta') {
      // Koulu luetaan ensisijaisesti istunnosta, ei pyynnön rungosta. Muuten
      // oppilas voisi muokatulla pyynnöllä lähettää työn toisen koulun tauluun.
      // Varapolku (body.koulu) koskee vain tilannetta jossa maksumuuri on pois
      // päältä – silloin koko sisältö on muutenkin julkista.
      const koulu = (await haeIstunnonKoulu(req)) || String(body.koulu || '').trim();
      const il    = body.ilmoitus || {};

      if (!koulu || koulu.length > 100) {
        return res.status(400).json({ ok: false, virhe: 'virheellinen_koulu' });
      }

      const ongelma = String(il.ongelma || '').trim();
      const idea    = String(il.idea    || '').trim();
      const jasenet = Array.isArray(il.jasenet) ? il.jasenet : [];

      if (!ongelma) return res.status(400).json({ ok: false, virhe: 'ongelma_puuttuu' });
      if (!idea)    return res.status(400).json({ ok: false, virhe: 'idea_puuttuu' });
      if (jasenet.length < 3) return res.status(400).json({ ok: false, virhe: 'liian_vahan_jasenia' });

      // Siivoa jäsenet
      const jasenetSiistitty = jasenet.slice(0, 5).map(j => ({
        nimi:  String(j.nimi  || '').trim().slice(0, 40),
        rooli: String(j.rooli || '').trim().slice(0, 30),
      })).filter(j => j.nimi && j.rooli);

      const rivi = {
        koulu,
        ongelma: ongelma.slice(0, 80),
        jasenet: jasenetSiistitty,
        idea:    idea.slice(0, 200),
        tila:    'odottaa',
        tykkaukset: 0,
      };

      const r = await sb('maailma_ratkaisut', {
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
        `maailma_ratkaisut?koulu=eq.${encodeURIComponent(koulu)}&order=created_at.asc&select=*`
      );
      if (!r.ok) throw new Error(`DB ${r.status}: ${await r.text()}`);
      const rivit = await r.json();
      return res.status(200).json({ ok: true, koulu, ilmoitukset: rivit.map(riviIlmoitukseksi) });
    }

    // ── HYVÄKSY ─────────────────────────────────────────────────────────
    if (toiminto === 'hyvaksy') {
      const id = String(body.id || '').trim();
      if (!id) return res.status(400).json({ ok: false, virhe: 'puuttuvat_parametrit' });
      const koulu = await opettajanKoulu(req);
      if (!koulu) return res.status(200).json({ ok: false, virhe: 'ei_opettajaistuntoa' });

      const r = await sb(
        `maailma_ratkaisut?id=eq.${encodeURIComponent(id)}&koulu=eq.${encodeURIComponent(koulu)}`,
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
        `maailma_ratkaisut?id=eq.${encodeURIComponent(id)}&koulu=eq.${encodeURIComponent(koulu)}`,
        { method: 'DELETE' }
      );
      if (!r.ok && r.status !== 404) throw new Error(`DB ${r.status}: ${await r.text()}`);
      return res.status(200).json({ ok: true });
    }

    // ── TYKKÄÄ ──────────────────────────────────────────────────────────
    if (toiminto === 'tykkaa') {
      const id = String(body.id || '').trim();
      if (!id) return res.status(400).json({ ok: false, virhe: 'id_puuttuu' });

      // Per-laite-esto: selaimen tunniste estää saman laitteen toistuvat
      // tykkäykset ja vähentää turhaa rivikuormaa. Tyhjä → legacy (kasvatetaan).
      const laite = String(body.laite || '').trim().slice(0, 64);
      const r = await sb('rpc/mt_kasvata_tykkays', {
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
        `maailma_ratkaisut?koulu=eq.${encodeURIComponent(koulu)}`,
        { method: 'DELETE' }
      );
      if (!r.ok) throw new Error(`DB ${r.status}: ${await r.text()}`);
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ ok: false, virhe: 'tuntematon_toiminto' });

  } catch (err) {
    console.error('maailma-taulu POST:', err);
    await kirjaaVirhe('maailma-taulu POST', err, { toiminto });
    return res.status(500).json({ ok: false, virhe: 'palvelinvirhe' });
  }
}
