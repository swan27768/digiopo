/* Asteroidivaellus – pelilogiikka. Kestää puuttuvat elementit. */
(function () {
  "use strict";
  var D = window.AV_DATA;
  var nayttama = document.getElementById("av-nayttama");
  var edistys = document.getElementById("av-edistys");
  if (!D || !nayttama) return;

  var AVAIN = "digiopo_asteroidivaellus_pohdinta";
  var tila = { kohta: 0, pisteet: { merkitys: 0, yhdessa: 0, vapaus: 0, kasvu: 0 } };

  function luo(tag, luokka, teksti) {
    var el = document.createElement(tag);
    if (luokka) el.className = luokka;
    if (teksti !== undefined) el.textContent = teksti;
    return el;
  }
  function tyhjenna() { while (nayttama.firstChild) nayttama.removeChild(nayttama.firstChild); }
  function fokusoi() { nayttama.focus({ preventScroll: false }); }
  function paivitaEdistys(teksti) { if (edistys) edistys.textContent = teksti; }

  function haePohdinta() {
    try { return JSON.parse(localStorage.getItem(AVAIN) || "{}"); } catch (e) { return {}; }
  }
  function tallennaPohdinta(o) {
    try { localStorage.setItem(AVAIN, JSON.stringify(o)); } catch (e) { /* ei haittaa */ }
  }

  function alku() {
    tyhjenna();
    paivitaEdistys("");
    var k = luo("div", "av-kortti");
    k.appendChild(luo("h1", "", "Asteroidivaellus"));
    k.appendChild(luo("p", "", "Sinulla on oma pieni asteroidi ja pieni alus. Tänään lähdet kylään viiden naapurin luo. Jokaisella on oma tapa elää ja tehdä työtä."));
    k.appendChild(luo("p", "", "Valitse jokaisella asteroidilla se vaihtoehto, joka tuntuu sinusta omalta. Oikeaa tai väärää vastausta ei ole. Lopuksi pohdit, mitä matka kertoi sinusta."));
    k.appendChild(luo("p", "av-pikku", "Kaikkea ei tarvitse tietää nyt. Tämä on vain yksi tapa miettiä tulevaisuutta."));
    var n = luo("button", "av-nappi", "Lähdetään!");
    n.type = "button";
    n.addEventListener("click", function () { tila.kohta = 0; tila.pisteet = { merkitys: 0, yhdessa: 0, vapaus: 0, kasvu: 0 }; planeetta(); });
    k.appendChild(n);
    nayttama.appendChild(k);
  }

  function planeetta() {
    var p = D.planeetat[tila.kohta];
    if (!p) { tulos(); return; }
    tyhjenna();
    paivitaEdistys("Asteroidi " + (tila.kohta + 1) + " / " + D.planeetat.length);
    var k = luo("div", "av-kortti");
    var pl = luo("div", "av-planeetta");
    pl.style.background = p.vari;
    pl.setAttribute("aria-hidden", "true");
    k.appendChild(pl);
    k.appendChild(luo("h2", "", p.nimi));
    k.appendChild(luo("p", "", p.kuvaus));
    k.appendChild(luo("p", "", p.kysymys));
    var lista = luo("div", "av-valinnat");
    p.valinnat.forEach(function (v) {
      var b = luo("button", "av-valinta", v.teksti);
      b.type = "button";
      b.addEventListener("click", function () { valitse(v); });
      lista.appendChild(b);
    });
    k.appendChild(lista);
    nayttama.appendChild(k);
    fokusoi();
  }

  function valitse(v) {
    Object.keys(v.pisteet).forEach(function (a) { tila.pisteet[a] = (tila.pisteet[a] || 0) + v.pisteet[a]; });
    tyhjenna();
    var k = luo("div", "av-kortti");
    k.appendChild(luo("div", "av-vastaus", v.vastaus));
    var viimeinen = tila.kohta >= D.planeetat.length - 1;
    var n = luo("button", "av-nappi", viimeinen ? "Katso, mitä matka kertoi" : "Seuraavalle asteroidille");
    n.type = "button";
    n.addEventListener("click", function () { tila.kohta++; planeetta(); });
    k.appendChild(n);
    nayttama.appendChild(k);
    n.focus();
  }

  function parasArvo() {
    var paras = null, max = -1;
    Object.keys(tila.pisteet).forEach(function (a) { if (tila.pisteet[a] > max) { max = tila.pisteet[a]; paras = a; } });
    return paras;
  }

  function tulos() {
    tyhjenna();
    paivitaEdistys("Matka päättyi");
    var a = parasArvo();
    var t = D.tulokset[a];
    var k = luo("div", "av-kortti");
    k.appendChild(luo("h2", "", t ? t.otsikko : "Matka päättyi"));
    if (t) k.appendChild(luo("p", "", t.teksti));
    var palkit = luo("div", "av-palkit");
    var suurin = 1;
    Object.keys(tila.pisteet).forEach(function (x) { if (tila.pisteet[x] > suurin) suurin = tila.pisteet[x]; });
    Object.keys(D.arvot).forEach(function (x) {
      var rivi = luo("div", "av-palkki-rivi");
      rivi.appendChild(luo("span", "", D.arvot[x].nimi));
      var pk = luo("div", "av-palkki");
      var sis = document.createElement("span");
      sis.style.width = Math.round((tila.pisteet[x] || 0) / suurin * 100) + "%";
      pk.appendChild(sis);
      rivi.appendChild(pk);
      palkit.appendChild(rivi);
    });
    k.appendChild(palkit);
    k.appendChild(luo("p", "av-pikku", "Tulos ei ole totuus sinusta. Se on vain suuntaa antava. Moni tykkää useasta asiasta yhtä paljon, ja se on ihan ok."));
    var n = luo("button", "av-nappi", "Pohdi omaa asteroidiasi");
    n.type = "button";
    n.addEventListener("click", pohdinta);
    k.appendChild(n);
    nayttama.appendChild(k);
    fokusoi();
  }

  function pohdinta() {
    tyhjenna();
    paivitaEdistys("Pohdinta");
    var tallessa = haePohdinta();
    var k = luo("div", "av-kortti");
    k.appendChild(luo("h2", "", "Mitä mietit nyt?"));
    k.appendChild(luo("p", "", "Vastaa omin sanoin. Vastauksesi tallentuvat vain tälle laitteelle."));
    var kentat = {};
    D.pohdinta.forEach(function (q) {
      var l = luo("label", "", q.kysymys);
      l.setAttribute("for", "av-" + q.id);
      var ta = document.createElement("textarea");
      ta.id = "av-" + q.id;
      ta.value = tallessa[q.id] || "";
      ta.addEventListener("input", function () {
        var o = haePohdinta(); o[q.id] = ta.value; tallennaPohdinta(o);
      });
      kentat[q.id] = ta;
      k.appendChild(l);
      k.appendChild(ta);
    });
    var rivi = luo("div", "av-rivi");
    var lataa = luo("button", "av-nappi", "Lataa vastaukset");
    lataa.type = "button";
    lataa.addEventListener("click", function () { lataaTiedosto(kentat); });
    var uusi = luo("button", "av-nappi toissijainen", "Pelaa uudestaan");
    uusi.type = "button";
    uusi.addEventListener("click", alku);
    rivi.appendChild(lataa);
    rivi.appendChild(uusi);
    k.appendChild(rivi);
    nayttama.appendChild(k);
    fokusoi();
  }

  function lataaTiedosto(kentat) {
    var otsikko = "Asteroidivaellus – pohdintani";
    var teksti = otsikko + "\n" + new Array(otsikko.length + 1).join("=") + "\n\n";
    D.pohdinta.forEach(function (q) {
      var ta = kentat[q.id];
      teksti += q.kysymys + "\n" + (ta ? ta.value : "") + "\n\n";
    });
    var blob = new Blob([teksti], { type: "text/plain;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "asteroidivaellus-pohdinta.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  alku();
})();
