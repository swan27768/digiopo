/* ============================================================
   PÄIVÄN KYSYMYS
   Näyttää luokan avaushero-laatikon alla omassa hero-tyylisessä laatikossaan yhden positiivisen pohdintakysymyksen.
   - Kysymys vaihtuu paikallisessa keskiyössä (voimassa 24 h), joten kaikki
     saman päivän katsojat näkevät saman kysymyksen.
   - Kysymykset ovat käännöstiedostoissa: translations/<kieli>.json -> paivan_kysymys
       yhteinen = kaikille luokille, g8 / g9 = luokkakohtaiset lisäkysymykset,
       g7 = 7. luokan oma lista, g89 = 8. ja 9. luokan oma lista (korvaavat yhteinen + g8/g9;
       puuttuessa käytetään vanhoja listoja).
     Kaikissa kielissä listat ovat samassa järjestyksessä, joten sama
     indeksi on sama kysymys kaikilla kielillä.
   - Kysymysten järjestys sekoitetaan kierros kerrallaan (siemenarvo = kierros),
     jolloin kysymys ei toistu ennen kuin koko lista on käyty läpi.
   ============================================================ */
(function () {
  'use strict';

  var PAIVA_MS = 86400000;
  var timer = null;

  function paivaNumero(d) {
    return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / PAIVA_MS);
  }

  /* Pieni, toistettava satunnaislukugeneraattori (mulberry32) */
  function siemen(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function jarjestys(pituus, kierros) {
    var idx = [];
    for (var i = 0; i < pituus; i++) idx.push(i);
    var rnd = siemen(kierros * 7919 + 13);
    for (var j = pituus - 1; j > 0; j--) {
      var k = Math.floor(rnd() * (j + 1));
      var tmp = idx[j]; idx[j] = idx[k]; idx[k] = tmp;
    }
    return idx;
  }

  function luokka(hero) {
    var m = /osio-hero--(7|8|9)\b/.exec(hero.className);
    return m ? m[1] : null;
  }

  function haeHero() {
    return document.querySelector('#johdanto > .osio-hero') ||
           document.querySelector('.aihe-osio > .osio-hero');
  }

  function valitse(data, lk, paiva) {
    /* Luokkakohtaiset kysymyslistat (g7 = 7. lk, g89 = 8. ja 9. lk), jos kieleltä
       löytyvät. Muuten (kieli, jolle listaa ei ole vielä käännetty) käytetään
       vanhaa yhteinen + g8/g9 -listaa. */
    var oma89 = (lk === '7') ? data.g7 : (lk === '8' || lk === '9') ? data.g89 : null;
    var luokkalista = (oma89 && oma89.length) ? oma89 : null;
    var yhteinen = luokkalista || data.yhteinen || [];
    var oma = luokkalista ? [] : (data['g' + lk] || []);
    var pituus = yhteinen.length + oma.length;
    if (!pituus) return null;
    var kierros = Math.floor(paiva / pituus);
    var jarj = jarjestys(pituus, kierros);
    var i = jarj[((paiva % pituus) + pituus) % pituus];
    return i < yhteinen.length ? yhteinen[i] : oma[i - yhteinen.length];
  }

  function nayta() {
    var t = window.DIGIOPO_T;
    var data = t && t.paivan_kysymys;
    var hero = haeHero();
    if (!data || !hero) return;
    var lk = luokka(hero);
    if (!lk) return;

    var teksti = valitse(data, lk, paivaNumero(new Date()));
    if (!teksti) return;

    var el = document.getElementById('paivan-kysymys');
    if (!el) {
      el = document.createElement('aside');
      el.id = 'paivan-kysymys';
      el.className = 'paivan-kysymys paivan-kysymys--' + lk;
      el.innerHTML =
        '<p class="paivan-kysymys__otsikko"></p>' +
        '<button type="button" class="paivan-kysymys__suurenna"></button>' +
        '<p class="paivan-kysymys__teksti"></p>' +
        '<p class="paivan-kysymys__huomenna"></p>';
      el.querySelector('.paivan-kysymys__suurenna').addEventListener('click', avaaIso);
      /* Oma hero-tyylinen laatikko päähero-laatikon alla */
      hero.insertAdjacentElement('afterend', el);
    }
    el.setAttribute('aria-label', data.otsikko || '');
    el.querySelector('.paivan-kysymys__otsikko').textContent = data.otsikko || '';
    el.querySelector('.paivan-kysymys__teksti').textContent = teksti;
    el.querySelector('.paivan-kysymys__huomenna').textContent = data.huomenna || '';
    var nappi = el.querySelector('.paivan-kysymys__suurenna');
    nappi.textContent = data.suurenna || '';
    nappi.hidden = !data.suurenna;
    paivitaIso(el, data, teksti, lk);
    ajastaVaihto();
  }

  /* Suurennettu näkymä (opettaja voi näyttää kysymyksen koko luokalle) */
  function luoIso() {
    var d = document.getElementById('paivan-kysymys-iso');
    if (d) return d;
    d = document.createElement('dialog');
    d.id = 'paivan-kysymys-iso';
    d.className = 'paivan-kysymys-iso';
    d.innerHTML =
      '<button type="button" class="paivan-kysymys-iso__sulje"></button>' +
      '<div class="paivan-kysymys-iso__sisalto">' +
        '<p class="paivan-kysymys-iso__otsikko"></p>' +
        '<p class="paivan-kysymys-iso__teksti"></p>' +
      '</div>';
    d.addEventListener('click', function () { d.close(); });
    document.body.appendChild(d);
    return d;
  }

  function paivitaIso(el, data, teksti, lk) {
    var d = luoIso();
    d.className = 'paivan-kysymys-iso paivan-kysymys-iso--' + lk;
    d.setAttribute('aria-label', data.otsikko || '');
    d.querySelector('.paivan-kysymys-iso__otsikko').textContent = data.otsikko || '';
    d.querySelector('.paivan-kysymys-iso__teksti').textContent = teksti;
    var sulje = d.querySelector('.paivan-kysymys-iso__sulje');
    sulje.textContent = data.sulje || '';
    sulje.setAttribute('aria-label', data.sulje || '');
  }

  function avaaIso() {
    var d = document.getElementById('paivan-kysymys-iso');
    if (d && typeof d.showModal === 'function' && !d.open) d.showModal();
  }

  /* Vaihdetaan kysymys, kun päivä vaihtuu myös avoinna olevalla sivulla */
  function ajastaVaihto() {
    if (timer) clearTimeout(timer);
    var nyt = new Date();
    var keskiyo = new Date(nyt.getFullYear(), nyt.getMonth(), nyt.getDate() + 1, 0, 0, 2);
    timer = setTimeout(nayta, Math.max(1000, keskiyo - nyt));
  }

  document.addEventListener('digiopo:langchange', nayta);
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) nayta();
  });
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', nayta);
  } else {
    nayta();
  }
})();
