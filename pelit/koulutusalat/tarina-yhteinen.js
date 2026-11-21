/* ==========================================================================
   DigiOpo – koulutusalojen tarinapelien yhteinen moottori (tarina-yhteinen.js)
   --------------------------------------------------------------------------
   Käyttö tarinan Twine-skriptissä (story JavaScript):

     TarinaYhteinen.alusta(setup, { ...alan data... });

   Data:
     ala            "tekniikka"           tunniste (tallennusavaimet, tiedostonimet)
     alaNimi        "Tekniikan ala"       näkyy kortissa ja palautustiedostossa
     tarinaNimi     "Linja seis!"
     kello          { alku: 720, raja: 180 }   minuutteja keskiyöstä; raja = minuuttia alusta (tai null)
     katsoTeksti    "Katso tehdasta"      3D-näkymän napin teksti
     piirteet       { avain: { nimi, kuvaus } }
     ammatit        { avain: { nimi, kuvaus, tutkinto, piirteet: [...] } }
     kutsuKortit    [ { tilanne, oikea, tutkinto, vaihtoehdot: { nimi: selitys },
                        nakyma?: HTML (esim. viestin kuva), ammattilainen?: "Tietoturva-asiantuntija" } ]
     tehtava        (valinnainen) loppuosan tehtävän tekstit, oletuksena "Kenet kutsut paikalle?":
                    { nimi, kysymys, korttiSana, seuraava, miksiLabel, placeholder, vihjeValitse,
                      vihjeAlku, sekoita, etiketit: { nimi: näkyvä teksti }, palaute: [hyvä, keski, alku],
                      ammattilainenTeksti }

   Sivulle tarjottavat funktiot: setup.tausta, setup.kello, setup.jaljella,
   setup.tallennaKortti, setup.piirreTeksti, setup.korttiHTML, setup.kutsuYhteenveto,
   window.kaynnistaTarina, paivitaKorttiNimi, lataaAmmattikortti, kutsuPiirra,
   lataaVastaukset, tyhjennaKaikki.
   ========================================================================== */
