// DigiOpo – Routing Middleware (Vercel Edge)
//
// Palvelinpuolinen maksumuuri: tarkistaa allekirjoitetun lisenssievästeen
// ENNEN kuin suojattu sisältö tarjoillaan. Ilman evästettä pyyntö ohjataan
// liity.html-portille (sivut) tai estetään 401:llä (data).
//
// TURVAVENTTIILI: jos LISENSSI_JWT_SECRET-ympäristömuuttujaa ei ole asetettu,
// muuri on POIS PÄÄLTÄ (fail-open). Näin koodin voi julkaista turvallisesti,
// ja muuri aktivoituu vasta kun salaisuus asetetaan Verceliin. Rollback =
// poista ympäristömuuttuja (ei uutta deployta tarvita).

import { next } from '@vercel/functions';
import { tarkistaToken } from './api/_lib/token.mjs';

export const config = {
  matcher: [
    '/sivut/:path*',
    '/pelit/:path*',
    '/tehtavat/:path*',
    '/robo-peli/:path*',
    '/7luokka',
    '/8luokka',
    '/9luokka',
    '/js/osio-data-7lk.js',
    '/js/osio-data-8lk.js',
    '/js/osio-data-9lk.js',
    '/js/tehtavat.json',
  ],
};

function haeEvaste(req, nimi) {
  const cookie = req.headers.get('cookie') || '';
  for (const osa of cookie.split(';')) {
    const vali = osa.indexOf('=');
    if (vali === -1) continue;
    if (osa.slice(0, vali).trim() === nimi) return osa.slice(vali + 1).trim();
  }
  return null;
}

export default async function middleware(req) {
  const secret = process.env.LISENSSI_JWT_SECRET;

  // Turvaventtiili: ilman salaisuutta muuri on pois päältä.
  if (!secret) return next();

  const token = haeEvaste(req, 'digiopo_lisenssi');
  const payload = token ? await tarkistaToken(token, secret) : null;
  if (payload) return next(); // valtuutus kunnossa

  const url = new URL(req.url);

  // Data-/JSON-pyynnöt: fetch ei hyödy redirectistä → estetään 401:llä.
  if (url.pathname.startsWith('/js/') || url.pathname.endsWith('.json')) {
    return new Response(JSON.stringify({ ok: false, virhe: 'ei_lisenssia' }), {
      status: 401,
      headers: { 'content-type': 'application/json; charset=utf-8' },
    });
  }

  // Sivupyynnöt: ohjaa portille ja muista alkuperäinen osoite.
  const portti = new URL('/liity.html', req.url);
  portti.searchParams.set('redirect', url.pathname + url.search);
  return Response.redirect(portti, 302);
}
