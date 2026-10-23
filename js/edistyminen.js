/* ============================================================
   EDISTYMINEN — "missä olen" -polku + osion "tehty"-merkintä
   - Vaakapolku navbarin alla: jokainen NÄKYVÄ osio on pysäkki.
   - Pysäkit rakennetaan elävästä DOM:ista, joten opettajan osioiden
     järjestys, piilotus ja lukitus (jarjestys.js) toimivat automaattisesti.
   - Merkinnät tallennetaan osion id:llä (ei paikalla) vain tälle laitteelle
     (localStorage): digiopo-edistyminen-<luokka>-<ryhmä>.
   - Tilat: tyhja → kaynyt (osiossa viivytty ~8 s JA tehty jotain: avattu
     tehtävä, klikattu, kirjoitettu) → tehty (oppilas merkitsee itse).
   - Polun väri ei seuraa vieritystä: jokaisen pysäkin edessä oleva jana
     värjäytyy vasta, kun pysäkki on käyty tai tehty. Lukitut jäävät värjäämättä.
     Sijainti näkyy vain isompana pysäkkinä ja "Nyt"-tekstinä.
   - Opettajan laitteella ja muokkaustilassa mitään ei tallenneta.
   ============================================================ */
(function () {
  "use strict";

  var LUOKKA = (location.pathname.match(/(\d)luokka/) || [])[1];
  var main = document.getElementById("main-content");
  if (!LUOKKA || !main) return;

  var TEKSTIT = {
    fi: {
      polku: "Sivun eteneminen", nyt: "Nyt",
      merkitse: "Merkitse osio tehdyksi", tehtyNappi: "Osio tehty – poista merkintä",
      nollaa: "Nollaa merkinnät", varmista: "Varmista nollaus",
      tyhja: "ei aloitettu", kaynyt: "käyty läpi", tehty: "tehty", lukittu: "lukittu",
      laite: "Merkinnät tallentuvat vain tälle laitteelle.",
    },
    sv: {
      polku: "Sidans framsteg", nyt: "Nu",
      merkitse: "Markera avsnittet som klart", tehtyNappi: "Avsnittet klart – ta bort markeringen",
      nollaa: "Nollställ markeringar", varmista: "Bekräfta nollställning",
      tyhja: "inte påbörjat", kaynyt: "besökt", tehty: "klart", lukittu: "låst",
      laite: "Markeringarna sparas bara på den här enheten.",
    },
    en: {
      polku: "Page progress", nyt: "Now",
      merkitse: "Mark section as done", tehtyNappi: "Section done – remove mark",
      nollaa: "Reset marks", varmista: "Confirm reset",
      tyhja: "not started", kaynyt: "visited", tehty: "done", lukittu: "locked",
      laite: "Marks are saved on this device only.",
    },
  };
  function t(k) {
    var l = (document.documentElement.getAttribute("lang") || "fi").toLowerCase().slice(0, 2);
    var s = TEKSTIT[l] || (l === "fi" ? TEKSTIT.fi : TEKSTIT.en);
    return s[k] || TEKSTIT.fi[k];
  }

  /* ---- tallennus ---- */
  function lueRaaka(a) { try { return localStorage.getItem(a); } catch (e) { return null; } }
  function avain() {
    return "digiopo-edistyminen-" + LUOKKA + "-" + (lueRaaka("digiopo-ryhma") || "oma");
  }
  function lueTila() {
    try { var o = JSON.parse(lueRaaka(avain()) || "{}"); return o && typeof o === "object" ? o : {}; }
    catch (e) { return {}; }
  }
  function opeTila() {
    return !!lueRaaka("digiopo-ope-ryhma") || document.body.classList.contains("ope-muokkaustila");
  }
  function kirjoita(o) { if (opeTila()) return; try { localStorage.setItem(avain(), JSON.stringify(o)); } catch (e) {} }

  /* ---- osiot (elävästä DOM:ista) ---- */
  function nakyvatOsiot() {
    return Array.prototype.slice
      .call(main.querySelectorAll(":scope > section.aihe-osio"))
      .filter(function (s) { return s.id && s.offsetParent !== null; });
  }
  var EM = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B50}\u{FE0F}\u{200D}]/gu;
  function osionNimi(sec) {
    var h = sec.querySelector("h2");
    if (!h) return sec.id;
    var k = h.cloneNode(true);
    Array.prototype.forEach.call(k.querySelectorAll("button, a, i, svg"), function (e) { e.remove(); });
    var s = k.textContent.replace(EM, "").replace(/\s+/g, " ").trim();
    return s || sec.id;
  }

  /* ---- DOM ---- */
  var bar, nytNimi, osat, lista, nollaaNappi;
  var osiot = [];
  var tila = {};
  var dwell = {};
  var nollausAjastin = null;

  function luoPalkki() {
    var ref = document.querySelector(".book-spread");
    if (!ref || !ref.parentNode) return false;
    bar = document.createElement("nav");
    bar.className = "edist-polku";
    bar.hidden = true;
    bar.innerHTML =
      '<div class="edist-polku__nyt"><span class="edist-polku__nyt-etu"></span> <strong class="edist-polku__nyt-nimi"></strong></div>' +
      '<div class="edist-polku__rata"><div class="edist-polku__viiva"></div><div class="edist-polku__osat"></div>' +
      '<ol class="edist-polku__lista"></ol></div>' +
      '<button type="button" class="edist-polku__nollaa" hidden></button>';
    ref.parentNode.insertBefore(bar, ref);
    nytNimi = bar.querySelector(".edist-polku__nyt-nimi");
    osat = bar.querySelector(".edist-polku__osat");
    lista = bar.querySelector(".edist-polku__lista");
    nollaaNappi = bar.querySelector(".edist-polku__nollaa");
    nollaaNappi.addEventListener("click", function () {
      if (nollaaNappi.dataset.varmista === "1") {
        clearTimeout(nollausAjastin);
        tila = {};
        dwell = {};
        kirjoita(tila);
        piirra();
      } else {
        nollaaNappi.dataset.varmista = "1";
        nollaaNappi.textContent = t("varmista");
        nollausAjastin = setTimeout(function () {
          nollaaNappi.dataset.varmista = "";
          nollaaNappi.textContent = t("nollaa");
        }, 4000);
      }
    });
    return true;
  }

  function osionTila(sec) {
    if (sec.classList.contains("osio-lukittu")) return "lukittu";
    return tila[sec.id] || "tyhja";
  }

  function varmistaNappi(sec) {
    var rivi = sec.querySelector(":scope > .osio-tehty-rivi");
    if (opeTila() || sec.classList.contains("osio-lukittu")) {
      if (rivi) rivi.remove();
      return;
    }
    if (!rivi) {
      rivi = document.createElement("div");
      rivi.className = "osio-tehty-rivi";
      var b = document.createElement("button");
      b.type = "button";
      b.className = "osio-tehty-nappi";
      b.addEventListener("click", function () {
        if (tila[sec.id] === "tehty") delete tila[sec.id];
        else tila[sec.id] = "tehty";
        kirjoita(tila);
        piirra();
      });
      rivi.appendChild(b);
      var p = document.createElement("p");
      p.className = "osio-tehty-laite";
      rivi.appendChild(p);
      sec.appendChild(rivi);
    }
    var nappi = rivi.querySelector("button");
    var tehty = tila[sec.id] === "tehty";
    nappi.setAttribute("aria-pressed", tehty ? "true" : "false");
    nappi.textContent = tehty ? t("tehtyNappi") : t("merkitse");
    rivi.querySelector("p").textContent = t("laite");
  }

  function piirra() {
    tila = lueTila();
    osiot = nakyvatOsiot();
    if (!bar) return;
    bar.setAttribute("aria-label", t("polku"));
    bar.querySelector(".edist-polku__nyt-etu").textContent = t("nyt");
    if (osiot.length < 2) { bar.hidden = true; return; }
    bar.hidden = false;

    var n = osiot.length;
    var html = "";
    var nav = document.querySelector(".aihelista");
    osiot.forEach(function (sec, i) {
      var nimi = osionNimi(sec);
      var s = osionTila(sec);
      var left = (i / (n - 1)) * 100;
      html +=
        '<li class="edist-polku__pysakki" data-tila="' + s + '" style="left:' + left.toFixed(3) + '%">' +
        '<a href="#' + sec.id + '" data-id="' + sec.id + '" data-nimi="' + nimi.replace(/"/g, "&quot;") + '"' +
        ' aria-label="' + nimi.replace(/"/g, "&quot;") + ", " + t(s) + '"><span class="edist-polku__piste"></span></a></li>';
      varmistaNappi(sec);
    });
    lista.innerHTML = html;

    /* jana edellisestä pysäkistä tähän: väri vain jos tämä pysäkki on käyty/tehty */
    var janat = "";
    osiot.forEach(function (sec, i) {
      if (i === 0) return;
      var s = osionTila(sec);
      if (s !== "kaynyt" && s !== "tehty") return;
      janat += '<span class="edist-polku__osa" data-tila="' + s + '" style="left:' +
        (((i - 1) / (n - 1)) * 100).toFixed(3) + '%;width:' + (100 / (n - 1)).toFixed(3) + '%"></span>';
    });
    osat.innerHTML = janat;

    /* sivupalkin linkkeihin vihreä ruksi tehdyille */
    if (nav) {
      Array.prototype.forEach.call(nav.querySelectorAll("a[href^='#']"), function (a) {
        var id = a.getAttribute("href").slice(1);
        a.classList.toggle("edistyminen-tehty", tila[id] === "tehty");
      });
    }
    nollaaNappi.hidden = opeTila() || !Object.keys(tila).length;
    if (!nollaaNappi.dataset.varmista) nollaaNappi.textContent = t("nollaa");
    paivitaRulla();
  }

  /* ---- vieritys: aktiivinen osio + täyttö ---- */
  var aktiivinenId = null;
  function paivitaRulla() {
    if (!bar || bar.hidden || !osiot.length) return;
    var vh = window.innerHeight, raja = vh * 0.35;
    var idx = -1;
    osiot.forEach(function (sec, i) {
      if (sec.getBoundingClientRect().top <= raja) idx = i;
    });
    aktiivinenId = idx < 0 ? null : osiot[idx].id;
    nytNimi.textContent = idx < 0 ? "" : osionNimi(osiot[idx]);
    Array.prototype.forEach.call(lista.querySelectorAll("a"), function (a) {
      if (a.dataset.id === aktiivinenId) a.setAttribute("aria-current", "location");
      else a.removeAttribute("aria-current");
    });
  }

  var odottaa = false;
  function ajasta() {
    if (odottaa) return;
    odottaa = true;
    requestAnimationFrame(function () { odottaa = false; paivitaRulla(); });
  }

  /* ---- "käyty": osiossa viivytty vähintään 8 s JA siinä on tehty jotain ----
     (avattu tehtävä/paneeli, klikattu, kirjoitettu tai siirrytty tehtävän iframeen).
     Pelkkä vieritys tai lukitun/kiinni olevan osion ohitus ei riitä. */
  var vuorovaikutus = {};
  function osioElementista(el) {
    while (el && el !== main) {
      if (el.parentNode === main && el.matches && el.matches("section.aihe-osio")) return el;
      el = el.parentNode;
    }
    return null;
  }
  function merkitseVuorovaikutus(el) {
    if (!el || !el.closest) return;
    if (el.closest(".osio-tehty-rivi, .osio-ope-btn, .opettaja-lataus")) return;
    var sec = osioElementista(el);
    if (sec && !sec.classList.contains("osio-lukittu")) vuorovaikutus[sec.id] = true;
  }
  ["click", "keydown", "input", "change"].forEach(function (tyyppi) {
    main.addEventListener(tyyppi, function (e) { merkitseVuorovaikutus(e.target); }, true);
  });
  /* Klikkaus iframen sisällä ei kupli tänne, mutta fokus siirtyy iframeen */
  window.addEventListener("blur", function () {
    setTimeout(function () {
      var a = document.activeElement;
      if (a && a.tagName === "IFRAME") merkitseVuorovaikutus(a);
    }, 0);
  });

  setInterval(function () {
    if (document.hidden || !aktiivinenId || opeTila()) return;
    var sec = document.getElementById(aktiivinenId);
    if (!sec || sec.classList.contains("osio-lukittu")) return;
    if (tila[aktiivinenId]) return; // kaynyt tai tehty
    dwell[aktiivinenId] = (dwell[aktiivinenId] || 0) + 1;
    if (dwell[aktiivinenId] >= 8 && vuorovaikutus[aktiivinenId]) {
      tila[aktiivinenId] = "kaynyt";
      kirjoita(tila);
      piirra();
    }
  }, 1000);

  /* ---- muutosten seuranta: järjestys, lukitus, piilotus, kieli ---- */
  var ajastin = null;
  function ajastaPiirto() {
    clearTimeout(ajastin);
    ajastin = setTimeout(function () { observeSections(); piirra(); }, 120);
  }
  var havaitut = typeof WeakSet !== "undefined" ? new WeakSet() : null;
  var secObs = new MutationObserver(ajastaPiirto);
  function observeSections() {
    Array.prototype.forEach.call(main.querySelectorAll(":scope > section.aihe-osio"), function (s) {
      if (havaitut && havaitut.has(s)) return;
      if (havaitut) havaitut.add(s);
      secObs.observe(s, { attributes: true, attributeFilter: ["class", "style", "hidden"] });
    });
  }

  function asetaKorkeus() {
    var h = document.querySelector("header.navbar, .navbar");
    document.documentElement.style.setProperty("--navbar-h", (h ? h.offsetHeight : 60) + "px");
    var b = bar ? bar.offsetHeight : 44;
    document.documentElement.style.setProperty("--polku-h", b + "px");
  }

  function init() {
    document.documentElement.classList.add("edist-" + LUOKKA);
    if (!luoPalkki()) return;
    observeSections();
    new MutationObserver(ajastaPiirto).observe(main, { childList: true });
    new MutationObserver(ajastaPiirto).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
    window.addEventListener("scroll", ajasta, { passive: true });
    window.addEventListener("resize", function () { asetaKorkeus(); ajasta(); });
    piirra();
    asetaKorkeus();
    setTimeout(function () { piirra(); asetaKorkeus(); }, 600);
  }

  if (document.readyState === "complete") init();
  else window.addEventListener("load", init);
})();
