// DigiOpo – Jaettu virhelokitusapuri (kuormankestävä)
// Kirjaa API-funktioiden virheet Supabasen api_virheet-tauluun, jotta ne
// näkyvät admin-paneelin "Vikatilanteet"-osiossa.
//
// TÄRKEÄÄ: lokitus ei koskaan saa kaataa varsinaista pyyntöä EIKÄ pahentaa
// käynnissä olevaa katkosta. Ilman suojia virhepiikki (esim. Supabase
// ruuhkautuu) tuottaisi jokaisesta epäonnistuneesta pyynnöstä UUDEN
// Supabase-kirjoituksen jo valmiiksi kuormittuneeseen kantaan → death spiral.
//
// Kolme suojaa (kaikki per serverless-instanssi, module-tason tila):
//   1) Aikakatkaisu: hidas/kaatunut Supabase ei jää roikkumaan pyyntöön.
//   2) Näytekatto: enintään MAX_PER_IKKUNA lokia per minuutti; loput pudotetaan
//      hiljaa (varsinainen virhe näkyy silti Vercelin console-lokissa).
//   3) Katkaisin: jos lokitus epäonnistuu toistuvasti, se menee pois päältä
//      cooldown-ajaksi eikä enää yritä kirjoittaa kaatuvaan kantaan.

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

// 1) Aikakatkaisu
const AIKAKATKAISU_MS = 2000;

// 2) Näytekatto (per instanssi)
const MAX_PER_IKKUNA = 10;
const IKKUNA_MS = 60 * 1000;
let ikkunaAlku = 0;
let ikkunassa = 0;

// 3) Katkaisin (per instanssi)
const KATKAISIN_RAJA = 3;                 // peräkkäistä epäonnistumista → auki
const KATKAISIN_COOLDOWN_MS = 30 * 1000;  // kuinka kauaksi lokitus suljetaan
let perakkaisetVirheet = 0;
let katkaisinAukiAsti = 0;

// Merkitsee lokitusyrityksen epäonnistuneeksi ja avaa katkaisimen tarvittaessa.
function merkitseEpaonnistuminen() {
  perakkaisetVirheet++;
  if (perakkaisetVirheet >= KATKAISIN_RAJA) {
    katkaisinAukiAsti = Date.now() + KATKAISIN_COOLDOWN_MS;
    perakkaisetVirheet = 0;
  }
}

export async function kirjaaVirhe(endpoint, err, lisatiedot = {}) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return;

  const nyt = Date.now();

  // 3) Katkaisin auki → ohita lokitus kokonaan (kanta saa toipua rauhassa)
  if (nyt < katkaisinAukiAsti) return;

  // 2) Näytekatto: nollaa ikkuna ja katso onko budjetti jäljellä
  if (nyt - ikkunaAlku > IKKUNA_MS) {
    ikkunaAlku = nyt;
    ikkunassa = 0;
  }
  if (ikkunassa >= MAX_PER_IKKUNA) return; // hiljainen pudotus
  ikkunassa++;

  // 1) Aikakatkaisu: älä anna hitaan Supabasen pidentää pyynnön kestoa
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), AIKAKATKAISU_MS);
  try {
    const base = SUPABASE_URL.replace(/\/$/, '');
    const viesti = String(err && err.message ? err.message : err).slice(0, 2000);

    const r = await fetch(`${base}/rest/v1/api_virheet`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ endpoint, viesti, lisatiedot }),
      signal: ctrl.signal,
    });

    if (r.ok) {
      perakkaisetVirheet = 0; // onnistui → nollaa katkaisin
    } else {
      merkitseEpaonnistuminen();
    }
  } catch {
    // Verkkovirhe tai aikakatkaisu → laske katkaisinta kohti. Lokituksen
    // epäonnistuminen ei koskaan vaikuta käyttäjän pyyntöön.
    merkitseEpaonnistuminen();
  } finally {
    clearTimeout(t);
  }
}
