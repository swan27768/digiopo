/* ============================================================
   MASKOTTI-TUNNE — maskotti reagoi siihen, mitä oppilas lukee
   - Teoria (.theory-card)                → miettivä
   - Tehtävä (.tasks-section, .mission-card, .task-list, …) → kannustava
   - Faktalaatikko / vihje (.fakta-laatikko, [data-fakta], .haaste-vihje, …) → yllättynyt
   Toimii 7., 8. ja 9. luokan sivuilla sellaisenaan: lukee nykyisen
   maskottikuvan nimestä perusnimen (lippis/tyttö/huppari) ja vaihtaa
   vain ilmeen. Osiokohtainen perusilme (luokka.js) pysyy oletuksena.
   Puhekupla näkyy vain suomeksi ja vain kerran per laatikko.
   ============================================================ */
(function () {
  "use strict";

  var HUPPARI = {
    "": "robo_maskotti_huppari_lapinakyva.webp",
    kannustaa: "robo_maskotti_huppari_sininen_kannustaa_musta_lippis_lapinakyva.webp",
    miettiva: "robo_maskotti_huppari_violetti_miettii_musta_lippis_lapinakyva.webp",
    yllattyy: "robo_maskotti_huppari_punainen_yllattyy_musta_lippis_lapinakyva.webp",
  };

  /* Tärkein ensin: faktalaatikko voi olla tehtävän sisällä */
  var KONTEKSTIT = [
    {
      tunne: "yllattyy",
      prio: 3,
      sel: ".fakta-laatikko, [data-fakta], .haaste-vihje, .tet-paneeli-vihje, .tet9d-vihje",
      tekstit: ["Hei, katso tämä!", "Tämä on hyvä tietää.", "Huomasitko tämän?"],
    },
    {
      tunne: "kannustaa",
      prio: 2,
      sel: ".tasks-section, .task-list, .mission-card, .interactive-hero, .tet-polku-osio, .haaste-osio",
      tekstit: ["Nyt on sinun vuorosi!", "Kokeile rohkeasti, näin oppii.", "Sinä pystyt tähän. Aloita vaikka heti."],
    },
    {
      tunne: "miettiva",
      prio: 1,
      sel: ".theory-card",
      tekstit: ["Pysähdy hetkeksi ja mieti tätä.", "Mitä ajattelet tästä?", "Lue rauhassa. Mikä tästä jää mieleen?"],
    },
  ];

  var img, laatikko, kupla;
  var nakyvat = new Map(); // elementti -> konteksti
  var esitelty = new WeakSet();
  var vaihdossa = false;
  var edellinenTunne = null;
  var viimeKupla = 0;
  var piilotusAjastin = null;
  var indeksit = {};

  function pieniRuutu() {
    return window.innerWidth <= 768;
  }

  function suomeksi() {
    var l = (document.documentElement.getAttribute("lang") || "fi").toLowerCase();
    return l === "fi" || l === "";
  }

  function kuvaTunteelle(tunne) {
    var src = img.getAttribute("src") || "";
    var i = src.lastIndexOf("/") + 1;
    var polku = src.slice(0, i);
    var nimi = src.slice(i);
    if (nimi.indexOf("huppari") !== -1) return polku + HUPPARI[tunne || ""];
    var perus = nimi.replace(/_(miettiva|yllattyy|kannustaa)(?=\.)/, "");
    return polku + perus.replace(/(\.\w+)$/, (tunne ? "_" + tunne : "") + "$1");
  }

  /* Vertaa aina todellista kuvaa haluttuun, joten sivun oma ilmeenvaihto
     ja tämä moduuli eivät jää epäsynkkaan nopeassa vierityksessä. */
  function asetaTunne(tunne) {
    if (vaihdossa) return;
    var uusi = kuvaTunteelle(tunne);
    if (uusi === img.getAttribute("src")) return;
    vaihdossa = true;
    var tmp = new Image();
    var valmis = function (ok) {
      if (ok) {
        img.style.transition = "opacity 0.2s ease";
        img.style.opacity = "0";
        setTimeout(function () {
          img.src = uusi;
          img.style.opacity = "1";
          vaihdossa = false;
        }, 200);
      } else {
        vaihdossa = false;
      }
    };
    tmp.onload = function () { valmis(true); };
    tmp.onerror = function () { valmis(false); };
    tmp.src = uusi;
  }

  function naytaKupla(konteksti, el) {
    if (!suomeksi() || !laatikko || !kupla) return;
    if (window.maskottiOsioKuplat) return; // sivulla on omat osiokohtaiset kuplat
    if (laatikko.classList.contains("nakyvissa")) return; // toinen kupla on jo näkyvissä
    var nyt = Date.now();
    if (nyt - viimeKupla < 8000 || esitelty.has(el) || window.scrollY < 80) return;
    esitelty.add(el);
    viimeKupla = nyt;
    var t = konteksti.tekstit;
    var k = (indeksit[konteksti.tunne] = ((indeksit[konteksti.tunne] || 0) + 1) % t.length);
    kupla.textContent = t[k];
    laatikko.classList.remove("piilossa");
    laatikko.classList.add("nakyvissa");
    clearTimeout(piilotusAjastin);
    piilotusAjastin = setTimeout(function () {
      laatikko.classList.remove("nakyvissa");
      laatikko.classList.add("piilossa");
    }, 4500);
  }

  function paivita() {
    if (pieniRuutu() || !nakyvat.size) return;
    var keski = window.innerHeight / 2;
    var paras = null, parasEl = null, parasEro = Infinity;
    nakyvat.forEach(function (k, el) {
      var r = el.getBoundingClientRect();
      var ero = Math.abs((r.top + r.bottom) / 2 - keski);
      if (!paras || k.prio > paras.prio || (k.prio === paras.prio && ero < parasEro)) {
        paras = k; parasEl = el; parasEro = ero;
      }
    });
    if (!paras) return;
    asetaTunne(paras.tunne);
    if (edellinenTunne !== paras.tunne || !esitelty.has(parasEl)) naytaKupla(paras, parasEl);
    edellinenTunne = paras.tunne;
  }

  var odottaa = false;
  function ajastaPaivitys() {
    if (odottaa) return;
    odottaa = true;
    requestAnimationFrame(function () { odottaa = false; paivita(); });
  }

  function init() {
    img = document.querySelector(".maskotti");
    laatikko = document.querySelector(".maskotti-laatikko");
    kupla = document.querySelector(".puhekupla");
    if (!img || !("IntersectionObserver" in window)) return;

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) nakyvat.set(e.target, e.target.__maskKonteksti);
          else nakyvat.delete(e.target);
        });
        ajastaPaivitys();
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
    );

    KONTEKSTIT.forEach(function (k) {
      document.querySelectorAll(k.sel).forEach(function (el) {
        if (el.__maskKonteksti && el.__maskKonteksti.prio >= k.prio) return;
        el.__maskKonteksti = k;
        io.observe(el);
      });
    });

    window.addEventListener("scroll", ajastaPaivitys, { passive: true });

    /* Sovita robotti sivuvalikon alapuolelle. Jos tilaa ei ole (pitkä valikko,
       esim. 9. luokka), robotti nostetaan ylemmäs valikon päälle (.ylos), jotta se
       ei jää näkymättömiin näytön alareunan taakse. Mobiilissa robotti on oikeassa alakulmassa. */
    var sovitusOdottaa = false;
    function sovita() {
      sovitusOdottaa = false;
      if (!laatikko) return;
      var valikko = document.querySelector(".aihelista");
      laatikko.classList.remove("kupla-piilossa", "pieni-robo", "ylos");
      if (!valikko || window.innerWidth <= 900) return;
      var vb = valikko.getBoundingClientRect();
      if (vb.bottom < 0 || vb.top > window.innerHeight) return;
      function mahtuu() { return laatikko.getBoundingClientRect().top >= vb.bottom - 6; }
      if (mahtuu()) return;
      laatikko.classList.add("ylos");
    }
    function ajastaSovitus() {
      if (sovitusOdottaa) return;
      sovitusOdottaa = true;
      requestAnimationFrame(sovita);
    }
    window.addEventListener("scroll", ajastaSovitus, { passive: true });
    window.addEventListener("resize", ajastaSovitus);
    sovita();

    /* Kun kuva vaihtuu (sivun oma osiokohtainen ilme tai minun vaihtoni),
       tarkista hetken päästä, vastaako se vielä tilannetta. */
    new MutationObserver(function () {
      setTimeout(ajastaPaivitys, 450);
    }).observe(img, { attributes: true, attributeFilter: ["src"] });

    /* Esilataa ilmeet, ettei kuva välky vaihtuessa */
    (window.requestIdleCallback || setTimeout)(function () {
      ["miettiva", "yllattyy", "kannustaa"].forEach(function (t) {
        new Image().src = kuvaTunteelle(t);
      });
    });
  }

  if (document.readyState === "complete") init();
  else window.addEventListener("load", init);
})();
