/* ============================================================
   DigiOpo – Tekoälytehtävät 7.–9. lk · jaettu i18n-moottori
   Kevyt monikielisyystuki itsenäisille peleille.

   Käyttö pelissä:
     TekoalyI18n.init({
       langs: ['fi','sv','en'],           // näytettävät kielet
       labels: { fi:'FI', sv:'SV', en:'EN' },
       dict: LANG,                        // { fi:{...}, sv:{...}, en:{...} }
       barSelector: '#langBar',           // mihin kielinapit renderöidään
       onChange: render                   // kutsutaan aina kun kieli vaihtuu
     });
     var teksti = T('avain.polku');       // haku nykyisellä kielellä

   Avaimet voivat olla sisäkkäisiä: T('cover.title').
   Puuttuva avain -> palautetaan avain itse (näkyy heti testatessa).
   ============================================================ */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'digiopo_tekoaly_kieli';
  var state = { lang: 'fi', dict: {}, langs: ['fi'], onChange: null };

  function haeTallennettuKieli() {
    try {
      var v = global.localStorage ? global.localStorage.getItem(STORAGE_KEY) : null;
      return v || null;
    } catch (e) { return null; }
  }
  function tallennaKieli(l) {
    try { if (global.localStorage) global.localStorage.setItem(STORAGE_KEY, l); } catch (e) { /* ignore */ }
  }

  // Hae sisäkkäinen avain, esim. "cover.title"
  function lue(obj, polku) {
    if (!obj) return undefined;
    var osat = polku.split('.');
    var nyt = obj;
    for (var i = 0; i < osat.length; i++) {
      if (nyt == null || typeof nyt !== 'object') return undefined;
      nyt = nyt[osat[i]];
    }
    return nyt;
  }

  // Julkinen käännösfunktio
  function T(avain) {
    var d = state.dict[state.lang];
    var arvo = lue(d, avain);
    if (arvo === undefined && state.lang !== 'fi') {
      arvo = lue(state.dict.fi, avain); // fallback suomeen
    }
    return arvo === undefined ? avain : arvo;
  }

  // Päivitä kaikki [data-i18n]-elementit (staattinen teksti)
  function paivitaStaattiset() {
    var elementit = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < elementit.length; i++) {
      var el = elementit[i];
      if (!el) continue;
      var avain = el.getAttribute('data-i18n');
      var teksti = T(avain);
      if (typeof teksti === 'string') el.textContent = teksti;
    }
    // data-i18n-aria: aseta aria-label
    var ariat = document.querySelectorAll('[data-i18n-aria]');
    for (var j = 0; j < ariat.length; j++) {
      var a = ariat[j];
      if (!a) continue;
      var ak = a.getAttribute('data-i18n-aria');
      var at = T(ak);
      if (typeof at === 'string') a.setAttribute('aria-label', at);
    }
    // Sivun kieliattribuutti + otsikko
    if (document.documentElement) document.documentElement.setAttribute('lang', state.lang);
    var otsikko = lue(state.dict[state.lang], 'meta.title') || lue(state.dict.fi, 'meta.title');
    if (otsikko) document.title = otsikko;
  }

  function renderoiKielinapit(barSelector, labels) {
    var bar = document.querySelector(barSelector);
    if (!bar) return;
    bar.innerHTML = '';
    for (var i = 0; i < state.langs.length; i++) {
      (function (l) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'lang-btn' + (l === state.lang ? ' active' : '');
        b.textContent = (labels && labels[l]) ? labels[l] : l.toUpperCase();
        b.setAttribute('aria-label', 'Kieli: ' + b.textContent);
        b.setAttribute('lang', l);
        if (l === state.lang) b.setAttribute('aria-current', 'true');
        b.onclick = function () { vaihdaKieli(l, barSelector, labels); };
        bar.appendChild(b);
      })(state.langs[i]);
    }
  }

  function vaihdaKieli(l, barSelector, labels) {
    if (state.langs.indexOf(l) === -1) return;
    state.lang = l;
    tallennaKieli(l);
    renderoiKielinapit(barSelector, labels);
    paivitaStaattiset();
    if (typeof state.onChange === 'function') {
      try { state.onChange(); } catch (e) { /* älä kaada käännösajoa */ }
    }
  }

  function init(cfg) {
    cfg = cfg || {};
    state.dict = cfg.dict || {};
    state.langs = cfg.langs || Object.keys(state.dict);
    state.onChange = cfg.onChange || null;

    var alku = haeTallennettuKieli();
    if (alku && state.langs.indexOf(alku) !== -1) {
      state.lang = alku;
    } else {
      // yritä selaimen kieltä, muuten fi
      var selain = (global.navigator && global.navigator.language ? global.navigator.language : 'fi').slice(0, 2);
      state.lang = state.langs.indexOf(selain) !== -1 ? selain : (state.langs[0] || 'fi');
    }

    renderoiKielinapit(cfg.barSelector || '#langBar', cfg.labels);
    paivitaStaattiset();
    if (typeof state.onChange === 'function') {
      try { state.onChange(); } catch (e) { /* ignore */ }
    }
  }

  global.TekoalyI18n = {
    init: init,
    T: T,
    get lang() { return state.lang; },
    setLang: function (l) { vaihdaKieli(l, '#langBar'); }
  };
  // Lyhyt globaali alias käännösfunktiolle
  global.T = T;
})(typeof window !== 'undefined' ? window : this);
