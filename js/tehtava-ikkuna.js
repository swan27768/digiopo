/* ============================================================
   DigiOpo · tehtava-ikkuna.js
   Nostaa auenneen tehtävän (iframe) kirjan oikealle puolelle
   omaksi, selvästi erottuvaksi ikkunaksi.

   - Tehtäväikkuna liukuu oikealle, vasemmalle jää näkyviin kirjasivu
     himmennettynä (tausta + ikkuna ovat hieman läpinäkyviä).
   - Yläpalkissa on iso, punainen "Sulje tehtävä" -painike, joka näkyy
     aina (palkki ei scrollaa pois).
   - Kirjasivu lukitaan ikkunan ajaksi, joten sivu ei lähde liikkumaan,
     kun oppilas scrollaa tehtävän sisällä. Tehtävä scrollaa omassa
     ikkunassaan loppuun asti.

   Käyttöönotto: lisää luokkasivulle ennen </body>:
     <script defer src="../js/tehtava-ikkuna.js"></script>

   Ei vaadi muutoksia tehtäväkohtaisiin avaa/sulje-funktioihin:
   moduuli tunnistaa automaattisesti piilotetut säiliöt, joissa on
   iframe, ja seuraa milloin ne avataan (display != none).
   Sulje-painike kutsuu säiliön omaa sulje-painiketta, joten
   kunkin tehtävän oma nollauslogiikka toimii kuten ennen.

   Ohitus: lisää säiliölle data-tp-ei, jos sitä ei haluta ikkunaan.
   ============================================================ */
