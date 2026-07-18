// DigiOpo – Lisenssien ylikäyttövahti
// Vercel Cron Job: ajaa kerran päivässä (ks. vercel.json).
// Tarkistaa lisenssi_kaytto-näkymästä koodit, joilla 30 pv aktiivisia laitteita
// on ENEMMÄN kuin myytyjä paikkoja (paikat), ja lähettää admineille koosteen.
//
// Seuranta, EI estä: hälytys auttaa puuttumaan ylikäyttöön kaupallisesti.
// Laitemäärä on suuntaa-antava (ks. supabase_lisenssi_seuranta.sql).

import { kirjaaVirhe } from './_lib/virhelogi.js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@digiopo.fi';

async function haeYlikaytto() {
  const baseUrl = SUPABASE_URL.replace(/\/$/, '');
  // ylikaytto = true → 30 pv aktiivisia laitteita enemmän kuin paikkoja.
  const vastaus = await fetch(
    `${baseUrl}/rest/v1/lisenssi_kaytto?ylikaytto=is.true&select=koodi,koulu,paikat,laitteita_30pv,laitteita_yht&order=laitteita_30pv.desc`,
    {
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
    }
  );
  if (!vastaus.ok) throw new Error(`Supabase virhe: ${vastaus.status}`);
  return vastaus.json();
}

async function laheta_halytys(rivit) {
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
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `DigiOpo Vahti <${FROM_EMAIL}>`,
      to: [ADMIN_EMAIL],
      subject: `🎫 DigiOpo: ${rivit.length} lisenssiä ylittää paikat`,
      html,
    }),
  });
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ virhe: 'Metodi ei sallittu' });
  }

  // Suojaus – vain Vercel cron pääsee (jos CRON_SECRET asetettu).
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers['authorization'] || '';
    if (authHeader !== `Bearer ${cronSecret}`) {
      return res.status(401).json({ virhe: 'Luvaton' });
    }
  }

  try {
    const rivit = await haeYlikaytto();

    if (rivit.length > 0) {
      if (RESEND_API_KEY && ADMIN_EMAIL) {
        await laheta_halytys(rivit);
        console.log(`Ylikäyttöhälytys lähetetty: ${rivit.length} koodia`);
      } else {
        console.log(`Ylikäyttöä (${rivit.length} koodia), mutta sähköposti ei konfiguroitu`);
      }
      return res.status(200).json({ ok: true, halytys: rivit.length > 0, maara: rivit.length });
    }

    console.log('Ei lisenssien ylikäyttöä – ok');
    return res.status(200).json({ ok: true, halytys: false, maara: 0 });
  } catch (err) {
    console.error('Lisenssivahti virhe:', err.message);
    await kirjaaVirhe('tarkista-lisenssit', err);
    return res.status(500).json({ ok: false, virhe: err.message });
  }
}
