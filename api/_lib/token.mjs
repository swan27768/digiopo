// DigiOpo – allekirjoitettu istuntotoken (HMAC-SHA256, Web Crypto)
//
// Toimii sekä Vercelin Node- (api/*) että Edge-ympäristössä (middleware.mjs),
// koska käyttää vain Web Crypto -rajapintaa – ei Node-riippuvuuksia eikä
// ulkoisia kirjastoja.
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

async function tuoAvain(secret) {
  return crypto.subtle.importKey(
    'raw', enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false, ['sign', 'verify']
  );
}

// Luo allekirjoitetun tokenin annetusta payloadista.
export async function luoToken(payload, secret) {
  const body = b64urlEncode(enc.encode(JSON.stringify(payload)));
  const key = await tuoAvain(secret);
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(body)));
  return body + '.' + b64urlEncode(sig);
}

// Tarkistaa tokenin allekirjoituksen ja voimassaolon.
// Palauttaa payloadin jos kelvollinen, muuten null.
export async function tarkistaToken(token, secret) {
  if (typeof token !== 'string' || token.indexOf('.') === -1) return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  try {
    const key = await tuoAvain(secret);
    const ok = await crypto.subtle.verify('HMAC', key, b64urlDecode(sig), enc.encode(body));
    if (!ok) return null;
    const payload = JSON.parse(dec.decode(b64urlDecode(body)));
    if (payload.exp && Date.now() > payload.exp) return null; // vanhentunut
    return payload;
  } catch {
    return null;
  }
}
