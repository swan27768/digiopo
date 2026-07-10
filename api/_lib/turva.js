// DigiOpo – Jaetut tietoturva-apurit
//
// haeIp(req)             – luotettava asiakkaan IP (Vercelin x-real-ip ensin)
// vertaaSalaisuus(a, b)  – vakioaikainen salaisuuksien vertailu (timing-safe)

import crypto from 'crypto';

// Palauttaa asiakkaan IP-osoitteen.
//
// Vercel asettaa `x-real-ip`-otsakkeen aidosta yhteydestä – asiakas EI voi
// väärentää sitä. Sen sijaan `x-forwarded-for`-otsakkeen vasemman pään voi
// asiakas itse asettaa, joten sitä ei käytetä ensisijaisena (aiempi versio
// käytti, mikä mahdollisti IP-pohjaisen rate limitin kiertämisen).
export function haeIp(req) {
  const realIp = String(req.headers['x-real-ip'] || '').trim();
  if (realIp) return realIp;

  // Varalla (esim. paikallinen kehitys): käytetään socketin osoitetta ennen
  // kuin luotetaan asiakkaan hallitsemaan x-forwarded-for-otsakkeeseen.
  const socketIp = req.socket?.remoteAddress || req.connection?.remoteAddress;
  if (socketIp) return socketIp;

  const xff = String(req.headers['x-forwarded-for'] || '')
    .split(',').map(s => s.trim()).filter(Boolean);
  return xff[0] || 'tuntematon';
}

// Vakioaikainen merkkijonovertailu. Estää ajastushyökkäykset, joissa
// hyökkääjä päättelee avaimen merkki kerrallaan vasteajan perusteella.
// Palauttaa false myös pituuseron tapauksessa (mutta tekee silti dummy-
// vertailun, jottei vertailun kesto vuoda tietoa).
export function vertaaSalaisuus(annettu, oikea) {
  if (typeof annettu !== 'string' || typeof oikea !== 'string' || oikea.length === 0) {
    return false;
  }
  const a = Buffer.from(annettu, 'utf8');
  const b = Buffer.from(oikea, 'utf8');
  if (a.length !== b.length) {
    crypto.timingSafeEqual(b, b); // vakioaikainen dummy
    return false;
  }
  return crypto.timingSafeEqual(a, b);
}