(function () {
  "use strict";

  function SC() { return window.SugarCube || {}; }
  function V() { return SC().State.variables; }
  function play(nimi) { SC().Engine.play(nimi); }
  function suojaa(t) { return String(t == null ? "" : t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  function alusta(setup, D) {
    var PIIRTEET = D.piirteet || {}, AMMATIT = D.ammatit || {}, KORTIT = D.kutsuKortit || [];
    var ALKU = (D.kello && D.kello.alku) || 0;
    var RAJA = (D.kello && typeof D.kello.raja === "number") ? D.kello.raja : null;
    var KUTSU_KEY = D.ala + "_kutsu_v1";
    /* Tallennus on sidottu korttisarjaan: jos kortit vaihtuvat, vanhat vastaukset hylätään */
    var KORTTI_SIG = KORTIT.map(function (k) { return k.oikea || k.otsikko || k.nimi; }).join("|");
    var TH = Object.assign({
      nimi: "Kenet kutsut paikalle?", kysymys: "Kenet kutsut paikalle?", korttiSana: "Kortti",
      seuraava: "Seuraava kortti", miksiLabel: "Miksi juuri hän? Kirjoita yksi lause.",
      placeholder: "Valitsin hänet, koska…", vihjeValitse: "Valitse ammattilainen.",
      vihjeAlku: "Valitse ammattilainen ja kirjoita perustelu.", sekoita: true, etiketit: {},
      palaute: ["Huippua! Tunnet alan ammatit hyvin.", "Hyvä! Moni ammatti tuli jo tutuksi.", "Nyt tiedät paljon enemmän kuin äsken. Juuri sitä varten tehtävä on."],
      ammattilainenTeksti: "Työssä tätä hoitaa"
    }, D.tehtava || {});
    var $ = window.jQuery;

    /* --- 3D-tausta: kohtaus passagen tagista (scene-*) --- */
    function asetaTausta(nimi) {
      document.documentElement.setAttribute("data-tausta", nimi || "");
      try { window.dispatchEvent(new CustomEvent("tausta3d:kohtaus", { detail: nimi || "" })); } catch (e) {}
    }
    setup.tausta = asetaTausta;
    $(document).on(":passagestart", function (ev) {
      var tags = (ev && ev.passage && ev.passage.tags) || [];
      if (tags.indexOf("scene-kansi") === -1) document.body.classList.remove("hide-navbar");
      for (var i = 0; i < tags.length; i++) {
        if (tags[i].indexOf("scene-") === 0) { asetaTausta(tags[i].slice(6)); return; }
      }
      asetaTausta("");
    });

    /* --- Katso ympärille: piilottaa tarinapaneelin hetkeksi --- */
    var KATSO = D.katsoTeksti || "Katso ympärille";
    function luoNappi() {
      if (document.getElementById("nayta-tehdas")) return;
      var b = document.createElement("button");
      b.type = "button"; b.id = "nayta-tehdas"; b.setAttribute("aria-pressed", "false");
      b.textContent = KATSO;
      b.addEventListener("click", function () {
        var auki = document.documentElement.classList.toggle("katso-3d");
        b.setAttribute("aria-pressed", auki ? "true" : "false");
        b.textContent = auki ? "Takaisin tarinaan" : KATSO;
      });
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && document.documentElement.classList.contains("katso-3d")) b.click();
      });
      document.body.appendChild(b);
    }
    $(document).one(":passagerender", luoNappi);
    $(document).on(":passagestart", function () {
      if (document.documentElement.classList.contains("katso-3d")) {
        document.documentElement.classList.remove("katso-3d");
        var b = document.getElementById("nayta-tehdas");
        if (b) { b.setAttribute("aria-pressed", "false"); b.textContent = KATSO; }
      }
    });

    /* --- Kohtauksen taustakuva (koko ruutu, 3D-taustan päällä) --- */
    function taustaElementti() {
      var el = document.getElementById("kohtaus-taustakuva");
      if (!el) {
        el = document.createElement("div");
        el.id = "kohtaus-taustakuva"; el.setAttribute("aria-hidden", "true");
        var canvas = document.getElementById("tausta3d");
        if (canvas && canvas.parentNode) canvas.parentNode.insertBefore(el, canvas.nextSibling);
        else document.body.insertBefore(el, document.body.firstChild);
      }
      return el;
    }
    var kuvaTassa = false;
    setup.taustakuva = function (src) {
      var el = taustaElementti();
      var url = 'url("' + src + '")';
      if (el.style.backgroundImage !== url) el.style.backgroundImage = url;
      el.classList.add("nakyy");
      kuvaTassa = true;
    };
    /* Kuva piilotetaan vasta, kun uusi passage on näkyvissä eikä se itse aseta kuvaa.
       Näin peräkkäiset sivut, joilla on sama kuva, eivät välähdä. */
    $(document).on(":passagestart", function () { kuvaTassa = false; });
    $(document).on(":passagedisplay", function () {
      var el = document.getElementById("kohtaus-taustakuva");
      if (el && !kuvaTassa) el.classList.remove("nakyy");
    });

    /* --- Kannen Käynnistä-painike --- */
    window.kaynnistaTarina = function (nappi) {
      if (nappi) { nappi.classList.add("painettu"); nappi.disabled = true; }
      var hidas = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      setTimeout(function () { play("start"); }, hidas ? 0 : 220);
    };

    /* --- Kello --- */
    setup.kello = function (m) {
      var t = ALKU + (Number(m) || 0);
      var h = Math.floor(t / 60) % 24, min = t % 60;
      return h + "." + (min < 10 ? "0" : "") + min;
    };
    setup.jaljella = function (m) {
      if (RAJA === null) return "";
      var j = RAJA - (Number(m) || 0);
      if (j < 0) return "Myöhässä " + (-j) + " min";
      var h = Math.floor(j / 60), min = j % 60;
      return "Aikaa " + (h ? h + " h" : "") + (h && min ? " " : "") + (min || !h ? min + " min" : "");
    };

    /* --- Ammattikortti --- */
    function laske() {
      var v = V(), p = v.piirre || {}, k = v.kiinn || {};
      var piirteet = Object.keys(PIIRTEET)
        .map(function (a) { return { avain: a, arvo: p[a] || 0 }; })
        .filter(function (x) { return x.arvo > 0; })
        .sort(function (a, b) { return b.arvo - a.arvo; })
        .slice(0, 2);
      var lista = Object.keys(AMMATIT).map(function (a) {
        var am = AMMATIT[a];
        var bonus = (am.piirteet || []).reduce(function (s, x) { return s + (p[x] || 0); }, 0);
        return { avain: a, nimi: am.nimi, kiinn: k[a] || 0, pisteet: (k[a] || 0) * 3 + bonus * 0.5 };
      }).sort(function (a, b) { return b.pisteet - a.pisteet; });
      var kiinnostavat = lista.filter(function (x) { return x.kiinn > 0; }).slice(0, 3);
      return { piirteet: piirteet, top: kiinnostavat.length ? kiinnostavat : lista.slice(0, 3), eiKiinnostusta: !kiinnostavat.length };
    }
    setup.tallennaKortti = function () { V().korttiTop = laske().top.map(function (x) { return x.nimi; }); };
    setup.piirreTeksti = function () {
      var k = laske();
      return k.piirteet.map(function (x) { return PIIRTEET[x.avain].nimi.toLowerCase(); }).join(" ja ");
    };
    setup.korttiHTML = function () {
      var k = laske(), nimi = V().korttiNimi || "";
      var h = '<div class="ammattikortti" role="group" aria-label="Ammattikortti">';
      h += '<div class="ak-yla"><p class="ak-otsikko">AMMATTIKORTTI · ' + suojaa(D.alaNimi.toUpperCase()) + '</p><p class="ak-nimi" id="ak-nimi">' + suojaa(nimi) + '</p></div>';
      h += '<p class="ak-osio">Vahvuutesi tarinassa</p>';
      if (k.piirteet.length) {
        h += '<div class="ak-piirteet">' + k.piirteet.map(function (x) {
          return '<div class="ak-piirre"><strong>' + suojaa(PIIRTEET[x.avain].nimi) + '</strong><span>' + suojaa(PIIRTEET[x.avain].kuvaus) + '</span></div>';
        }).join("") + '</div>';
      } else {
        h += '<p class="ak-viesti">Kokeilit rohkeasti eri vaihtoehtoja. Pelaa uudelleen, niin löydät vahvuutesi!</p>';
      }
      h += '<p class="ak-osio">' + (k.eiKiinnostusta ? "Voisit silti kurkata" : "Tutki näitä ammatteja") + '</p>';
      if (k.eiKiinnostusta) h += '<p class="ak-viesti">Mikään näistä ei vielä tuntunut omalta, ja se on ihan ok. Vahvuuksistasi on hyötyä monessa muussakin työssä.</p>';
      h += '<ol>' + k.top.map(function (x) {
        var am = AMMATIT[x.avain];
        return '<li><strong>' + suojaa(am.nimi) + '</strong> – ' + suojaa(am.kuvaus) + '<span class="ak-tutkinto">' + suojaa(am.tutkinto) + '</span></li>';
      }).join("") + '</ol></div>';
      return h;
    };
    window.paivitaKorttiNimi = function (arvo) {
      V().korttiNimi = String(arvo || "").slice(0, 40);
      var el = document.getElementById("ak-nimi");
      if (el) el.textContent = V().korttiNimi;
    };

    function rivita(g, teksti, maxW) {
      var sanat = String(teksti).split(" "), rivit = [], r = "";
      sanat.forEach(function (s) {
        var koe = r ? r + " " + s : s;
        if (g.measureText(koe).width > maxW && r) { rivit.push(r); r = s; } else r = koe;
      });
      if (r) rivit.push(r);
      return rivit;
    }
    function cssVari(nimi, oletus) {
      var v = getComputedStyle(document.documentElement).getPropertyValue(nimi).trim();
      return v || oletus;
    }
    window.lataaAmmattikortti = function () {
      var k = laske();
      var A1 = cssVari("--a1", "#6fffe9"), KOR = cssVari("--korostus", "#ffe066"),
          T1 = cssVari("--paneeli-2", "#13224a"), T2 = cssVari("--tausta", "#0b132b"), VA = cssVari("--teksti-vaalea", "#e6fbff");
      var W = 1080, P = 80, F = "'Segoe UI', Arial, sans-serif";
      function piirra(g, H) {
        var gr = g.createLinearGradient(0, 0, W, H); gr.addColorStop(0, T1); gr.addColorStop(1, T2);
        g.fillStyle = gr; g.fillRect(0, 0, W, H);
        g.strokeStyle = A1; g.lineWidth = 6; g.strokeRect(30, 30, W - 60, H - 60);
        var y = 130;
        g.fillStyle = A1; g.font = "bold 34px " + F; g.fillText("AMMATTIKORTTI · " + D.alaNimi.toUpperCase(), P, y);
        y += 80;
        g.fillStyle = "#ffffff"; g.font = "800 64px " + F; g.fillText(V().korttiNimi || D.tarinaNimi, P, y);
        y += 90;
        g.fillStyle = KOR; g.font = "bold 30px " + F; g.fillText("VAHVUUTESI TARINASSA", P, y);
        y += 60;
        (k.piirteet.length ? k.piirteet : [{ avain: null }]).forEach(function (x) {
          g.fillStyle = A1; g.font = "bold 40px " + F;
          g.fillText(x.avain ? PIIRTEET[x.avain].nimi : "Rohkea kokeilija", P, y); y += 50;
          g.fillStyle = VA; g.font = "32px " + F;
          rivita(g, x.avain ? PIIRTEET[x.avain].kuvaus : "Kokeilit eri vaihtoehtoja.", W - 2 * P).forEach(function (r) { g.fillText(r, P, y); y += 42; });
          y += 24;
        });
        y += 20;
        g.fillStyle = KOR; g.font = "bold 30px " + F;
        g.fillText(k.eiKiinnostusta ? "VOISIT SILTI KURKATA" : "TUTKI NÄITÄ AMMATTEJA", P, y);
        y += 60;
        k.top.forEach(function (x, i) {
          var am = AMMATIT[x.avain];
          g.fillStyle = "#ffffff"; g.font = "bold 42px " + F; g.fillText((i + 1) + ". " + am.nimi, P, y); y += 48;
          g.fillStyle = VA; g.font = "32px " + F;
          rivita(g, am.kuvaus, W - 2 * P - 40).forEach(function (r) { g.fillText(r, P + 40, y); y += 40; });
          g.fillStyle = "#9ca3af"; g.font = "28px " + F;
          rivita(g, am.tutkinto, W - 2 * P - 40).forEach(function (r) { g.fillText(r, P + 40, y); y += 36; });
          y += 28;
        });
        g.fillStyle = "#9ca3af"; g.font = "26px " + F; g.fillText("DigiOpo · " + D.tarinaNimi + " -tarina", P, Math.max(y + 40, H - 70));
        return y;
      }
      var mitta = document.createElement("canvas").getContext("2d");
      var H = Math.max(1350, Math.ceil(piirra(mitta, 1350) + 150));
      var c = document.createElement("canvas"); c.width = W; c.height = H;
      piirra(c.getContext("2d"), H);
      var a = document.createElement("a");
      a.download = "ammattikortti_" + D.ala + ".png";
      a.href = c.toDataURL("image/png");
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
    };

    /* --- Kenet kutsut paikalle? --- */
    function kutsuTila() {
      var v = V();
      if (!v.kutsu || !Array.isArray(v.kutsu.vastaukset)) {
        var tallessa = null;
        try { tallessa = JSON.parse(localStorage.getItem(KUTSU_KEY) || "null"); } catch (e) {}
        v.kutsu = (tallessa && Array.isArray(tallessa.vastaukset) && tallessa.sig === KORTTI_SIG) ? tallessa : { vastaukset: [], sig: KORTTI_SIG };
      }
      return v.kutsu;
    }
    function kutsuTallenna() { try { localStorage.setItem(KUTSU_KEY, JSON.stringify(V().kutsu)); } catch (e) {} }

    window.kutsuPiirra = function () {
      var alue = document.getElementById("kutsu-alue");
      if (!alue) return;
      var tila = kutsuTila();
      var i = tila.vastaukset.length;
      if (i >= KORTIT.length) { play("Kutsu: tulos"); return; }
      var k = KORTIT[i];
      var nimet = Object.keys(k.vaihtoehdot);
      if (TH.sekoita) for (var r = nimet.length - 1; r > 0; r--) { var q = Math.floor(Math.random() * (r + 1)); var tmp = nimet[r]; nimet[r] = nimet[q]; nimet[q] = tmp; }
      var pallot = KORTIT.map(function (_, j) { return '<span class="' + (j < i ? "tehty" : j === i ? "nyt" : "") + '"></span>'; }).join("");
      alue.innerHTML =
        '<p class="kohtaus-nro">' + suojaa(TH.korttiSana) + ' ' + (i + 1) + '/' + KORTIT.length + '</p>' +
        '<div class="kutsu-edistyminen" aria-hidden="true">' + pallot + '</div>' +
        '<div class="kutsu-kortti"><p class="kutsu-tilanne">' + suojaa(D.kutsuTilanneOtsikko || "Tilanne") + '</p><p class="kutsu-teksti">' + suojaa(k.tilanne) + '</p>' + (k.nakyma ? '<div class="kutsu-nakyma">' + k.nakyma + '</div>' : '') + '</div>' +
        '<p class="kutsu-kysymys" id="kutsu-kysymys">' + suojaa(TH.kysymys) + '</p>' +
        '<div class="kutsu-vaihtoehdot" role="radiogroup" aria-labelledby="kutsu-kysymys">' +
          nimet.map(function (n, j) { return '<button type="button" class="kutsu-vaihtoehto" role="radio" aria-checked="false" tabindex="' + (j === 0 ? 0 : -1) + '" data-nimi="' + suojaa(n) + '">' + suojaa(TH.etiketit[n] || n) + '</button>'; }).join("") +
        '</div>' +
        '<label class="kutsu-miksi-label" for="kutsu-miksi">' + suojaa(TH.miksiLabel) + '</label>' +
        '<textarea id="kutsu-miksi" maxlength="300" placeholder="' + suojaa(TH.placeholder) + '"></textarea>' +
        '<p class="kutsu-vihje" id="kutsu-vihje" aria-live="polite">' + suojaa(TH.vihjeAlku) + '</p>' +
        '<div class="kutsu-napit"><button type="button" class="kutsu-tarkista" disabled>Tarkista</button></div>' +
        '<div class="kutsu-palaute" aria-live="polite"></div>';

      var valinta = null;
      var napit = Array.prototype.slice.call(alue.querySelectorAll(".kutsu-vaihtoehto"));
      var miksi = alue.querySelector("#kutsu-miksi");
      var tarkista = alue.querySelector(".kutsu-tarkista");
      var vihje = alue.querySelector("#kutsu-vihje");

      function paivita() {
        var pituus = miksi.value.trim().length;
        tarkista.disabled = !(valinta && pituus >= 10);
        vihje.textContent = !valinta ? TH.vihjeValitse : (pituus < 10 ? "Kirjoita vielä lyhyt perustelu." : "Hyvä! Paina Tarkista.");
      }
      function valitse(nappi) {
        valinta = nappi.getAttribute("data-nimi");
        napit.forEach(function (b) { var on = b === nappi; b.setAttribute("aria-checked", on ? "true" : "false"); b.tabIndex = on ? 0 : -1; });
        paivita();
      }
      napit.forEach(function (b, j) {
        b.addEventListener("click", function () { valitse(b); });
        b.addEventListener("keydown", function (e) {
          var siirto = (e.key === "ArrowRight" || e.key === "ArrowDown") ? 1 : (e.key === "ArrowLeft" || e.key === "ArrowUp") ? -1 : 0;
          if (!siirto) return;
          e.preventDefault();
          var seur = napit[(j + siirto + napit.length) % napit.length];
          seur.focus(); valitse(seur);
        });
      });
      miksi.addEventListener("input", paivita);

      tarkista.addEventListener("click", function () {
        if (tarkista.disabled) return;
        var oikein = valinta === k.oikea;
        tila.vastaukset.push({ valinta: valinta, perustelu: miksi.value.trim(), oikein: oikein });
        kutsuTallenna();
        napit.forEach(function (b) {
          b.disabled = true;
          var n = b.getAttribute("data-nimi");
          if (n === k.oikea) b.classList.add("oikea");
          else if (n === valinta) b.classList.add("vaara");
        });
        miksi.disabled = true; tarkista.parentNode.style.display = "none"; vihje.textContent = "";
        var viimeinen = tila.vastaukset.length >= KORTIT.length;
        var h = '<div class="palaute">';
        if (oikein) {
          h += '<p class="kutsu-tulos-otsikko"><strong class="ok">Oikein!</strong></p><p>' + suojaa(k.vaihtoehdot[k.oikea]) + '</p>';
        } else {
          h += '<p class="kutsu-tulos-otsikko"><strong class="ei">Ei aivan.</strong> Oikea vastaus on <strong>' + suojaa(k.oikea.toLowerCase()) + '</strong>.</p>' +
               '<p>' + suojaa(k.vaihtoehdot[valinta]) + '</p><p>' + suojaa(k.vaihtoehdot[k.oikea]) + '</p>';
        }
        if (k.ammattilainen) h += '<p class="kutsu-ammattilainen">' + suojaa(TH.ammattilainenTeksti) + ': <strong>' + suojaa(k.ammattilainen) + '</strong></p>';
        h += '<p class="kutsu-tutkinto">Koulutus: ' + suojaa(k.tutkinto) + '</p></div>' +
             '<div class="kutsu-napit" style="margin-top:1rem"><button type="button" class="kutsu-seuraava">' + (viimeinen ? "Katso tulokset" : suojaa(TH.seuraava)) + '</button></div>';
        var pal = alue.querySelector(".kutsu-palaute");
        pal.innerHTML = h;
        var seuraava = pal.querySelector(".kutsu-seuraava");
        seuraava.addEventListener("click", function () {
          if (viimeinen) play("Kutsu: tulos");
          else {
            window.kutsuPiirra();
            var ylos = document.getElementById("passages"); if (ylos && ylos.scrollIntoView) ylos.scrollIntoView();
            var e1 = document.querySelector(".kutsu-vaihtoehto"); if (e1) e1.focus({ preventScroll: true });
          }
        });
        seuraava.focus({ preventScroll: true });
        if (pal.scrollIntoView) pal.scrollIntoView({ block: "nearest" });
      });
      paivita();
    };

    setup.kutsuYhteenveto = function () {
      var tila = kutsuTila();
      var oikeat = tila.vastaukset.filter(function (x) { return x.oikein; }).length;
      var h = '<p class="kutsu-pisteet">Osuit oikeaan <strong>' + oikeat + '/' + KORTIT.length + '</strong> kertaa.</p>';
      h += '<p style="text-align:center">' + suojaa(oikeat >= 7 ? TH.palaute[0] : oikeat >= 4 ? TH.palaute[1] : TH.palaute[2]) + '</p>';
      h += '<ol class="kutsu-lista">' + KORTIT.map(function (k, j) {
        var v = tila.vastaukset[j];
        if (!v) return "";
        return '<li><span class="' + (v.oikein ? "ok" : "ei") + '">' + (v.oikein ? "✓" : "✗") + '</span> ' + suojaa(k.tilanne) +
          '<br><strong>' + suojaa(TH.etiketit[k.oikea] || k.oikea) + '</strong>' + (v.oikein ? "" : ' (valitsit: ' + suojaa(TH.etiketit[v.valinta] || v.valinta) + ')') +
          (k.ammattilainen ? '<span class="kl-ammattilainen">' + suojaa(TH.ammattilainenTeksti) + ': ' + suojaa(k.ammattilainen) + '</span>' : '') +
          '<span class="kl-perustelu">Perustelusi: ' + suojaa(v.perustelu) + '</span></li>';
      }).join("") + '</ol>';
      return h;
    };

    var tehtavaTeksti = function (tila) {
      var oikeat = tila.vastaukset.filter(function (x) { return x.oikein; }).length;
      var t = "\n" + TH.nimi.toUpperCase() + " – oikein " + oikeat + "/" + KORTIT.length + "\n\n";
      KORTIT.forEach(function (kk, j) {
        var x = tila.vastaukset[j]; if (!x) return;
        t += (j + 1) + ". " + kk.tilanne + "\n   Valintani: " + x.valinta + (x.oikein ? " (oikein)" : " (oikea: " + kk.oikea + ")") + "\n   Perusteluni: " + x.perustelu + "\n" + (kk.ammattilainen ? "   " + TH.ammattilainenTeksti + ": " + kk.ammattilainen + "\n" : "") + "\n";
      });
      return t;
    };

    /* --- Tehtävätyyppi "kehitys": oppilas rakentaa oman tuotteen vaihe vaiheelta ---
       kutsuKortit = vaiheet: { otsikko, kysymys, miksi, ammattilainen, tutkinto,
         vaihtoehdot: [ { nimi, kuvaus, hinta, allergeenit:[], tagit:[], tarve?, kielletty?:[], palaute } ] }
       Ensimmäinen vaihe on kohderyhmä (tarve + kielletty). Lopuksi tuote nimetään. */
    if (TH.tyyppi === "kehitys") {
      var euro = function (x) { return (Math.round(x * 100) / 100).toFixed(2).replace(".", ",") + " €"; };
      var valitut = function (tila) {
        return tila.vastaukset.map(function (x, j) {
          var vt = (KORTIT[j].vaihtoehdot || []).filter(function (o) { return o.nimi === x.valinta; })[0];
          return vt || null;
        });
      };
      var arvio = function (tila) {
        var vv = valitut(tila), kohde = vv[0] || {}, hinta = 0, allerg = [], tagit = [];
        vv.forEach(function (o, j) {
          if (!o || j === 0) return;
          hinta += o.hinta || 0;
          (o.allergeenit || []).forEach(function (a) { if (allerg.indexOf(a) < 0) allerg.push(a); });
          (o.tagit || []).forEach(function (a) { if (tagit.indexOf(a) < 0) tagit.push(a); });
        });
        var ristiriidat = [];
        vv.forEach(function (o, j) {
          if (!o || j === 0) return;
          (kohde.kielletty || []).forEach(function (kk) {
            if ((o.allergeenit || []).concat(o.tagit || []).indexOf(kk) >= 0) ristiriidat.push(o.nimi);
          });
        });
        return { kohde: kohde, vv: vv, hinta: hinta, allerg: allerg, tagit: tagit, ristiriidat: ristiriidat,
                 tarveOk: kohde.tarve ? tagit.indexOf(kohde.tarve) >= 0 : true };
      };
      var sopiiko = function (kohde, o) {
        return !(kohde && (kohde.kielletty || []).some(function (kk) { return (o.allergeenit || []).concat(o.tagit || []).indexOf(kk) >= 0; }));
      };
      var sopivuusTeksti = function (a) {
        var r = [];
        if (a.ristiriidat.length) r.push("⚠ Ei sovi kohderyhmälle (" + a.kohde.nimi.toLowerCase() + "): " + a.ristiriidat.join(", ").toLowerCase() + ".");
        else if (a.kohde.nimi) r.push("✓ Raaka-aineet sopivat kohderyhmälle.");
        if (a.kohde.tarve) r.push(a.tarveOk ? "✓ " + (a.kohde.tarveOk || "Kohderyhmän tarve on huomioitu.") : "Vinkki: " + (a.kohde.tarveVinkki || "mieti vielä kohderyhmän tarvetta."));
        if (TH.hintaRaja && a.hinta > TH.hintaRaja) r.push("Hinta " + euro(a.hinta) + " on aika korkea välipalalle. " + (TH.hintaVinkki || ""));
        return r;
      };
      var tilaLaatikko = function (tila, esik) {
        var a = arvio({ vastaukset: tila.vastaukset.concat(esik ? [esik] : []) });
        var rivit = KORTIT.map(function (k, j) {
          var o = a.vv[j];
          return o ? '<li><span>' + suojaa(k.otsikko) + '</span><strong>' + suojaa(o.nimi) + '</strong></li>' : "";
        }).join("");
        return '<div class="kehitys-tila" aria-live="polite"><p class="kehitys-tila-otsikko">' + suojaa(TH.tilaOtsikko || "Tuotteesi nyt") + '</p>' +
          (rivit ? '<ul>' + rivit + '</ul>' : '<p class="pieni">Ei vielä valintoja.</p>') +
          '<p class="kehitys-mitat"><span>Hinta: <strong>' + euro(a.hinta) + '</strong></span><span>Allergeenit: <strong>' + suojaa(a.allerg.length ? a.allerg.join(", ") : "ei") + '</strong></span></p></div>';
      };

      window.kutsuPiirra = function () {
        var alue = document.getElementById("kutsu-alue");
        if (!alue) return;
        var tila = kutsuTila();
        var i = tila.vastaukset.length;
        if (i >= KORTIT.length) { if (tila.tuote && tila.tuote.nimi) { play("Kutsu: tulos"); return; } return piirraNimeaminen(alue, tila); }
        var k = KORTIT[i], kohde = valitut(tila)[0];
        var pallot = KORTIT.map(function (_, j) { return '<span class="' + (j < i ? "tehty" : j === i ? "nyt" : "") + '"></span>'; }).join("") + '<span class="' + (i >= KORTIT.length ? "nyt" : "") + '"></span>';
        alue.innerHTML =
          '<p class="kohtaus-nro">' + suojaa(TH.korttiSana) + ' ' + (i + 1) + '/' + (KORTIT.length + 1) + '</p>' +
          '<div class="kutsu-edistyminen" aria-hidden="true">' + pallot + '</div>' +
          '<div class="kutsu-kortti"><p class="kutsu-tilanne">' + suojaa(k.otsikko) + '</p><p class="kutsu-teksti">' + suojaa(k.kysymys) + '</p></div>' +
          '<div class="kehitys-asettelu"><div>' +
          '<div class="kutsu-vaihtoehdot kehitys-vaihtoehdot" role="radiogroup" aria-label="' + suojaa(k.otsikko) + '">' +
            k.vaihtoehdot.map(function (o, j) {
              var meta = [];
              if (o.hinta) meta.push("+" + euro(o.hinta));
              (o.allergeenit || []).forEach(function (x) { meta.push(x); });
              (o.tagit || []).forEach(function (x) { if (x !== "eläin") meta.push(x); });
              var ei = i > 0 && !sopiiko(kohde, o);
              return '<button type="button" class="kutsu-vaihtoehto kehitys-vaihtoehto' + (ei ? " ei-sovi" : "") + '" role="radio" aria-checked="false" tabindex="' + (j === 0 ? 0 : -1) + '" data-nimi="' + suojaa(o.nimi) + '">' +
                '<span class="kv-nimi">' + suojaa(o.nimi) + '</span>' +
                (o.kuvaus ? '<span class="kv-kuvaus">' + suojaa(o.kuvaus) + '</span>' : '') +
                (meta.length ? '<span class="kv-meta">' + suojaa(meta.join(" · ")) + '</span>' : '') +
                (ei ? '<span class="kv-varoitus">⚠ Ei sovi kohderyhmälle</span>' : '') + '</button>';
            }).join("") +
          '</div>' +
          '<label class="kutsu-miksi-label" for="kutsu-miksi">' + suojaa(k.miksi || TH.miksiLabel) + '</label>' +
          '<textarea id="kutsu-miksi" maxlength="300" placeholder="' + suojaa(TH.placeholder) + '"></textarea>' +
          '<p class="kutsu-vihje" id="kutsu-vihje" aria-live="polite">' + suojaa(TH.vihjeAlku) + '</p>' +
          '<div class="kutsu-napit"><button type="button" class="kutsu-tarkista" disabled>' + suojaa(TH.valitseNappi || "Valitse") + '</button></div>' +
          '<div class="kutsu-palaute" aria-live="polite"></div></div>' +
          '<div class="kehitys-sivu">' + tilaLaatikko(tila) + '</div></div>';

        var valinta = null;
        var napit = Array.prototype.slice.call(alue.querySelectorAll(".kutsu-vaihtoehto"));
        var miksi = alue.querySelector("#kutsu-miksi"), tarkista = alue.querySelector(".kutsu-tarkista"), vihje = alue.querySelector("#kutsu-vihje");
        var sivu = alue.querySelector(".kehitys-sivu");
        function paivita() {
          var pituus = miksi.value.trim().length;
          tarkista.disabled = !(valinta && pituus >= 10);
          vihje.textContent = !valinta ? TH.vihjeValitse : (pituus < 10 ? "Kirjoita vielä lyhyt perustelu." : "Hyvä! Paina " + (TH.valitseNappi || "Valitse") + ".");
        }
        function valitse(nappi) {
          valinta = nappi.getAttribute("data-nimi");
          napit.forEach(function (b) { var on = b === nappi; b.setAttribute("aria-checked", on ? "true" : "false"); b.tabIndex = on ? 0 : -1; });
          sivu.innerHTML = tilaLaatikko(tila, { valinta: valinta });
          paivita();
        }
        napit.forEach(function (b, j) {
          b.addEventListener("click", function () { valitse(b); });
          b.addEventListener("keydown", function (e) {
            var siirto = (e.key === "ArrowRight" || e.key === "ArrowDown") ? 1 : (e.key === "ArrowLeft" || e.key === "ArrowUp") ? -1 : 0;
            if (!siirto) return;
            e.preventDefault();
            var seur = napit[(j + siirto + napit.length) % napit.length];
            seur.focus(); valitse(seur);
          });
        });
        miksi.addEventListener("input", paivita);
        tarkista.addEventListener("click", function () {
          if (tarkista.disabled) return;
          var o = k.vaihtoehdot.filter(function (x) { return x.nimi === valinta; })[0];
          tila.vastaukset.push({ valinta: valinta, perustelu: miksi.value.trim() });
          kutsuTallenna();
          napit.forEach(function (b) { b.disabled = true; if (b.getAttribute("data-nimi") === valinta) b.classList.add("valittu"); });
          miksi.disabled = true; tarkista.parentNode.style.display = "none"; vihje.textContent = "";
          var ei = i > 0 && !sopiiko(kohde, o);
          var h = '<div class="palaute"><p class="kutsu-tulos-otsikko"><strong class="ok">' + suojaa(o.nimi) + '</strong></p>' +
            (o.palaute ? '<p>' + suojaa(o.palaute) + '</p>' : '') +
            (ei ? '<p class="ei">⚠ Huomaa: kohderyhmäsi ei voi syödä tätä. Voit jatkaa, mutta mieti asiaa tuotekortissa.</p>' : '') +
            '<p class="kutsu-ammattilainen">' + suojaa(TH.ammattilainenTeksti) + ': <strong>' + suojaa(k.ammattilainen) + '</strong>' + (k.ammattikuvaus ? ' – ' + suojaa(k.ammattikuvaus) : '') + '</p>' +
            '<p class="kutsu-tutkinto">Koulutus: ' + suojaa(k.tutkinto) + '</p></div>' +
            '<div class="kutsu-napit" style="margin-top:1rem"><button type="button" class="kutsu-seuraava">' + suojaa(i + 1 >= KORTIT.length ? (TH.nimeaNappi || "Nimeä tuote") : TH.seuraava) + '</button></div>';
          var pal = alue.querySelector(".kutsu-palaute");
          pal.innerHTML = h;
          sivu.innerHTML = tilaLaatikko(tila);
          var seuraava = pal.querySelector(".kutsu-seuraava");
          seuraava.addEventListener("click", function () {
            window.kutsuPiirra();
            var ylos = document.getElementById("passages"); if (ylos && ylos.scrollIntoView) ylos.scrollIntoView();
            var e1 = document.querySelector(".kutsu-vaihtoehto, #kehitys-nimi"); if (e1) e1.focus({ preventScroll: true });
          });
          seuraava.focus({ preventScroll: true });
          if (pal.scrollIntoView) pal.scrollIntoView({ block: "nearest" });
        });
        paivita();
      };

      var piirraNimeaminen = function (alue, tila) {
        var a = arvio(tila);
        var pallot = KORTIT.map(function () { return '<span class="tehty"></span>'; }).join("") + '<span class="nyt"></span>';
        alue.innerHTML =
          '<p class="kohtaus-nro">' + suojaa(TH.korttiSana) + ' ' + (KORTIT.length + 1) + '/' + (KORTIT.length + 1) + '</p>' +
          '<div class="kutsu-edistyminen" aria-hidden="true">' + pallot + '</div>' +
          '<div class="kutsu-kortti"><p class="kutsu-tilanne">' + suojaa(TH.nimeaOtsikko || "Nimi ja mainoslause") + '</p><p class="kutsu-teksti">' + suojaa(TH.nimeaTeksti || "Keksi tuotteelle nimi ja lyhyt mainoslause.") + '</p></div>' +
          tilaLaatikko(tila) +
          '<ul class="kehitys-sopivuus">' + sopivuusTeksti(a).map(function (r) { return '<li>' + suojaa(r) + '</li>'; }).join("") + '</ul>' +
          '<label class="kutsu-miksi-label" for="kehitys-nimi">Tuotteen nimi</label>' +
          '<input id="kehitys-nimi" class="kehitys-input" type="text" maxlength="30" autocomplete="off" placeholder="' + suojaa(TH.nimiPlaceholder || "Esim. Marjapala") + '">' +
          '<label class="kutsu-miksi-label" for="kehitys-lause">Mainoslause</label>' +
          '<input id="kehitys-lause" class="kehitys-input" type="text" maxlength="80" autocomplete="off" placeholder="' + suojaa(TH.lausePlaceholder || "Esim. Pieni pala, iso energia!") + '">' +
          '<p class="kutsu-vihje" id="kutsu-vihje" aria-live="polite">Kirjoita nimi ja mainoslause.</p>' +
          '<div class="kutsu-napit"><button type="button" class="kutsu-tarkista" disabled>' + suojaa(TH.valmisNappi || "Tee tuotekortti") + '</button></div>';
        var nimi = alue.querySelector("#kehitys-nimi"), lause = alue.querySelector("#kehitys-lause"), nappi = alue.querySelector(".kutsu-tarkista");
        function p() { nappi.disabled = !(nimi.value.trim().length >= 2 && lause.value.trim().length >= 5); }
        nimi.addEventListener("input", p); lause.addEventListener("input", p);
        nappi.addEventListener("click", function () {
          if (nappi.disabled) return;
          tila.tuote = { nimi: nimi.value.trim(), lause: lause.value.trim() };
          kutsuTallenna(); play("Kutsu: tulos");
        });
      };

      setup.kutsuYhteenveto = function () {
        var tila = kutsuTila(), a = arvio(tila), tuote = tila.tuote || {};
        var ainekset = a.vv.slice(1).filter(Boolean);
        var h = '<div class="tuotekortti">' +
          '<p class="tk-yla">' + suojaa(TH.korttiYla || "TUOTEKORTTI") + '</p>' +
          '<p class="tk-tuotenimi">' + suojaa(tuote.nimi || "Nimetön tuote") + '</p>' +
          (tuote.lause ? '<p class="tk-lause">”' + suojaa(tuote.lause) + '”</p>' : '') +
          '<dl class="tk-tiedot">' + KORTIT.map(function (k, j) { var o = a.vv[j]; return o ? '<dt>' + suojaa(k.otsikko) + '</dt><dd>' + suojaa(o.nimi) + '</dd>' : ''; }).join("") +
          '<dt>Hinta</dt><dd>' + euro(a.hinta) + '</dd><dt>Allergeenit</dt><dd>' + suojaa(a.allerg.length ? a.allerg.join(", ") : "ei") + '</dd></dl>' +
          '<ul class="kehitys-sopivuus">' + sopivuusTeksti(a).map(function (r) { return '<li>' + suojaa(r) + '</li>'; }).join("") + '</ul></div>';
        h += '<h3 class="kehitys-perustelut-otsikko">Perustelusi ja ammattilaiset</h3><ol class="kutsu-lista">' + KORTIT.map(function (k, j) {
          var v = tila.vastaukset[j]; if (!v) return "";
          return '<li><strong>' + suojaa(k.otsikko) + ':</strong> ' + suojaa(v.valinta) +
            '<span class="kl-perustelu">Perustelusi: ' + suojaa(v.perustelu) + '</span>' +
            '<span class="kl-ammattilainen">' + suojaa(TH.ammattilainenTeksti) + ': ' + suojaa(k.ammattilainen) + '</span></li>';
        }).join("") + '</ol>';
        return h;
      };

      tehtavaTeksti = function (tila) {
        var a = arvio(tila), tuote = tila.tuote || {};
        var t = "\n" + TH.nimi.toUpperCase() + "\n\n";
        t += "Tuotteen nimi: " + (tuote.nimi || "-") + "\nMainoslause: " + (tuote.lause || "-") + "\n\n";
        KORTIT.forEach(function (k, j) {
          var x = tila.vastaukset[j]; if (!x) return;
          t += (j + 1) + ". " + k.otsikko + ": " + x.valinta + "\n   Perusteluni: " + x.perustelu + "\n   " + TH.ammattilainenTeksti + ": " + k.ammattilainen + "\n\n";
        });
        t += "Hinta: " + euro(a.hinta) + "\nAllergeenit: " + (a.allerg.length ? a.allerg.join(", ") : "ei") + "\n";
        sopivuusTeksti(a).forEach(function (r) { t += r + "\n"; });
        return t;
      };
    }

    /* --- Tehtävätyyppi "budjetti": oppilas ostaa valikoiman annetulla budjetilla ---
       kutsuKortit = tuotteet: { nimi, ikoni, kuvaus, osto, myynti, ryhma, trendi(1-3), vastuu(1-3), menekki(0-1) }
       TH.budjetti, TH.askel, TH.maxMaara, TH.minKaytto, TH.minTuotteita, TH.ryhmat {avain: {nimi, vari}},
       TH.kysymykset [ { kysymys ({top} = eniten ostettu tuote), ammattilainen, tutkinto } ] */
    if (TH.tyyppi === "budjetti") {
      var BUD = TH.budjetti || 2000, ASK = TH.askel || 5, MAX = TH.maxMaara || 60;
      var RYHMAT = TH.ryhmat || {};
      var eur = function (x) { return Math.round(x).toLocaleString("fi-FI") + " €"; };
      var tahdet = function (n) { return "★★★".slice(0, n) + "☆☆☆".slice(0, 3 - n); };
      var ostot = function (tila) { if (!tila.ostot) tila.ostot = {}; return tila.ostot; };
      var laskeB = function (tila) {
        var o = ostot(tila), kaytetty = 0, myynti = 0, jaa = 0, kpl = 0, tuotteita = 0, ryhmaEur = {};
        KORTIT.forEach(function (t) {
          var q = o[t.nimi] || 0; if (!q) return;
          tuotteita++; kpl += q;
          kaytetty += q * t.osto; myynti += q * t.myynti * (t.menekki || 1); jaa += Math.round(q * (1 - (t.menekki || 1)));
          ryhmaEur[t.ryhma] = (ryhmaEur[t.ryhma] || 0) + q * t.osto;
        });
        var osuus = {}; Object.keys(RYHMAT).forEach(function (r) { osuus[r] = kaytetty ? Math.round((ryhmaEur[r] || 0) / kaytetty * 100) : 0; });
        var top = null; KORTIT.forEach(function (t) { var q = o[t.nimi] || 0; if (q && (!top || q * t.osto > (o[top.nimi] || 0) * top.osto)) top = t; });
        return { kaytetty: kaytetty, jaljella: BUD - kaytetty, myynti: myynti, voitto: myynti - kaytetty, jaa: jaa, kpl: kpl, tuotteita: tuotteita, osuus: osuus, top: top };
      };
      var palauteB = function (a) {
        var r = [], pal = TH.palauteB || {};
        (TH.tavoitteet || []).forEach(function (tv) {
          var x = a.osuus[tv.ryhma] || 0;
          if (tv.min != null && x < tv.min) r.push("Vinkki: " + tv.alle);
          else if (tv.max != null && x > tv.max) r.push("Huomio: " + tv.yli);
          else r.push("✓ " + tv.ok);
        });
        if (a.jaa > 0) r.push((pal.jaa || "Arviolta {n} kpl jää myymättä. Ne myydään alennuksella.").replace("{n}", a.jaa));
        r.push(a.voitto > 0 ? "✓ Voittoarvio on " + eur(a.voitto) + "." : "Huomio: kauppa tekisi tappiota. Valitse tuotteita, jotka menevät varmemmin kaupaksi.");
        return r;
      };
      var yhteenvetoPalkki = function (a) {
        var palkki = Object.keys(RYHMAT).map(function (r) {
          return a.osuus[r] ? '<span style="width:' + a.osuus[r] + '%;background:' + RYHMAT[r].vari + '" title="' + suojaa(RYHMAT[r].nimi) + '"></span>' : "";
        }).join("");
        var selite = Object.keys(RYHMAT).map(function (r) {
          return '<span class="bj-selite"><i style="background:' + RYHMAT[r].vari + '"></i>' + suojaa(RYHMAT[r].nimi) + ' ' + (a.osuus[r] || 0) + ' %</span>';
        }).join("");
        return '<div class="bj-luvut">' +
          '<div><span>Budjetti</span><strong>' + eur(BUD) + '</strong></div>' +
          '<div><span>Käytetty</span><strong>' + eur(a.kaytetty) + '</strong></div>' +
          '<div class="' + (a.jaljella < 0 ? "ei" : "") + '"><span>Jäljellä</span><strong>' + eur(a.jaljella) + '</strong></div>' +
          '<div><span>Myyntiarvio</span><strong>' + eur(a.myynti) + '</strong></div>' +
          '<div><span>Voittoarvio</span><strong class="' + (a.voitto < 0 ? "ei" : "ok") + '">' + eur(a.voitto) + '</strong></div></div>' +
          '<div class="bj-palkki" aria-hidden="true">' + palkki + '</div><div class="bj-selitteet">' + selite + '</div>';
      };

      window.kutsuPiirra = function () {
        var alue = document.getElementById("kutsu-alue");
        if (!alue) return;
        var tila = kutsuTila();
        if (tila.valmis) { play("Kutsu: tulos"); return; }
        if (tila.vaihe === "perustelu") return piirraPerustelut(alue, tila);
        var o = ostot(tila);
        alue.innerHTML =
          '<p class="kohtaus-nro">' + suojaa(TH.osa1 || "Osa 1/2 · Ostot") + '</p>' +
          '<div class="kutsu-kortti"><p class="kutsu-tilanne">' + suojaa(TH.tilanneOtsikko || "Tehtävä") + '</p><p class="kutsu-teksti">' + suojaa(TH.ostoOhje) + '</p></div>' +
          '<div class="bj-yhteenveto bj-sticky" aria-live="polite"></div>' +
          '<div class="bj-tuotteet">' + KORTIT.map(function (t, j) {
            return '<div class="bj-tuote" data-i="' + j + '">' +
              '<div class="bj-yla"><span class="bj-ikoni" aria-hidden="true">' + suojaa(t.ikoni || "") + '</span><div><p class="bj-nimi">' + suojaa(t.nimi) + '</p>' +
              '<p class="bj-ryhma" style="color:' + ((RYHMAT[t.ryhma] || {}).vari || "inherit") + '">' + suojaa((RYHMAT[t.ryhma] || {}).nimi || "") + '</p></div></div>' +
              '<p class="bj-kuvaus">' + suojaa(t.kuvaus || "") + '</p>' +
              '<p class="bj-hinnat">Ostohinta <strong>' + eur(t.osto) + '</strong> · Myyntihinta <strong>' + eur(t.myynti) + '</strong></p>' +
              '<p class="bj-tahdet"><span>Trendi <b aria-label="' + t.trendi + '/3">' + tahdet(t.trendi) + '</b></span><span>Vastuullisuus <b aria-label="' + t.vastuu + '/3">' + tahdet(t.vastuu) + '</b></span></p>' +
              '<div class="bj-maara"><button type="button" class="bj-miinus" aria-label="Vähemmän: ' + suojaa(t.nimi) + '">−</button>' +
              '<output aria-live="polite">' + (o[t.nimi] || 0) + ' kpl</output>' +
              '<button type="button" class="bj-plus" aria-label="Enemmän: ' + suojaa(t.nimi) + '">+</button></div></div>';
          }).join("") + '</div>' +
          '<p class="kutsu-vihje" id="kutsu-vihje" aria-live="polite"></p>' +
          '<div class="kutsu-napit"><button type="button" class="kutsu-tarkista" disabled>' + suojaa(TH.valmisOstot || "Lähetä tilaus") + '</button></div>';
        var yv = alue.querySelector(".bj-yhteenveto"), vihje = alue.querySelector("#kutsu-vihje"), nappi = alue.querySelector(".kutsu-tarkista");
        function paivita() {
          var a = laskeB(tila);
          yv.innerHTML = yhteenvetoPalkki(a);
          Array.prototype.forEach.call(alue.querySelectorAll(".bj-tuote"), function (el) {
            var t = KORTIT[+el.getAttribute("data-i")], q = o[t.nimi] || 0;
            el.querySelector("output").textContent = q + " kpl";
            el.querySelector(".bj-miinus").disabled = q <= 0;
            el.querySelector(".bj-plus").disabled = q + ASK > MAX || a.jaljella < ASK * t.osto;
            el.classList.toggle("valittu", q > 0);
          });
          var minK = TH.minKaytto || BUD * 0.75, minT = TH.minTuotteita || 5;
          var ok = a.kaytetty >= minK && a.tuotteita >= minT;
          nappi.disabled = !ok;
          vihje.textContent = ok ? "Hyvä! Voit vielä muokata tai lähettää tilauksen." :
            (a.tuotteita < minT ? "Valitse vähintään " + minT + " eri tuotetta (nyt " + a.tuotteita + "). " : "") +
            (a.kaytetty < minK ? "Käytä budjetista vähintään " + eur(minK) + "." : "");
        }
        Array.prototype.forEach.call(alue.querySelectorAll(".bj-tuote"), function (el) {
          var t = KORTIT[+el.getAttribute("data-i")];
          el.querySelector(".bj-plus").addEventListener("click", function () { o[t.nimi] = (o[t.nimi] || 0) + ASK; kutsuTallenna(); paivita(); });
          el.querySelector(".bj-miinus").addEventListener("click", function () { o[t.nimi] = Math.max(0, (o[t.nimi] || 0) - ASK); if (!o[t.nimi]) delete o[t.nimi]; kutsuTallenna(); paivita(); });
        });
        nappi.addEventListener("click", function () {
          if (nappi.disabled) return;
          tila.vaihe = "perustelu"; kutsuTallenna();
          window.kutsuPiirra();
          var ylos = document.getElementById("passages"); if (ylos && ylos.scrollIntoView) ylos.scrollIntoView();
          var e1 = document.querySelector(".bj-perustelu textarea"); if (e1) e1.focus({ preventScroll: true });
        });
        paivita();
      };

      var kysymysTeksti = function (k, a) { return k.kysymys.replace("{top}", a.top ? a.top.nimi.toLowerCase() : "tuote"); };
      var piirraPerustelut = function (alue, tila) {
        var a = laskeB(tila);
        var kys = TH.kysymykset || [];
        alue.innerHTML =
          '<p class="kohtaus-nro">' + suojaa(TH.osa2 || "Osa 2/2 · Perustelut") + '</p>' +
          '<div class="kutsu-kortti"><p class="kutsu-tilanne">' + suojaa(TH.perusteluOtsikko || "Tilaus lähetetty") + '</p><p class="kutsu-teksti">' + suojaa(TH.perusteluOhje || "Vastaa vielä kolmeen kysymykseen. Kirjoita jokaiseen yksi tai kaksi lausetta.") + '</p></div>' +
          '<div class="bj-yhteenveto">' + yhteenvetoPalkki(a) + '</div>' +
          kys.map(function (k, j) {
            return '<div class="bj-perustelu"><label class="kutsu-miksi-label" for="bj-p' + j + '">' + (j + 1) + '. ' + suojaa(kysymysTeksti(k, a)) + '</label>' +
              '<textarea id="bj-p' + j + '" maxlength="400" placeholder="' + suojaa(k.placeholder || "Kirjoita tähän…") + '">' + suojaa((tila.perustelut || [])[j] || "") + '</textarea>' +
              '<p class="kutsu-ammattilainen">' + suojaa(TH.ammattilainenTeksti) + ': <strong>' + suojaa(k.ammattilainen) + '</strong></p></div>';
          }).join("") +
          '<p class="kutsu-vihje" id="kutsu-vihje" aria-live="polite"></p>' +
          '<div class="kutsu-napit bj-napit"><button type="button" class="kutsu-seuraava bj-takaisin">' + suojaa(TH.takaisinOstoihin || "Muokkaa ostoja") + '</button>' +
          '<button type="button" class="kutsu-tarkista" disabled>' + suojaa(TH.valmisNappi || "Katso tulos") + '</button></div>';
        var tekstit = Array.prototype.slice.call(alue.querySelectorAll(".bj-perustelu textarea"));
        var nappi = alue.querySelector(".kutsu-tarkista"), vihje = alue.querySelector("#kutsu-vihje");
        function p() {
          tila.perustelut = tekstit.map(function (t) { return t.value.trim(); }); kutsuTallenna();
          var puuttuu = tila.perustelut.filter(function (x) { return x.length < 10; }).length;
          nappi.disabled = puuttuu > 0;
          vihje.textContent = puuttuu ? "Vastaa vielä " + puuttuu + " kysymykseen." : "Valmista! Paina " + (TH.valmisNappi || "Katso tulos") + ".";
        }
        tekstit.forEach(function (t) { t.addEventListener("input", p); });
        alue.querySelector(".bj-takaisin").addEventListener("click", function () { tila.vaihe = "osto"; kutsuTallenna(); window.kutsuPiirra(); });
        nappi.addEventListener("click", function () { if (nappi.disabled) return; tila.valmis = true; kutsuTallenna(); play("Kutsu: tulos"); });
        p();
      };

      setup.kutsuYhteenveto = function () {
        var tila = kutsuTila(), a = laskeB(tila), o = ostot(tila);
        var rivit = KORTIT.filter(function (t) { return o[t.nimi]; }).map(function (t) {
          return '<tr><td>' + suojaa((t.ikoni ? t.ikoni + " " : "") + t.nimi) + '</td><td>' + o[t.nimi] + '</td><td>' + eur(o[t.nimi] * t.osto) + '</td></tr>';
        }).join("");
        var h = '<div class="tuotekortti bj-tilaus"><p class="tk-yla">' + suojaa(TH.korttiYla || "TILAUSVAHVISTUS") + '</p>' +
          '<p class="tk-tuotenimi">' + suojaa(TH.kauppaNimi || "Oma valikoima") + '</p>' +
          '<table class="bj-taulu"><thead><tr><th>Tuote</th><th>Kpl</th><th>Hinta</th></tr></thead><tbody>' + rivit + '</tbody></table>' +
          '<dl class="tk-tiedot"><dt>Käytetty</dt><dd>' + eur(a.kaytetty) + ' / ' + eur(BUD) + '</dd><dt>Myyntiarvio</dt><dd>' + eur(a.myynti) + '</dd><dt>Voittoarvio</dt><dd>' + eur(a.voitto) + '</dd>' +
          '<dt>Valikoima</dt><dd>' + Object.keys(RYHMAT).map(function (r) { return suojaa(RYHMAT[r].nimi) + " " + (a.osuus[r] || 0) + " %"; }).join(", ") + '</dd></dl>' +
          '<ul class="kehitys-sopivuus">' + palauteB(a).map(function (r) { return '<li>' + suojaa(r) + '</li>'; }).join("") + '</ul></div>';
        h += '<h3 class="kehitys-perustelut-otsikko">Perustelusi ja ammattilaiset</h3><ol class="kutsu-lista">' + (TH.kysymykset || []).map(function (k, j) {
          return '<li><strong>' + suojaa(kysymysTeksti(k, a)) + '</strong><span class="kl-perustelu">' + suojaa((tila.perustelut || [])[j] || "") + '</span>' +
            '<span class="kl-ammattilainen">' + suojaa(TH.ammattilainenTeksti) + ': ' + suojaa(k.ammattilainen) + ' – ' + suojaa(k.tutkinto) + '</span></li>';
        }).join("") + '</ol>';
        return h;
      };

      tehtavaTeksti = function (tila) {
        var a = laskeB(tila), o = ostot(tila);
        var t = "\n" + TH.nimi.toUpperCase() + "\n\nOSTOT\n";
        KORTIT.forEach(function (k) { if (o[k.nimi]) t += "- " + k.nimi + ": " + o[k.nimi] + " kpl × " + k.osto + " € = " + eur(o[k.nimi] * k.osto) + "\n"; });
        t += "\nKäytetty: " + eur(a.kaytetty) + " / " + eur(BUD) + "\nMyyntiarvio: " + eur(a.myynti) + "\nVoittoarvio: " + eur(a.voitto) + "\n";
        t += "Valikoima: " + Object.keys(RYHMAT).map(function (r) { return RYHMAT[r].nimi + " " + (a.osuus[r] || 0) + " %"; }).join(", ") + "\n";
        palauteB(a).forEach(function (r) { t += r + "\n"; });
        t += "\nPERUSTELUT\n";
        (TH.kysymykset || []).forEach(function (k, j) { t += (j + 1) + ". " + kysymysTeksti(k, a) + "\n   " + ((tila.perustelut || [])[j] || "-") + "\n   " + TH.ammattilainenTeksti + ": " + k.ammattilainen + "\n\n"; });
        return t;
      };
    }

    window.lataaVastaukset = function () {
      var v = V(), tila = kutsuTila(), k = laske();
      var t = D.alaNimi.toUpperCase() + " – " + D.tarinaNimi.toUpperCase() + "\n" + (v.korttiNimi ? "Nimi: " + v.korttiNimi + "\n" : "") + "\n";
      t += "AMMATTIKORTTI\n";
      if (k.piirteet.length) t += "Vahvuudet: " + k.piirteet.map(function (x) { return PIIRTEET[x.avain].nimi; }).join(", ") + "\n";
      if (v.korttiTop && v.korttiTop.length) t += "Ehdotetut ammatit: " + v.korttiTop.join(", ") + "\n";
      if (D.aikaRivi && typeof v.aika === "number" && v.aika > 0) t += D.aikaRivi + " " + setup.kello(v.aika) + "\n";
      t += tehtavaTeksti(tila);
      var blob = new Blob([t], { type: "text/plain;charset=utf-8" });
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = D.ala + "_" + (v.korttiNimi ? v.korttiNimi.replace(/\s+/g, "_") : "vastaukset") + ".txt";
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    };

    window.tyhjennaKaikki = function (nappi) {
      try { localStorage.removeItem(KUTSU_KEY); } catch (e) {}
      var v = V();
      v.kutsu = { vastaukset: [], sig: KORTTI_SIG };
      v.korttiNimi = ""; v.korttiTop = []; v.aika = 0;
      v.piirre = {}; Object.keys(PIIRTEET).forEach(function (a) { v.piirre[a] = 0; });
      v.kiinn = {}; Object.keys(AMMATIT).forEach(function (a) { v.kiinn[a] = 0; });
      if (nappi) nappi.textContent = "Tyhjennetty ✓";
    };
  }

  window.TarinaYhteinen = { alusta: alusta };
})();
