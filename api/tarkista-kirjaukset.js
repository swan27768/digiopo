// DigiOpo – Kirjautumis- ja lisenssivahti
// Vercel Cron Job (ks. vercel.json). Tekee kaksi tarkistusta:
//   1) Kirjautumispiikki: yli 50 kirjausta viimeisen tunnin aikana → hälytys.
//   2) Lisenssien ylikäyttö: koodit joilla 30 pv aktiivisia laitteita enemmän
//      kuin myytyjä paikkoja → hälytys.
// (Yhdistetty samaan funktioon Hobby-planin 12 funktion rajan takia.)

import { kirjaaVirhe } from './_lib/virhelogi.js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@digiopo.fi';

const HALYTYSRAJA = 50; // kirjausta / tunti

async function haeKirjausmaara() {
  const baseUrl = SUPABASE_URL.replace(/\/$/, '');
  const tuntiSitten = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const vastaus = await fetch(
    `${baseUrl}/rest/v1/lisenssi_kirjaukset?kirjattu_klo=gte.${tuntiSitten}&select=id`,
    {
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Prefer': 'count=exact',
      },
    }
  );

  if (!vastaus.ok) throw new Error(`Supabase virhe: ${vastaus.status}`);

  // Supabase palauttaa määrän Content-Range-otsikossa: "0-49/127"
  const contentRange = vastaus.headers.get('content-range') || '';
  const maara = parseInt(contentRange.split('/')[1] || '0', 10);
  return maara;
}

async function laheta_halytys(maara) {
  const aika = new Date().toLocaleString('fi-FI', { timeZone: 'Europe/Helsinki' });
  const html = `<!DOCTYPE html>
<html lang="fi">
<body style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 20px;color:#0f2540">
  <h2 style="color:#dc2626">⚠️ DigiOpo – Epätavallinen kirjautumispiikki</h2>
  <p>Viimeisen tunnin aikana on tehty <strong>${maara} kirjautumista</strong>, mikä ylittää hälytysrajan (${HALYTYSRAJA}/tunti).</p>
  <table style="width:100%;border-collapse:collapse;margin:20px 0">
    <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#3a5a7a">Kirjauksia tunnissa</td><td style="padding:8px;border-bottom:1px solid #eee;font-weight:700;color:#dc2626">${maara}</td></tr>
    <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#3a5a7a">Hälytysraja</td><td style="padding:8px;border-bottom:1px solid #eee">${HALYTYSRAJA}</td></tr>
    <tr><td style="padding:8px;color:#3a5a7a">Aika</td><td style="padding:8px">${aika}</td></tr>
  </table>
  <p>Tarkista tilanne Supabasessa:</p>
  <ul style="line-height:1.8">
    <li>Onko kyseessä normaali oppilaspäivä (kaikki ok)?</li>
    <li>Onko sama IP-osoite tehnyt paljon pyyntöjä (brute force)?</li>
    <li>Onko jokin koodi vuotanut julkisuuteen?</li>
  </ul>
  <p style="font-size:12px;color:#7a9ab5;margin-top:24px">Tämä on automaattinen hälytys DigiOpo-järjestelmästä.</p>
</body>
</html>`;

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `DigiOpo Vahti <${FROM_EMAIL}>`,
      to: [ADMIN_EMAIL],
      subject: `⚠️ DigiOpo: ${maara} kirjautumista tunnissa`,
      html,
    }),
  });
}

