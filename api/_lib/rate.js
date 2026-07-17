// DigiOpo – Jaettu rate limiter (Upstash Redis REST, kuten lisenssi.js)
//
// Serverless-ympäristössä muistipohjainen Map ei toimi luotettavana rajana,
// koska jokainen Vercel-instanssi pitää omaa laskuriaan (ja ne nollautuvat).
// Tämä käyttää ensisijaisesti Upstash Redisiä, joka on jaettu kaikkien
// instanssien kesken. Jos Redistä ei ole konfiguroitu tai se on virhetilassa,
// turvaudutaan instanssikohtaiseen muistilaskuriin (parempi kuin ei mitään).
//
// Käyttö:
//   import { rateLimitSallittu } from './_lib/rate.js';
//   if (!(await rateLimitSallittu(`rl:jarjestys:ip:${ip}`, 40, 600))) → 429

const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

const redisKaytossa = () => Boolean(UPSTASH_REDIS_REST_URL && UPSTASH_REDIS_REST_TOKEN);

// Kasvattaa Redis-laskuria ja palauttaa arvon, tai null jos Redis on
// poissa/virhetilassa (jolloin kutsuja turvautuu muistilaskuriin).
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

// Instanssikohtainen varalaskuri, jos Redis puuttuu.
const muisti = new Map();
function muistiSallittu(avain, max, ikkunaMs) {
  const nyt = Date.now();
  const m = muisti.get(avain) || { maara: 0, alku: nyt };
  if (nyt - m.alku > ikkunaMs) { muisti.set(avain, { maara: 1, alku: nyt }); return true; }
  if (m.maara >= max) return false;
  muisti.set(avain, { maara: m.maara + 1, alku: m.alku });
  return true;
}

// Palauttaa true jos pyyntö sallitaan, false jos raja (max / ikkunaS) ylittyi.
export async function rateLimitSallittu(avain, max, ikkunaS) {
  const maara = await incr(avain, ikkunaS);
  if (maara === null) return muistiSallittu(avain, max, ikkunaS * 1000);
  return maara <= max;
}
