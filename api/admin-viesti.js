// DigiOpo – Admin-paneelin massaviesti-endpoint
//
// GET  /api/admin-viesti?action=esikatselu
//      Header: x-admin-key   → { ok, maara } (kuinka moni saisi viestin nyt)
//
// POST /api/admin-viesti
//      Header: x-admin-key
//      Body: { action: 'testi', otsikko, viesti }
//        → lähettää viestin VAIN ADMIN_EMAILiin esikatselua varten
//      Body: { action: 'laheta', otsikko, viesti, vahvistus: 'LAHETA' }
//        → lähettää kaikille aktiivisille, voimassa oleville, ei-testilisensseille
//        → vaatii vahvistus==='LAHETA' (myös palvelimella, ei vain selaimessa)
//
// Vastaanottajat: lisenssit-taulusta, aktiivinen=true, voimassa_asti > nyt,
// tyyppi != 'testi', sähköpostit deduplikoitu (sama opettaja voi olla useammalla rivillä).
//
// Ympäristömuuttujat: SUPABASE_URL, SUPABASE_SERVICE_KEY, RESEND_API_KEY,
// ADMIN_EMAIL, FROM_EMAIL, ADMIN_DASHBOARD_KEY (sama kuin admin-tilastot.js:ssä)

import { kirjaaVirhe } from './_lib/virhelogi.js';
import { vertaaSalaisuus } from './_lib/turva.js';

// Isompi vastaanottajajoukko + Resendin rate limit -kunnioittava viive voi
// kestää tavallista pidempään, joten nostetaan funktion maksimiaikaa.
export const config = { maxDuration: 60 };

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@digiopo.fi';
const ADMIN_DASHBOARD_KEY = process.env.ADMIN_DASHBOARD_KEY;

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

// Hakee deduplikoidut sähköpostit aktiivisilta, voimassa olevilta, ei-testilisensseiltä
async function haeVastaanottajat() {
  const nyt = new Date().toISOString().split('T')[0];
  const r = await sb(
    `lisenssit?aktiivinen=eq.true&voimassa_asti=gt.${nyt}&tyyppi=neq.testi&select=email,koulu`
  );
  if (!r.ok) throw new Error(`lisenssit-haku epäonnistui: ${r.status}`);
  const rivit = await r.json();

  const emailit = new Map(); // email -> koulu (ensimmäinen löytyvä, vain näyttöä varten)
  for (const rivi of rivit) {
    const email = (rivi.email || '').trim().toLowerCase();
    if (email && !emailit.has(email)) emailit.set(email, rivi.koulu || '');
  }
  return emailit;
}

