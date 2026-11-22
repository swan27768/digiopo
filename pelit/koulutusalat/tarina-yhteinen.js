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
    /* Peli alkaa aina alusta, kun sivu avataan uudelleen: myös tehtävän vastaukset nollataan. */
    try { localStorage.removeItem(KUTSU_KEY); } catch (e) {}
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

    /* --- Tehtävätyyppi "kartta": oppilas ottaa rajallisen määrän näytteitä kartalta ja päättelee lähteen ---
       kutsuKortit = näytepisteet: { nimi, x, y (0–100), kuvaus, arvot: { avain: luku }, havainto }
       TH.naytteet (montako saa ottaa), TH.minNaytteet, TH.mittarit [ { avain, nimi, yksikko, hyva(arvo)→bool-raja: {min|max} } ],
       TH.joki (SVG-polku 0–100), TH.kohteet [ { x, y, teksti } ], TH.oikea (pisteen nimi), TH.lahella [nimiä],
       TH.korjaukset [ { nimi, oikein, palaute } ], TH.ammattilaiset [ { nimi, tehtava, tutkinto } ] */
    if (TH.tyyppi === "kartta") {
      var NMAX = TH.naytteet || 5, NMIN = TH.minNaytteet || 3, MITT = TH.mittarit || [];
      var otetut = function (tila) { if (!tila.naytteet) tila.naytteet = []; return tila.naytteet; };
      var piste = function (nimi) { return KORTIT.filter(function (p) { return p.nimi === nimi; })[0]; };
      var hyvaArvo = function (m, v) { return (m.min == null || v >= m.min) && (m.max == null || v <= m.max); };
      var arvoRivi = function (p) {
        return MITT.map(function (m) {
          var v = p.arvot[m.avain], ok = hyvaArvo(m, v);
          return '<span class="kt-arvo ' + (ok ? "ok" : "ei") + '">' + suojaa(m.nimi) + ' <strong>' + suojaa(String(v).replace(".", ",")) + '</strong> ' + suojaa(m.yksikko || "") + (ok ? "" : " ⚠") + '</span>';
        }).join("");
      };
      var karttaSVG = function (tila, valittu, korostus, kaikki) {
        var o = otetut(tila);
        var h = '<svg class="kt-kartta" viewBox="0 0 100 130" role="img" aria-label="' + suojaa(TH.karttaNimi || "Kartta") + '">';
        h += '<defs><linearGradient id="kt-maa" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d8c79a"/><stop offset="1" stop-color="#b9cf9a"/></linearGradient></defs>';
        h += '<rect x="0" y="0" width="100" height="130" rx="4" fill="url(#kt-maa)"/>';
        (TH.alueet || []).forEach(function (a) { h += '<path d="' + a.d + '" fill="' + a.vari + '" opacity="' + (a.opacity || 0.8) + '"/>'; });
        h += '<path d="' + TH.joki + '" fill="none" stroke="#5b9bd5" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round"/>';
        h += '<path d="' + TH.joki + '" fill="none" stroke="#8cc4ef" stroke-width="1.6" stroke-linecap="round" stroke-dasharray="2 3" opacity=".8"/>';
        (TH.sivuvedet || []).forEach(function (sv) { h += '<path d="' + sv.d + '" fill="none" stroke="' + (sv.vari || "#5b9bd5") + '" stroke-width="' + (sv.leveys || 1.6) + '" stroke-linecap="round"/>'; });
        (TH.kohteet || []).forEach(function (k) { h += '<text x="' + k.x + '" y="' + k.y + '" class="kt-kohde" text-anchor="' + (k.anchor || "middle") + '">' + suojaa(k.teksti) + '</text>'; });
        KORTIT.forEach(function (p, j) {
          var otettu = o.indexOf(p.nimi) >= 0 || kaikki;
          var luokka = "kt-piste" + (otettu ? " otettu" : "") + (valittu === p.nimi ? " valittu" : "") + (korostus && korostus.indexOf(p.nimi) >= 0 ? " korostus" : "");
          var vari = "#ffffff";
          if (otettu) vari = MITT.every(function (m) { return hyvaArvo(m, p.arvot[m.avain]); }) ? "#51cf66" : "#ff8a3d";
          h += '<g class="' + luokka + '" data-i="' + j + '" tabindex="0" role="button" aria-label="' + suojaa((j + 1) + ". " + p.nimi + (otettu ? ", näyte otettu" : "")) + '">' +
            '<circle cx="' + p.x + '" cy="' + p.y + '" r="3.6" fill="' + vari + '" stroke="#1d2b22" stroke-width=".8"/>' +
            '<text x="' + p.x + '" y="' + (p.y + 1.3) + '" text-anchor="middle" class="kt-nro">' + (j + 1) + '</text></g>';
        });
        return h + '</svg>';
      };

      window.kutsuPiirra = function () {
        var alue = document.getElementById("kutsu-alue");
        if (!alue) return;
        var tila = kutsuTila();
        if (tila.valmis) { play("Kutsu: tulos"); return; }
        if (tila.vaihe === "ratkaisu") return piirraRatkaisu(alue, tila);
        var valittu = null;
        function piirra() {
          var o = otetut(tila), jaljella = NMAX - o.length, p = valittu ? piste(valittu) : null;
          var info;
          if (!p) info = '<p class="kt-ohje">' + suojaa(TH.valitseOhje || "Valitse kartalta piste, josta haluat ottaa näytteen.") + '</p>';
          else {
            var otettu = o.indexOf(p.nimi) >= 0;
            info = '<p class="kt-pnimi">' + (KORTIT.indexOf(p) + 1) + '. ' + suojaa(p.nimi) + '</p><p class="kt-kuvaus">' + suojaa(p.kuvaus) + '</p>' +
              (otettu ? '<div class="kt-tulos"><p class="kt-havainto">' + suojaa(p.havainto) + '</p><div class="kt-arvot">' + arvoRivi(p) + '</div></div>'
                : '<div class="kutsu-napit"><button type="button" class="kutsu-tarkista kt-ota"' + (jaljella <= 0 ? " disabled" : "") + '>' + suojaa(jaljella > 0 ? "Ota näyte tästä" : "Näytteet loppuivat") + '</button></div>');
          }
          var taulu = o.length ? '<table class="kt-taulu"><thead><tr><th>Piste</th>' + MITT.map(function (m) { return '<th>' + suojaa(m.nimi) + '</th>'; }).join("") + '</tr></thead><tbody>' +
            KORTIT.filter(function (q) { return o.indexOf(q.nimi) >= 0; }).map(function (q) {
              return '<tr><td>' + (KORTIT.indexOf(q) + 1) + '. ' + suojaa(q.nimi) + '</td>' + MITT.map(function (m) { var v = q.arvot[m.avain]; return '<td class="' + (hyvaArvo(m, v) ? "ok" : "ei") + '">' + suojaa(String(v).replace(".", ",")) + '</td>'; }).join("") + '</tr>';
            }).join("") + '</tbody></table>' : '';
          alue.innerHTML =
            '<p class="kohtaus-nro">' + suojaa(TH.osa1 || "Osa 1/2 · Näytteet") + '</p>' +
            '<div class="kutsu-kortti"><p class="kutsu-tilanne">' + suojaa(TH.tilanneOtsikko || "Tehtävä") + '</p><p class="kutsu-teksti">' + suojaa(TH.karttaOhje) + '</p>' +
            (TH.raja ? '<p class="kt-raja">' + suojaa(TH.raja) + '</p>' : '') + '</div>' +
            '<div class="kt-asettelu"><div class="kt-kartta-laatikko">' + karttaSVG(tila, valittu) + '</div>' +
            '<div class="kt-sivu"><p class="kt-laskuri">Näytteitä jäljellä: <strong>' + jaljella + '/' + NMAX + '</strong></p>' +
            '<div class="kt-info" aria-live="polite">' + info + '</div>' + taulu + '</div></div>' +
            '<p class="kutsu-vihje" aria-live="polite">' + (o.length < NMIN ? "Ota vähintään " + NMIN + " näytettä ennen kuin ratkaiset mysteerin." : "Voit ottaa vielä näytteitä tai siirtyä ratkaisemaan.") + '</p>' +
            '<div class="kutsu-napit"><button type="button" class="kutsu-seuraava kt-ratkaise"' + (o.length < NMIN ? " disabled" : "") + '>' + suojaa(TH.ratkaiseNappi || "Ratkaise mysteeri") + '</button></div>';
          Array.prototype.forEach.call(alue.querySelectorAll(".kt-piste"), function (g) {
            var valitse = function () { valittu = KORTIT[+g.getAttribute("data-i")].nimi; piirra(); var u = alue.querySelector('.kt-piste[data-i="' + g.getAttribute("data-i") + '"]'); if (u) u.focus(); };
            g.addEventListener("click", valitse);
            g.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); valitse(); } });
          });
          var ota = alue.querySelector(".kt-ota");
          if (ota) ota.addEventListener("click", function () {
            if (ota.disabled) return;
            o.push(valittu); kutsuTallenna(); piirra();
            var i2 = alue.querySelector(".kt-info"); if (i2 && i2.scrollIntoView) i2.scrollIntoView({ block: "nearest" });
          });
          var rat = alue.querySelector(".kt-ratkaise");
          rat.addEventListener("click", function () {
            if (rat.disabled) return;
            tila.vaihe = "ratkaisu"; kutsuTallenna(); window.kutsuPiirra();
            var ylos = document.getElementById("passages"); if (ylos && ylos.scrollIntoView) ylos.scrollIntoView();
          });
        }
        piirra();
      };

      var piirraRatkaisu = function (alue, tila) {
        var o = otetut(tila);
        tila.ratkaisu = tila.ratkaisu || {};
        var R = tila.ratkaisu;
        alue.innerHTML =
          '<p class="kohtaus-nro">' + suojaa(TH.osa2 || "Osa 2/2 · Ratkaisu") + '</p>' +
          '<div class="kt-asettelu"><div class="kt-kartta-laatikko">' + karttaSVG(tila, R.lahde) + '</div><div class="kt-sivu">' +
          '<p class="kutsu-miksi-label" id="kt-l1">1. ' + suojaa(TH.lahdeKysymys || "Mistä ongelma alkaa?") + '</p>' +
          '<div class="kt-lahteet" role="radiogroup" aria-labelledby="kt-l1">' + KORTIT.map(function (p, j) {
            return '<button type="button" class="kutsu-vaihtoehto kt-lahde" role="radio" aria-checked="' + (R.lahde === p.nimi) + '" data-nimi="' + suojaa(p.nimi) + '">' + (j + 1) + '. ' + suojaa(p.nimi) + '</button>';
          }).join("") + '</div></div></div>' +
          '<label class="kutsu-miksi-label" for="kt-p1">2. ' + suojaa(TH.perusteluKysymys || "Mihin näytteisiin päätelmäsi perustuu?") + '</label>' +
          '<textarea id="kt-p1" class="kt-teksti" maxlength="400" placeholder="' + suojaa(TH.perusteluPlaceholder || "Päättelin tämän, koska…") + '">' + suojaa(R.perustelu || "") + '</textarea>' +
          '<p class="kutsu-miksi-label" id="kt-l3">3. ' + suojaa(TH.korjausKysymys || "Miten joki korjataan?") + '</p>' +
          '<div class="kutsu-vaihtoehdot kt-korjaukset" role="radiogroup" aria-labelledby="kt-l3">' + (TH.korjaukset || []).map(function (k) {
            return '<button type="button" class="kutsu-vaihtoehto kt-korjaus" role="radio" aria-checked="' + (R.korjaus === k.nimi) + '" data-nimi="' + suojaa(k.nimi) + '">' + suojaa(k.nimi) + '</button>';
          }).join("") + '</div>' +
          '<label class="kutsu-miksi-label" for="kt-p2">4. ' + suojaa(TH.korjausPerusteluKysymys || "Miksi valitsit tämän korjauksen?") + '</label>' +
          '<textarea id="kt-p2" class="kt-teksti" maxlength="400" placeholder="Valitsin tämän, koska…">' + suojaa(R.korjausPerustelu || "") + '</textarea>' +
          '<p class="kutsu-vihje" id="kutsu-vihje" aria-live="polite"></p>' +
          '<div class="kutsu-napit bj-napit"><button type="button" class="kutsu-seuraava kt-takaisin">' + suojaa(TH.takaisinNappi || "Takaisin näytteisiin") + '</button>' +
          '<button type="button" class="kutsu-tarkista" disabled>' + suojaa(TH.valmisNappi || "Katso tulos") + '</button></div>';
        var nappi = alue.querySelector(".kutsu-tarkista"), vihje = alue.querySelector("#kutsu-vihje");
        var p1 = alue.querySelector("#kt-p1"), p2 = alue.querySelector("#kt-p2");
        function p() {
          R.perustelu = p1.value.trim(); R.korjausPerustelu = p2.value.trim(); kutsuTallenna();
          var puuttuu = [];
          if (!R.lahde) puuttuu.push("valitse lähde");
          if (R.perustelu.length < 10) puuttuu.push("kirjoita perustelu");
          if (!R.korjaus) puuttuu.push("valitse korjaus");
          if (R.korjausPerustelu.length < 10) puuttuu.push("perustele korjaus");
          nappi.disabled = puuttuu.length > 0;
          vihje.textContent = puuttuu.length ? "Vielä: " + puuttuu.join(", ") + "." : "Valmista! Paina " + (TH.valmisNappi || "Katso tulos") + ".";
        }
        function ryhma(sel, avain, jalkeen) {
          var napit = Array.prototype.slice.call(alue.querySelectorAll(sel));
          napit.forEach(function (b) {
            b.addEventListener("click", function () {
              R[avain] = b.getAttribute("data-nimi");
              napit.forEach(function (x) { x.setAttribute("aria-checked", x === b ? "true" : "false"); });
              if (jalkeen) jalkeen(); p();
            });
          });
        }
        ryhma(".kt-lahde", "lahde", function () { var k = alue.querySelector(".kt-kartta-laatikko"); if (k) k.innerHTML = karttaSVG(tila, R.lahde); });
        ryhma(".kt-korjaus", "korjaus");
        p1.addEventListener("input", p); p2.addEventListener("input", p);
        alue.querySelector(".kt-takaisin").addEventListener("click", function () { tila.vaihe = "naytteet"; kutsuTallenna(); window.kutsuPiirra(); });
        nappi.addEventListener("click", function () { if (nappi.disabled) return; tila.valmis = true; kutsuTallenna(); play("Kutsu: tulos"); });
        p();
      };

      var arvioKartta = function (tila) {
        var R = tila.ratkaisu || {};
        var lahdeOk = R.lahde === TH.oikea, lahella = (TH.lahella || []).indexOf(R.lahde) >= 0;
        var k = (TH.korjaukset || []).filter(function (x) { return x.nimi === R.korjaus; })[0] || {};
        return { R: R, lahdeOk: lahdeOk, lahella: lahella, korjaus: k };
      };

      setup.kutsuYhteenveto = function () {
        var tila = kutsuTila(), a = arvioKartta(tila), o = otetut(tila);
        var oikeaNro = KORTIT.indexOf(piste(TH.oikea)) + 1;
        var otsikko = a.lahdeOk ? (TH.tulosOikein || "Ratkaisit mysteerin!") : a.lahella ? (TH.tulosLahella || "Melkein!") : (TH.tulosVaarin || "Mysteeri ratkesi toisin.");
        var h = '<div class="tuotekortti kt-raportti"><p class="tk-yla">' + suojaa(TH.korttiYla || "TUTKIMUSRAPORTTI") + '</p>' +
          '<p class="tk-tuotenimi">' + suojaa(otsikko) + '</p>' +
          '<div class="kt-raportti-kartta">' + karttaSVG(tila, a.R.lahde, [TH.oikea], true) + '</div>' +
          '<dl class="tk-tiedot"><dt>Näytteitä</dt><dd>' + o.length + '/' + NMAX + ': ' + o.map(function (n) { return (KORTIT.indexOf(piste(n)) + 1) + ". " + n; }).join(", ") + '</dd>' +
          '<dt>Sinun lähteesi</dt><dd>' + suojaa(a.R.lahde || "-") + '</dd><dt>Oikea lähde</dt><dd>' + oikeaNro + '. ' + suojaa(TH.oikea) + '</dd>' +
          '<dt>Korjauksesi</dt><dd>' + suojaa(a.R.korjaus || "-") + '</dd></dl>' +
          '<ul class="kehitys-sopivuus"><li>' + suojaa(a.lahdeOk ? TH.selitysOikein : a.lahella ? TH.selitysLahella : TH.selitysVaarin) + '</li>' +
          '<li>' + suojaa((a.korjaus.oikein ? "✓ " : "") + (a.korjaus.palaute || "")) + '</li></ul></div>';
        h += '<h3 class="kehitys-perustelut-otsikko">Perustelusi</h3><ol class="kutsu-lista">' +
          '<li><strong>' + suojaa(TH.perusteluKysymys || "Perustelu") + '</strong><span class="kl-perustelu">' + suojaa(a.R.perustelu || "") + '</span></li>' +
          '<li><strong>' + suojaa(TH.korjausPerusteluKysymys || "Korjaus") + '</strong><span class="kl-perustelu">' + suojaa(a.R.korjausPerustelu || "") + '</span></li></ol>';
        h += '<h3 class="kehitys-perustelut-otsikko">' + suojaa(TH.ammattilaisetOtsikko || "Näitä töitä tekevät") + '</h3><ol class="kutsu-lista">' + (TH.ammattilaiset || []).map(function (x) {
          return '<li><strong>' + suojaa(x.nimi) + '</strong> – ' + suojaa(x.tehtava) + '<span class="kl-ammattilainen">Koulutus: ' + suojaa(x.tutkinto) + '</span></li>';
        }).join("") + '</ol>';
        return h;
      };

      tehtavaTeksti = function (tila) {
        var a = arvioKartta(tila), o = otetut(tila);
        var t = "\n" + TH.nimi.toUpperCase() + "\n\nNÄYTTEET (" + o.length + "/" + NMAX + ")\n";
        o.forEach(function (n) { var q = piste(n); t += "- " + (KORTIT.indexOf(q) + 1) + ". " + n + ": " + MITT.map(function (m) { return (m.nimi + " " + String(q.arvot[m.avain]).replace(".", ",") + " " + (m.yksikko || "")).trim(); }).join(", ") + "\n"; });
        t += "\nLähde, jonka valitsin: " + (a.R.lahde || "-") + (a.lahdeOk ? " (oikein)" : " (oikea: " + TH.oikea + ")") + "\nPerusteluni: " + (a.R.perustelu || "-") + "\n";
        t += "\nKorjaus: " + (a.R.korjaus || "-") + (a.korjaus.oikein ? " (paras ratkaisu)" : "") + "\nPerusteluni: " + (a.R.korjausPerustelu || "-") + "\n";
        return t;
      };
    }

    /* --- Tehtävätyyppi "sijoitus": oppilas sijoittaa ihmiset vaihtoehtoihin, joissa on rajallisesti paikkoja ---
       kutsuKortit = ihmiset: { nimi, ikoni, kuvaus, sopivuus: { avain: [taso 0–2, selitys] } }
       TH.vaihtoehdot [ { avain, nimi, ikoni, tieto, paikat } ], TH.kysymykset [ { kysymys, ammattilainen, tutkinto, placeholder } ],
       TH.ammattilaiset [ { nimi, tehtava, tutkinto } ], TH.palaute [hyvä, keski, alku] */
    if (TH.tyyppi === "sijoitus") {
      var VT = TH.vaihtoehdot || [];
      var vt = function (avain) { return VT.filter(function (v) { return v.avain === avain; })[0]; };
      var sij = function (tila) { if (!tila.sijoitukset) tila.sijoitukset = {}; return tila.sijoitukset; };
      var kaytetty = function (tila, avain) { var s = sij(tila), n = 0; Object.keys(s).forEach(function (k) { if (s[k] === avain) n++; }); return n; };
      var tasoMerkki = ["✗", "✓", "✓✓"], tasoLuokka = ["ei", "ok", "hyva"];
      var pisteet = function (tila) {
        var s = sij(tila), p = 0;
        KORTIT.forEach(function (h) { var a = s[h.nimi]; if (a && h.sopivuus[a]) p += h.sopivuus[a][0]; });
        return p;
      };
      var maxP = KORTIT.length * 2;
      var paikkaPalkki = function (tila) {
        return '<div class="sj-paikat">' + VT.map(function (v) {
          var vapaa = v.paikat - kaytetty(tila, v.avain);
          return '<div class="sj-paikka' + (vapaa <= 0 ? " taynna" : "") + '"><span class="sj-ikoni" aria-hidden="true">' + suojaa(v.ikoni) + '</span>' +
            '<span class="sj-pnimi">' + suojaa(v.nimi) + '</span><span class="sj-tieto">' + suojaa(v.tieto || "") + '</span>' +
            '<span class="sj-vapaa"><strong>' + vapaa + '</strong>/' + v.paikat + ' vapaana</span></div>';
        }).join("") + '</div>';
      };

      window.kutsuPiirra = function () {
        var alue = document.getElementById("kutsu-alue");
        if (!alue) return;
        var tila = kutsuTila();
        if (tila.valmis) { play("Kutsu: tulos"); return; }
        if (tila.vaihe === "perustelu") return piirraPerustelutS(alue, tila);
        var s = sij(tila);
        function piirra() {
          var kaikki = KORTIT.every(function (h) { return s[h.nimi]; });
          var p = pisteet(tila);
          alue.innerHTML =
            '<p class="kohtaus-nro">' + suojaa(TH.osa1 || "Osa 1/2 · Sijoitus") + '</p>' +
            '<div class="kutsu-kortti"><p class="kutsu-tilanne">' + suojaa(TH.tilanneOtsikko || "Tehtävä") + '</p><p class="kutsu-teksti">' + suojaa(TH.ohje) + '</p></div>' +
            '<div class="sj-yla" aria-live="polite">' + paikkaPalkki(tila) + '</div>' +
            '<div class="sj-ihmiset">' + KORTIT.map(function (h, j) {
              var valittu = s[h.nimi], tulos = tila.tarkistettu && valittu ? h.sopivuus[valittu] : null;
              return '<div class="sj-ihminen' + (valittu ? " sijoitettu" : "") + (tulos ? " " + tasoLuokka[tulos[0]] : "") + '" data-i="' + j + '">' +
                '<div class="bj-yla"><span class="bj-ikoni" aria-hidden="true">' + suojaa(h.ikoni || "") + '</span><div><p class="bj-nimi">' + (j + 1) + '. ' + suojaa(h.nimi) + '</p>' +
                '<p class="bj-kuvaus">' + suojaa(h.kuvaus) + '</p></div></div>' +
                '<div class="sj-valinnat" role="radiogroup" aria-label="Minne ' + suojaa(h.nimi) + '?">' + VT.map(function (v) {
                  var on = valittu === v.avain, taynna = !on && kaytetty(tila, v.avain) >= v.paikat;
                  return '<button type="button" class="sj-nappi" role="radio" aria-checked="' + on + '" data-a="' + suojaa(v.avain) + '"' + (taynna ? " disabled" : "") +
                    ' title="' + suojaa(v.nimi + (taynna ? " (täynnä)" : "")) + '"><span aria-hidden="true">' + suojaa(v.ikoni) + '</span> ' + suojaa(v.lyhyt || v.nimi) + '</button>';
                }).join("") + '</div>' +
                (tulos ? '<p class="sj-tulos ' + tasoLuokka[tulos[0]] + '"><strong>' + tasoMerkki[tulos[0]] + '</strong> ' + suojaa(tulos[1]) + '</p>' : '') + '</div>';
            }).join("") + '</div>' +
            (tila.tarkistettu ? '<p class="sj-pisteet">Pisteet: <strong>' + p + '/' + maxP + '</strong> – ' + suojaa(p >= maxP - 2 ? TH.palaute[0] : p >= maxP / 2 ? TH.palaute[1] : TH.palaute[2]) + '</p>' : '') +
            '<p class="kutsu-vihje" aria-live="polite">' + (kaikki ? (tila.tarkistettu ? "Voit vielä muuttaa sijoituksia ja tarkistaa uudelleen, tai jatkaa." : "Kaikki on sijoitettu. Tarkista, miten onnistuit.") : "Sijoita vielä " + KORTIT.filter(function (h) { return !s[h.nimi]; }).length + " matkustajaa.") + '</p>' +
            '<div class="kutsu-napit bj-napit"><button type="button" class="kutsu-tarkista sj-tarkista"' + (kaikki ? "" : " disabled") + '>' + suojaa(TH.tarkistaNappi || "Tarkista sijoitukset") + '</button>' +
            (tila.tarkistettu ? '<button type="button" class="kutsu-seuraava sj-jatka">' + suojaa(TH.jatkaNappi || "Jatka perusteluihin") + '</button>' : '') + '</div>';
          Array.prototype.forEach.call(alue.querySelectorAll(".sj-ihminen"), function (el) {
            var h = KORTIT[+el.getAttribute("data-i")];
            Array.prototype.forEach.call(el.querySelectorAll(".sj-nappi"), function (b) {
              b.addEventListener("click", function () {
                if (b.disabled) return;
                var a = b.getAttribute("data-a");
                if (s[h.nimi] === a) delete s[h.nimi]; else s[h.nimi] = a;
                tila.tarkistettu = false; kutsuTallenna(); piirra();
                var uusi = alue.querySelector('.sj-ihminen[data-i="' + el.getAttribute("data-i") + '"] .sj-nappi[data-a="' + a + '"]'); if (uusi) uusi.focus({ preventScroll: true });
              });
            });
          });
          var tark = alue.querySelector(".sj-tarkista");
          tark.addEventListener("click", function () {
            if (tark.disabled) return;
            tila.tarkistettu = true; kutsuTallenna(); piirra();
            var pp = alue.querySelector(".sj-pisteet"); if (pp && pp.scrollIntoView) pp.scrollIntoView({ block: "center" });
          });
          var jatka = alue.querySelector(".sj-jatka");
          if (jatka) jatka.addEventListener("click", function () {
            tila.vaihe = "perustelu"; kutsuTallenna(); window.kutsuPiirra();
            var ylos = document.getElementById("passages"); if (ylos && ylos.scrollIntoView) ylos.scrollIntoView();
          });
        }
        piirra();
      };

      var piirraPerustelutS = function (alue, tila) {
        var kys = TH.kysymykset || [];
        alue.innerHTML =
          '<p class="kohtaus-nro">' + suojaa(TH.osa2 || "Osa 2/2 · Perustelut") + '</p>' +
          '<div class="kutsu-kortti"><p class="kutsu-tilanne">' + suojaa(TH.perusteluOtsikko || "Perustelut") + '</p><p class="kutsu-teksti">' + suojaa(TH.perusteluOhje || "Vastaa kysymyksiin.") + '</p></div>' +
          '<p class="sj-pisteet">Sijoitusten pisteet: <strong>' + pisteet(tila) + '/' + maxP + '</strong></p>' +
          kys.map(function (k, j) {
            return '<div class="bj-perustelu"><label class="kutsu-miksi-label" for="sj-p' + j + '">' + (j + 1) + '. ' + suojaa(k.kysymys) + '</label>' +
              '<textarea id="sj-p' + j + '" maxlength="400" placeholder="' + suojaa(k.placeholder || "Kirjoita tähän…") + '">' + suojaa((tila.perustelut || [])[j] || "") + '</textarea>' +
              '<p class="kutsu-ammattilainen">' + suojaa(TH.ammattilainenTeksti) + ': <strong>' + suojaa(k.ammattilainen) + '</strong></p></div>';
          }).join("") +
          '<p class="kutsu-vihje" id="kutsu-vihje" aria-live="polite"></p>' +
          '<div class="kutsu-napit bj-napit"><button type="button" class="kutsu-seuraava sj-takaisin">' + suojaa(TH.takaisinNappi || "Muuta sijoituksia") + '</button>' +
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
        alue.querySelector(".sj-takaisin").addEventListener("click", function () { tila.vaihe = "sijoitus"; kutsuTallenna(); window.kutsuPiirra(); });
        nappi.addEventListener("click", function () { if (nappi.disabled) return; tila.valmis = true; kutsuTallenna(); play("Kutsu: tulos"); });
        p();
      };

      setup.kutsuYhteenveto = function () {
        var tila = kutsuTila(), s = sij(tila), p = pisteet(tila);
        var h = '<div class="tuotekortti sj-raportti"><p class="tk-yla">' + suojaa(TH.korttiYla || "RAPORTTI") + '</p>' +
          '<p class="tk-tuotenimi">' + p + '/' + maxP + ' pistettä</p>' +
          '<p class="tk-lause">' + suojaa(p >= maxP - 2 ? TH.palaute[0] : p >= maxP / 2 ? TH.palaute[1] : TH.palaute[2]) + '</p>' +
          '<table class="bj-taulu"><thead><tr><th>Matkustaja</th><th>Sijoitus</th><th></th></tr></thead><tbody>' + KORTIT.map(function (hh) {
            var a = s[hh.nimi], t = a ? hh.sopivuus[a] : [0, "-"], v = vt(a) || {};
            return '<tr><td>' + suojaa((hh.ikoni ? hh.ikoni + " " : "") + hh.nimi) + '</td><td>' + suojaa((v.ikoni || "") + " " + (v.nimi || "-")) + '</td><td class="' + tasoLuokka[t[0]] + '">' + tasoMerkki[t[0]] + '</td></tr>' +
              '<tr class="sj-selitysrivi"><td colspan="3">' + suojaa(t[1]) + '</td></tr>';
          }).join("") + '</tbody></table></div>';
        h += '<h3 class="kehitys-perustelut-otsikko">Perustelusi</h3><ol class="kutsu-lista">' + (TH.kysymykset || []).map(function (k, j) {
          return '<li><strong>' + suojaa(k.kysymys) + '</strong><span class="kl-perustelu">' + suojaa((tila.perustelut || [])[j] || "") + '</span>' +
            '<span class="kl-ammattilainen">' + suojaa(TH.ammattilainenTeksti) + ': ' + suojaa(k.ammattilainen) + ' – ' + suojaa(k.tutkinto) + '</span></li>';
        }).join("") + '</ol>';
        if (TH.ammattilaiset) h += '<h3 class="kehitys-perustelut-otsikko">' + suojaa(TH.ammattilaisetOtsikko || "Näitä töitä tekevät") + '</h3><ol class="kutsu-lista">' + TH.ammattilaiset.map(function (x) {
          return '<li><strong>' + suojaa(x.nimi) + '</strong> – ' + suojaa(x.tehtava) + '<span class="kl-ammattilainen">Koulutus: ' + suojaa(x.tutkinto) + '</span></li>';
        }).join("") + '</ol>';
        return h;
      };

      tehtavaTeksti = function (tila) {
        var s = sij(tila);
        var t = "\n" + TH.nimi.toUpperCase() + " – " + pisteet(tila) + "/" + maxP + " pistettä\n\nSIJOITUKSET\n";
        KORTIT.forEach(function (hh, j) {
          var a = s[hh.nimi], tt = a ? hh.sopivuus[a] : [0, "-"], v = vt(a) || {};
          t += (j + 1) + ". " + hh.nimi + " → " + (v.nimi || "-") + " (" + tasoMerkki[tt[0]] + ")\n   " + tt[1] + "\n";
        });
        t += "\nPERUSTELUT\n";
        (TH.kysymykset || []).forEach(function (k, j) { t += (j + 1) + ". " + k.kysymys + "\n   " + ((tila.perustelut || [])[j] || "-") + "\n   " + TH.ammattilainenTeksti + ": " + k.ammattilainen + "\n\n"; });
        return t;
      };
    }

    /* --- Tehtävätyyppi "viikko": oppilas valmentajana suunnittelee nuoren viikko-ohjelman ---
       KORTIT = henkilöt (urheilija, tanssija, sirkusartisti). Jokaisella on kiinteät menot
       (koulu, ottelu/esitys) ja omat säännöt. Oppilas sijoittaa harjoitukset viikkoon,
       mittari näyttää kuormituksen, ja säännöt tarkistetaan. Lopuksi kaksi perustelua. */
    if (TH.tyyppi === "viikko") {
      var PV = TH.paivat || ["Ma", "Ti", "Ke", "To", "Pe", "La", "Su"];
      var PVN = TH.paivaNimet || ["Maanantai", "Tiistai", "Keskiviikko", "Torstai", "Perjantai", "Lauantai", "Sunnuntai"];
      var JK = TH.jaksot || ["Aamu", "Ilta"];
      var HR = TH.harjoitteet || [];
      var hr = function (a) { return HR.filter(function (x) { return x.avain === a; })[0]; };
      var henk = function (tila) { return typeof tila.henkilo === "number" ? KORTIT[tila.henkilo] : null; };
      var ohj = function (tila) { if (!tila.ohjelma) tila.ohjelma = {}; return tila.ohjelma; };
      var solu = function (d, j) { return PV[d] + "-" + JK[j]; };
      var kiintea = function (h, d, j) { return (h.kiinteat || {})[solu(d, j)] || null; };
      var harjNimi = function (h, x) { return x.avain === "laji" && h.lajiNimi ? h.lajiNimi : x.nimi; };
      var harjIkoni = function (h, x) { return x.avain === "laji" && h.ikoni ? h.ikoni : x.ikoni; };
      var etunimi = function (h) { return String(h.nimi).split(",")[0]; };
      /* Viikon luvut */
      var laskeV = function (tila) {
        var h = henk(tila), o = ohj(tila), paiva = [], maara = {}, yht = 0;
        HR.forEach(function (x) { maara[x.avain] = 0; });
        PV.forEach(function (_, d) {
          var k = 0;
          JK.forEach(function (_, j) {
            var f = kiintea(h, d, j);
            if (f) { k += f.kuorma || 0; return; }
            var x = hr(o[solu(d, j)]);
            if (x) { k += x.kuorma || 0; maara[x.avain]++; }
          });
          paiva.push(k); yht += k;
        });
        var putki = 0, nyt = 0;
        paiva.forEach(function (k) { nyt = k >= 2 ? nyt + 1 : 0; if (nyt > putki) putki = nyt; });
        var kevyet = paiva.filter(function (k) { return k <= 1; }).length;
        return { paiva: paiva, maara: maara, yht: yht, putki: putki, kevyet: kevyet,
                 harj: Object.keys(maara).reduce(function (s, a) { return s + (a === "lepo" ? 0 : maara[a]); }, 0) };
      };
      var saantoOk = function (s, a) {
        if (s.tyyppi === "maara") { var n = a.maara[s.harj] || 0; return n >= (s.min || 0) && n <= (s.max == null ? 99 : s.max); }
        if (s.tyyppi === "kevyet") return a.kevyet >= s.min;
        if (s.tyyppi === "paiva") return a.paiva[s.paiva] <= s.max;
        if (s.tyyppi === "paivaMax") return a.paiva.every(function (k) { return k <= s.max; });
        if (s.tyyppi === "putki") return a.putki <= s.max;
        if (s.tyyppi === "kuorma") return a.yht >= s.min && a.yht <= s.max;
        return false;
      };
      var tulokset = function (tila) {
        var h = henk(tila); if (!h) return [];
        var a = laskeV(tila);
        return (h.saannot || []).map(function (s) { return { s: s, ok: saantoOk(s, a) }; });
      };
      var pisteetV = function (tila) { return tulokset(tila).filter(function (r) { return r.ok; }).length; };
      var palauteV = function (p, max) { return p >= max ? TH.palaute[0] : p >= max - 2 ? TH.palaute[1] : TH.palaute[2]; };
      var kuormaRaja = function (h) { return (h.saannot || []).filter(function (s) { return s.tyyppi === "kuorma"; })[0] || { min: 0, max: 20 }; };

      var viikkoTaulu = function (h, tila, muokattava) {
        var o = ohj(tila), a = laskeV(tila);
        return '<div class="vk-viikko" role="table" aria-label="Viikko-ohjelma">' +
          '<div class="vk-rivi vk-otsake" role="row"><span role="columnheader">Päivä</span>' + JK.map(function (j) { return '<span role="columnheader">' + suojaa(j) + '</span>'; }).join("") + '<span role="columnheader">Kuorma</span></div>' +
          PV.map(function (p, d) {
            return '<div class="vk-rivi" role="row"><span class="vk-pv" role="rowheader"><abbr title="' + suojaa(PVN[d]) + '">' + suojaa(p) + '</abbr></span>' + JK.map(function (_, j) {
              var f = kiintea(h, d, j), x = hr(o[solu(d, j)]);
              if (f) return '<span class="vk-solu vk-kiintea' + (f.kuorma ? " vk-tapahtuma" : "") + '" role="cell"><span aria-hidden="true">' + suojaa(f.ikoni || "") + '</span> ' + suojaa(f.nimi) + '</span>';
              var sis = x ? '<span aria-hidden="true">' + suojaa(harjIkoni(h, x)) + '</span> ' + suojaa(harjNimi(h, x)) : '<span class="vk-tyhja">+ lisää</span>';
              if (!muokattava) return '<span class="vk-solu' + (x ? " vk-" + x.avain : "") + '" role="cell">' + (x ? sis : '–') + '</span>';
              return '<span role="cell"><button type="button" class="vk-solu vk-nappi' + (x ? " vk-" + x.avain : "") + '" data-solu="' + suojaa(solu(d, j)) + '" aria-label="' + suojaa(PVN[d] + " " + JK[j].toLowerCase() + ": " + (x ? harjNimi(h, x) : "tyhjä")) + '">' + sis + '</button></span>';
            }).join("") + '<span class="vk-kuorma k' + Math.min(a.paiva[d], 5) + '" role="cell" title="Päivän kuormitus">' + a.paiva[d] + '</span></div>';
          }).join("") + '</div>';
      };
      var mittari = function (h, a) {
        var r = kuormaRaja(h), M = r.max + 6, pros = Math.min(100, Math.round(a.yht / M * 100));
        var tila = a.yht < r.min ? ["kevyt", TH.mittariKevyt || "Liian kevyt"] : a.yht > r.max ? ["raskas", TH.mittariRaskas || "Liian raskas"] : ["sopiva", TH.mittariSopiva || "Sopiva"];
        return '<div class="vk-mittari"><div class="vk-mittari-yla"><span>' + suojaa(TH.mittariOtsikko || "Viikon kuormitus") + '</span><strong class="' + tila[0] + '">' + a.yht + ' · ' + suojaa(tila[1]) + '</strong></div>' +
          '<div class="vk-palkki" aria-hidden="true"><span class="vk-alue" style="left:' + (r.min / M * 100) + '%;width:' + ((r.max - r.min) / M * 100) + '%"></span><span class="vk-taso ' + tila[0] + '" style="width:' + pros + '%"></span></div></div>';
      };
      var saantoLista = function (tila, selitykset) {
        return '<ul class="vk-saannot">' + tulokset(tila).map(function (r) {
          return '<li class="' + (r.ok ? "ok" : "ei") + '"><span class="vk-merkki" aria-hidden="true">' + (r.ok ? "✓" : (selitykset ? "✗" : "○")) + '</span><span><strong>' + suojaa(r.s.nimi) + '</strong>' +
            '<span class="sr-only">' + (r.ok ? " – kunnossa" : " – ei vielä") + '</span>' +
            (selitykset ? '<span class="vk-selitys">' + suojaa(r.s.selitys) + (r.s.ammattilainen ? ' <em>(' + suojaa(r.s.ammattilainen) + ')</em>' : '') + '</span>' : '') + '</span></li>';
        }).join("") + '</ul>';
      };

      window.kutsuPiirra = function () {
        var alue = document.getElementById("kutsu-alue");
        if (!alue) return;
        var tila = kutsuTila();
        if (tila.valmis) { play("Kutsu: tulos"); return; }
        if (tila.vaihe === "perustelu" && henk(tila)) return piirraPerustelutV(alue, tila);
        if (!henk(tila)) return piirraValintaV(alue, tila);
        var h = henk(tila), o = ohj(tila);
        var valittu = tila.sivellin || (HR[0] && HR[0].avain);
        function piirra(fokus) {
          var a = laskeV(tila), max = (h.saannot || []).length, p = pisteetV(tila);
          alue.innerHTML =
            '<p class="kohtaus-nro">' + suojaa(TH.osa1 || "Osa 1/2 · Viikko-ohjelma") + '</p>' +
            '<div class="kutsu-kortti vk-henkilo"><span class="vk-iso-ikoni" aria-hidden="true">' + suojaa(h.ikoni || "") + '</span><div><p class="kutsu-tilanne">' + suojaa(h.nimi + " · " + h.laji) + '</p>' +
            '<p class="kutsu-teksti">' + suojaa(h.kuvaus) + '</p><p class="vk-ohje">' + suojaa(TH.ohje) + '</p></div></div>' +
            '<div class="vk-tyokalut" role="radiogroup" aria-label="Valitse harjoitus, jonka lisäät viikkoon">' + HR.map(function (x) {
              var on = x.avain === valittu;
              return '<button type="button" class="vk-tyokalu vk-' + x.avain + (on ? " valittu" : "") + '" role="radio" aria-checked="' + on + '" data-a="' + suojaa(x.avain) + '">' +
                '<span class="vk-t-ikoni" aria-hidden="true">' + suojaa(harjIkoni(h, x)) + '</span><span class="vk-t-nimi">' + suojaa(harjNimi(h, x)) + '</span><span class="vk-t-kuorma">' + (x.kuorma ? "kuorma " + x.kuorma : "palautuminen") + '</span></button>';
            }).join("") + '</div>' +
            '<p class="vk-vinkki">' + suojaa(TH.vinkki || "Valitse harjoitus ja napauta viikosta kohtaa, johon lisäät sen. Napauta uudelleen, niin kohta tyhjenee.") + '</p>' +
            '<div class="vk-asettelu"><div class="vk-vasen">' + viikkoTaulu(h, tila, true) + '</div>' +
            '<div class="vk-oikea" aria-live="polite">' + mittari(h, a) +
            '<p class="vk-luvut"><span>Harjoituksia <strong>' + a.harj + '</strong></span><span>Kevyitä päiviä <strong>' + a.kevyet + '</strong></span></p>' +
            '<p class="vk-saannot-otsikko">' + suojaa(TH.saannotOtsikko || "Valmentajan muistilista") + '</p>' + saantoLista(tila, tila.tarkistettu) +
            (tila.tarkistettu ? '<p class="sj-pisteet">Pisteet: <strong>' + p + '/' + max + '</strong> – ' + suojaa(palauteV(p, max)) + '</p>' : '') + '</div></div>' +
            '<p class="kutsu-vihje" aria-live="polite">' + (a.harj < 3 ? "Lisää viikkoon vielä harjoituksia." : tila.tarkistettu ? "Voit vielä muuttaa ohjelmaa ja tarkistaa uudelleen, tai jatkaa." : "Kun ohjelma on mielestäsi valmis, tarkista se.") + '</p>' +
            '<div class="kutsu-napit bj-napit"><button type="button" class="kutsu-seuraava vk-vaihda">' + suojaa(TH.vaihdaNappi || "Vaihda henkilöä") + '</button>' +
            '<button type="button" class="kutsu-tarkista vk-tarkista"' + (a.harj >= 3 ? "" : " disabled") + '>' + suojaa(TH.tarkistaNappi || "Tarkista ohjelma") + '</button>' +
            (tila.tarkistettu ? '<button type="button" class="kutsu-seuraava vk-jatka">' + suojaa(TH.jatkaNappi || "Jatka perusteluihin") + '</button>' : '') + '</div>';
          Array.prototype.forEach.call(alue.querySelectorAll(".vk-tyokalu"), function (b) {
            b.addEventListener("click", function () { valittu = tila.sivellin = b.getAttribute("data-a"); kutsuTallenna(); piirra(".vk-tyokalu[data-a=\"" + valittu + "\"]"); });
            b.addEventListener("keydown", function (e) {
              var kaikki = Array.prototype.slice.call(alue.querySelectorAll(".vk-tyokalu")), i = kaikki.indexOf(b), n = null;
              if (e.key === "ArrowRight" || e.key === "ArrowDown") n = kaikki[(i + 1) % kaikki.length];
              if (e.key === "ArrowLeft" || e.key === "ArrowUp") n = kaikki[(i - 1 + kaikki.length) % kaikki.length];
              if (n) { e.preventDefault(); n.click(); }
            });
          });
          Array.prototype.forEach.call(alue.querySelectorAll(".vk-nappi"), function (b) {
            b.addEventListener("click", function () {
              var sl = b.getAttribute("data-solu");
              if (o[sl] === valittu) delete o[sl]; else o[sl] = valittu;
              tila.tarkistettu = false; kutsuTallenna(); piirra('.vk-nappi[data-solu="' + sl + '"]');
            });
          });
          var tark = alue.querySelector(".vk-tarkista");
          tark.addEventListener("click", function () {
            if (tark.disabled) return;
            tila.tarkistettu = true; kutsuTallenna(); piirra(".vk-tarkista");
            var pp = alue.querySelector(".vk-saannot"); if (pp && pp.scrollIntoView) pp.scrollIntoView({ block: "center" });
          });
          alue.querySelector(".vk-vaihda").addEventListener("click", function () {
            delete tila.henkilo; tila.ohjelma = {}; tila.tarkistettu = false; kutsuTallenna(); window.kutsuPiirra();
            var ylos = document.getElementById("passages"); if (ylos && ylos.scrollIntoView) ylos.scrollIntoView();
          });
          var jatka = alue.querySelector(".vk-jatka");
          if (jatka) jatka.addEventListener("click", function () {
            tila.vaihe = "perustelu"; kutsuTallenna(); window.kutsuPiirra();
            var ylos = document.getElementById("passages"); if (ylos && ylos.scrollIntoView) ylos.scrollIntoView();
          });
          if (fokus) { var f = alue.querySelector(fokus); if (f) f.focus({ preventScroll: true }); }
        }
        piirra();
      };

      var piirraValintaV = function (alue, tila) {
        alue.innerHTML =
          '<p class="kohtaus-nro">' + suojaa(TH.osa0 || "Valitse henkilö") + '</p>' +
          '<div class="kutsu-kortti"><p class="kutsu-tilanne">' + suojaa(TH.valintaOtsikko || "Kenen valmentaja olet?") + '</p><p class="kutsu-teksti">' + suojaa(TH.valintaOhje || "Valitse yksi nuori. Suunnittelet hänelle viikon harjoitukset.") + '</p></div>' +
          '<div class="vk-henkilot">' + KORTIT.map(function (h, i) {
            return '<button type="button" class="vk-henkilokortti" data-i="' + i + '"><span class="vk-iso-ikoni" aria-hidden="true">' + suojaa(h.ikoni || "") + '</span>' +
              '<span class="vk-hk-nimi">' + suojaa(h.nimi) + '</span><span class="vk-hk-laji">' + suojaa(h.laji) + '</span>' +
              '<span class="vk-hk-kuvaus">' + suojaa(h.kuvaus) + '</span><span class="vk-hk-valitse">Valitse ' + suojaa(etunimi(h)) + ' →</span></button>';
          }).join("") + '</div>';
        Array.prototype.forEach.call(alue.querySelectorAll(".vk-henkilokortti"), function (b) {
          b.addEventListener("click", function () {
            tila.henkilo = +b.getAttribute("data-i"); tila.ohjelma = {}; tila.tarkistettu = false; tila.vaihe = "ohjelma"; kutsuTallenna(); window.kutsuPiirra();
            var ylos = document.getElementById("passages"); if (ylos && ylos.scrollIntoView) ylos.scrollIntoView();
          });
        });
      };

      var kysymysV = function (k, h) { return k.kysymys.replace(/\{nimi\}/g, h ? etunimi(h) : "hän"); };
      var piirraPerustelutV = function (alue, tila) {
        var kys = TH.kysymykset || [], h = henk(tila), max = (h.saannot || []).length;
        alue.innerHTML =
          '<p class="kohtaus-nro">' + suojaa(TH.osa2 || "Osa 2/2 · Perustelut") + '</p>' +
          '<div class="kutsu-kortti"><p class="kutsu-tilanne">' + suojaa(TH.perusteluOtsikko || "Perustelut") + '</p><p class="kutsu-teksti">' + suojaa(TH.perusteluOhje || "Vastaa kysymyksiin.") + '</p></div>' +
          '<p class="sj-pisteet">Viikko-ohjelman pisteet: <strong>' + pisteetV(tila) + '/' + max + '</strong></p>' +
          kys.map(function (k, j) {
            return '<div class="bj-perustelu"><label class="kutsu-miksi-label" for="vk-p' + j + '">' + (j + 1) + '. ' + suojaa(kysymysV(k, h)) + '</label>' +
              '<textarea id="vk-p' + j + '" maxlength="400" placeholder="' + suojaa(k.placeholder || "Kirjoita tähän…") + '">' + suojaa((tila.perustelut || [])[j] || "") + '</textarea>' +
              '<p class="kutsu-ammattilainen">' + suojaa(TH.ammattilainenTeksti) + ': <strong>' + suojaa(k.ammattilainen) + '</strong></p></div>';
          }).join("") +
          '<p class="kutsu-vihje" id="kutsu-vihje" aria-live="polite"></p>' +
          '<div class="kutsu-napit bj-napit"><button type="button" class="kutsu-seuraava vk-takaisin">' + suojaa(TH.takaisinNappi || "Muuta ohjelmaa") + '</button>' +
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
        alue.querySelector(".vk-takaisin").addEventListener("click", function () { tila.vaihe = "ohjelma"; kutsuTallenna(); window.kutsuPiirra(); });
        nappi.addEventListener("click", function () { if (nappi.disabled) return; tila.valmis = true; kutsuTallenna(); play("Kutsu: tulos"); });
        p();
      };

      setup.kutsuYhteenveto = function () {
        var tila = kutsuTila(), h = henk(tila);
        if (!h) return "<p>Et vielä tehnyt viikko-ohjelmaa.</p>";
        var p = pisteetV(tila), max = (h.saannot || []).length, a = laskeV(tila);
        var hh = '<div class="tuotekortti vk-raportti"><p class="tk-yla">' + suojaa(TH.korttiYla || "VIIKKO-OHJELMA") + '</p>' +
          '<p class="tk-tuotenimi">' + suojaa((h.ikoni ? h.ikoni + " " : "") + h.nimi + " · " + h.laji) + '</p>' +
          '<p class="tk-lause">' + p + '/' + max + ' pistettä – ' + suojaa(palauteV(p, max)) + '</p>' +
          viikkoTaulu(h, tila, false) +
          '<p class="vk-yht">Viikon kuormitus: <strong>' + a.yht + '</strong> (sopiva ' + kuormaRaja(h).min + '–' + kuormaRaja(h).max + ')</p>' +
          saantoLista(tila, true) + '</div>';
        hh += '<h3 class="kehitys-perustelut-otsikko">Perustelusi</h3><ol class="kutsu-lista">' + (TH.kysymykset || []).map(function (k, j) {
          return '<li><strong>' + suojaa(kysymysV(k, h)) + '</strong><span class="kl-perustelu">' + suojaa((tila.perustelut || [])[j] || "") + '</span>' +
            '<span class="kl-ammattilainen">' + suojaa(TH.ammattilainenTeksti) + ': ' + suojaa(k.ammattilainen) + ' – ' + suojaa(k.tutkinto) + '</span></li>';
        }).join("") + '</ol>';
        if (TH.ammattilaiset) hh += '<h3 class="kehitys-perustelut-otsikko">' + suojaa(TH.ammattilaisetOtsikko || "Näitä töitä tekevät") + '</h3><ol class="kutsu-lista">' + TH.ammattilaiset.map(function (x) {
          return '<li><strong>' + suojaa(x.nimi) + '</strong> – ' + suojaa(x.tehtava) + '<span class="kl-ammattilainen">Koulutus: ' + suojaa(x.tutkinto) + '</span></li>';
        }).join("") + '</ol>';
        return hh;
      };

      tehtavaTeksti = function (tila) {
        var h = henk(tila);
        if (!h) return "\n" + TH.nimi.toUpperCase() + "\nTehtävä jäi kesken.\n";
        var o = ohj(tila), a = laskeV(tila), max = (h.saannot || []).length;
        var t = "\n" + TH.nimi.toUpperCase() + " – " + pisteetV(tila) + "/" + max + " pistettä\n";
        t += "Henkilö: " + h.nimi + ", " + h.laji + "\n\nVIIKKO\n";
        PV.forEach(function (_, d) {
          t += PVN[d] + ": " + JK.map(function (j, jj) {
            var f = kiintea(h, d, jj), x = hr(o[solu(d, jj)]);
            return j.toLowerCase() + " " + (f ? f.nimi : x ? harjNimi(h, x) : "-");
          }).join(", ") + " (kuorma " + a.paiva[d] + ")\n";
        });
        t += "Viikon kuormitus: " + a.yht + " (sopiva " + kuormaRaja(h).min + "–" + kuormaRaja(h).max + ")\n\nMUISTILISTA\n";
        tulokset(tila).forEach(function (r) { t += (r.ok ? "✓ " : "✗ ") + r.s.nimi + "\n"; });
        t += "\nPERUSTELUT\n";
        (TH.kysymykset || []).forEach(function (k, j) { t += (j + 1) + ". " + kysymysV(k, h) + "\n   " + ((tila.perustelut || [])[j] || "-") + "\n   " + TH.ammattilainenTeksti + ": " + k.ammattilainen + "\n\n"; });
        return t;
      };
    }

    /* --- Tehtävätyyppi "juliste": oppilas suunnittelee festarijulisteen ---
       Valinnat (kuva, värit, otsikkofontti, asettelu) ja tekstikentät päivittävät
       esikatselun heti. Tarkistuslista: mitä, milloin, missä, lisätieto, lyhyt otsikko
       ja tekstin kontrasti (WCAG). Juliste ladataan kuvana. Lopuksi kaksi perustelua. */
    if (TH.tyyppi === "juliste") {
      var JK_ = TH.kuvat || [], JV = TH.varit || [], JF = TH.fontit || [], JA = TH.asettelut || [];
      var hae = function (lista, a) { return lista.filter(function (x) { return x.avain === a; })[0] || lista[0]; };
      var jt = function (tila) {
        if (!tila.juliste) tila.juliste = { kuva: JK_[0] && JK_[0].avain, vari: JV[0] && JV[0].avain, fontti: JF[0] && JF[0].avain, asettelu: "ala", nimi: "", aika: "", paikka: "", lisa: "" };
        return tila.juliste;
      };
      var rgb = function (hex) { var h = hex.replace("#", ""); return [0, 2, 4].map(function (i) { return parseInt(h.substr(i, 2), 16); }); };
      var luminanssi = function (hex) {
        var c = rgb(hex).map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
        return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
      };
      var kontrasti = function (a, b) { var x = luminanssi(a), y = luminanssi(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
      var sanat = function (t) { return String(t || "").trim().split(/\s+/).filter(Boolean).length; };
      var saannotJ = function (j) {
        var v = hae(JV, j.vari), k = kontrasti(v.teksti, v.tausta);
        return [
          { nimi: "Mitä: tapahtuman nimi", ok: String(j.nimi).trim().length >= 3, selitys: "Nimi kertoo heti, mistä on kyse. Se on julisteen isoin teksti." },
          { nimi: "Milloin: päivämäärä", ok: /\d/.test(j.aika), selitys: "Ilman päivämäärää kukaan ei tiedä, milloin tulla paikalle." },
          { nimi: "Missä: paikka", ok: String(j.paikka).trim().length >= 3, selitys: "Paikka auttaa lukijaa löytämään perille." },
          { nimi: "Lisätieto, esim. hinta tai ikäraja", ok: String(j.lisa).trim().length >= 3, selitys: "Esimerkiksi ”Vapaa pääsy” tai ”Kaikenikäisille” houkuttelee tulemaan." },
          { nimi: "Lyhyt otsikko (enintään 4 sanaa)", ok: sanat(j.nimi) >= 1 && sanat(j.nimi) <= 4, selitys: "Julistetta katsotaan ohi kulkiessa vain pari sekuntia. Lyhyt otsikko ehditään lukea." },
          { nimi: "Teksti erottuu taustasta", ok: k >= 4.5, selitys: "Tekstin ja taustan värien kontrastin pitää olla tarpeeksi suuri. Valitsemasi värien kontrasti on " + k.toFixed(1).replace(".", ",") + " (vähintään 4,5)." }
        ];
      };
      var pisteetJ = function (j) { return saannotJ(j).filter(function (r) { return r.ok; }).length; };
      var palauteJ = function (p, m) { return p >= m ? TH.palaute[0] : p >= m - 2 ? TH.palaute[1] : TH.palaute[2]; };
      var paikat = { yla: "flex-start", keski: "center", ala: "flex-end" };
      var liukuma = function (v, as) {
        var c = rgb(v.tausta).join(",");
        if (as === "yla") return "linear-gradient(to bottom, rgba(" + c + ",.92) 0%, rgba(" + c + ",.75) 38%, rgba(" + c + ",0) 72%)";
        if (as === "keski") return "linear-gradient(to bottom, rgba(" + c + ",0) 8%, rgba(" + c + ",.85) 35%, rgba(" + c + ",.85) 65%, rgba(" + c + ",0) 92%)";
        return "linear-gradient(to top, rgba(" + c + ",.92) 0%, rgba(" + c + ",.75) 38%, rgba(" + c + ",0) 72%)";
      };
      var julisteHTML = function (j) {
        var v = hae(JV, j.vari), f = hae(JF, j.fontti), kv = hae(JK_, j.kuva);
        return '<div class="jl-juliste" role="img" aria-label="Julisteesi esikatselu" style="background-image:url(\'' + suojaa(kv.src) + '\')">' +
          '<div class="jl-peite" style="background:' + liukuma(v, j.asettelu) + ';justify-content:' + paikat[j.asettelu || "ala"] + '">' +
          '<p class="jl-nimi" style="color:' + v.teksti + ';font-family:' + f.css + ';font-weight:' + (f.paino || 800) + ';font-style:' + (f.tyyli || "normal") + ';text-transform:' + (f.isot ? "uppercase" : "none") + '">' + (suojaa(j.nimi) || '<span class="jl-tyhja">Tapahtuman nimi</span>') + '</p>' +
          '<p class="jl-aika" style="color:' + v.teksti + '">' + (suojaa(j.aika) || '<span class="jl-tyhja">Päivämäärä</span>') + '</p>' +
          '<p class="jl-paikka" style="color:' + v.teksti + '">' + (suojaa(j.paikka) || '<span class="jl-tyhja">Paikka</span>') + '</p>' +
          (j.lisa ? '<p class="jl-lisa" style="background:' + v.korostus + ';color:' + v.tausta + '">' + suojaa(j.lisa) + '</p>' : '') +
          '</div></div>';
      };
      var listaJ = function (j, selitykset) {
        return '<ul class="vk-saannot jl-saannot">' + saannotJ(j).map(function (r) {
          return '<li class="' + (r.ok ? "ok" : "ei") + '"><span class="vk-merkki" aria-hidden="true">' + (r.ok ? "✓" : (selitykset ? "✗" : "○")) + '</span><span><strong>' + suojaa(r.nimi) + '</strong>' +
            '<span class="sr-only">' + (r.ok ? " – kunnossa" : " – ei vielä") + '</span>' + (selitykset ? '<span class="vk-selitys">' + suojaa(r.selitys) + '</span>' : '') + '</span></li>';
        }).join("") + '</ul>';
      };
      var valintaRyhma = function (otsikko, lista, avain, valittu, sisalto) {
        return '<fieldset class="jl-ryhma"><legend>' + suojaa(otsikko) + '</legend><div class="jl-napit" role="radiogroup" aria-label="' + suojaa(otsikko) + '">' + lista.map(function (x) {
          var on = x.avain === valittu;
          return '<button type="button" class="jl-nappi" role="radio" aria-checked="' + on + '" data-k="' + avain + '" data-a="' + suojaa(x.avain) + '">' + sisalto(x) + '</button>';
        }).join("") + '</div></fieldset>';
      };

      window.lataaJuliste = function () {
        var j = jt(kutsuTila()), v = hae(JV, j.vari), f = hae(JF, j.fontti), kv = hae(JK_, j.kuva);
        var W = 900, H = 1200, c = document.createElement("canvas"); c.width = W; c.height = H;
        var g = c.getContext("2d"), img = new Image();
        img.onload = function () {
          var s = Math.max(W / img.width, H / img.height), w = img.width * s, h = img.height * s;
          g.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
          var col = rgb(v.tausta).join(","), as = j.asettelu || "ala", gr;
          if (as === "yla") { gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, "rgba(" + col + ",.92)"); gr.addColorStop(0.38, "rgba(" + col + ",.75)"); gr.addColorStop(0.72, "rgba(" + col + ",0)"); }
          else if (as === "keski") { gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0.08, "rgba(" + col + ",0)"); gr.addColorStop(0.35, "rgba(" + col + ",.85)"); gr.addColorStop(0.65, "rgba(" + col + ",.85)"); gr.addColorStop(0.92, "rgba(" + col + ",0)"); }
          else { gr = g.createLinearGradient(0, H, 0, 0); gr.addColorStop(0, "rgba(" + col + ",.92)"); gr.addColorStop(0.38, "rgba(" + col + ",.75)"); gr.addColorStop(0.72, "rgba(" + col + ",0)"); }
          g.fillStyle = gr; g.fillRect(0, 0, W, H);
          g.textAlign = "center"; g.fillStyle = v.teksti;
          var nimi = f.isot ? String(j.nimi).toUpperCase() : String(j.nimi);
          g.font = (f.tyyli === "italic" ? "italic " : "") + (f.paino || 800) + " 96px " + f.css;
          var rivit = rivita(g, nimi, W - 120);
          var korkeus = rivit.length * 104 + 60 + 52 + (j.lisa ? 100 : 0);
          var y = as === "yla" ? 140 : as === "keski" ? (H - korkeus) / 2 + 80 : H - korkeus - 20;
          rivit.forEach(function (r) { g.fillText(r, W / 2, y); y += 104; });
          g.font = "700 48px 'Segoe UI', Arial, sans-serif"; g.fillText(j.aika, W / 2, y); y += 60;
          g.font = "500 40px 'Segoe UI', Arial, sans-serif"; g.fillText(j.paikka, W / 2, y); y += 52;
          if (j.lisa) {
            g.font = "800 38px 'Segoe UI', Arial, sans-serif";
            var lw = g.measureText(j.lisa).width + 60; g.fillStyle = v.korostus;
            g.fillRect((W - lw) / 2, y + 4, lw, 64); g.fillStyle = v.tausta; g.fillText(j.lisa, W / 2, y + 50);
          }
          /* Blob-osoite eikä data-osoite: Safari voi avata data-kuvan peli-ikkunaan latauksen sijaan,
             jolloin peli katoaa näkyvistä. Samalla tavalla ladataan myös vastaukset. */
          var tallenna = function (blob) {
            var a = document.createElement("a");
            a.href = URL.createObjectURL(blob); a.download = D.ala + "_juliste.png";
            document.body.appendChild(a); a.click(); document.body.removeChild(a);
            setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
          };
          if (c.toBlob) c.toBlob(tallenna, "image/png");
          else {
            var d = atob(c.toDataURL("image/png").split(",")[1]), u = new Uint8Array(d.length);
            for (var i = 0; i < d.length; i++) u[i] = d.charCodeAt(i);
            tallenna(new Blob([u], { type: "image/png" }));
          }
        };
        img.src = kv.src;
      };

      window.kutsuPiirra = function () {
        var alue = document.getElementById("kutsu-alue");
        if (!alue) return;
        var tila = kutsuTila();
        if (tila.valmis) { play("Kutsu: tulos"); return; }
        if (tila.vaihe === "perustelu") return piirraPerustelutJ(alue, tila);
        var j = jt(tila);
        alue.innerHTML =
          '<p class="kohtaus-nro">' + suojaa(TH.osa1 || "Osa 1/2 · Juliste") + '</p>' +
          '<div class="kutsu-kortti"><p class="kutsu-tilanne">' + suojaa(TH.tilanneOtsikko || "Tehtävä") + '</p><p class="kutsu-teksti">' + suojaa(TH.ohje) + '</p>' +
          (TH.faktat ? '<ul class="jl-faktat">' + TH.faktat.map(function (f) { return '<li><strong>' + suojaa(f[0]) + ':</strong> ' + suojaa(f[1]) + '</li>'; }).join("") + '</ul>' : '') + '</div>' +
          '<div class="jl-asettelu"><div class="jl-esikatselu" aria-live="polite"></div><div class="jl-ohjaimet">' +
          '<div class="jl-kentat">' +
          [["nimi", "Tapahtuman nimi", 40], ["aika", "Päivämäärä", 30], ["paikka", "Paikka", 40], ["lisa", "Lisätieto (esim. hinta)", 30]].map(function (x) {
            return '<label class="jl-kentta"><span>' + x[1] + '</span><input type="text" data-kentta="' + x[0] + '" maxlength="' + x[2] + '" autocomplete="off" value="' + suojaa(j[x[0]]) + '"></label>';
          }).join("") + '</div>' +
          valintaRyhma("Kuva", JK_, "kuva", j.kuva, function (x) { return '<img src="' + suojaa(x.src) + '" alt="" width="64" height="48"><span>' + suojaa(x.nimi) + '</span>'; }) +
          valintaRyhma("Värit", JV, "vari", j.vari, function (x) { return '<span class="jl-vari" style="background:' + x.tausta + ';color:' + x.teksti + '">Aa</span><span>' + suojaa(x.nimi) + '</span>'; }) +
          valintaRyhma("Otsikon fontti", JF, "fontti", j.fontti, function (x) { return '<span class="jl-fontti" style="font-family:' + x.css + ';font-weight:' + (x.paino || 800) + ';font-style:' + (x.tyyli || "normal") + '">Aa</span><span>' + suojaa(x.nimi) + '</span>'; }) +
          valintaRyhma("Tekstien paikka", JA, "asettelu", j.asettelu, function (x) { return '<span>' + suojaa(x.nimi) + '</span>'; }) +
          '<p class="vk-saannot-otsikko">' + suojaa(TH.saannotOtsikko || "Tarkistuslista") + '</p><div class="jl-lista"></div><div class="jl-pisteet"></div>' +
          '</div></div>' +
          '<p class="kutsu-vihje" aria-live="polite"></p>' +
          '<div class="kutsu-napit bj-napit"><button type="button" class="kutsu-seuraava jl-lataa">' + suojaa(TH.lataaNappi || "Lataa juliste kuvana") + '</button>' +
          '<button type="button" class="kutsu-tarkista jl-tarkista">' + suojaa(TH.tarkistaNappi || "Tarkista juliste") + '</button>' +
          '<button type="button" class="kutsu-seuraava jl-jatka" hidden>' + suojaa(TH.jatkaNappi || "Jatka perusteluihin") + '</button></div>';
        var esik = alue.querySelector(".jl-esikatselu"), lista = alue.querySelector(".jl-lista"), pist = alue.querySelector(".jl-pisteet");
        var tark = alue.querySelector(".jl-tarkista"), jatka = alue.querySelector(".jl-jatka"), vihje = alue.querySelector(".kutsu-vihje");
        function paivita() {
          esik.innerHTML = julisteHTML(j);
          lista.innerHTML = listaJ(j, tila.tarkistettu);
          var m = saannotJ(j).length, p = pisteetJ(j);
          pist.innerHTML = tila.tarkistettu ? '<p class="sj-pisteet">Pisteet: <strong>' + p + '/' + m + '</strong> – ' + suojaa(palauteJ(p, m)) + '</p>' : '';
          var valmiina = String(j.nimi).trim().length >= 1;
          tark.disabled = !valmiina; jatka.hidden = !tila.tarkistettu;
          vihje.textContent = !valmiina ? "Kirjoita ensin tapahtuman nimi." : tila.tarkistettu ? "Voit vielä muokata julistetta ja tarkistaa uudelleen, tai jatkaa." : "Kun juliste on mielestäsi valmis, tarkista se.";
        }
        Array.prototype.forEach.call(alue.querySelectorAll(".jl-kentta input"), function (inp) {
          inp.addEventListener("input", function () { j[inp.getAttribute("data-kentta")] = inp.value; tila.tarkistettu = false; kutsuTallenna(); paivita(); });
        });
        Array.prototype.forEach.call(alue.querySelectorAll(".jl-nappi"), function (b) {
          b.addEventListener("click", function () {
            var k = b.getAttribute("data-k"); j[k] = b.getAttribute("data-a"); tila.tarkistettu = false; kutsuTallenna();
            Array.prototype.forEach.call(alue.querySelectorAll('.jl-nappi[data-k="' + k + '"]'), function (x) { x.setAttribute("aria-checked", x === b ? "true" : "false"); });
            paivita();
          });
        });
        tark.addEventListener("click", function () { if (tark.disabled) return; tila.tarkistettu = true; kutsuTallenna(); paivita(); if (lista.scrollIntoView) lista.scrollIntoView({ block: "center" }); });
        jatka.addEventListener("click", function () {
          tila.vaihe = "perustelu"; kutsuTallenna(); window.kutsuPiirra();
          var ylos = document.getElementById("passages"); if (ylos && ylos.scrollIntoView) ylos.scrollIntoView();
        });
        alue.querySelector(".jl-lataa").addEventListener("click", window.lataaJuliste);
        paivita();
      };

      var piirraPerustelutJ = function (alue, tila) {
        var kys = TH.kysymykset || [], j = jt(tila), m = saannotJ(j).length;
        alue.innerHTML =
          '<p class="kohtaus-nro">' + suojaa(TH.osa2 || "Osa 2/2 · Perustelut") + '</p>' +
          '<div class="kutsu-kortti"><p class="kutsu-tilanne">' + suojaa(TH.perusteluOtsikko || "Perustelut") + '</p><p class="kutsu-teksti">' + suojaa(TH.perusteluOhje || "Vastaa kysymyksiin.") + '</p></div>' +
          '<div class="jl-pieni">' + julisteHTML(j) + '</div>' +
          '<p class="sj-pisteet">Julisteen pisteet: <strong>' + pisteetJ(j) + '/' + m + '</strong></p>' +
          kys.map(function (k, i) {
            return '<div class="bj-perustelu"><label class="kutsu-miksi-label" for="jl-p' + i + '">' + (i + 1) + '. ' + suojaa(k.kysymys) + '</label>' +
              '<textarea id="jl-p' + i + '" maxlength="400" placeholder="' + suojaa(k.placeholder || "Kirjoita tähän…") + '">' + suojaa((tila.perustelut || [])[i] || "") + '</textarea>' +
              '<p class="kutsu-ammattilainen">' + suojaa(TH.ammattilainenTeksti) + ': <strong>' + suojaa(k.ammattilainen) + '</strong></p></div>';
          }).join("") +
          '<p class="kutsu-vihje" id="kutsu-vihje" aria-live="polite"></p>' +
          '<div class="kutsu-napit bj-napit"><button type="button" class="kutsu-seuraava jl-takaisin">' + suojaa(TH.takaisinNappi || "Muokkaa julistetta") + '</button>' +
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
        alue.querySelector(".jl-takaisin").addEventListener("click", function () { tila.vaihe = "suunnittelu"; kutsuTallenna(); window.kutsuPiirra(); });
        nappi.addEventListener("click", function () { if (nappi.disabled) return; tila.valmis = true; kutsuTallenna(); play("Kutsu: tulos"); });
        p();
      };

      setup.kutsuYhteenveto = function () {
        var tila = kutsuTila(), j = jt(tila), p = pisteetJ(j), m = saannotJ(j).length;
        var v = hae(JV, j.vari), f = hae(JF, j.fontti), kv = hae(JK_, j.kuva);
        var h = '<div class="tuotekortti jl-raportti"><p class="tk-yla">' + suojaa(TH.korttiYla || "JULISTE") + '</p>' +
          '<p class="tk-lause">' + p + '/' + m + ' pistettä – ' + suojaa(palauteJ(p, m)) + '</p>' +
          '<div class="jl-raportti-sisalto"><div class="jl-pieni">' + julisteHTML(j) + '</div><div>' +
          '<dl class="tk-tiedot"><dt>Kuva</dt><dd>' + suojaa(kv.nimi) + '</dd><dt>Värit</dt><dd>' + suojaa(v.nimi) + '</dd><dt>Fontti</dt><dd>' + suojaa(f.nimi) + '</dd><dt>Tekstien paikka</dt><dd>' + suojaa(hae(JA, j.asettelu).nimi) + '</dd></dl>' +
          listaJ(j, true) + '</div></div>' +
          '<div class="kutsu-napit"><button type="button" class="kutsu-tarkista jl-lataa-tulos" onclick="lataaJuliste()">' + suojaa(TH.lataaNappi || "Lataa juliste kuvana") + '</button></div></div>';
        h += '<h3 class="kehitys-perustelut-otsikko">Perustelusi</h3><ol class="kutsu-lista">' + (TH.kysymykset || []).map(function (k, i) {
          return '<li><strong>' + suojaa(k.kysymys) + '</strong><span class="kl-perustelu">' + suojaa((tila.perustelut || [])[i] || "") + '</span>' +
            '<span class="kl-ammattilainen">' + suojaa(TH.ammattilainenTeksti) + ': ' + suojaa(k.ammattilainen) + ' – ' + suojaa(k.tutkinto) + '</span></li>';
        }).join("") + '</ol>';
        if (TH.ammattilaiset) h += '<h3 class="kehitys-perustelut-otsikko">' + suojaa(TH.ammattilaisetOtsikko || "Näitä töitä tekevät") + '</h3><ol class="kutsu-lista">' + TH.ammattilaiset.map(function (x) {
          return '<li><strong>' + suojaa(x.nimi) + '</strong> – ' + suojaa(x.tehtava) + '<span class="kl-ammattilainen">Koulutus: ' + suojaa(x.tutkinto) + '</span></li>';
        }).join("") + '</ol>';
        return h;
      };

      tehtavaTeksti = function (tila) {
        var j = jt(tila), m = saannotJ(j).length;
        var t = "\n" + TH.nimi.toUpperCase() + " – " + pisteetJ(j) + "/" + m + " pistettä\n\nJULISTE\n";
        t += "Nimi: " + (j.nimi || "-") + "\nPäivämäärä: " + (j.aika || "-") + "\nPaikka: " + (j.paikka || "-") + "\nLisätieto: " + (j.lisa || "-") + "\n";
        t += "Kuva: " + hae(JK_, j.kuva).nimi + "\nVärit: " + hae(JV, j.vari).nimi + "\nFontti: " + hae(JF, j.fontti).nimi + "\nTekstien paikka: " + hae(JA, j.asettelu).nimi + "\n\nTARKISTUSLISTA\n";
        saannotJ(j).forEach(function (r) { t += (r.ok ? "✓ " : "✗ ") + r.nimi + "\n"; });
        t += "\nPERUSTELUT\n";
        (TH.kysymykset || []).forEach(function (k, i) { t += (i + 1) + ". " + k.kysymys + "\n   " + ((tila.perustelut || [])[i] || "-") + "\n   " + TH.ammattilainenTeksti + ": " + k.ammattilainen + "\n\n"; });
        return t;
      };
    }

    /* --- Tehtävätyyppi "jarjestys": hoidon vaiheet oikeaan järjestykseen + kotihoito-ohjeet ---
       Oppilas valitsee hoidon, järjestää sen vaiheet nuolinapeilla ja tarkistaa. Sitten hän
       valitsee asiakkaalle kolme oikeaa kotihoito-ohjetta. Lopuksi kaksi perustelua. */
    if (TH.tyyppi === "jarjestys") {
      var HO = TH.hoidot || [];
      var hoito = function (tila) { return typeof tila.hoito === "number" ? HO[tila.hoito] : null; };
      var sekoita = function (n) {
        var a = [], i; for (i = 0; i < n; i++) a.push(i);
        var siemen = 7;
        for (i = n - 1; i > 0; i--) { siemen = (siemen * 9301 + 49297) % 233280; var j = Math.floor(siemen / 233280 * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
        if (a.every(function (x, k) { return x === k; })) a.reverse();
        return a;
      };
      var oikeinPaikalla = function (tila) { return (tila.jarjestys || []).filter(function (x, i) { return x === i; }).length; };
      var ohjePisteet = function (tila) {
        var h = hoito(tila); if (!h) return 0;
        var p = 0; (tila.ohjeet || []).forEach(function (i) { p += h.ohjeet[i].oikein ? 1 : -1; });
        return Math.max(0, p);
      };
      var maxJ = function (h) { return h.vaiheet.length + (h.ohjeet || []).filter(function (o) { return o.oikein; }).length; };
      var pisteetJ2 = function (tila) { return oikeinPaikalla(tila) + ohjePisteet(tila); };
      var palauteJ2 = function (p, m) { return p >= m ? TH.palaute[0] : p >= m - 3 ? TH.palaute[1] : TH.palaute[2]; };
      var ylos = function () { var y = document.getElementById("passages"); if (y && y.scrollIntoView) y.scrollIntoView(); };

      window.kutsuPiirra = function () {
        var alue = document.getElementById("kutsu-alue");
        if (!alue) return;
        var tila = kutsuTila();
        if (tila.valmis) { play("Kutsu: tulos"); return; }
        var h = hoito(tila);
        if (!h) return piirraValintaJ(alue, tila);
        if (tila.vaihe === "ohjeet") return piirraOhjeet(alue, tila, h);
        if (tila.vaihe === "perustelu") return piirraPerustelutJ2(alue, tila, h);
        if (!tila.jarjestys || tila.jarjestys.length !== h.vaiheet.length) tila.jarjestys = sekoita(h.vaiheet.length);
        function piirra(fokus) {
          var n = h.vaiheet.length, p = oikeinPaikalla(tila);
          alue.innerHTML =
            '<p class="kohtaus-nro">' + suojaa(TH.osa1 || "Osa 1/3 · Hoidon vaiheet") + '</p>' +
            '<div class="kutsu-kortti vk-henkilo"><span class="vk-iso-ikoni" aria-hidden="true">' + suojaa(h.ikoni || "") + '</span><div><p class="kutsu-tilanne">' + suojaa(h.nimi) + '</p>' +
            '<p class="kutsu-teksti">' + suojaa(h.asiakas) + '</p><p class="vk-ohje">' + suojaa(TH.ohje) + '</p></div></div>' +
            '<ol class="jr-lista">' + tila.jarjestys.map(function (v, i) {
              var ok = tila.tarkistettu && v === i, vaara = tila.tarkistettu && v !== i;
              return '<li class="jr-vaihe' + (ok ? " ok" : "") + (vaara ? " ei" : "") + '">' +
                '<span class="jr-nro" aria-hidden="true">' + (i + 1) + '</span>' +
                '<span class="jr-teksti"><strong>' + suojaa(h.vaiheet[v].nimi) + '</strong>' +
                (ok ? '<span class="jr-selitys">✓ ' + suojaa(h.vaiheet[v].selitys) + '</span>' : '') +
                (vaara ? '<span class="jr-selitys">✗ Ei vielä oikealla paikalla.</span>' : '') +
                '<span class="sr-only">, kohta ' + (i + 1) + '/' + n + (ok ? ", oikein" : vaara ? ", väärällä paikalla" : "") + '</span></span>' +
                '<span class="jr-napit"><button type="button" class="jr-nuoli" data-i="' + i + '" data-s="-1" aria-label="Siirrä ylös: ' + suojaa(h.vaiheet[v].nimi) + '"' + (i === 0 ? " disabled" : "") + '>▲</button>' +
                '<button type="button" class="jr-nuoli" data-i="' + i + '" data-s="1" aria-label="Siirrä alas: ' + suojaa(h.vaiheet[v].nimi) + '"' + (i === n - 1 ? " disabled" : "") + '>▼</button></span></li>';
            }).join("") + '</ol>' +
            (tila.tarkistettu ? '<p class="sj-pisteet">Oikealla paikalla: <strong>' + p + '/' + n + '</strong>' + (p === n ? " – Täydellinen järjestys!" : " – Siirrä punaisia vaiheita ja tarkista uudelleen.") + '</p>' : '') +
            '<p class="kutsu-vihje" aria-live="polite">' + (tila.tarkistettu ? "Voit vielä korjata järjestystä tai jatkaa kotihoito-ohjeisiin." : "Siirrä vaiheita nuolilla. Kun järjestys on mielestäsi oikein, tarkista se.") + '</p>' +
            '<div class="kutsu-napit bj-napit"><button type="button" class="kutsu-seuraava jr-vaihda">' + suojaa(TH.vaihdaNappi || "Vaihda hoitoa") + '</button>' +
            '<button type="button" class="kutsu-tarkista jr-tarkista">' + suojaa(TH.tarkistaNappi || "Tarkista järjestys") + '</button>' +
            (tila.tarkistettu ? '<button type="button" class="kutsu-seuraava jr-jatka">' + suojaa(TH.jatkaNappi || "Jatka kotihoito-ohjeisiin") + '</button>' : '') + '</div>';
          Array.prototype.forEach.call(alue.querySelectorAll(".jr-nuoli"), function (b) {
            b.addEventListener("click", function () {
              var i = +b.getAttribute("data-i"), s = +b.getAttribute("data-s"), j = i + s, a = tila.jarjestys;
              if (j < 0 || j >= a.length) return;
              var t = a[i]; a[i] = a[j]; a[j] = t; tila.tarkistettu = false; kutsuTallenna();
              piirra('.jr-nuoli[data-i="' + j + '"][data-s="' + s + '"]');
            });
          });
          alue.querySelector(".jr-tarkista").addEventListener("click", function () {
            tila.tarkistettu = true; kutsuTallenna(); piirra(".jr-tarkista");
            var l = alue.querySelector(".sj-pisteet"); if (l && l.scrollIntoView) l.scrollIntoView({ block: "center" });
          });
          alue.querySelector(".jr-vaihda").addEventListener("click", function () {
            delete tila.hoito; tila.jarjestys = null; tila.tarkistettu = false; tila.ohjeet = []; kutsuTallenna(); window.kutsuPiirra(); ylos();
          });
          var jatka = alue.querySelector(".jr-jatka");
          if (jatka) jatka.addEventListener("click", function () { tila.vaihe = "ohjeet"; kutsuTallenna(); window.kutsuPiirra(); ylos(); });
          if (fokus) { var f = alue.querySelector(fokus); if (f && !f.disabled) f.focus({ preventScroll: true }); }
        }
        piirra();
      };

      var piirraValintaJ = function (alue, tila) {
        alue.innerHTML =
          '<p class="kohtaus-nro">' + suojaa(TH.osa0 || "Valitse hoito") + '</p>' +
          '<div class="kutsu-kortti"><p class="kutsu-tilanne">' + suojaa(TH.valintaOtsikko || "Minkä hoidon teet?") + '</p><p class="kutsu-teksti">' + suojaa(TH.valintaOhje || "Valitse hoito.") + '</p></div>' +
          '<div class="vk-henkilot jr-hoidot">' + HO.map(function (x, i) {
            return '<button type="button" class="vk-henkilokortti" data-i="' + i + '"><span class="vk-iso-ikoni" aria-hidden="true">' + suojaa(x.ikoni || "") + '</span>' +
              '<span class="vk-hk-nimi">' + suojaa(x.nimi) + '</span><span class="vk-hk-laji">' + suojaa(x.ammatti) + '</span>' +
              '<span class="vk-hk-kuvaus">' + suojaa(x.asiakas) + '</span><span class="vk-hk-valitse">Valitse →</span></button>';
          }).join("") + '</div>';
        Array.prototype.forEach.call(alue.querySelectorAll(".vk-henkilokortti"), function (b) {
          b.addEventListener("click", function () {
            tila.hoito = +b.getAttribute("data-i"); tila.jarjestys = null; tila.tarkistettu = false; tila.ohjeet = []; tila.ohjeTarkistettu = false; tila.vaihe = "jarjestys";
            kutsuTallenna(); window.kutsuPiirra(); ylos();
          });
        });
      };

      var piirraOhjeet = function (alue, tila, h) {
        var valitut = tila.ohjeet || (tila.ohjeet = []), tarvitaan = h.ohjeet.filter(function (o) { return o.oikein; }).length;
        function piirra(fokus) {
          var t = tila.ohjeTarkistettu;
          alue.innerHTML =
            '<p class="kohtaus-nro">' + suojaa(TH.osa2 || "Osa 2/3 · Kotihoito-ohjeet") + '</p>' +
            '<div class="kutsu-kortti"><p class="kutsu-tilanne">' + suojaa(TH.ohjeetOtsikko || "Kotihoito-ohjeet") + '</p><p class="kutsu-teksti">' + suojaa((TH.ohjeetOhje || "Valitse asiakkaalle {n} hyvää kotihoito-ohjetta.").replace("{n}", tarvitaan)) + '</p></div>' +
            '<div class="jr-ohjeet" role="group" aria-label="Kotihoito-ohjeet">' + h.ohjeet.map(function (o, i) {
              var on = valitut.indexOf(i) !== -1, tulos = t && on ? (o.oikein ? " ok" : " ei") : (t && o.oikein ? " puuttui" : "");
              return '<button type="button" class="jr-ohje' + (on ? " valittu" : "") + tulos + '" aria-pressed="' + on + '" data-i="' + i + '">' +
                '<span class="jr-ruutu" aria-hidden="true">' + (on ? "✓" : "") + '</span><span class="jr-ohje-teksti">' + suojaa(o.teksti) +
                (t && (on || o.oikein) ? '<span class="jr-selitys">' + (o.oikein ? (on ? "✓ " : "Tämä olisi ollut hyvä ohje: ") : "✗ ") + suojaa(o.selitys) + '</span>' : '') + '</span></button>';
            }).join("") + '</div>' +
            (t ? '<p class="sj-pisteet">Ohjeiden pisteet: <strong>' + ohjePisteet(tila) + '/' + tarvitaan + '</strong></p>' : '') +
            '<p class="kutsu-vihje" aria-live="polite">' + (valitut.length !== tarvitaan ? "Valitse " + tarvitaan + " ohjetta. Valittuna " + valitut.length + "." : t ? "Voit vielä muuttaa valintoja tai jatkaa." : "Hyvä! Tarkista valintasi.") + '</p>' +
            '<div class="kutsu-napit bj-napit"><button type="button" class="kutsu-seuraava jr-takaisin">' + suojaa(TH.takaisinNappi || "Takaisin järjestykseen") + '</button>' +
            '<button type="button" class="kutsu-tarkista jr-tarkista-o"' + (valitut.length === tarvitaan ? "" : " disabled") + '>' + suojaa(TH.ohjeTarkistaNappi || "Tarkista ohjeet") + '</button>' +
            (t ? '<button type="button" class="kutsu-seuraava jr-jatka-o">' + suojaa(TH.jatka2Nappi || "Jatka perusteluihin") + '</button>' : '') + '</div>';
          Array.prototype.forEach.call(alue.querySelectorAll(".jr-ohje"), function (b) {
            b.addEventListener("click", function () {
              var i = +b.getAttribute("data-i"), k = valitut.indexOf(i);
              if (k !== -1) valitut.splice(k, 1); else if (valitut.length < tarvitaan) valitut.push(i); else return;
              tila.ohjeTarkistettu = false; kutsuTallenna(); piirra('.jr-ohje[data-i="' + i + '"]');
            });
          });
          var to = alue.querySelector(".jr-tarkista-o");
          to.addEventListener("click", function () { if (to.disabled) return; tila.ohjeTarkistettu = true; kutsuTallenna(); piirra(".jr-tarkista-o"); });
          alue.querySelector(".jr-takaisin").addEventListener("click", function () { tila.vaihe = "jarjestys"; kutsuTallenna(); window.kutsuPiirra(); ylos(); });
          var j = alue.querySelector(".jr-jatka-o");
          if (j) j.addEventListener("click", function () { tila.vaihe = "perustelu"; kutsuTallenna(); window.kutsuPiirra(); ylos(); });
          if (fokus) { var f = alue.querySelector(fokus); if (f && !f.disabled) f.focus({ preventScroll: true }); }
        }
        piirra();
      };

      var piirraPerustelutJ2 = function (alue, tila, h) {
        var kys = TH.kysymykset || [];
        alue.innerHTML =
          '<p class="kohtaus-nro">' + suojaa(TH.osa3 || "Osa 3/3 · Perustelut") + '</p>' +
          '<div class="kutsu-kortti"><p class="kutsu-tilanne">' + suojaa(TH.perusteluOtsikko || "Perustelut") + '</p><p class="kutsu-teksti">' + suojaa(TH.perusteluOhje || "Vastaa kysymyksiin.") + '</p></div>' +
          '<p class="sj-pisteet">Pisteet tähän asti: <strong>' + pisteetJ2(tila) + '/' + maxJ(h) + '</strong></p>' +
          kys.map(function (k, i) {
            return '<div class="bj-perustelu"><label class="kutsu-miksi-label" for="jr-p' + i + '">' + (i + 1) + '. ' + suojaa(k.kysymys) + '</label>' +
              '<textarea id="jr-p' + i + '" maxlength="400" placeholder="' + suojaa(k.placeholder || "Kirjoita tähän…") + '">' + suojaa((tila.perustelut || [])[i] || "") + '</textarea>' +
              '<p class="kutsu-ammattilainen">' + suojaa(TH.ammattilainenTeksti) + ': <strong>' + suojaa(k.ammattilainen) + '</strong></p></div>';
          }).join("") +
          '<p class="kutsu-vihje" id="kutsu-vihje" aria-live="polite"></p>' +
          '<div class="kutsu-napit bj-napit"><button type="button" class="kutsu-seuraava jr-takaisin2">' + suojaa(TH.takaisin2Nappi || "Takaisin ohjeisiin") + '</button>' +
          '<button type="button" class="kutsu-tarkista" disabled>' + suojaa(TH.valmisNappi || "Katso tulos") + '</button></div>';
        var tekstit = Array.prototype.slice.call(alue.querySelectorAll(".bj-perustelu textarea"));
        var nappi = alue.querySelector(".kutsu-tarkista"), vihje = alue.querySelector("#kutsu-vihje");
        function p() {
          tila.perustelut = tekstit.map(function (t) { return t.value.trim(); }); kutsuTallenna();
          var puuttuu = tila.perustelut.filter(function (x) { return x.length < 10; }).length;
          nappi.disabled = puuttuu > 0;
          vihje.textContent = puuttuu ? "Vastaa vielä " + puuttuu + " kysymykseen (vähintään lyhyt lause)." : "Valmista! Paina " + (TH.valmisNappi || "Katso tulos") + ".";
        }
        tekstit.forEach(function (t) { t.addEventListener("input", p); });
        alue.querySelector(".jr-takaisin2").addEventListener("click", function () { tila.vaihe = "ohjeet"; kutsuTallenna(); window.kutsuPiirra(); });
        nappi.addEventListener("click", function () { if (nappi.disabled) return; tila.valmis = true; kutsuTallenna(); play("Kutsu: tulos"); });
        p();
      };

      setup.kutsuYhteenveto = function () {
        var tila = kutsuTila(), h = hoito(tila);
        if (!h) return "<p>Et vielä tehnyt tehtävää.</p>";
        var p = pisteetJ2(tila), m = maxJ(h);
        var x = '<div class="tuotekortti jr-raportti"><p class="tk-yla">' + suojaa(TH.korttiYla || "HOITOSUUNNITELMA") + '</p>' +
          '<p class="tk-tuotenimi">' + suojaa((h.ikoni ? h.ikoni + " " : "") + h.nimi) + '</p>' +
          '<p class="tk-lause">' + p + '/' + m + ' pistettä – ' + suojaa(palauteJ2(p, m)) + '</p>' +
          '<p class="jr-alaotsikko">Sinun järjestyksesi</p><ol class="jr-lista jr-pieni">' + (tila.jarjestys || []).map(function (v, i) {
            return '<li class="jr-vaihe ' + (v === i ? "ok" : "ei") + '"><span class="jr-nro" aria-hidden="true">' + (i + 1) + '</span><span class="jr-teksti"><strong>' + suojaa(h.vaiheet[v].nimi) + '</strong>' +
              (v !== i ? '<span class="jr-selitys">Oikea paikka: ' + (v + 1) + '.</span>' : '') + '</span></li>';
          }).join("") + '</ol>' +
          '<p class="jr-alaotsikko">Kotihoito-ohjeet</p><ul class="vk-saannot">' + (tila.ohjeet || []).map(function (i) {
            var o = h.ohjeet[i];
            return '<li class="' + (o.oikein ? "ok" : "ei") + '"><span class="vk-merkki" aria-hidden="true">' + (o.oikein ? "✓" : "✗") + '</span><span><strong>' + suojaa(o.teksti) + '</strong><span class="vk-selitys">' + suojaa(o.selitys) + '</span></span></li>';
          }).join("") + '</ul></div>';
        x += '<h3 class="kehitys-perustelut-otsikko">Perustelusi</h3><ol class="kutsu-lista">' + (TH.kysymykset || []).map(function (k, i) {
          return '<li><strong>' + suojaa(k.kysymys) + '</strong><span class="kl-perustelu">' + suojaa((tila.perustelut || [])[i] || "") + '</span>' +
            '<span class="kl-ammattilainen">' + suojaa(TH.ammattilainenTeksti) + ': ' + suojaa(k.ammattilainen) + ' – ' + suojaa(k.tutkinto) + '</span></li>';
        }).join("") + '</ol>';
        if (TH.ammattilaiset) x += '<h3 class="kehitys-perustelut-otsikko">' + suojaa(TH.ammattilaisetOtsikko || "Näitä töitä tekevät") + '</h3><ol class="kutsu-lista">' + TH.ammattilaiset.map(function (a) {
          return '<li><strong>' + suojaa(a.nimi) + '</strong> – ' + suojaa(a.tehtava) + '<span class="kl-ammattilainen">Koulutus: ' + suojaa(a.tutkinto) + '</span></li>';
        }).join("") + '</ol>';
        return x;
      };

      tehtavaTeksti = function (tila) {
        var h = hoito(tila);
        if (!h) return "\n" + TH.nimi.toUpperCase() + "\nTehtävä jäi kesken.\n";
        var t = "\n" + TH.nimi.toUpperCase() + " – " + pisteetJ2(tila) + "/" + maxJ(h) + " pistettä\nHoito: " + h.nimi + "\n\nJÄRJESTYKSESI\n";
        (tila.jarjestys || []).forEach(function (v, i) { t += (i + 1) + ". " + h.vaiheet[v].nimi + (v === i ? " ✓" : " ✗ (oikea paikka " + (v + 1) + ")") + "\n"; });
        t += "\nKOTIHOITO-OHJEET\n";
        (tila.ohjeet || []).forEach(function (i) { t += (h.ohjeet[i].oikein ? "✓ " : "✗ ") + h.ohjeet[i].teksti + "\n"; });
        t += "\nPERUSTELUT\n";
        (TH.kysymykset || []).forEach(function (k, i) { t += (i + 1) + ". " + k.kysymys + "\n   " + ((tila.perustelut || [])[i] || "-") + "\n   " + TH.ammattilainenTeksti + ": " + k.ammattilainen + "\n\n"; });
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
