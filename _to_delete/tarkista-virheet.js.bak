// DigiOpo – Virhehälytysvahti
// Vercel Cron Job: ajaa kerran päivässä (Hobby-tilaus sallii vain päivittäisen ajastuksen)
// Tarkistaa onko api_virheet-tauluun tullut uusia rivejä edellisen 24h aikana.
// Jos on, lähettää yhteenvetosähköpostin adminille (ryhmiteltynä endpointeittain).
//
// Vercel cron config on tiedostossa vercel.json

import { kirjaaVirhe } from './_lib/virhelogi.js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@digiopo.fi';

// Ajastus on päivittäinen, joten katsotaan taaksepäin hieman yli 24h ettei
// jää aukkoja jos cron joskus viivästyy muutamalla minuutilla.
const TARKASTELUIKKUNA_H = 25;

async function haeVirheet() {
  const baseUrl = SUPABASE_URL.replace(/\/$/, '');
  const rajaAika = new Date(Date.now() - TARKASTELUIKKUNA_H * 60 * 60 * 1000).toISOString();

  const vastaus = await fetch(
    `${baseUrl}/rest/v1/api_virheet?luotu_at=gte.${rajaAika}&select=*&order=luotu_at.desc`,
    {
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        Accept: 'application/json',
      },
    }
  );

  if (!vastaus.ok) throw new Error(`Supabase virhe: ${vastaus.status}`);
  return vastaus.json();
}

function ryhmitteleEndpointeittain(virheet) {
  const ryhmat = {};
  for (const v of virheet) {
    ryhmat[v.endpoint] = (ryhmat[v.endpoint] || 0) + 1;
  }
  return Object.entries(ryhmat).sort((a, b) => b[1] - a[1]);
}

async function laheta_halytys(virheet) {
  const aika = new Date().toLocaleString('fi-FI', { timeZone: 'Europe/Helsinki' });
  const ryhmiteltyna = ryhmitteleEndpointeittain(virheet);
  const naytettavat = virheet.slice(0, 15);

  const html = `<!DOCTYPE html>
<html lang="fi">
<body style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;padding:32px 20px;color:#0f2540">
  <h2 style="color:#dc2626">🚨 DigiOpo – ${virheet.length} API-virhettä viimeisen ${TARKASTELUIKKUNA_H}h aikana</h2>

  <h3 style="color:#3a5a7a;margin-top:24px">Endpointeittain</h3>
  <table style="width:100%;border-collapse:collapse;margin:12px 0">
    ${ryhmiteltyna.map(([endpoint, maara]) => `
      <tr><td style="padding:6px 8px;border-bottom:1px solid #eee">${endpoint}</td><td style="padding:6px 8px;border-bottom:1px solid #eee;font-weight:700;text-align:right">${maara}</td></tr>
    `).join('')}
  </table>

  <h3 style="color:#3a5a7a;margin-top:24px">Viimeisimmät (max 15)</h3>
  <table style="width:100%;border-collapse:collapse;margin:12px 0;font-size:13px">
    ${naytettavat.map(v => `
      <tr>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;color:#7a9ab5;white-space:nowrap">${new Date(v.luotu_at).toLocaleString('fi-FI', { timeZone: 'Europe/Helsinki' })}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;font-weight:600">${v.endpoint}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee">${(v.viesti || '').slice(0, 200)}</td>
      </tr>
    `).join('')}
  </table>

  <p style="margin-top:24px"><a href="https://app.digiopo.fi" style="color:#2563a8">Avaa admin-paneeli tarkempaa tarkastelua varten →</a></p>
  <p style="font-size:12px;color:#7a9ab5;margin-top:24px">Lähetetty ${aika}. Tämä on automaattinen hälytys DigiOpo-järjestelmästä (tarkista-virheet-cron).</p>
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
      subject: `🚨 DigiOpo: ${virheet.length} API-virhettä viimeisen vuorokauden aikana`,
      html,
    }),
  });
}

export default async function handler(req, res) {
  // Vercel cron kutsuu GET-metodilla
  if (req.method !== 'GET') {
    return res.status(405).json({ virhe: 'Metodi ei sallittu' });
  }

  // Suojataan endpoint – vain Vercel cron pääsee ilman avainta (sama malli kuin tarkista-kirjaukset.js)
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers['authorization'] || '';
    if (authHeader !== `Bearer ${cronSecret}`) {
      return res.status(401).json({ virhe: 'Luvaton' });
    }
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return res.status(500).json({ ok: false, virhe: 'palvelin_ei_konfiguroitu' });
  }

  try {
    const virheet = await haeVirheet();

    if (virheet.length > 0 && RESEND_API_KEY && ADMIN_EMAIL) {
      await laheta_halytys(virheet);
      console.log(`Virhehälytys lähetetty: ${virheet.length} virhettä`);
      return res.status(200).json({ ok: true, halytys: true, maara: virheet.length });
    }

    console.log(`Virheitä ${TARKASTELUIKKUNA_H}h aikana: ${virheet.length} – ${virheet.length > 0 ? 'ei RESEND_API_KEY/ADMIN_EMAIL, hälytystä ei lähetetty' : 'ok'}`);
    return res.status(200).json({ ok: true, halytys: false, maara: virheet.length });
  } catch (err) {
    console.error('tarkista-virheet virhe:', err.message);
    await kirjaaVirhe('tarkista-virheet', err);
    return res.status(500).json({ ok: false, virhe: err.message });
  }
}