(function () {
  "use strict";

  var EI_IKKUNAAN = '[id^="lukuvuosiUpotus"], [data-tp-ei]';
  var auki = [];          // avoimet säiliöt (viimeisin = päällimmäinen)
  var edellinenFokus = null;
  var tallennettuY = 0;
  var scrim = null;

  function nakyva(c) {
    return !c.hidden && c.style.display !== "none" &&
      window.getComputedStyle(c).display !== "none";
  }

  function lisaaTyylit() {
    if (document.getElementById("tp-tyylit")) return;
    var css =
      ".tp-scrim{position:fixed;inset:0;background:rgba(15,23,42,.42);z-index:9980;" +
      "opacity:0;pointer-events:auto;transition:opacity .22s}" +
      ".tp-scrim.tp-nakyy{opacity:1}" +
      /* filter/transform yms. esivanhemmassa sitoisi position:fixed -ikkunan siihen eikä selaimen ikkunaan */
      ".tp-vapaa{filter:none!important;transform:none!important;-webkit-backdrop-filter:none!important;" +
      "backdrop-filter:none!important;perspective:none!important;contain:none!important;will-change:auto!important;" +
      "animation:none!important;transition:none!important;z-index:auto!important;isolation:auto!important;opacity:1!important}" +
      "html.tp-lukittu,html.tp-lukittu body{overflow:hidden!important}" +

      /* Ikkuna: oikealla, kirjasivu jää näkyviin vasemmalle */
      ".tp-auki{--tp-vasen:clamp(16px,22vw,340px);--tp-pala:68px;" +
      "position:fixed!important;top:14px;bottom:14px;right:16px;left:auto;" +
      "width:calc(100vw - var(--tp-vasen) - 16px);max-width:1280px;margin:0!important;" +
      "z-index:9990;overflow-y:auto;overscroll-behavior:contain;box-sizing:border-box;" +
      "background:rgba(255,255,255,.90);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);" +
      "border:3px solid var(--grade-accent,#7c3aed);border-radius:18px;padding:0!important;" +
      "box-shadow:-14px 10px 48px rgba(15,23,42,.38);animation:tp-sisaan .26s cubic-bezier(.2,.7,.2,1)}" +
      "@keyframes tp-sisaan{from{transform:translateX(44px);opacity:0}to{transform:none;opacity:1}}" +
      "@media(prefers-reduced-motion:reduce){.tp-auki{animation:none}.tp-scrim{transition:none}}" +

      /* Yläpalkki, joka pysyy paikallaan */
      ".tp-palkki{display:none}" +
      ".tp-auki>.tp-palkki{display:flex;position:sticky;top:0;z-index:5;align-items:center;gap:12px;" +
      "min-height:var(--tp-pala);box-sizing:border-box;padding:10px 14px 10px 18px;" +
      "background:rgba(255,255,255,.94);border-bottom:2px solid var(--grade-accent,#7c3aed)}" +
      ".tp-otsikko{margin-right:auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" +
      "font:700 1.02rem/1.2 system-ui,-apple-system,'Segoe UI',sans-serif;color:#1e1b4b}" +
      ".tp-sulje{flex:0 0 auto;display:inline-flex;align-items:center;gap:8px;min-height:46px;padding:0 22px;" +
      "border:0;border-radius:12px;background:#dc2626;color:#fff;cursor:pointer;" +
      "font:800 1rem/1 system-ui,-apple-system,'Segoe UI',sans-serif;" +
      "box-shadow:0 3px 0 #991b1b,0 6px 16px rgba(220,38,38,.35)}" +
      ".tp-sulje:hover{background:#b91c1c}" +
      ".tp-sulje:focus-visible{outline:3px solid #1e1b4b;outline-offset:3px}" +
      ".tp-sulje-x{font-size:1.3rem;line-height:1}" +

      /* Tekstin koko */
      ".tp-koko{flex:0 0 auto;display:inline-flex;align-items:center;gap:4px;padding:3px;border-radius:12px;background:#f1f0f7;border:1px solid #d9d6ea}" +
      ".tp-koko-btn{min-width:42px;min-height:40px;border:0;border-radius:9px;background:#fff;color:#1e1b4b;cursor:pointer;" +
      "font:800 1rem/1 system-ui,-apple-system,'Segoe UI',sans-serif;box-shadow:0 1px 2px rgba(0,0,0,.15)}" +
      ".tp-koko-btn:hover:not(:disabled){background:#ede9fe}" +
      ".tp-koko-btn:disabled{opacity:.4;cursor:default}" +
      ".tp-koko-btn:focus-visible{outline:3px solid #1e1b4b;outline-offset:2px}" +
      ".tp-zoom-arvo{min-width:48px;text-align:center;font:700 .85rem/1 system-ui,sans-serif;color:#3b3768}" +

      /* Alkuperäiset sulje-painikkeet piiloon ikkunan ajaksi (uusi palkki korvaa ne) */
      ".tp-auki .tp-piilo{display:none!important}" +

      /* Iframe täyttää ikkunan, ja tehtävä scrollaa sen sisällä */
      ".tp-auki iframe{display:block!important;width:100%!important;" +
      "height:calc(100vh - 34px - var(--tp-pala))!important;height:calc(100dvh - 34px - var(--tp-pala))!important;" +
      "min-height:0!important;margin:0!important;" +
      "border:0!important;border-radius:0 0 15px 15px!important;box-shadow:none!important;" +
      "background:transparent}" +

      /* Ei-iframe-sisältö (data-tp-ikkuna): sisältö saa reunatilaa, palkki ulottuu reunasta reunaan */
      ".tp-auki[data-tp-ikkuna]{padding:0 22px 28px!important}" +
      ".tp-auki[data-tp-ikkuna]>.tp-palkki{margin:0 -22px 18px}" +

      /* Puhelin/pieni ruutu: koko ruutu, mutta sama sulje-palkki */
      "@media(max-width:899px){.tp-auki{top:0;bottom:0;left:0;right:0;width:100vw;max-width:none;" +
      "border-radius:0;border-width:0 0 0 0;padding-bottom:env(safe-area-inset-bottom)!important}" +
      ".tp-zoom-arvo{display:none}.tp-otsikko{font-size:.9rem}" +
      ".tp-auki iframe{border-radius:0!important;height:calc(100vh - var(--tp-pala))!important;" +
      "height:calc(100dvh - var(--tp-pala))!important}}";
    var st = document.createElement("style");
    st.id = "tp-tyylit";
    st.textContent = css;
    document.head.appendChild(st);
  }

  function luoScrim() {
    if (scrim) return scrim;
    scrim = document.createElement("div");
    scrim.className = "tp-scrim";
    scrim.hidden = true;
    scrim.setAttribute("aria-hidden", "true");
    document.body.appendChild(scrim);
    return scrim;
  }

  function otsikko(c) {
    var f = c.querySelector("iframe");
    var t = c.getAttribute("data-tp-otsikko") || (f && f.getAttribute("title"));
    if (!t && c.id) {
      // Haetaan nimi tehtävän avaavasta painikkeesta tai sen kortin otsikosta
      var b = document.querySelector('[aria-controls~="' + c.id + '"]');
      if (b) {
        var l = b.querySelector(".vaihe-label") || (b.parentElement && b.parentElement.querySelector("h3")) ||
          (b.closest(".vaihe-kortti, [id]") && b.closest(".vaihe-kortti, [id]").querySelector("h3"));
        t = l ? l.textContent.replace(/\s+/g, " ").trim() : "";
      }
    }
    if (!t) {
      var s = c.closest("section");
      var h = s && s.querySelector("h2");
      t = h ? h.textContent.replace(/\s+/g, " ").trim() : "";
    }
    return t || "Tehtävä";
  }

  function alkuperaisetSulut(c) {
    var lista = [];
    if (c.hasAttribute("data-tp-ikkuna")) return lista; // oma sisältö: suljetaan aria-controls-painikkeella
    c.querySelectorAll('button, a, [role="button"]').forEach(function (el) {
      if (el.closest(".tp-palkki")) return;
      if (/sulje/i.test(el.textContent || "") && !el.closest("iframe")) lista.push(el);
    });
    return lista;
  }

  var KOOT = [1, 1.15, 1.3, 1.5, 1.75];
  function haeKoko() {
    try {
      var v = parseFloat(window.localStorage.getItem("tp-koko"));
      if (KOOT.indexOf(v) !== -1) return v;
    } catch (e) {}
    return 1.15;
  }
  // Suurentaa ikkunan oman sisällön (ohjetekstit yms.) mutta ei iframeja,
  // joiden sisältö suurennetaan erikseen. Iframen sisältävistä lohkoista mennään syvemmälle.
  function suurennaSisalto(el, z) {
    Array.prototype.forEach.call(el.children, function (ch) {
      if (ch.classList.contains("tp-palkki") || ch.tagName === "IFRAME" || ch.tagName === "SCRIPT" || ch.tagName === "STYLE") return;
      if (ch.querySelector("iframe")) suurennaSisalto(ch, z);
      else ch.style.zoom = z === 1 ? "" : String(z);
    });
  }
  function sovellaKoko(c) {
    var z = haeKoko();
    suurennaSisalto(c, z);
    c.querySelectorAll("iframe").forEach(function (f) {
      try {
        var d = f.contentDocument;
        if (d && d.documentElement && d.URL !== "about:blank") d.documentElement.style.zoom = z === 1 ? "" : String(z);
      } catch (e) { /* toisen sivuston tehtävää ei voi suurentaa */ }
    });
    var l = c.querySelector(".tp-zoom-arvo");
    if (l) l.textContent = Math.round(z * 100) + " %";
    var i = KOOT.indexOf(z);
    var bm = c.querySelector('.tp-koko-btn[data-d="-1"]'), bp = c.querySelector('.tp-koko-btn[data-d="1"]');
    if (bm) bm.disabled = i <= 0;
    if (bp) bp.disabled = i >= KOOT.length - 1;
  }
  function muutaKokoa(c, d) {
    var i = Math.max(0, Math.min(KOOT.length - 1, KOOT.indexOf(haeKoko()) + d));
    try { window.localStorage.setItem("tp-koko", String(KOOT[i])); } catch (e) {}
    sovellaKoko(c);
  }

  function sulje(c) {
    var sulut = alkuperaisetSulut(c);
    if (sulut.length) {
      sulut[0].click();
    } else if (c.id) {
      var ohjain = document.querySelector('[aria-controls~="' + c.id + '"]');
      if (ohjain) ohjain.click(); else c.style.display = "none";
    } else {
      c.style.display = "none";
    }
    // Varmistus: jos oma sulje-logiikka ei piilottanut säiliötä, piilotetaan se
    window.setTimeout(function () {
      if (nakyva(c)) c.style.display = "none";
    }, 450);
  }

  function luoPalkki(c) {
    var p = c.querySelector(":scope > .tp-palkki");
    if (!p) {
      p = document.createElement("div");
      p.className = "tp-palkki";
      p.innerHTML =
        '<span class="tp-otsikko"></span>' +
        '<span class="tp-koko" role="group" aria-label="Tekstin koko">' +
        '<button type="button" class="tp-koko-btn" data-d="-1" aria-label="Pienennä tekstiä" title="Pienennä tekstiä">A\u2212</button>' +
        '<span class="tp-zoom-arvo" aria-live="polite"></span>' +
        '<button type="button" class="tp-koko-btn" data-d="1" aria-label="Suurenna tekstiä" title="Suurenna tekstiä">A+</button></span>' +
        '<button type="button" class="tp-sulje" aria-label="Sulje tehtävä">' +
        '<span class="tp-sulje-x" aria-hidden="true">✕</span> Sulje tehtävä</button>';
      p.querySelector(".tp-sulje").addEventListener("click", function () { sulje(c); });
      p.querySelectorAll(".tp-koko-btn").forEach(function (b) {
        b.addEventListener("click", function () { muutaKokoa(c, parseInt(b.getAttribute("data-d"), 10)); });
      });
      c.insertBefore(p, c.firstChild);
    }
    p.querySelector(".tp-otsikko").textContent = otsikko(c);
    return p;
  }

  function lukitse() {
    if (document.documentElement.classList.contains("tp-lukittu")) return;
    var kaista = window.innerWidth - document.documentElement.clientWidth;
    document.documentElement.classList.add("tp-lukittu");
    if (kaista > 0) document.body.style.paddingRight = kaista + "px";
  }
  function vapauta() {
    document.documentElement.classList.remove("tp-lukittu");
    document.body.style.paddingRight = "";
  }

  var PROPS = ["filter", "transform", "perspective", "backdropFilter", "contain", "willChange"];
  function vapautaEsivanhemmat(c) {
    c._tpVapautetut = [];
    for (var el = c.parentElement; el && el !== document.documentElement; el = el.parentElement) {
      var cs = window.getComputedStyle(el), sido = false;
      if ((cs.position !== "static" && cs.zIndex !== "auto") || cs.isolation === "isolate" || parseFloat(cs.opacity) < 1) sido = true;
      for (var i = 0; i < PROPS.length; i++) {
        var v = cs[PROPS[i]];
        if (v && v !== "none" && v !== "auto" && v !== "normal") { sido = true; break; }
      }
      if (sido) { el.classList.add("tp-vapaa"); c._tpVapautetut.push(el); }
    }
  }
  function palautaEsivanhemmat(c) {
    (c._tpVapautetut || []).forEach(function (el) {
      var viela = auki.some(function (x) { return x !== c && (x._tpVapautetut || []).indexOf(el) !== -1; });
      if (!viela) el.classList.remove("tp-vapaa");
    });
    c._tpVapautetut = [];
  }

  function avaa(c) {
    if (c._tpAuki) return;
    c._tpAuki = true;
    if (!auki.length) {
      edellinenFokus = document.activeElement;
      tallennettuY = window.pageYOffset;
    }
    auki.push(c);

    vapautaEsivanhemmat(c);
    c.classList.add("tp-auki");
    c.setAttribute("role", "dialog");
    c.setAttribute("aria-modal", "true");
    c.setAttribute("aria-label", otsikko(c));

    alkuperaisetSulut(c).forEach(function (el) {
      el.classList.add("tp-piilo");
      var vanhempi = el.parentElement;
      if (vanhempi && vanhempi !== c && vanhempi.children.length === 1) {
        vanhempi.classList.add("tp-piilo");
      }
    });

    var palkki = luoPalkki(c);
    var s = luoScrim();
    s.hidden = false;
    requestAnimationFrame(function () { s.classList.add("tp-nakyy"); });
    lukitse();

    // Avaus-funktiot kutsuvat scrollIntoView -> sivu lähtisi liikkeelle taustalla.
    // Palautetaan sivu siihen kohtaan, jossa oppilas painoi "Avaa".
    window.scrollTo({ top: tallennettuY, behavior: "instant" });
    requestAnimationFrame(function () {
      window.scrollTo({ top: tallennettuY, behavior: "instant" });
    });

    c.querySelectorAll("iframe").forEach(function (f) {
      if (!f._tpKuuntelee) {
        f._tpKuuntelee = true;
        f.addEventListener("load", function () { if (c._tpAuki) sovellaKoko(c); });
      }
    });
    sovellaKoko(c);

    var nappi = palkki.querySelector(".tp-sulje");
    if (nappi) nappi.focus({ preventScroll: true });
  }

  function suljettu(c) {
    if (!c._tpAuki) return;
    c._tpAuki = false;
    auki = auki.filter(function (x) { return x !== c; });
    c.classList.remove("tp-auki");
    palautaEsivanhemmat(c);
    c.removeAttribute("role");
    c.removeAttribute("aria-modal");
    c.removeAttribute("aria-label");
    c.querySelectorAll(".tp-piilo").forEach(function (el) { el.classList.remove("tp-piilo"); });
    if (!auki.length) {
      if (scrim) {
        scrim.classList.remove("tp-nakyy");
        scrim.hidden = true;
      }
      vapauta();
      if (edellinenFokus && edellinenFokus.focus && document.contains(edellinenFokus)) {
        try { edellinenFokus.focus({ preventScroll: true }); } catch (e) {}
      }
    }
  }

  function paivita(c) {
    var n = nakyva(c);
    if (n && !c._tpAuki) avaa(c);
    else if (!n && c._tpAuki) suljettu(c);
    else if (n && c._tpAuki) {
      var o = c.querySelector(":scope > .tp-palkki .tp-otsikko");
      if (o) o.textContent = otsikko(c);
    }
  }

  function rekisteroi(c) {
    var mo = new MutationObserver(function () { paivita(c); });
    mo.observe(c, { attributes: true, attributeFilter: ["style", "class", "hidden"] });
    paivita(c);
  }

  function alusta() {
    lisaaTyylit();
    var nahty = [];
    document.querySelectorAll("[data-tp-ikkuna]").forEach(function (c) {
      nahty.push(c);
      rekisteroi(c);
    });
    document.querySelectorAll("iframe").forEach(function (f) {
      var c = f.parentElement;
      while (c && c !== document.body) {
        if (c.style && c.style.display === "none") break;
        c = c.parentElement;
      }
      if (!c || c === document.body) return;           // iframe on aina näkyvissä -> pysyy sivulla
      if (c.matches(EI_IKKUNAAN) || nahty.indexOf(c) !== -1) return;
      nahty.push(c);
      rekisteroi(c);
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", alusta);
  else alusta();

  // Tehtävä iframen sisällä voi pyytää ikkunan sulkemista (esim. "Palaa takaisin" -linkki)
  window.addEventListener("message", function (e) {
    if (e.origin !== window.location.origin) return;
    if (e.data && e.data.digiopo === "sulje-tehtava" && auki.length) sulje(auki[auki.length - 1]);
  });

  window.TehtavaIkkuna = { sulje: function () { if (auki.length) sulje(auki[auki.length - 1]); } };
})();
