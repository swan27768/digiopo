// DigiOpo – Lisenssintarkistus
// POST /api/lisenssi  →  { koodi: "KOULU-2026" }
// Palauttaa: { ok: true, voimassa_asti: "2026-12-31" }
//         tai { ok: false, virhe: "vanhentunut" | "virheellinen" | "liikaa_yrityksia" }

import { kirjaaVirhe } from './_lib/virhelogi.js';
import { haeIp } from './_lib/turva.js';
import { luoToken } from './_lib/token.js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const LISENSSI_JWT_SECRET = process.env.LISENSSI_JWT_SECRET;

// Lisenssievästeen (maksumuurin) ikä. Pitkä, jotta oppilas kirjautuu vain kerran
// per laite. lisenssiportti.js tekee taustalla 24 h välein hiljaisen tarkistuksen,
// joka uusii evästeen (onnistuessaan) tai poistaa sen (jos lisenssi peruttu) –
// näin peruutus tehoaa ~vuorokaudessa vaikka eväste on pitkäikäinen.
const EVASTE_IKA_S = 300 * 24 * 60 * 60; // ~lukuvuosi (300 vrk)

// Asettaa allekirjoitetun lisenssievästeen vastaukseen. Jos salaisuutta ei ole
// asetettu, ei tehdä mitään (maksumuuri on tällöin pois päältä = fail-open).
async function asetaLisenssiEvaste(res, tiedot) {
  if (!LISENSSI_JWT_SECRET) return;
  const token = await luoToken(
    { ...tiedot, exp: Date.now() + EVASTE_IKA_S * 1000 },
    LISENSSI_JWT_SECRET
  );
  res.setHeader(
    'Set-Cookie',
    `digiopo_lisenssi=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${EVASTE_IKA_S}`
  );
}

// Poistaa lisenssievästeen (peruttu tai vanhentunut lisenssi). Näin taustalla
// tehtävä tarkistus lopettaa pääsyn heti kun lisenssi ei enää kelpaa.
function poistaLisenssiEvaste(res) {
  res.setHeader(
    'Set-Cookie',
    'digiopo_lisenssi=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0'
  );
}

// Seuranta (ei estä): kirjaa onnistuneen koodikirjautumisen laitetunniste
// koodikohtaiseen tauluun deduplattuna (yksi rivi per koodi + laite). Näin
// admin näkee montako eri laitetta koodia käyttää vs. myydyt paikat. Upsert
// päivittää viim_nahty:n; ensi_nahty säilyy (ei mukana payloadissa). Seurannan
// epäonnistuminen EI koskaan saa vaikuttaa kirjautumiseen (try/catch + fire).
async function kirjaaLaite(koodi, koulu, laite) {
  if (!laite) return; // ei tunnistetta (esim. vanha frontend) → ei kirjata
  try {
    const base = SUPABASE_URL.replace(/\/$/, '');
    await fetch(`${base}/rest/v1/lisenssi_laitteet?on_conflict=koodi,laite`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify({ koodi, koulu, laite, viim_nahty: new Date().toISOString() }),
    });
  } catch {
    // Seurannan epäonnistuminen ei vaikuta kirjautumiseen.
  }
}

// Redis-pohjainen rate limiter – toimii luotettavasti serverless-ympäristössä.
// Kolme kerrosta brute-forcea vastaan – KAIKKI laskevat vain EPÄonnistuneita
// yrityksiä, joten onnistunut kirjautuminen ei koskaan kuluta budjettia:
//   - per IP:     saman IP:n epäonnistuneet yritykset   (max 40 / 10 min)
//   - per koodi:  saman koodin epäonnistuneet yritykset (max 8  / 10 min)
//   - globaali:   epäonnistuneet yritykset yhteensä     (max 120 / 10 min)
// TÄRKEÄÄ: koko koulu on tyypillisesti yhden julkisen NAT-IP:n takana, joten
// sadat oppilaat näkyvät palvelimelle SAMANA IP:nä. Siksi per-IP-raja EI saa
// laskea onnistuneita kirjautumisia – muuten luokan kirjautuessa aamulla N:s
// oppilas lukittuisi ulos vaikka koodi on oikea. Vain epäonnistumiset (väärä
// koodi / väärä opettajatoken) kasvattavat per-IP-laskuria.
const MAX_IP_FAIL = 40;
const MAX_KOODI_FAIL = 8;
const MAX_GLOBAL_FAIL = 120;
const IKKUNA_S = 10 * 60; // 10 minuuttia sekunteina

const redisKaytossa = () => Boolean(UPSTASH_REDIS_REST_URL && UPSTASH_REDIS_REST_TOKEN);

