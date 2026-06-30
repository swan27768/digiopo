// DigiOpo – Maailma tarvitsee sinua – Luokan taulu
//
// GET  /api/maailma-taulu?koulu=KOULU_NIMI
//      → { ok: true, ilmoitukset: [...] }   (hyvaksytty-ilmoitukset galleriaan)
//
// POST /api/maailma-taulu
//   { toiminto: "laheta",            koulu, ilmoitus }      → { ok, id }
//   { toiminto: "tarkista_opettaja", koodi }                → { ok, koulu }
//   { toiminto: "hae_kaikki",        koodi }                → { ok, ilmoitukset, koulu }
//   { toiminto: "hyvaksy",           koodi, id }            → { ok }
//   { toiminto: "poista",            koodi, id }            → { ok }
//   { toiminto: "tykkaa",            id }                   → { ok, tykkaukset }
//   { toiminto: "tyhjenna",          koodi }                → { ok }

const SUPABASE_URL        = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

// ─── Rate limiter (muistipohjainen) ──────────────────────────────────────────
const yritykset    = new Map();
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

// ─── Koulukoodi → koulunimi ───────────────────────────────────────────────────
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
      return res.status(500).json({ ok: false, virhe: 'palvelinvirhe' });
    }
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, virhe: 'metodi_ei_sallittu' });
  }

  // ── Rate limit POST ──────────────────────────────────────────────────────
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim()
    || req.socket?.remoteAddress || 'tuntematon';
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

    // ── LÄHETÄ: oppilas lähettää ilmoituksen ────────────────────────────
    if (toiminto === 'laheta') {
      const koulu = String(body.koulu || '').trim();
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
      const koodi = String(body.koodi || '').trim().toUpperCase();
      if (!koodi) return res.status(400).json({ ok: false, virhe: 'koodi_puuttuu' });
      const koulu = await tarkistaKoodi(koodi);
      if (!koulu) return res.status(200).json({ ok: false, virhe: 'virheellinen_koodi' });
      return res.status(200).json({ ok: true, koulu });
    }

    // ── HAE KAIKKI: opettajan näkymä ────────────────────────────────────
    if (toiminto === 'hae_kaikki') {
      const koodi = String(body.koodi || '').trim().toUpperCase();
      if (!koodi) return res.status(400).json({ ok: false, virhe: 'koodi_puuttuu' });
      const koulu = await tarkistaKoodi(koodi);
      if (!koulu) return res.status(200).json({ ok: false, virhe: 'virheellinen_koodi' });

      const r = await sb(
        `maailma_ratkaisut?koulu=eq.${encodeURIComponent(koulu)}&order=created_at.asc&select=*`
      );
      if (!r.ok) throw new Error(`DB ${r.status}: ${await r.text()}`);
      const rivit = await r.json();
      return res.status(200).json({ ok: true, koulu, ilmoitukset: rivit.map(riviIlmoitukseksi) });
    }

    // ── HYVÄKSY ─────────────────────────────────────────────────────────
    if (toiminto === 'hyvaksy') {
      const koodi = String(body.koodi || '').trim().toUpperCase();
      const id    = String(body.id    || '').trim();
      if (!koodi || !id) return res.status(400).json({ ok: false, virhe: 'puuttuvat_parametrit' });
      const koulu = await tarkistaKoodi(koodi);
      if (!koulu) return res.status(200).json({ ok: false, virhe: 'virheellinen_koodi' });

      const r = await sb(
        `maailma_ratkaisut?id=eq.${encodeURIComponent(id)}&koulu=eq.${encodeURIComponent(koulu)}`,
        { method: 'PATCH', body: JSON.stringify({ tila: 'hyvaksytty' }) }
      );
      if (!r.ok) throw new Error(`DB ${r.status}: ${await r.text()}`);
      return res.status(200).json({ ok: true });
    }

    // ── POISTA ──────────────────────────────────────────────────────────
    if (toiminto === 'poista') {
      const koodi = String(body.koodi || '').trim().toUpperCase();
      const id    = String(body.id    || '').trim();
      if (!koodi || !id) return res.status(400).json({ ok: false, virhe: 'puuttuvat_parametrit' });
      const koulu = await tarkistaKoodi(koodi);
      if (!koulu) return res.status(200).json({ ok: false, virhe: 'virheellinen_koodi' });

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

      const r = await sb('rpc/mt_kasvata_tykkays', {
        method: 'POST',
        body:   JSON.stringify({ p_id: id }),
      });
      if (!r.ok) throw new Error(`DB ${r.status}: ${await r.text()}`);
      const uusi = await r.json();
      return res.status(200).json({ ok: true, tykkaukset: uusi });
    }

    // ── TYHJENNÄ ────────────────────────────────────────────────────────
    if (toiminto === 'tyhjenna') {
      const koodi = String(body.koodi || '').trim().toUpperCase();
      if (!koodi) return res.status(400).json({ ok: false, virhe: 'koodi_puuttuu' });
      const koulu = await tarkistaKoodi(koodi);
      if (!koulu) return res.status(200).json({ ok: false, virhe: 'virheellinen_koodi' });

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
    return res.status(500).json({ ok: false, virhe: 'palvelinvirhe' });
  }
}
