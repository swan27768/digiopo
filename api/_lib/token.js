// DigiOpo – allekirjoitettu istuntotoken (HMAC-SHA256, Web Crypto)
//
// HUOM: tämä on .js (ei .mjs), jotta Vercel voi kääntää sen samoin kuin muut
// api/_lib -tiedostot. .mjs aiheutti ERR_REQUIRE_ESM:n, koska Vercel ajaa
// api-funktioita CommonJS-tilassa eikä voi require()-ladata ES-moduulia.
//
// Toimii sekä Node- (api/*) että Edge-ympäristössä (middleware): käyttää
// Web Cryptoa, ja jos globalThis.crypto puuttuu (vanha Node), turvautuu
// node:crypton webcryptoon.
//
// Muoto:  base64url(JSON-payload) + "." + base64url(HMAC-SHA256)

const enc = new TextEncoder();
const dec = new TextDecoder();

function b64urlEncode(bytes) {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecode(str) {
  let s = str.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  const bin = atob(s);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

// Hakee Web Crypto -rajapinnan tavalla joka toimii kaikissa ympäristöissä.
// Edge + Node 19+: globalThis.crypto valmiina. Node 18: node:crypto webcrypto.
// (node:crypto-import kirjoitettu ei-literaalina, jottei Edge-bundleri yritä
// analysoida sitä; sitä ei koskaan ajeta Edgessä koska globalThis.crypto on.)
let _subtle = null;
async function getSubtle() {
  if (_subtle) return _subtle;
  if (globalThis.crypto && globalThis.crypto.subtle) {
    _subtle = globalThis.crypto.subtle;
    return _subtle;
  }
  const moduuli = 'node:' + 'crypto';
  const { webcrypto } = await import(moduuli);
  _subtle = webcrypto.subtle;
  return _subtle;
}

async function tuoAvain(subtle, secret) {
  return subtle.importKey(
    'raw', enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false, ['sign', 'verify']
  );
}

// Luo allekirjoitetun tokenin annetusta payloadista.
export async function luoToken(payload, secret) {
  const subtle = await getSubtle();
  const body = b64urlEncode(enc.encode(JSON.stringify(payload)));
  const key = await tuoAvain(subtle, secret);
  const sig = new Uint8Array(await subtle.sign('HMAC', key, enc.encode(body)));
  return body + '.' + b64urlEncode(sig);
}

// Tarkistaa tokenin allekirjoituksen ja voimassaolon.
// Palauttaa payloadin jos kelvollinen, muuten null.
export async function tarkistaToken(token, secret) {
  if (typeof token !== 'string' || token.indexOf('.') === -1) return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  try {
    const subtle = await getSubtle();
    const key = await tuoAvain(subtle, secret);
    const ok = await subtle.verify('HMAC', key, b64urlDecode(sig), enc.encode(body));
    if (!ok) return null;
    const payload = JSON.parse(dec.decode(b64urlDecode(body)));
    if (payload.exp && Date.now() > payload.exp) return null; // vanhentunut
    return payload;
  } catch {
    return null;
  }
}
