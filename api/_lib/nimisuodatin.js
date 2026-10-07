// DigiOpo – Nimimerkkisuodatin (tulostaulu näkyy kaikille kouluille)
//
// Tarkistaa nimimerkin (ja koulun nimen) ennen kuin se päätyy julkiseen tulostauluun:
//   1) sopimattomat sanat (suomi, englanti, ruotsi) – myös kiertoyritykset:
//      isot/pienet kirjaimet, ä/ö/å, numerokorvaukset (v1ttu, p4ska), välimerkit ja välilyönnit
//      sekä toistetut kirjaimet (paskaaa)
//   2) yhteystiedot: puhelinnumero, sähköposti, verkko-osoite (tietosuoja)
//
// Suodatin EI ole täydellinen. Täydennä listaa tarvittaessa: lisää sana pieninä kirjaimina
// ilman ääkkösiä (a/o) joko OSAT-listaan (löytyy mistä tahansa nimestä) tai SANAT-listaan
// (vain kokonainen sana; käytä lyhyille sanoille, jotka esiintyvät viattomissa sanoissa).
// Kaksoiskirjain sanassa (esim. vittu, mulkku) vaatii kaksoiskirjaimen nimessä, jotta
// viattomat sanat (esim. Niger-maa, grape) eivät osu.

// Löytyy nimestä osana (kirjoitettu ilman ääkkösiä)
const OSAT = [
  // suomi
  'vittu', 'vitun', 'vitu', 'paska', 'saatana', 'helvetti', 'helvetin', 'perse', 'huora', 'huoran',
  'hintti', 'mulkku', 'mulkero', 'kyrpa', 'pillu', 'runkkari', 'runkata', 'kusipaa', 'kusipaat',
  'neekeri', 'nekeri', 'raiskaa', 'raiskaus', 'idiootti', 'retardi', 'ryssa', 'mutakuono',
  'natsi', 'hitler', 'perkele', 'jumalauta',
  // englanti
  'fuck', 'shit', 'bitch', 'cunt', 'pussy', 'whore', 'slut', 'bastard', 'nigga', 'nigger',
  'faggot', 'retard', 'nazi', 'asshole', 'dickhead', 'cocksucker', 'sex',
  // ruotsi
  'fitta', 'knull', 'javla', 'horunge', 'neger',
];
// Vain kokonaisena sanana (lyhyet sanat, jotka esiintyvät viattomissa sanoissa)
const SANAT = ['rape', 'fag', 'homo', 'kuk', 'kusi', 'tisu', 'tissi', 'ass', 'dick', 'cock', 'hora', 'idiot', 'pimppi', 'porn'];

const LEET = { '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '@': 'a', '$': 's', '!': 'i', '€': 'e' };

function taivuta(s) {
  return s.toLowerCase()
    .replace(/[äå]/g, 'a').replace(/ö/g, 'o')
    .replace(/[01345 7@$!€]/g, m => LEET[m] || m);
}

// "vittu" → v+i+t{2,}u+ : sama kirjain saa toistua, kaksoiskirjain vaatii vähintään kaksi
function sanaRegex(sana) {
  let r = '';
  for (let i = 0; i < sana.length; i++) {
    const c = sana[i];
    if (sana[i + 1] === c) { r += `${c}{2,}`; i++; } else { r += `${c}+`; }
  }
  return r;
}
const OSA_RE  = new RegExp(OSAT.map(sanaRegex).join('|'));
const SANA_RE = new RegExp('^(?:' + SANAT.map(sanaRegex).join('|') + ')$');

// true = sopimaton
export function onSopimaton(teksti) {
  const t = taivuta(String(teksti || ''));
  // 1) Kirjaimet yhteen (kiertäminen "p.a.s.k.a" / "p a s k a")
  const yhteen = t.replace(/[^a-z]/g, '');
  if (OSA_RE.test(yhteen)) return true;
  // 2) Lyhyet sanat vain kokonaisina sanoina
  const sanat = t.split(/[^a-z]+/).filter(Boolean);
  return sanat.some(s => SANA_RE.test(s));
}

// true = sisältää yhteystietoja (puhelin, sähköposti, verkko-osoite)
export function sisaltaaYhteystiedon(teksti) {
  const s = String(teksti || '');
  const numeroita = (s.match(/\d/g) || []).length;
  return numeroita >= 7
    || /@/.test(s)
    || /(https?:|www\.|\.(fi|com|net|org|io|me|gg)\b)/i.test(s);
}

// Palauttaa null (kunnossa) tai virhekoodin
export function tarkistaNimimerkki(nimi) {
  if (sisaltaaYhteystiedon(nimi)) return 'nimi_yhteystieto';
  if (onSopimaton(nimi)) return 'nimi_ei_sovi';
  return null;
}
export function tarkistaKoulu(koulu) {
  return onSopimaton(koulu) ? 'nimi_ei_sovi' : null;
}
