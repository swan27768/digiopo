/**
 * DigiOpo i18n – 9. luokka sivukohtaiset käännökset
 * Käyttää CSS-selectoreja, ei vaadi data-i18n muutoksia HTML:ään.
 * Kuuntelee digiopo:langchange tapahtumaa i18n.js:stä.
 */
(function () {
  'use strict';

  /* ── Apufunktiot ── */
  function setTxt(sel, val) {
    if (!val) return;
    var el = document.querySelector(sel);
    if (el) el.textContent = val;
  }

  function setAllTxt(sel, vals) {
    if (!vals || !vals.length) return;
    var els = document.querySelectorAll(sel);
    for (var i = 0; i < els.length && i < vals.length; i++) {
      els[i].textContent = vals[i];
    }
  }

  function setHTML(sel, val) {
    if (!val) return;
    var el = document.querySelector(sel);
    if (el) el.innerHTML = val;
  }

  function setAttr(sel, attr, val) {
    if (!val) return;
    var el = document.querySelector(sel);
    if (el) el.setAttribute(attr, val);
  }

  function g(obj, key) {
    var parts = key.split('.');
    var res = obj;
    for (var i = 0; i < parts.length; i++) {
      if (!res || typeof res !== 'object') return null;
      res = res[parts[i]];
    }
    return res != null ? res : null;
  }

  /* ── Pääkäyttö ── */
  function applyG9(t) {
    var g9 = t && t.g9;
    if (!g9) return;

    /* Meta */
    if (g9.meta) {
      if (g9.meta.title) document.title = g9.meta.title;
      var metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc && g9.meta.description) metaDesc.setAttribute('content', g9.meta.description);
    }

    /* Navigaatio - takaisin-linkki */
    setAttr('.nav-logo', 'aria-label', g(g9, 'nav.back_aria'));

    /* Sivupalkki */
    setTxt('.book-page-left h3', g(g9, 'sidebar.heading'));
    setTxt('.aihelista a[href="#johdanto"]', g(g9, 'sidebar.link_johdanto'));
    setTxt('.aihelista a[href="#jatko"]', g(g9, 'sidebar.link_jatko'));
    setTxt('.aihelista a[href="#ajattelu"]', g(g9, 'sidebar.link_ajattelu'));
    setTxt('.aihelista a[href="#tet"]', g(g9, 'sidebar.link_tet'));
    setTxt('.aihelista a[href="#paatoksenteko"]', g(g9, 'sidebar.link_paatoksenteko'));
    setTxt('.aihelista a[href="#yhteishaku"]', g(g9, 'sidebar.link_yhteishaku'));
    setTxt('.aihelista a[href="#epavarmuus"]', g(g9, 'sidebar.link_epavarmuus'));
    setTxt('.aihelista a[href="#testi"]', g(g9, 'sidebar.link_testi'));
    setTxt('.aihelista a[href="#valinnat"]', g(g9, 'sidebar.link_valinnat'));
    setTxt('.aihelista a[href="#tulevaisuus"]', g(g9, 'sidebar.link_tulevaisuus'));

    /* Breadcrumb */
    setTxt('.breadcrumb a[href="../index.html"]', g(g9, 'breadcrumb.home'));
    var crumbCurrent = document.querySelector('.breadcrumb');
    if (crumbCurrent && g9.breadcrumb) {
      var nodes = crumbCurrent.childNodes;
      for (var n = 0; n < nodes.length; n++) {
        if (nodes[n].nodeType === 3 && nodes[n].textContent.trim() === '9. luokka') {
          nodes[n].textContent = ' → ' + g9.breadcrumb.current;
          break;
        }
      }
    }

    /* H1 — myös data-i18n hoitaa, mutta setTxt varmuuden vuoksi */
    setTxt('h1', g(g9, 'hero.h1'));

  }

  /* ── Tapahtumakuuntelijat ── */
  document.addEventListener('digiopo:langchange', function (e) {
    applyG9(e.detail.t);
  });

  /* Jos käännökset on jo ladattu ennen tätä skriptiä */
  if (window.DIGIOPO_T) {
    applyG9(window.DIGIOPO_T);
  }

})();
