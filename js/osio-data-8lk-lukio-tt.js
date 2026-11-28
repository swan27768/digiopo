/* ══ 8. lk · Oma reitti löytyy tutkimalla · Lukiopolku Vaihe 5, Osa 1: Totta vai tarua? ══
   Sama idea kuin Amispolussa (js/osio-data-8lk-amispolku.js): oppilas arvaa ensin, sitten näkee selityksen.
   Lukitsee suunnitelman (Osa 2) kuten Amispolussa: se aukeaa, kun kaikkiin väitteisiin on vastattu,
   tai jos suunnitelma on jo aloitettu tai tallennettu (localStorage dg8-lukio-v4 / dg8-lukio-v4-valmis).
   Pisteet näkyvät suunnitelmakortissa ja PDF:ssä.
   Tila: sessionStorage dg8-lukio-tt – tyhjenee, kun välilehti/selain suljetaan. Rajapinta suunnitelmalle: window.lukioTT.{pisteet, vastaukset, tyhjenna}.
   Käännökset: valinnainen ylikirjoitus DIGIOPO_T.g8.tutkija.lukio_tt (sama rakenne kuin FI). */
(function () {
  'use strict';

  var FI = {
    ui: {
      osa1: 'Osa 1: Totta vai tarua?',
      osa1_ohje: 'Lue väite. Valitse, onko se mielestäsi totta vai tarua. Sen jälkeen näet, miten asia oikeasti on.',
      osa2: 'Osa 2: Tee oma lukiosuunnitelma',
      totta: 'Totta', tarua: 'Tarua',
      oikein: 'Osuit oikeaan!', vaarin: 'Ei ihan – moni luulee samoin.',
      vaite_on: 'Väite on',
      laskuri: '{n}/{m} vastattu',
      lue_lisaa: 'Lue lisää',
      tulos: 'Osuit oikeaan {k}/{m}.',
      tulos_kaikki: 'Huippua – tiedät lukiosta jo paljon!',
      tulos_hyva: 'Hyvin meni! Pari asiaa varmaan yllätti.',
      tulos_muu: 'Nyt tiedät lukiosta paljon enemmän kuin äsken. Juuri sitä varten väitteet olivat täällä.',
      seuraavaksi: 'Seuraavaksi: tee oma lukiosuunnitelmasi.'
    },
    vaitteet: [
      { id: 'keskiarvo', vaite: 'Lukioon pääsee vain, jos keskiarvo on yli 9.', oikea: 'tarua',
        selitys: 'Rajat vaihtelevat paljon. Osaan lukioista pääsee noin seiskan keskiarvolla, suosittuihin tarvitaan yli yhdeksän. Raja riippuu siitä, keitä sinä vuonna hakee.',
        linkki: 'https://opintopolku.fi/konfo/fi/sivu/lukiokoulutus' },
      { id: 'yliopisto', vaite: 'Lukion jälkeen on pakko mennä yliopistoon.', oikea: 'tarua',
        selitys: 'Lukion jälkeen voit hakea yliopistoon tai ammattikorkeakouluun, opiskella ammatin amiksessa tai mennä töihin. Moni pitää myös välivuoden.' },
      { id: 'amis', vaite: 'Lukion jälkeen voi vielä opiskella ammatin amiksessa.', oikea: 'totta',
        selitys: 'Ylioppilaana voit hakea amikseen. Osa yhteisistä opinnoista voi olla jo tehty, joten opiskelu voi olla lyhyempää.' },
      { id: 'lukujarjestys', vaite: 'Lukiossa koko luokalla on sama lukujärjestys.', oikea: 'tarua',
        selitys: 'Useimmissa lukioissa teet oman lukujärjestyksen: valitset itse opintojaksot ja niiden järjestyksen. Siksi ryhmä vaihtuu usein aineen mukaan.' },
      { id: 'todistus', vaite: 'Yo-todistuksella voi päästä korkeakouluun ilman pääsykoetta.', oikea: 'totta',
        selitys: 'Suuri osa korkeakoulujen opiskelupaikoista täytetään todistusvalinnalla. Silloin yo-kirjoitusten arvosanat ratkaisevat. Osaan aloista on lisäksi pääsykoe.' },
      { id: 'tuki', vaite: 'Jos opiskelu tuntuu vaikealta, lukiossa ei saa apua.', oikea: 'tarua',
        selitys: 'Lukiossa sinulla on oikeus opinto-ohjaukseen ja erityisopetukseen. Apua saat myös opettajilta, kuraattorilta ja psykologilta.' }
    ]
  };

  var AVAIN = 'dg8-lukio-tt';

  function yhdista(a, b) {
    if (!b || typeof b !== 'object') return a;
    if (Array.isArray(a)) return a.map(function (x, i) { return yhdista(x, b[i]); });
    var o = {};
    Object.keys(a).forEach(function (k) {
      o[k] = (a[k] && typeof a[k] === 'object') ? yhdista(a[k], b[k]) : (b[k] != null && b[k] !== '' ? b[k] : a[k]);
    });
    return o;
  }
  function tj() { return (window.DIGIOPO_T && window.DIGIOPO_T.g8 && window.DIGIOPO_T.g8.tutkija) || {}; }
  function D() { return yhdista(FI, tj().lukio_tt); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  function f(s, o) { return s.replace(/\{(\w+)\}/g, function (_, k) { return o[k]; }); }
  function $(id) { return document.getElementById(id); }

  function lue() {
    try { localStorage.removeItem(AVAIN); } catch (e) {}   /* vanha pysyvä tallennus pois */
    try { var v = JSON.parse(sessionStorage.getItem(AVAIN) || 'null'); if (v && typeof v === 'object') return v; } catch (e) {}
    return {};
  }
  var tila = lue();
  function tallenna() { try { sessionStorage.setItem(AVAIN, JSON.stringify(tila)); } catch (e) {} }

  function pisteet(d) {
    d = d || D();
    var k = 0, n = 0;
    d.vaitteet.forEach(function (v) { if (tila[v.id]) { n++; if (tila[v.id] === v.oikea) k++; } });
    return { k: k, n: n, m: d.vaitteet.length };
  }

  function piirra() {
    var d = D(), lista = $('lukio-tt-lista');
    if (!lista) return;
    var otsikko = function (id, t) {
      var el = $(id); if (!el) return;
      var m = String(t).match(/^([^:]+):\s*(.+)$/);
      el.innerHTML = m ? '<span class="amis-v3-osa-nro">' + esc(m[1]) + '</span> ' + esc(m[2]) : esc(t);
    };
    otsikko('lukio-tt-otsikko', d.ui.osa1);
    otsikko('lukio-osa2-otsikko', d.ui.osa2);
    var ohje = $('lukio-tt-ohje'); if (ohje) ohje.textContent = d.ui.osa1_ohje;
    /* Kieliviesti: väitteet ovat suomeksi, ellei käännöstä ole */
    var huom = $('lukio-tt-kieli'), tt = tj();
    if (huom) {
      var lang = (document.documentElement.getAttribute('lang') || 'fi').slice(0, 2);
      huom.hidden = !!tt.lukio_tt || lang === 'fi' || !tt.lang_warning;
      if (!huom.hidden) huom.textContent = tt.lang_warning;
    }

    lista.innerHTML = d.vaitteet.map(function (v, i) {
      var vas = tila[v.id];
      var nappi = function (arvo, teksti) {
        var cls = 'amis-tt-nappi' + (vas === arvo ? ' valittu' : '') + (vas && arvo === v.oikea ? ' oikea' : '');
        return '<button type="button" class="' + cls + '" data-ltt="' + v.id + '" data-arvo="' + arvo + '"' +
          (vas ? ' aria-disabled="true"' : '') + ' aria-pressed="' + (vas === arvo) + '">' + esc(teksti) + '</button>';
      };
      var palaute = '';
      if (vas) {
        var ok = vas === v.oikea;
        palaute = '<p class="amis-tt-otsake ' + (ok ? 'ok' : 'ei') + '"><span aria-hidden="true">' + (ok ? '✓ ' : '✗ ') + '</span>' +
          esc(ok ? d.ui.oikein : d.ui.vaarin) + ' ' + esc(d.ui.vaite_on) + ' <strong>' + esc((v.oikea === 'totta' ? d.ui.totta : d.ui.tarua).toLowerCase()) + '</strong>.</p>' +
          '<p>' + esc(v.selitys) + '</p>' +
          (v.linkki ? '<p><a href="' + esc(v.linkki) + '" target="_blank" rel="noopener">' + esc(d.ui.lue_lisaa) + ' →</a></p>' : '');
      }
      return '<li class="amis-tt-kortti' + (vas ? ' vastattu ' + (vas === v.oikea ? 'tulos-ok' : 'tulos-ei') : '') + '">' +
        '<p class="amis-tt-vaite"><span class="amis-tt-nro" aria-hidden="true">' + (i + 1) + '</span>' + esc(v.vaite) + '</p>' +
        '<div class="amis-tt-napit" role="group" aria-label="' + esc(v.vaite) + '">' + nappi('totta', d.ui.totta) + nappi('tarua', d.ui.tarua) + '</div>' +
        '<div class="amis-tt-palaute" aria-live="polite"' + (vas ? '' : ' hidden') + '>' + palaute + '</div></li>';
    }).join('');

    var p = pisteet(d);
    var laskuri = $('lukio-tt-laskuri'); if (laskuri) laskuri.textContent = f(d.ui.laskuri, { n: p.n, m: p.m });
    var tulos = $('lukio-tt-tulos');
    if (tulos) {
      var kaikki = p.n === p.m;
      tulos.hidden = !kaikki;
      if (kaikki) {
        var kom = p.k === p.m ? d.ui.tulos_kaikki : (p.k >= p.m - 2 ? d.ui.tulos_hyva : d.ui.tulos_muu);
        tulos.innerHTML = '<strong>' + esc(f(d.ui.tulos, { k: p.k, m: p.m })) + '</strong> ' + esc(kom) + '<br>' + esc(d.ui.seuraavaksi) + ' <span aria-hidden="true">↓</span>';
      }
    }
    paivitaOsa2(p.n === p.m);
  }

  /* Osa 2 näkyviin samalla säännöllä kuin Amispolussa */
  function suunnitelmaAloitettu() {
    try {
      if (localStorage.getItem('dg8-lukio-v4-valmis') === '1') return true;
      var v = JSON.parse(localStorage.getItem('dg8-lukio-v4') || 'null');
      return !!(v && (v.painotus || (v.aineet && v.aineet.length) || v.jatko || v.haave || v.selvita));
    } catch (e) { return false; }
  }
  function paivitaOsa2(kaikki) {
    var auki = kaikki || suunnitelmaAloitettu();
    ['lukio-osa2', 'lukio-v4-tehtava'].forEach(function (id) { var el = $(id); if (el) el.hidden = !auki; });
  }

  function ilmoita() { try { document.dispatchEvent(new CustomEvent('digiopo:lukio-tt')); } catch (e) {} }

  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('#lukio-tt-lista button[data-ltt]');
    if (!b || b.getAttribute('aria-disabled') === 'true') return;
    var id = b.dataset.ltt;
    if (tila[id]) return;
    tila[id] = b.dataset.arvo; tallenna(); piirra(); ilmoita();
    var uusi = document.querySelector('#lukio-tt-lista button[data-ltt="' + id + '"][data-arvo="' + b.dataset.arvo + '"]');
    if (uusi) uusi.focus();
  });
  document.addEventListener('digiopo:langchange', function () { setTimeout(piirra, 0); });

  window.lukioTT = {
    pisteet: function () { return pisteet(); },
    /* PDF:ää varten: [[väite, vastasin, oikea]] */
    vastaukset: function () {
      var d = D();
      return d.vaitteet.map(function (v) {
        var nimi = function (x) { return x === 'totta' ? d.ui.totta : x === 'tarua' ? d.ui.tarua : '–'; };
        return { vaite: v.vaite, vastasin: nimi(tila[v.id]), oikein: tila[v.id] === v.oikea, oikea: nimi(v.oikea) };
      });
    },
    tyhjenna: function () { tila = {}; try { sessionStorage.removeItem(AVAIN); } catch (e) {} piirra(); ilmoita(); }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', piirra);
  else piirra();
})();
