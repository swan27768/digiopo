// DigiOpo – Opettajaistunnon luku (opettajatili, Vaihe 1)
//
// Lukee allekirjoitetun `digiopo_lisenssi`-evästeen, verifioi sen ja palauttaa
// kirjautuneen opettajan sähköpostin. Palauttaa null, jos kyseessä ei ole
// opettajaistunto (esim. koulukoodilla kirjautunut oppilas → ei email-kenttää).
//
// Tämä on hallintaoikeuden tunniste: myöhemmissä vaiheissa ryhmien luonti,
// nimeäminen, poisto ja järjestyksen tallennus valtuutetaan vertaamalla tätä
// sähköpostia ryhmän omistaja_email-kenttään.

import { tarkistaToken } from './token.js';

const LISENSSI_JWT_SECRET = process.env.LISENSSI_JWT_SECRET;

function haeEvaste(req, nimi) {
  const cookie = (req.headers && req.headers.cookie) || '';
  for (const osa of cookie.split(';')) {
    const vali = osa.indexOf('=');
    if (vali === -1) continue;
    if (osa.slice(0, vali).trim() === nimi) return osa.slice(vali + 1).trim();
  }
  return null;
}

// Palauttaa koko opettajaistunnon { email, koulu } tai null.
// tarkistaToken hoitaa sekä allekirjoituksen että vanhentumisen tarkistuksen.
//
// HUOM: `typ !== 'opettaja'` sulkee pois koulukoodilla kirjautuneen oppilaan,
// vaikka eväste on sama. Koulukoodi-istunnossa ei ole email-kenttää.
export async function haeOpettajaIstunto(req) {
  if (!LISENSSI_JWT_SECRET) return null; // maksumuuri/istunnot pois päältä
  const token = haeEvaste(req, 'digiopo_lisenssi');
  if (!token) return null;
  const payload = await tarkistaToken(token, LISENSSI_JWT_SECRET);
  if (!payload || payload.typ !== 'opettaja' || !payload.email) return null;
  return {
    email: String(payload.email).toLowerCase(),
    koulu: payload.koulu || null,
  };
}

// Palauttaa kirjautuneen opettajan sähköpostin (pienaakkosin) tai null.
export async function haeKirjautunutOpettaja(req) {
  const istunto = await haeOpettajaIstunto(req);
  return istunto ? istunto.email : null;
}
