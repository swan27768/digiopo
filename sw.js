// DigiOpo – Service Worker
// Strategia:
//   - Vendor-kirjastot (/vendor/*): cache-first (nopea; versionnosto flushaa)
//   - Sovelluksen oma JS/CSS: network-first (pysyy tuoreena, EI vanhene välimuistiin)
//   - Kuvat/fontit/ikonit: cache-first (nopea)
//   - JSON-datatiedostot (tehtavat.json, fi.json jne.): network-first (pysyy aina tuoreena)
//   - HTML-sivut: network-first (sisältö pysyy tuoreena)
//   - API-kutsut (/api/*): ei välimuistitusta

// HUOM: nosta tätä versionumeroa AINA kun muutat esiladattua tiedostoa
// (PRECACHE_ASSETS) tai muuta staattista sisältöä. Muuten selaimet tarjoilevat
// vanhaa versiota välimuistista eikä korjaus näy käyttäjille.
const CACHE_VERSION = "digiopo-v35";

// Maksumuurin takana oleva sisältö: EI koskaan välimuistiin, jotta middleware
// hallitsee pääsyä eikä suojattua sisältöä voi lukea offline ilman lisenssiä.
function onSuojattuPolku(pathname) {
  return (
    pathname.startsWith("/sivut/") ||
    pathname.startsWith("/pelit/") ||
    pathname.startsWith("/tehtavat/") ||
    pathname.startsWith("/robo-peli/") ||
    pathname === "/7luokka" ||
    pathname === "/8luokka" ||
    pathname === "/9luokka" ||
    pathname.includes("osio-data-") ||
    pathname === "/js/tehtavat.json"
  );
}
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const HTML_CACHE = `${CACHE_VERSION}-html`;

// Esiladataan tärkeimmät staattiset tiedostot heti asennuksessa
const PRECACHE_ASSETS = [
  "/css/base.css",
  "/css/navbar.css",
  "/css/layout.css",
  "/css/components.css",
  "/css/lisenssiportti.css",
  "/js/lisenssiportti.js",
  "/js/seuranta.js",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

// ── Asennus: esiladataan kriittiset resurssit ────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ── Aktivointi: poistetaan vanhat välimuistit ────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith("digiopo-") && k !== STATIC_CACHE && k !== HTML_CACHE)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ── Pyyntöjen käsittely ──────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ohita: API-kutsut, muut originit, POST-pyynnöt
  if (
    url.pathname.startsWith("/api/") ||
    url.origin !== self.location.origin ||
    request.method !== "GET"
  ) {
    return;
  }

  // Maksumuurin takana oleva sisältö: ohita SW kokonaan → selain hoitaa
  // pyynnön natiivisti ja middleware ohjaa portille jos lisenssi puuttuu.
  // Näin suojattua sisältöä ei tallenneta välimuistiin.
  if (onSuojattuPolku(url.pathname)) {
    return;
  }

  // HTML-sivut: network-first (koululainen saa tuoreimman sisällön)
  // Jos verkko ei vastaa, tarjoillaan välimuistista
  if (request.headers.get("accept")?.includes("text/html")) {
    event.respondWith(networkFirst(request, HTML_CACHE));
    return;
  }

  // JSON-datatiedostot: network-first (sisältö muuttuu usein — ei välimuistia)
  if (url.pathname.endsWith(".json") && !url.pathname.includes("manifest")) {
    event.respondWith(networkFirst(request, HTML_CACHE));
    return;
  }

  // Vendor-kirjastot (/vendor/*): cache-first — isot, harvoin muuttuvat.
  // Versionnosto (CACHE_VERSION) flushaa nämä. Pitää slow-network-latauksen nopeana.
  if (url.pathname.startsWith("/vendor/")) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Sovelluksen oma JS/CSS: network-first — pysyy aina tuoreena eikä jää
  // vanhentuneena välimuistiin (ei tarvita CACHE_VERSION-nostoa joka muutoksella).
  // Offline-tilassa tarjoillaan välimuistista.
  if (url.pathname.endsWith(".js") || url.pathname.endsWith(".css")) {
    event.respondWith(networkFirst(request, STATIC_CACHE));
    return;
  }

  // Muut staattiset (kuvat, fontit, ikonit): cache-first (nopea).
  event.respondWith(cacheFirst(request, STATIC_CACHE));
});

// ── Apufunktiot ──────────────────────────────────────────────────────────────

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response("Ei verkkoyhteyttä eikä välimuistia.", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response("Resurssi ei saatavilla.", { status: 503 });
  }
}
