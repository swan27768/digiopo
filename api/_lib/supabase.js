// DigiOpo – Jaettu Supabase (PostgREST) -fetch-apuri, kelloheitto-suojattu
//
// TAUSTA: Supabasen PostgREST palauttaa satunnaisesti 401 / PGRST303
// ("JWT issued at future"), kun sen oma palvelinsolmu on hetkellisesti
// ajastaan jäljessä (PostgREST sietää vain ~30 s kelloeron). Token on
// kelvollinen – vika on Supabasen infran kellosynkassa, ei meidän. Ilmaisella
// tilillä emme voi pyytää heitä synkkaamaan NTP:tä, joten lievennämme itse:
// uusitaan VAIN tämä nimenomainen virhe pienellä viiveellä. Uusinta osuu
// yleensä hetkeen jolloin kello on taas synkassa. Kaikki muut virheet (myös
// muut 401:t) palautetaan heti ilman uusintaa.
//
// 401/PGRST303 tarkoittaa että PostgREST hylkäsi pyynnön ENNEN suoritusta,
// joten uusinta on turvallinen myös POST/DELETE-kutsuille (ei kaksoissuoritusta).

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

function onKelloheitto(status, teksti) {
  return status === 401 && /PGRST303|issued at future/i.test(teksti || '');
}

const nuku = (ms) => new Promise((r) => setTimeout(r, ms));

// sbFetch(path, opts, { retries, backoffMs })
//  - path: joko "taulu?..."/"rpc/..." (liitetään /rest/v1/ eteen) tai koko URL
//  - opts: kuten fetch (method, body, headers, signal…)
// Palauttaa Response-olion (r.ok, r.status, r.text(), r.json() toimivat).
export async function sbFetch(path, opts = {}, { retries = 2, backoffMs = 400 } = {}) {
  const base = (SUPABASE_URL || '').replace(/\/$/, '');
  const url = /^https?:\/\//.test(path) ? path : `${base}/rest/v1/${path}`;

  const headers = {
    apikey: SUPABASE_SERVICE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
    Accept: 'application/json',
    ...(opts.headers || {}),
  };
  if (opts.body != null && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  for (let yritys = 0; yritys <= retries; yritys++) {
    const r = await fetch(url, { ...opts, headers });
    if (r.ok) return r;

    // Luetaan body kerran, jotta voidaan sekä tutkia että palauttaa se eteenpäin.
    const teksti = await r.text();
    if (onKelloheitto(r.status, teksti) && yritys < retries) {
      await nuku(backoffMs * (yritys + 1)); // 400 ms, 800 ms
      continue;
    }
    // Body on jo luettu → rakennetaan uusi käytettävä Response.
    return new Response(teksti, {
      status: r.status,
      statusText: r.statusText,
      headers: r.headers,
    });
  }
}