// Viesti tulee admin-paneelin rich text -editorista valmiina HTML:nä (esim.
// <b>lihavoitu</b>, <u>alleviivattu</u>). Puhdistetaan vaaralliset elementit
// palvelimella vielä uudelleen (selain jo puhdisti, tämä on toinen varmistus)
// ennen kuin sisältö upotetaan oikeasti asiakkaille lähtevään sähköpostiin.
function puhdistaViestiHtml(html) {
  return String(html)
    // poista script/style/iframe/object/embed kokonaan sisältöineen
    .replace(/<(script|style|iframe|object|embed)[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<(script|style|iframe|object|embed)[^>]*\/?>/gi, '')
    // poista on*-tapahtumakäsittelijät ja javascript: -linkit attribuuteista
    .replace(/\son\w+\s*=\s*(".*?"|'.*?'|[^\s>]+)/gi, '')
    .replace(/(href|src)\s*=\s*(["'])\s*javascript:[^"']*\2/gi, '$1="#"');
}

function escHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function viestinHtml(otsikko, viesti) {
  const puhdasViesti = puhdistaViestiHtml(viesti);

  return `<!DOCTYPE html>
<html lang="fi">
<body style="font-family:Arial,sans-serif;max-width:580px;margin:0 auto;padding:32px 20px;color:#0f2540;background:#f8fbff">
  <div style="text-align:center;margin-bottom:28px">
    <span style="font-size:26px;font-weight:700;color:#1a3f6f">Digi<span style="color:#2d9e6b">Opo</span></span>
  </div>
  <h2 style="color:#1a3f6f">${escHtml(otsikko)}</h2>
  <div style="line-height:1.7">${puhdasViesti}</div>
  <p style="font-size:12px;color:#7a9ab5;margin-top:32px">Tämä on tiedote DigiOpo-palvelusta. Kysyttävää? Vastaa tähän viestiin tai ota yhteyttä: <a href="mailto:digiopo@digiopo.fi" style="color:#2563a8">digiopo@digiopo.fi</a></p>
</body>
</html>`;
}

function odota(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// HUOM: Resendin /emails/batch-rajapinta osoittautui testissä epäluotettavaksi
// HTML-muotoillun sisällön kanssa – vastaanotettu viesti näytti raakoja
// HTML-tageja (<div>, <b> jne.) muotoillun tekstin sijaan. Muualla koodikannassa
// (tilaus.js, tarkista-virheet.js) käytetty yksittäinen /emails-rajapinta
// toimii HTML:n kanssa luotettavasti, joten lähetetään viestit yksitellen sen
// kautta. Resendin oletusrajoitus on 5 pyyntöä/s koko tiimille, joten pyyntöjen
// välissä pieni viive ettei osumaa tule 429:ään (ja jos silti osuu, yritetään
// kerran uudelleen lyhyen odotuksen jälkeen).
const RESEND_VIIVE_MS = 900;

async function lahetaYksi(email, otsikko, html, yrKerta = 0) {
  const vastaus = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `DigiOpo <${FROM_EMAIL}>`,
      to: [email],
      subject: otsikko,
      html,
    }),
  });

  if (vastaus.ok) return { ok: true };

  if (vastaus.status === 429 && yrKerta < 1) {
    await odota(1000);
    return lahetaYksi(email, otsikko, html, yrKerta + 1);
  }

  const teksti = await vastaus.text();
  return { ok: false, status: vastaus.status, teksti };
}

// Lähetetään pieninä, rinnakkaisina erinä (ei yksi kerrallaan) jotta iso
// vastaanottajajoukko ei aja Vercelin funktion suoritusajan (maxDuration) yli.
// 4 rinnakkaista pyyntöä + ~900ms tauko erien välissä pysyy Resendin 5 pyyntöä/s
// -oletusrajan alla.
const RINNAKKAISUUS = 4;

async function lahetaBatch(emailit, otsikko, viesti) {
  const html = viestinHtml(otsikko, viesti);
  const kaikki = Array.from(emailit.keys());
  let onnistuneet = 0;
  let epaonnistuneet = 0;

  for (let i = 0; i < kaikki.length; i += RINNAKKAISUUS) {
    const era = kaikki.slice(i, i + RINNAKKAISUUS);
    const tulokset = await Promise.all(era.map((email) => lahetaYksi(email, otsikko, html)));

    for (let j = 0; j < tulokset.length; j++) {
      const tulos = tulokset[j];
      const email = era[j];
      if (tulos.ok) {
        onnistuneet += 1;
      } else {
        epaonnistuneet += 1;
        console.error(`admin-viesti lähetysvirhe (${email}):`, tulos.status, tulos.teksti);
        await kirjaaVirhe('admin-viesti laheta', new Error(`Resend ${tulos.status}: ${tulos.teksti}`), { email });
      }
    }

    if (i + RINNAKKAISUUS < kaikki.length) await odota(RESEND_VIIVE_MS);
  }

  return { onnistuneet, epaonnistuneet };
}

async function kirjaaLoki(otsikko, viesti, maara, onnistuneet, epaonnistuneet) {
  try {
    await sb('admin_viestit', {
      method: 'POST',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({ otsikko, viesti, vastaanottajamaara: maara, onnistuneet, epaonnistuneet }),
    });
  } catch (err) {
    console.error('admin_viestit-lokitus epäonnistui:', err.message);
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'x-admin-key, Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

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

  try {
    // ── GET: esikatselu (vastaanottajamäärä) tai historia ─────────────────
    if (req.method === 'GET') {
      const action = String(req.query.action || '');

      if (action === 'esikatselu') {
        const emailit = await haeVastaanottajat();
        return res.status(200).json({ ok: true, maara: emailit.size });
      }

      if (action === 'historia') {
        const r = await sb('admin_viestit?select=*&order=laheta_at.desc&limit=10');
        if (!r.ok) throw new Error(`admin_viestit-haku epäonnistui: ${r.status}`);
        const rivit = await r.json();
        return res.status(200).json({ ok: true, historia: rivit });
      }

      return res.status(400).json({ ok: false, virhe: 'tuntematon_toiminto' });
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ ok: false, virhe: 'metodi_ei_sallittu' });
    }

    let body;
    try {
      body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    } catch {
      return res.status(400).json({ ok: false, virhe: 'virheellinen_pyynto' });
    }

    const action = String(body.action || '');
    const otsikko = String(body.otsikko || '').trim().slice(0, 200);
    const viesti = String(body.viesti || '').trim().slice(0, 8000); // HTML-muotoilu vie enemmän tilaa kuin pelkkä teksti

    if (!otsikko || !viesti) {
      return res.status(400).json({ ok: false, virhe: 'otsikko_tai_viesti_puuttuu' });
    }
    if (!RESEND_API_KEY || !ADMIN_EMAIL) {
      return res.status(500).json({ ok: false, virhe: 'sahkoposti_ei_konfiguroitu' });
    }

    // ── POST: testiviesti vain adminille ──────────────────────────────────
    if (action === 'testi') {
      const testiEmailit = new Map([[ADMIN_EMAIL.toLowerCase(), '(testi)']]);
      const { onnistuneet, epaonnistuneet } = await lahetaBatch(testiEmailit, `[TESTI] ${otsikko}`, viesti);
      return res.status(200).json({ ok: true, testi: true, onnistuneet, epaonnistuneet });
    }

    // ── POST: oikea massalähetys ───────────────────────────────────────────
    if (action === 'laheta') {
      if (body.vahvistus !== 'LAHETA') {
        return res.status(400).json({ ok: false, virhe: 'vahvistus_puuttuu' });
      }

      const emailit = await haeVastaanottajat();
      if (emailit.size === 0) {
        return res.status(200).json({ ok: true, maara: 0, onnistuneet: 0, epaonnistuneet: 0 });
      }

      const { onnistuneet, epaonnistuneet } = await lahetaBatch(emailit, otsikko, viesti);
      await kirjaaLoki(otsikko, viesti, emailit.size, onnistuneet, epaonnistuneet);

      return res.status(200).json({ ok: true, maara: emailit.size, onnistuneet, epaonnistuneet });
    }

    return res.status(400).json({ ok: false, virhe: 'tuntematon_toiminto' });
  } catch (err) {
    console.error('admin-viesti virhe:', err);
    await kirjaaVirhe('admin-viesti', err);
    return res.status(500).json({ ok: false, virhe: 'palvelinvirhe' });
  }
}
