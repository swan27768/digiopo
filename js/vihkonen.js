/* ============================================================
   VIHKONEN — selattava teoriavihko (karuselli) — js/vihkonen.js
   Tyylit: css/vihkonen.css. Käyttö (HTML):
     <div class="vihkonen" data-vihkonen data-otsikko="Vihkon nimi">
       <div class="vihkonen__ikkuna">
         <section class="vihkonen__sivu" data-luku-nimi="Ylärivin teksti" data-sivu-nimi="Sivun nimi">…</section>
         …
   Komponentti lisää itse: otsikkopalkin (luku + Suurenna), nuolet, sivupisteet,
   sivulaskurin ja ruudunlukijan ilmoituksen.
   - Selaus: nuolet, pisteet, näppäimistö (← → Home End), pyyhkäisy kosketuksella.
   - Hyppy sivulle: mikä tahansa [data-vihkonen-mene="N"] vihkon sisällä (N = sivu, 0 = kansi).
   - Linkki #sivun-id avaa sivun, jos sivulla on id.
   - Suurenna: koko näyttö (opettaja näyttää luokalle). Esc sulkee.
   Ilman JS:ää sivut näkyvät allekkain.
   ============================================================ */
(function () {
  "use strict";

  function luo(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function ikoni(nimi) { return '<i class="fa-solid ' + nimi + '" aria-hidden="true"></i>'; }

  function alusta(juuri) {
    if (juuri.getAttribute("data-vihkonen-valmis")) return;
    var ikkuna = juuri.querySelector(".vihkonen__ikkuna");
    if (!ikkuna) return;
    var sivut = Array.prototype.slice.call(ikkuna.querySelectorAll(":scope > .vihkonen__sivu"));
    if (sivut.length < 2) return;
    juuri.setAttribute("data-vihkonen-valmis", "1");

    var nimi = juuri.getAttribute("data-otsikko") || "Vihkonen";
    var nyt = 0;
    var iso = false;
    var paikka = null;
    var viimeinenFokus = null;
    var vieritys = 0;

    juuri.classList.add("vihkonen--js");
    juuri.setAttribute("role", "region");
    juuri.setAttribute("aria-roledescription", "karuselli");
    juuri.setAttribute("aria-label", nimi);

    sivut.forEach(function (s, i) {
      s.setAttribute("role", "group");
      s.setAttribute("aria-roledescription", "sivu");
      s.setAttribute("aria-label", (i + 1) + " / " + sivut.length + ": " + (s.getAttribute("data-sivu-nimi") || ""));
    });

    /* ── Otsikkopalkki ── */
    var yla = luo("div", "vihkonen__yla");
    var luku = luo("span", "vihkonen__luku");
    var isoNappi = luo("button", "vihkonen__iso-nappi");
    isoNappi.type = "button";
    yla.appendChild(luku);
    yla.appendChild(isoNappi);
    juuri.insertBefore(yla, ikkuna);

    /* ── Alapalkki ── */
    var ala = luo("div", "vihkonen__ala");
    var edell = luo("button", "vihkonen__nuoli", ikoni("fa-chevron-left") + "<span>Edellinen</span>");
    edell.type = "button";
    edell.setAttribute("aria-label", "Edellinen sivu");
    var keski = luo("div", "vihkonen__keski");
    var pisteet = luo("div", "vihkonen__pisteet");
    pisteet.setAttribute("role", "group");
    pisteet.setAttribute("aria-label", "Sivut");
    var pistenapit = sivut.map(function (s, i) {
      var b = luo("button", "vihkonen__piste");
      b.type = "button";
      b.setAttribute("aria-label", "Sivu " + (i + 1) + ": " + (s.getAttribute("data-sivu-nimi") || ""));
      b.addEventListener("click", function () { mene(i); });
      pisteet.appendChild(b);
      return b;
    });
    var laskuri = luo("span", "vihkonen__laskuri");
    laskuri.setAttribute("aria-hidden", "true");
    keski.appendChild(pisteet);
    keski.appendChild(laskuri);
    var seur = luo("button", "vihkonen__nuoli");
    seur.type = "button";
    ala.appendChild(edell);
    ala.appendChild(keski);
    ala.appendChild(seur);
    juuri.appendChild(ala);

    var tila = luo("div", "sr-only");
    tila.setAttribute("aria-live", "polite");
    juuri.appendChild(tila);

    /* ── Sivun vaihto ── */
    function mene(n, ilmoita) {
      n = Math.max(0, Math.min(sivut.length - 1, n));
      sivut.forEach(function (s, i) {
        s.classList.toggle("is-aktiivi", i === n);
        s.classList.toggle("is-ohi", i < n);
        if (i === n) { s.removeAttribute("aria-hidden"); s.removeAttribute("inert"); }
        else { s.setAttribute("aria-hidden", "true"); s.setAttribute("inert", ""); }
      });
      pistenapit.forEach(function (b, i) {
        if (i === n) b.setAttribute("aria-current", "true"); else b.removeAttribute("aria-current");
      });
      var s = sivut[n];
      luku.textContent = s.getAttribute("data-luku-nimi") || nimi;
      laskuri.textContent = (n + 1) + " / " + sivut.length;
      edell.disabled = n === 0;
      if (n === sivut.length - 1) {
        seur.innerHTML = "<span>Alkuun</span>" + ikoni("fa-arrows-rotate");
        seur.setAttribute("aria-label", "Takaisin alkuun");
      } else {
        seur.innerHTML = "<span>Seuraava</span>" + ikoni("fa-chevron-right");
        seur.setAttribute("aria-label", "Seuraava sivu");
      }
      s.scrollTop = 0;
      if (ilmoita !== false && n !== nyt) {
        tila.textContent = "Sivu " + (n + 1) + " / " + sivut.length + ": " + (s.getAttribute("data-sivu-nimi") || "");
      }
      nyt = n;
    }

    edell.addEventListener("click", function () { mene(nyt - 1); });
    seur.addEventListener("click", function () { mene(nyt === sivut.length - 1 ? 0 : nyt + 1); });
    juuri.addEventListener("click", function (e) {
      var k = e.target.closest ? e.target.closest("[data-vihkonen-mene]") : null;
      if (k && juuri.contains(k)) mene(parseInt(k.getAttribute("data-vihkonen-mene"), 10) || 0);
    });

    /* ── Näppäimistö ── */
    juuri.addEventListener("keydown", function (e) {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.key === "ArrowRight") { mene(nyt + 1); e.preventDefault(); }
      else if (e.key === "ArrowLeft") { mene(nyt - 1); e.preventDefault(); }
      else if (e.key === "Home") { mene(0); e.preventDefault(); }
      else if (e.key === "End") { mene(sivut.length - 1); e.preventDefault(); }
    });

    /* ── Pyyhkäisy (kosketus ja kynä; hiirellä ei, ettei tekstin valinta häiriinny) ── */
    var x0 = null, y0 = null;
    ikkuna.addEventListener("pointerdown", function (e) {
      if (e.pointerType === "mouse") return;
      x0 = e.clientX; y0 = e.clientY;
    });
    ikkuna.addEventListener("pointerup", function (e) {
      if (x0 === null) return;
      var dx = e.clientX - x0, dy = e.clientY - y0;
      x0 = null;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) mene(nyt + (dx < 0 ? 1 : -1));
    });
    ikkuna.addEventListener("pointercancel", function () { x0 = null; });

    /* ── Linkki #sivun-id ── */
    function hashiin() {
      var h = (window.location.hash || "").replace("#", "");
      if (!h) return false;
      for (var i = 0; i < sivut.length; i++) {
        if (sivut[i].id === h) { mene(i, false); return true; }
      }
      return false;
    }
    window.addEventListener("hashchange", function () {
      if (hashiin() && !iso) juuri.scrollIntoView({ block: "start" });
    });

    /* ── Suurennus ── */
    function palautaVieritys() {
      /* behavior "instant": sivun oma scroll-behavior: smooth ei saa animoida paluuta */
      window.scrollTo({ left: window.pageXOffset, top: vieritys, behavior: "instant" });
    }
    function paivitaIsoNappi() {
      isoNappi.innerHTML = iso
        ? ikoni("fa-xmark") + "<span>Sulje suurennus</span>"
        : ikoni("fa-expand") + "<span>Suurenna</span>";
      isoNappi.setAttribute("aria-label", iso ? "Sulje suurennus" : "Suurenna vihkonen koko näytölle");
    }
    function isoNappain(e) {
      if (e.key === "Escape") { suljeIso(); e.preventDefault(); }
    }
    function avaaIso() {
      if (iso) return;
      iso = true;
      vieritys = window.pageYOffset;
      viimeinenFokus = document.activeElement;
      /* Vihko siirretään body-elementin alle, jotta esivanhempien filter/transform ei sido sen kiinteää sijaintia.
         Tilalle jää samankokoinen paikanvaraaja, jottei sivu hypi. */
      paikka = luo("div", "vihkonen__paikka");
      paikka.setAttribute("aria-hidden", "true");
      paikka.style.height = juuri.offsetHeight + "px";
      paikka.style.margin = window.getComputedStyle(juuri).margin;
      juuri.parentNode.insertBefore(paikka, juuri);
      document.body.appendChild(juuri);
      juuri.classList.add("vihkonen--iso");
      document.documentElement.classList.add("vihkonen-lukittu");
      document.addEventListener("keydown", isoNappain, true);
      palautaVieritys();   // selain voi siirtää vieritystä, kun vihko vaihtaa paikkaa
      paivitaIsoNappi();
      var rf = juuri.requestFullscreen || juuri.webkitRequestFullscreen;
      if (rf) {
        try { var p = rf.call(juuri); if (p && p.catch) p.catch(function () {}); } catch (err) {}
      }
      isoNappi.focus({ preventScroll: true });
    }
    function suljeIso() {
      if (!iso) return;
      iso = false;
      document.removeEventListener("keydown", isoNappain, true);
      var fs = document.fullscreenElement || document.webkitFullscreenElement;
      if (fs === juuri) {
        var ex = document.exitFullscreen || document.webkitExitFullscreen;
        try { var p = ex && ex.call(document); if (p && p.catch) p.catch(function () {}); } catch (err) {}
      }
      juuri.classList.remove("vihkonen--iso");
      document.documentElement.classList.remove("vihkonen-lukittu");
      if (paikka && paikka.parentNode) {
        paikka.parentNode.insertBefore(juuri, paikka);
        paikka.parentNode.removeChild(paikka);
      }
      paikka = null;
      palautaVieritys();
      paivitaIsoNappi();
      isoNappi.focus({ preventScroll: true });
      palautaVieritys();
    }
    isoNappi.addEventListener("click", function () { if (iso) suljeIso(); else avaaIso(); });
    function fsMuuttui() {
      var fs = document.fullscreenElement || document.webkitFullscreenElement;
      if (iso && !fs) suljeIso();   // käyttäjä poistui koko näytöstä Esc:llä
    }
    document.addEventListener("fullscreenchange", fsMuuttui);
    document.addEventListener("webkitfullscreenchange", fsMuuttui);

    paivitaIsoNappi();
    mene(0, false);
    hashiin();
  }

  function kaynnista() {
    Array.prototype.forEach.call(document.querySelectorAll("[data-vihkonen]"), alusta);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", kaynnista);
  else kaynnista();
})();