// Kasvattaa Redis-laskuria ja palauttaa sen arvon, tai null jos Redis on
// poissa/virhetilassa (jolloin ei rangaista käyttäjää = fail-open).
async function incr(avain, ikkunaS) {
  if (!redisKaytossa()) return null;
  const headers = {
    Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}`,
    'Content-Type': 'application/json',
  };
  try {
    const r = await fetch(`${UPSTASH_REDIS_REST_URL}/incr/${encodeURIComponent(avain)}`, {
      method: 'POST', headers,
    });
    const { result: maara } = await r.json();
    if (maara === 1) {
      await fetch(`${UPSTASH_REDIS_REST_URL}/expire/${encodeURIComponent(avain)}/${ikkunaS}`, {
        method: 'POST', headers,
      });
    }
    return maara;
  } catch {
    return null;
  }
}

// Lukee laskurin arvon KASVATTAMATTA sitä (Upstash GET). Palauttaa luvun tai
// null jos Redis on poissa/virhetilassa (→ fail-open, ei rangaista käyttäjää).
async function haeLaskuri(avain) {
  if (!redisKaytossa()) return null;
  try {
    const r = await fetch(`${UPSTASH_REDIS_REST_URL}/get/${encodeURIComponent(avain)}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}` },
    });
    const { result } = await r.json();
    return result == null ? 0 : Number(result);
  } catch {
    return null;
  }
}

// Per-IP-raja: tarkistetaan VAIN epäonnistumisten laskuri, kasvattamatta sitä.
// true = IP estetään (liikaa epäonnistuneita yrityksiä), false = päästetään läpi.
// Onnistuneet kirjautumiset eivät kasvata laskuria → koulun jaettu NAT-IP ei
// lukitse oppilaita ulos.
async function ipEstetty(ip) {
  const maara = await haeLaskuri(`rl:lisenssi:ipfail:${ip}`);
  return maara === null ? false : maara > MAX_IP_FAIL;
}

// Kirjaa epäonnistuneen kooditarkistuksen (per koodi, globaali JA per IP).
// Palauttaa true jos koodikohtainen, globaali tai IP-raja ylittyi
// (→ pyyntö kannattaa estää 429:llä).
async function kirjaaEpaonnistuminen(koodi, ip) {
  const [g, k, i] = await Promise.all([
    incr('rl:lisenssi:fail:global', IKKUNA_S),
    incr(`rl:lisenssi:fail:koodi:${koodi}`, IKKUNA_S),
    incr(`rl:lisenssi:ipfail:${ip}`, IKKUNA_S),
  ]);
  const globaaliYli = g !== null && g > MAX_GLOBAL_FAIL;
  const koodiYli = k !== null && k > MAX_KOODI_FAIL;
  const ipYli = i !== null && i > MAX_IP_FAIL;
  return globaaliYli || koodiYli || ipYli;
}

// Kirjaa epäonnistuneen opettajatoken-yrityksen per IP (brute-force-signaali).
async function kirjaaIpEpaonnistuminen(ip) {
  await incr(`rl:lisenssi:ipfail:${ip}`, IKKUNA_S);
}

async function haeSupabasesta(koodi) {
  const baseUrl = SUPABASE_URL.replace(/\/$/, '');
  const url = `${baseUrl}/rest/v1/lisenssit?koodi=eq.${encodeURIComponent(koodi.toUpperCase())}&select=koodi,koulu,tyyppi,voimassa_asti,aktiivinen`;
  const vastaus = await fetch(url, {
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Prefer': 'return=representation',
    },
  });
  if (!vastaus.ok) {
    const teksti = await vastaus.text();
    throw new Error(`Tietokantavirhe: ${vastaus.status} – ${teksti}`);
  }
  const data = await vastaus.json();
  return data[0] || null;
}

// Tarkistaa Supabase JWT-tokenin ja palauttaa käyttäjän sähköpostin
async function tarkistaToken(token) {
  const baseUrl = SUPABASE_URL.replace(/\/$/, '');
  const vastaus = await fetch(`${baseUrl}/auth/v1/user`, {
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${token}`,
    },
  });
  if (!vastaus.ok) return null;
  const data = await vastaus.json();
  return data.email || null;
}

// Hakee opettajalisenssin sähköpostin perusteella
async function haeOpettajaSupabasesta(email) {
  const baseUrl = SUPABASE_URL.replace(/\/$/, '');
  const url = `${baseUrl}/rest/v1/lisenssit?email=eq.${encodeURIComponent(email.toLowerCase())}&tyyppi=eq.opettaja&select=email,koulu,voimassa_asti,aktiivinen`;
  const vastaus = await fetch(url, {
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });
  if (!vastaus.ok) throw new Error(`Tietokantavirhe: ${vastaus.status}`);
  const data = await vastaus.json();
  return data[0] || null;
}