// ─── Lisenssien ylikäyttö (haetaan lisenssi_kaytto-näkymästä) ─────────────────
async function haeYlikaytto() {
  const baseUrl = SUPABASE_URL.replace(/\/$/, '');
  const vastaus = await fetch(
    `${baseUrl}/rest/v1/lisenssi_kaytto?ylikaytto=is.true&select=koodi,koulu,paikat,laitteita_30pv,laitteita_yht&order=laitteita_30pv.desc`,
    { headers: { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` } }
  );
  if (!vastaus.ok) throw new Error(`Supabase virhe (ylikäyttö): ${vastaus.status}`);
  return vastaus.json();
}

async function lahetaYlikayttoHalytys(rivit) {
  const aika = new Date().toLocaleString('fi-FI', { timeZone: 'Europe/Helsinki' });
  const rivitHtml = rivit.map((r) => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #eee;font-weight:700">${r.koodi}</td>
      <td style="padding:8px;border-bottom:1px solid #eee">${r.koulu || '—'}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;color:#dc2626;font-weight:700">${r.laitteita_30pv}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${r.paikat}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;color:#7a9ab5">${r.laitteita_yht}</td>
    </tr>`).join('');
  const html = `<!DOCTYPE html>
<html lang="fi">
<body style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;padding:32px 20px;color:#0f2540">
  <h2 style="color:#dc2626">🎫 DigiOpo – Lisenssien ylikäyttö</h2>
  <p><strong>${rivit.length} koodilla</strong> on viimeisen 30 pv aikana enemmän aktiivisia laitteita kuin myytyjä paikkoja.</p>
  <table style="width:100%;border-collapse:collapse;margin:20px 0;font-size:14px">
    <tr style="text-align:left;color:#3a5a7a">
      <th style="padding:8px;border-bottom:2px solid #eee">Koodi</th>
      <th style="padding:8px;border-bottom:2px solid #eee">Koulu</th>
      <th style="padding:8px;border-bottom:2px solid #eee;text-align:center">Laitteita 30pv</th>
      <th style="padding:8px;border-bottom:2px solid #eee;text-align:center">Paikkoja</th>
      <th style="padding:8px;border-bottom:2px solid #eee;text-align:center">Yhteensä</th>
    </tr>
    ${rivitHtml}
  </table>
  <p style="font-size:13px;color:#3a5a7a">Laitemäärä on suuntaa-antava (sama oppilas voi käyttää useaa laitetta, yhteiskone laskee vähemmän). Käytä lukua ylikäytön havaitsemiseen, älä tarkkaan laskutukseen.</p>
  <p style="font-size:12px;color:#7a9ab5;margin-top:24px">Aika: ${aika} · Automaattinen hälytys DigiOpo-järjestelmästä.</p>
</body>
</html>`;

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: `DigiOpo Vahti <${FROM_EMAIL}>`,
      to: [ADMIN_EMAIL],
      subject: `🎫 DigiOpo: ${rivit.length} lisenssiä ylittää paikat`,
      html,
    }),
  });
}

export default async function handler(req, res) {
  // Vercel cron kutsuu GET-metodilla
  if (req.method !== 'GET') {
    return res.status(405).json({ virhe: 'Metodi ei sallittu' });
  }

  // Suojataan endpoint – vain Vercel cron pääsee ilman avainta
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers['authorization'] || '';
    if (authHeader !== `Bearer ${cronSecret}`) {
      return res.status(401).json({ virhe: 'Luvaton' });
    }
  }

  const sposti = Boolean(RESEND_API_KEY && ADMIN_EMAIL);
  try {
    // 1) Kirjautumispiikki
    const maara = await haeKirjausmaara();
    let kirjautumisHalytys = false;
    if (maara > HALYTYSRAJA) {
      if (sposti) await laheta_halytys(maara);
      kirjautumisHalytys = true;
      console.log(`Kirjautumishälytys: ${maara} kirjausta`);
    }

    // 2) Lisenssien ylikäyttö (ei saa kaataa kirjautumisvahtia esim. jos
    //    lisenssi_kaytto-näkymää ei ole vielä luotu).
    let ylikayttoja = 0;
    try {
      const yli = await haeYlikaytto();
      ylikayttoja = yli.length;
      if (ylikayttoja > 0 && sposti) {
        await lahetaYlikayttoHalytys(yli);
        console.log(`Ylikäyttöhälytys: ${ylikayttoja} koodia`);
      }
    } catch (e) {
      await kirjaaVirhe('tarkista-kirjaukset ylikaytto', e);
    }

    return res.status(200).json({ ok: true, kirjautumiset: maara, kirjautumisHalytys, ylikayttoja });
  } catch (err) {
    console.error('Kirjausvahti virhe:', err.message);
    await kirjaaVirhe('tarkista-kirjaukset', err);
    return res.status(500).json({ ok: false, virhe: err.message });
  }
}
