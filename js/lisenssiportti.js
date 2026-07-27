// DigiOpo – Lisenssiportti
// Tarkistaa lisenssin localStorage:sta ja tarvittaessa palvelimelta.
// Tukee myös opettajalisenssiä Supabase magic link -kirjautumisella.
// Lisätään kaikkien sivujen <head>-osioon.

(function () {
  "use strict";

  // Pysyvä laitetunniste (localStorage) → palvelin arvioi koulukoodin
  // käyttäjämäärää eri laitteiden perusteella (seuranta, ei estä). Ei
  // henkilötietoa, satunnainen id. Sama avain kuin muualla sivustolla.
  function laiteTunnus() {
    try {
      let v = localStorage.getItem('digiopo_laite');
      if (!v) {
        v = (self.crypto && crypto.randomUUID)
          ? crypto.randomUUID()
          : (Date.now() + '-' + Math.random().toString(16).slice(2));
        localStorage.setItem('digiopo_laite', v);
      }
      return v;
    } catch { return ''; }
  }

  // ─── Supabase-konfiguraatio ──────────────────────────────────────────────
  const SUPABASE_URL  = 'https://uiqjrhaoumxwshnojtyn.supabase.co';
  const SUPABASE_ANON = 'sb_publishable_hTXgi8AA2p94327GlrdjmA_aTrJOqCA';

  // Lataa Supabase JS SDK dynaamisesti (kerran)
  function lataaSuperbase() {
    return new Promise((resolve, reject) => {
      if (window.__supabaseClient) return resolve(window.__supabaseClient);
      if (document.getElementById('supabase-sdk')) {
        // SDK ladataan parhaillaan – odotetaan
        const odota = setInterval(() => {
          if (window.__supabaseClient) { clearInterval(odota); resolve(window.__supabaseClient); }
        }, 50);
        return;
      }
      const script = document.createElement('script');
      script.id = 'supabase-sdk';
      script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js';
      script.onload = () => {
        const { createClient } = window.supabase;
        window.__supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON);
        resolve(window.__supabaseClient);
      };
      script.onerror = () => reject(new Error('Supabase SDK ei latautunut'));
      document.head.appendChild(script);
    });
  }

  // Tarkistaa onko opettajalla validi Supabase-sessio ja aktiivinen lisenssi
  async function tarkistaOpettajaSessio() {
    try {
      const db = await lataaSuperbase();
      const { data: { session } } = await db.auth.getSession();
      if (!session) return false;

      const vastaus = await fetch('/api/lisenssi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({}),
      });
      const data = await vastaus.json();
      return data.ok === true;
    } catch {
      return false;
    }
  }

  // ─── Tulostussuojaus ─────────────────────────────────────────────────────
  // Lisätään @media print -sääntö dynaamisesti, jotta se kattaa myös sivut
  // joilla ei ole base.css:ää (tehtavat/, pelit/ jne.)
  (function lisaaTulostussuoja() {
    // Opettajan ohjeet ja tulostettavat tehtäväkortit saa tulostaa vapaasti
    const polku = window.location.pathname;
    if (
      polku.includes("_ope") ||
      polku.includes("_opettaja") ||
      polku.includes("/tehtavat/")
    ) return;

    const style = document.createElement("style");
    style.textContent = [
      "@media print {",
      "  body::before {",
      "    content: '© DigiOpo – sisältö on tarkoitettu vain digitaaliseen käyttöön';",
      "    display: block;",
      "    font-size: 16px;",
      "    color: #aaa;",
      "    text-align: center;",
      "    padding: 48px 24px;",
      "    letter-spacing: 0.02em;",
      "  }",
      "  body > * { opacity: 0.08 !important; }",
      "  body::before { opacity: 1 !important; }",
      "}",
    ].join("\n");
    document.head.appendChild(style);
  })();

  const AVAIN = "digiopo_lisenssi";
  const TARKISTUS_VALI_MS = 24 * 60 * 60 * 1000; // 24 tuntia
  const API = "/api/lisenssi";

  // Poikkeukset: nämä sivut eivät tarvitse lisenssiä
  const VAPAAT_POLUT = ["/404.html", "/kayttoehdot.html", "/liity.html", "/liity"];

  function nykyinenPolku() {
    return window.location.pathname;
  }

  function onVapaaPolku() {
    return VAPAAT_POLUT.some((p) => nykyinenPolku().includes(p));
  }

  function lueListenssi() {
    try {
      const raw = localStorage.getItem(AVAIN);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function tallenneLisenssi(data) {
    try {
      localStorage.setItem(
        AVAIN,
        JSON.stringify({ ...data, tarkistettu: Date.now() })
      );
    } catch {
      // localStorage ei käytettävissä – jatketaan silti
    }
  }

  function poistaLisenssi() {
    try {
      localStorage.removeItem(AVAIN);
    } catch {}
  }

  function onVoimassa(lisenssi) {
    if (!lisenssi || !lisenssi.ok) return false;
    const voimassaAsti = new Date(lisenssi.voimassa_asti);
    return voimassaAsti > new Date();
  }

  function tarvitseeTarkistuksen(lisenssi) {
    if (!lisenssi || !lisenssi.tarkistettu) return true;
    return Date.now() - lisenssi.tarkistettu > TARKISTUS_VALI_MS;
  }

  // ─── Porttikomponentti ───────────────────────────────────────────────────

  function luoPortti() {
    // Lisätään CSS jos ei vielä ladattu
    if (!document.getElementById("lisenssiportti-css")) {
      const link = document.createElement("link");
      link.id = "lisenssiportti-css";
      link.rel = "stylesheet";
      const syvyys =
        (window.location.pathname.match(/\//g) || []).length - 1;
      link.href = "../".repeat(syvyys) + "css/lisenssiportti.css";
      document.head.appendChild(link);
    }

    const portti = document.createElement("div");
    portti.id = "lisenssiportti";
    portti.setAttribute("role", "dialog");
    portti.setAttribute("aria-modal", "true");
    portti.setAttribute("aria-label", "Kirjaudu koulukoodilla");

    portti.innerHTML = `
      <div class="portti-kortti">
        <div class="portti-logo">Digi<span>opo</span></div>
        <div class="portti-alaotsikko">Omilla jäljillä · Yläkoulun oppilaanohjaus</div>
        <h1 class="portti-otsikko">Syötä koulukoodisi</h1>
        <p class="portti-kuvaus">
          Opettajasi on antanut koulullenne koodin.<br>
          Syötä se alle päästäksesi sisään.
        </p>
        <form id="portti-lomake" novalidate>
          <input
            id="portti-koodi"
            class="portti-kentta"
            type="text"
            placeholder="esim. KOULU-2026"
            autocomplete="off"
            autocapitalize="characters"
            spellcheck="false"
            maxlength="40"
            required
            aria-label="Koulukoodi"
          />
          <button type="submit" class="portti-nappi" id="portti-nappi">
            Kirjaudu sisään
          </button>
        </form>
        <div id="portti-viesti" class="portti-viesti" role="alert" aria-live="polite"></div>
        <p class="portti-ehdot">
          Kirjautumalla hyväksyt <a href="/kayttoehdot.html" target="_blank" rel="noopener">käyttöehdot</a>.
        </p>
      </div>
    `;

    document.body.prepend(portti);

    // Animaatio sisään
    requestAnimationFrame(() => {
      requestAnimationFrame(() => portti.classList.add("nakyva"));
    });

    // Estä taustasisällön selaaminen
    document.body.style.overflow = "hidden";

    // Lomakkeen lähetys
    const lomake = document.getElementById("portti-lomake");
    lomake.addEventListener("submit", async (e) => {
      e.preventDefault();
      await lahetaKoodi();
    });

    // Enter toimii myös input-kentässä
    document.getElementById("portti-koodi").addEventListener("keydown", (e) => {
      if (e.key === "Enter") lahetaKoodi();
    });

    // Fokus kenttään
    setTimeout(() => document.getElementById("portti-koodi")?.focus(), 100);
  }

  function piilotaPortti() {
    const portti = document.getElementById("lisenssiportti");
    if (!portti) return;
    document.body.style.overflow = "";
    portti.classList.add("piilotettu");
    setTimeout(() => portti.remove(), 400);
  }

  function naytaViesti(teksti, tyyppi) {
    const el = document.getElementById("portti-viesti");
    if (!el) return;
    el.textContent = teksti;
    el.className = `portti-viesti ${tyyppi}`;
  }

  function virheTekstiKoodilla(virhe) {
    const viestit = {
      virheellinen: "Koodi ei ole oikein. Tarkista kirjoitus.",
      vanhentunut: "Tämä koodi on vanhentunut. Pyydä opettajaltasi uusi.",
      liikaa_yrityksia: "Liian monta yritystä. Odota 10 minuuttia.",
      palvelinvirhe: "Palvelinvirhe. Yritä hetken kuluttua uudelleen.",
    };
    return viestit[virhe] || "Jokin meni pieleen. Yritä uudelleen.";
  }

  async function lahetaKoodi() {
    const kentta = document.getElementById("portti-koodi");
    const nappi = document.getElementById("portti-nappi");
    const koodi = kentta.value.trim().toUpperCase();

    if (!koodi) {
      kentta.classList.add("virhe");
      naytaViesti("Syötä koulukoodi.", "virhe");
      kentta.focus();
      return;
    }

    kentta.classList.remove("virhe");
    nappi.disabled = true;
    nappi.textContent = "Tarkistetaan…";

    try {
      const vastaus = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ koodi, laite: laiteTunnus() }),
      });

      const data = await vastaus.json();

      if (data.ok) {
        tallenneLisenssi({ ...data, koodi }); // tallennetaan myös koodi taustapäivitystä varten
        naytaViesti("✓ Koodi hyväksytty! Tervetuloa.", "onnistui");
        setTimeout(() => piilotaPortti(), 800);
      } else {
        kentta.classList.add("virhe");
        naytaViesti(virheTekstiKoodilla(data.virhe), "virhe");
        nappi.disabled = false;
        nappi.textContent = "Kirjaudu sisään";
        kentta.focus();
        kentta.select();
      }
    } catch {
      naytaViesti("Verkkovirhe. Tarkista yhteys ja yritä uudelleen.", "virhe");
      nappi.disabled = false;
      nappi.textContent = "Kirjaudu sisään";
    }
  }

  // ─── Päätarkistuslogiikka ────────────────────────────────────────────────

  async function tarkistaLisenssi() {
    if (onVapaaPolku()) return;

    // 1. Opettajalisenssi: tarkistetaan Supabase-sessio
    const opettajaOk = await tarkistaOpettajaSessio();
    if (opettajaOk) return; // Pääsy myönnetty

    // 2. Koululisenssi: tarkistetaan localStorage
    const tallennettu = lueListenssi();

    // Ei tallennettua lisenssiä → näytä portti heti
    if (!tallennettu) {
      luoPortti();
      return;
    }

    // Lisenssi on vanhentunut paikallisesti → näytä portti
    if (!onVoimassa(tallennettu)) {
      poistaLisenssi();
      luoPortti();
      return;
    }

    // Ei tarvita palvelintarkistusta (alle 24h sitten) → pääsy ok
    if (!tarvitseeTarkistuksen(tallennettu)) return;

    // Taustalla tarkistetaan palvelimelta (ei blokkaava)
    try {
      const vastaus = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ koodi: tallennettu.koodi || tallennettu.voimassa_asti, laite: laiteTunnus() }),
      });
      const data = await vastaus.json();

      if (data.ok) {
        tallenneLisenssi(data);
      } else {
        // Lisenssi peruttu tai vanhentunut palvelimella
        poistaLisenssi();
        luoPortti();
      }
    } catch {
      // Verkkovirhe: annetaan käyttäjän jatkaa (ei rangaista yhteysongelmasta)
    }
  }

  // Käynnistys
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", tarkistaLisenssi);
  } else {
    tarkistaLisenssi();
  }

  // ─── Service Worker ──────────────────────────────────────────────────────
  // Paikallisessa kehityksessä service workeria EI rekisteröidä. Muuten se
  // sieppaa pyynnöt ja tarjoilee vanhaa välimuistisisältöä, jolloin dev-serverin
  // muutokset eivät näy – tai näyttää "Ei verkkoyhteyttä eikä välimuistia",
  // jos palvelin ei ole käynnissä.
  //
  // Lisäksi poistetaan aiemmin rekisteröity SW: pelkkä rekisteröinnin ohitus
  // ei riitä, koska kerran asennettu SW jää selaimeen pysyvästi.
  const onPaikallinen = ["localhost", "127.0.0.1", "::1"].includes(
    location.hostname
  );

  if ("serviceWorker" in navigator) {
    if (onPaikallinen) {
      navigator.serviceWorker
        .getRegistrations()
        .then((rekisteroinnit) => {
          rekisteroinnit.forEach((r) => r.unregister());
        })
        .catch(() => {});
    } else {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Rekisteröinti epäonnistui – ei kriittinen, sivusto toimii normaalisti
      });
    }
  }
})();