export default async function handler(req, res) {
  // CORS-otsikot
  res.setHeader('Access-Control-Allow-Origin', 'https://app.digiopo.fi');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ virhe: 'Metodi ei sallittu' });
  }

  // ── ULOSKIRJAUTUMINEN ────────────────────────────────────────────────────
  //
  // MIKSI: lisenssieväste on pitkäikäinen (~300 vrk), jotta oppilaan ja
  // opettajan ei tarvitse kirjautua joka kerta. Ilman uloskirjautumista se
  // tarkoittaa, että KOULUN YHTEISKONE jää opettajana kirjautuneeksi lähes
  // vuodeksi – ja kuka tahansa oppilas voisi järjestää osiot uudelleen,
  // moderoida töitä tai poistaa opetusryhmiä pysyvästi.
  //
  // Eväste on HttpOnly, joten selaimen JavaScript ei voi tyhjentää sitä.
  // Poisto vaatii siksi palvelinkutsun.
  //
  // Ei rate limitiä eikä valtuutusta: uloskirjautuminen on aina turvallinen
  // toiminto, ja sen estäminen olisi haitallisempaa kuin salliminen.
  try {
    const runko = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    if (String(runko.toiminto || '') === 'kirjaudu_ulos') {
      poistaLisenssiEvaste(res);
      return res.status(200).json({ ok: true, uloskirjattu: true });
    }
  } catch { /* virheellinen runko käsitellään alempana normaalisti */ }

  // IP rate limiting (x-real-ip on Vercelissä luotettava, ei väärennettävissä).
  // HUOM: raja koskee vain epäonnistuneita yrityksiä (ks. kommentti yllä) –
  // onnistunut kirjautuminen ei kuluta budjettia, joten koulun jaettu NAT-IP
  // ei lukitse oppilaita ulos.
  const ip = haeIp(req);

  if (await ipEstetty(ip)) {
    return res.status(429).json({ ok: false, virhe: 'liikaa_yrityksia' });
  }

  // ── Opettajalisenssi: Bearer-token tarkistus ─────────────────────────────
  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    try {
      const email = await tarkistaToken(token);
      if (!email) {
        await kirjaaIpEpaonnistuminen(ip);
        return res.status(401).json({ ok: false, virhe: 'ei_valtuutusta' });
      }

      const lisenssi = await haeOpettajaSupabasesta(email);
      if (!lisenssi || !lisenssi.aktiivinen) {
        poistaLisenssiEvaste(res);
        return res.status(200).json({ ok: false, virhe: 'virheellinen' });
      }
      if (new Date() > new Date(lisenssi.voimassa_asti)) {
        poistaLisenssiEvaste(res);
        return res.status(200).json({ ok: false, virhe: 'vanhentunut' });
      }
      // email evästeeseen → palvelin tunnistaa kirjautuneen opettajan (opettajatili).
      await asetaLisenssiEvaste(res, { typ: 'opettaja', koulu: lisenssi.koulu, email: email.toLowerCase() });
      return res.status(200).json({
        ok: true,
        tyyppi: 'opettaja',
        voimassa_asti: lisenssi.voimassa_asti,
        koulu: lisenssi.koulu,
      });
    } catch (err) {
      console.error('Opettajatarkistusvirhe:', err);
      await kirjaaVirhe('lisenssi opettaja', err);
      return res.status(500).json({ ok: false, virhe: 'palvelinvirhe' });
    }
  }

  // ── Koululisenssi: kooditarkistus ────────────────────────────────────────
  let koodi;
  let laite = '';
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    koodi = (body.koodi || '').trim();
    laite = String(body.laite || '').trim().slice(0, 64); // seuranta (ei estä)
  } catch {
    return res.status(400).json({ ok: false, virhe: 'virheellinen_pyynto' });
  }

  if (!koodi || koodi.length < 3 || koodi.length > 40) {
    return res.status(400).json({ ok: false, virhe: 'virheellinen' });
  }

  try {
    const lisenssi = await haeSupabasesta(koodi);

    if (!lisenssi || !lisenssi.aktiivinen) {
      poistaLisenssiEvaste(res);
      // Virheellinen koodi = mahdollinen brute-force-yritys → kirjataan (per koodi + IP).
      if (await kirjaaEpaonnistuminen(koodi.toUpperCase(), ip)) {
        return res.status(429).json({ ok: false, virhe: 'liikaa_yrityksia' });
      }
      return res.status(200).json({ ok: false, virhe: 'virheellinen' });
    }

    const nyt = new Date();
    const voimassaAsti = new Date(lisenssi.voimassa_asti);

    if (nyt > voimassaAsti) {
      poistaLisenssiEvaste(res);
      // Vanhentunut mutta oikea koodi – ei lasketa brute-force-yritykseksi.
      return res.status(200).json({ ok: false, virhe: 'vanhentunut' });
    }

    await asetaLisenssiEvaste(res, { typ: 'koulu', koulu: lisenssi.koulu });
    // Seuranta (ei estä): kirjaa laite koodikohtaisesti käyttömäärän arviointiin.
    await kirjaaLaite(lisenssi.koodi, lisenssi.koulu, laite);
    return res.status(200).json({
      ok: true,
      koodi: lisenssi.koodi,
      voimassa_asti: lisenssi.voimassa_asti,
      koulu: lisenssi.koulu,
    });
  } catch (err) {
    console.error('Supabase-virhe:', err);
    await kirjaaVirhe('lisenssi koulukoodi', err);
    return res.status(500).json({ ok: false, virhe: 'palvelinvirhe' });
  }
}
