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

// Palauttaa kirjautuneen opettajan sähköpostin (pienaakkosin) tai null.
// tarkistaToken hoitaa sekä allekirjoituksen että vanhentumisen tarkistuksen.
export async function haeKirjautunutOpettaja(req) {
  if (!LISENSSI_JWT_SECRET) return null; // maksumuuri/istunnot pois päältä
  const token = haeEvaste(req, 'digiopo_lisenssi');
  if (!token) return null;
  const payload = await tarkistaToken(token, LISENSSI_JWT_SECRET);
  if (!payload || payload.typ !== 'opettaja' || !payload.email) return null;
  return String(payload.email).toLowerCase();
}
