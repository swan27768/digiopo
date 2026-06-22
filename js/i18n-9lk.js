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

    /* Hero intro-kappale */
    setTxt('.book-page-right > p', g(g9, 'hero.intro'));

    /* ── Johdanto ── */
    setTxt('#johdanto h2#otsikko-johdanto', g(g9, 'johdanto.h2'));
    setTxt('#johdanto .aihe-otsikko p', g(g9, 'johdanto.subtitle'));
    setTxt('.johdanto-maskotti-label', g(g9, 'johdanto.maskotti_label'));
    setTxt('.johdanto-maskotti-teksti', g(g9, 'johdanto.maskotti_teksti'));
    /* Suurenna-painike: säilytetään emoji, vaihdetaan vain teksti */
    (function () {
      var zoomSpan = document.querySelector('#johdanto span[style*="absolute"]');
      if (zoomSpan && g9.johdanto && g9.johdanto.zoom) {
        zoomSpan.textContent = g9.johdanto.zoom;
      }
    })();

    /* ── Jatko ── */
    setTxt('#jatko h2#otsikko-jatko', g(g9, 'jatko.h2'));
    setTxt('#jatko .aihe-otsikko p', g(g9, 'jatko.subtitle'));

    /* Theory card */
    setTxt('#jatko .theory-card h3', g(g9, 'jatko.theory.h3'));
    setTxt('#jatko .theory-card .theory-text p:first-of-type', g(g9, 'jatko.theory.p'));
    setTxt('#jatko .theory-card .theory-text strong', g(g9, 'jatko.theory.strong'));

    /* Kaavio-painike */
    (function () {
      var kaavioBtns = document.querySelectorAll('#jatko button');
      for (var i = 0; i < kaavioBtns.length; i++) {
        if (kaavioBtns[i].getAttribute('onclick') === 'avaaKoulutusKaavio()') {
          var icon = kaavioBtns[i].querySelector('i');
          if (g9.jatko && g9.jatko.kaavio_btn) {
            kaavioBtns[i].textContent = g9.jatko.kaavio_btn;
            if (icon) kaavioBtns[i].insertBefore(icon, kaavioBtns[i].firstChild);
          }
          break;
        }
      }
      /* Sulje kaavio */
      var kaavioDlg = document.getElementById('koulutusKaavioDialog');
      if (kaavioDlg && g9.jatko && g9.jatko.kaavio_close) {
        var closeBtn = kaavioDlg.querySelector('button[aria-label]');
        if (closeBtn) closeBtn.setAttribute('aria-label', g9.jatko.kaavio_close);
      }
    })();

    /* Mission card 1 */
    (function () {
      var cards = document.querySelectorAll('#jatko .mission-card');
      var m1 = g(g9, 'jatko.mission1');
      if (cards[0] && m1) {
        var h4 = cards[0].querySelector('h4');
        var badge = cards[0].querySelector('.mission-badge');
        var p = cards[0].querySelector('p:not(.mission-hint)');
        var lis = cards[0].querySelectorAll('li');
        var hint = cards[0].querySelector('.mission-hint');
        if (h4) h4.textContent = m1.h4;
        if (badge) badge.textContent = m1.badge;
        if (p) p.textContent = m1.p;
        if (m1.li) for (var i = 0; i < lis.length && i < m1.li.length; i++) lis[i].textContent = m1.li[i];
        if (hint) hint.textContent = m1.hint;
      }
    })();

    /* Laskuri hero */
    (function () {
      var lk = g(g9, 'jatko.laskuri');
      if (!lk) return;
      var hero = document.querySelector('#jatko .duuniintet-hero');
      if (hero) {
        var badge = hero.querySelector('.duuniintet-badge');
        if (badge) {
          var icon = badge.querySelector('i');
          badge.textContent = lk.badge;
          if (icon) badge.insertBefore(icon, badge.firstChild);
        }
        var h3 = hero.querySelector('h3');
        if (h3) h3.textContent = lk.h3;
        var p = hero.querySelector('p');
        if (p) p.textContent = lk.p;
        var btn = document.getElementById('laskuri-btn');
        if (btn) {
          var icon2 = btn.querySelector('i');
          btn.textContent = lk.btn_open;
          if (icon2) btn.insertBefore(icon2, btn.firstChild);
        }
      }
      var closeBtn = document.querySelector('#laskuriContainer > div > button');
      if (closeBtn) closeBtn.textContent = lk.btn_close;
    })();

    /* Mission card 2 */
    (function () {
      var cards = document.querySelectorAll('#jatko .mission-card');
      var m2 = g(g9, 'jatko.mission2');
      if (cards[1] && m2) {
        var h4 = cards[1].querySelector('h4');
        var badge = cards[1].querySelector('.mission-badge');
        var p = cards[1].querySelector('p:not(.mission-hint)');
        var lis = cards[1].querySelectorAll('li');
        var hint = cards[1].querySelector('.mission-hint');
        if (h4) h4.textContent = m2.h4;
        if (badge) badge.textContent = m2.badge;
        if (p) p.textContent = m2.p;
        if (m2.li) for (var i = 0; i < lis.length && i < m2.li.length; i++) lis[i].textContent = m2.li[i];
        if (hint) hint.textContent = m2.hint;
      }
    })();

    /* Vuosikello hero */
    (function () {
      var vk = g(g9, 'jatko.vuosikello');
      if (!vk) return;
      var hero = document.querySelector('#jatko .tetjakso-hero');
      if (hero) {
        var badge = hero.querySelector('.tetjakso-badge');
        if (badge) {
          var icon = badge.querySelector('i');
          badge.textContent = vk.badge;
          if (icon) badge.insertBefore(icon, badge.firstChild);
        }
        var h3 = hero.querySelector('h3');
        if (h3) h3.textContent = vk.h3;
        var p = hero.querySelector('p');
        if (p) p.textContent = vk.p;
        var btn = hero.querySelector('.btn-tetjakso');
        if (btn) {
          var icon2 = btn.querySelector('i');
          btn.textContent = vk.btn_open;
          if (icon2) btn.insertBefore(icon2, btn.firstChild);
        }
      }
      var closeBtn = document.querySelector('#vuosikelloContainer > div > button');
      if (closeBtn) {
        var icon3 = closeBtn.querySelector('i');
        closeBtn.textContent = vk.btn_close;
        if (icon3) closeBtn.insertBefore(icon3, closeBtn.firstChild);
      }
    })();

  }

    /* ── Ajattelu ── */
    (function () {
      var aj = g(g9, 'ajattelu');
      if (!aj) return;

      setTxt('#ajattelu h2#otsikko-ajattelu', aj.h2);
      setTxt('#ajattelu .aihe-otsikko p', aj.subtitle);

      /* Tehtävä 1 badge (span ennen theory-card:ia) */
      (function () {
        var spans = document.querySelectorAll('#ajattelu > span');
        if (spans.length && aj.badge1) spans[0].textContent = aj.badge1;
        /* Myös harmaalla divissä oleva span */
        var divSpans = document.querySelectorAll('#ajattelu > div > span');
        for (var i = 0; i < divSpans.length; i++) {
          if (divSpans[i].textContent.trim() === 'Tehtävä 1') {
            divSpans[i].textContent = aj.badge1;
            break;
          }
        }
      })();

      /* Theory card intro */
      setTxt('#ajattelu .theory-card .theory-text > p', aj.theory_intro);

      /* Ajattelutyypit – 5 korttia */
      if (aj.thinking_types) {
        var cards = document.querySelectorAll('#ajattelu .theory-card .theory-text > div > div');
        for (var i = 0; i < cards.length && i < aj.thinking_types.length; i++) {
          var ch = cards[i].children;
          if (ch[1]) ch[1].textContent = aj.thinking_types[i].title;
          if (ch[2]) ch[2].textContent = aj.thinking_types[i].desc;
        }
      }

      /* Peli-napit */
      (function () {
        var openBtn = document.querySelector('#ajattelu button[onclick="avaaAjattelupeli()"]');
        if (openBtn && aj.game_btn_open) openBtn.textContent = aj.game_btn_open;
        var closeBtns = document.querySelectorAll('#ajatteluSuljeBtn, #ajattelupeliContainer button');
        for (var i = 0; i < closeBtns.length; i++) {
          if (aj.game_btn_close) closeBtns[i].textContent = aj.game_btn_close;
        }
      })();

      /* Tehtävä 2 badge */
      (function () {
        var allSpans = document.querySelectorAll('#ajattelu > div > span');
        for (var i = 0; i < allSpans.length; i++) {
          if (allSpans[i].textContent.trim() === 'Tehtävä 2') {
            allSpans[i].textContent = aj.badge2;
            break;
          }
        }
      })();

      /* Salapoliisitehtävä (murha) */
      if (aj.murha) {
        var badge = document.querySelector('#ajattelu-mission .hero-badge');
        if (badge) {
          var icon = badge.querySelector('i');
          badge.textContent = aj.murha.badge;
          if (icon) badge.insertBefore(icon, badge.firstChild);
        }
        var mh3 = document.querySelector('#ajattelu-mission h3');
        if (mh3) mh3.textContent = aj.murha.h3;
        var mp = document.querySelector('#ajattelu-mission p');
        if (mp) mp.textContent = aj.murha.p;
        var infoSpan = document.querySelector('#ajattelu-mission .btn-hero + span');
        if (infoSpan) infoSpan.textContent = aj.murha.info;
        /* Open-painike ja toggleMurha-patch */
        var openBtn = document.querySelector('#ajattelu-mission .btn-hero');
        if (openBtn && aj.murha.btn_open) openBtn.textContent = aj.murha.btn_open;
        /* Patch toggleMurha function */
        window._murhaAuki = aj.murha.btn_open;
        window._murhaSuljettu = aj.murha.btn_close;
        window.toggleMurha = function (btn) {
          var wrapper = document.getElementById('murha-wrapper');
          var isOpen = wrapper.style.display === 'block';
          wrapper.style.display = isOpen ? 'none' : 'block';
          btn.textContent = isOpen ? (window._murhaAuki || 'Avaa tehtävä') : (window._murhaSuljettu || 'Sulje tehtävä');
          btn.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
          if (!isOpen) wrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });
        };
        /* Close-painike murha-wrapperissa */
        var closeBtn = document.querySelector('#murha-wrapper > div > button');
        if (closeBtn) {
          var closeIcon = closeBtn.querySelector('i');
          closeBtn.textContent = aj.murha.btn_close;
          if (closeIcon) closeBtn.insertBefore(closeIcon, closeBtn.firstChild);
        }
      }

      /* Opettajan materiaali */
      (function () {
        var el = document.querySelector('#ajattelu .opettaja-toggle .opettaja-toggle-left span:last-child');
        if (el && aj.opettaja_btn) el.textContent = aj.opettaja_btn;
        var link = document.querySelector('#opettaja-sisalto-ajattelu .opettaja-lataus');
        if (link && aj.opettaja_link) {
          var linkSpan = link.querySelector('span');
          link.textContent = aj.opettaja_link;
          if (linkSpan) link.insertBefore(linkSpan, link.firstChild);
        }
      })();
    })();

    /* ── TET ── */
    (function () {
      var tet = g(g9, 'tet');
      if (!tet) return;

      setTxt('#tet h2#otsikko-tet', tet.h2);
      setTxt('#tet .aihe-otsikko p', tet.subtitle);
      setTxt('#tet .theory-card .theory-text p:first-of-type', tet.theory_p);
      setTxt('#tet .theory-card .theory-text strong', tet.theory_strong);

      /* "Klikkaa suurentaaksesi" -teksti (2 kuvaa) */
      if (tet.zoom_caption) {
        var zoomIcons = document.querySelectorAll('#tet .fa-magnifying-glass-plus');
        for (var i = 0; i < zoomIcons.length; i++) {
          var parentDiv = zoomIcons[i].parentNode;
          if (parentDiv) {
            /* Korvaa tekstisolmu ikonin jälkeen */
            var nodes = parentDiv.childNodes;
            for (var n = 0; n < nodes.length; n++) {
              if (nodes[n].nodeType === 3) {
                nodes[n].textContent = ' ' + tet.zoom_caption;
              }
            }
          }
        }
      }

      /* Dialog sulje kuva */
      var tetDlgClose = document.querySelector('#tetKuvaDialog .tet-dialog-sulje');
      if (tetDlgClose && tet.dialog_close) {
        tetDlgClose.setAttribute('aria-label', tet.dialog_close);
        tetDlgClose.textContent = '✕';
      }

      /* Duuniin! TET-peli */
      if (tet.duuniintet) {
        var du = tet.duuniintet;
        var hero = document.querySelector('#tet .duuniintet-hero');
        if (hero) {
          var badge = hero.querySelector('.duuniintet-badge');
          if (badge) {
            var icon = badge.querySelector('i');
            badge.textContent = du.badge;
            if (icon) badge.insertBefore(icon, badge.firstChild);
          }
          setTxt('#tet .duuniintet-hero h3', du.h3);
          setTxt('#tet .duuniintet-hero p', du.p);
          var openBtn = hero.querySelector('.btn-duuniintet');
          if (openBtn) {
            var icon2 = openBtn.querySelector('i');
            openBtn.textContent = du.btn_open;
            if (icon2) openBtn.insertBefore(icon2, openBtn.firstChild);
          }
        }
        var closeBtn = document.querySelector('#duuniintetContainer .duuniintet-sulje-btn');
        if (closeBtn) {
          var icon3 = closeBtn.querySelector('i');
          closeBtn.textContent = du.btn_close;
          if (icon3) closeBtn.insertBefore(icon3, closeBtn.firstChild);
        }
      }

      /* TET-jakson jälkeen */
      if (tet.tetjakso) {
        var tj = tet.tetjakso;
        var tetHero = document.querySelector('#tet-harjoittelu-tehtava');
        if (tetHero) {
          var badge = tetHero.querySelector('.tetjakso-badge');
          if (badge) {
            var icon = badge.querySelector('i');
            badge.textContent = tj.badge;
            if (icon) badge.insertBefore(icon, badge.firstChild);
          }
          setTxt('#tet-harjoittelu-tehtava h3', tj.h3);
          setTxt('#tet-harjoittelu-tehtava p', tj.p);
          var openBtn = tetHero.querySelector('.btn-tetjakso');
          if (openBtn) {
            var icon2 = openBtn.querySelector('i');
            openBtn.textContent = tj.btn_open;
            if (icon2) openBtn.insertBefore(icon2, openBtn.firstChild);
          }
        }
        var closeBtn = document.querySelector('#tetjaksoContainer .tetjakso-sulje-btn');
        if (closeBtn) {
          var icon3 = closeBtn.querySelector('i');
          closeBtn.textContent = tj.btn_close;
          if (icon3) closeBtn.insertBefore(icon3, closeBtn.firstChild);
        }
      }

      /* Miten minä opin? */
      if (tet.oppiminen) {
        var op = tet.oppiminen;
        /* Label (pieni yläotsikko) */
        (function () {
          var osio = document.getElementById('tetOppimisOsio');
          if (!osio) return;
          /* Yläotsikko-div: ensimmäinen lapsi-div:n sisällä oleva pieni teksti-div */
          var labelDiv = osio.querySelector('div > div > div:first-child');
          if (labelDiv && op.label) labelDiv.textContent = op.label;
          setTxt('#tetOppimisOsio h3', op.h3);
          setTxt('#tetOppimisOsio > p', op.p);
          /* Avaa-painike */
          var openBtn = osio.querySelector('button[onclick="toggleTetOppiminen(this)"]');
          if (openBtn && op.btn_open) {
            var span = openBtn.querySelector('span:first-child');
            if (span) {
              var icon = span.querySelector('i');
              span.textContent = op.btn_open;
              if (icon) span.insertBefore(icon, span.firstChild);
            }
          }
          /* Kysymykset */
          var q1 = osio.querySelector('label[for="tetOppiminen1"]');
          if (q1) q1.textContent = op.q1_label;
          var q1p = osio.querySelector('label[for="tetOppiminen1"] + p');
          if (q1p) {
            var q1strong = q1p.querySelectorAll('strong');
            q1p.textContent = op.q1_hint;
          }
          var q2 = osio.querySelector('label[for="tetOppiminen2"]');
          if (q2) q2.textContent = op.q2_label;
          var q2p = osio.querySelector('label[for="tetOppiminen2"] + p');
          if (q2p) q2p.textContent = op.q2_hint;
          var q3 = osio.querySelector('label[for="tetOppiminen3"]');
          if (q3) q3.textContent = op.q3_label;
          var q3p = osio.querySelector('label[for="tetOppiminen3"] + p');
          if (q3p) q3p.textContent = op.q3_hint;
          /* Bonus (details/summary) */
          var summary = osio.querySelector('details summary');
          if (summary && op.bonus_summary) {
            var starSpan = summary.querySelector('span:first-child');
            summary.textContent = op.bonus_summary;
            if (starSpan) summary.insertBefore(starSpan, summary.firstChild);
          }
          var bonusLabel = osio.querySelector('label[for="tetOppiminenBonus"]');
          if (bonusLabel) bonusLabel.textContent = op.bonus_label;
          var bonusP = osio.querySelector('label[for="tetOppiminenBonus"] + p');
          if (bonusP) bonusP.textContent = op.bonus_hint;
          /* Tip (loppuhuomio) */
          var tip = osio.querySelector('div[style*="border-left"]');
          if (tip && op.tip) {
            var tipIcon = tip.querySelector('i');
            var tipStrong = tip.querySelector('strong');
            /* Säilytetään Miksi tärkeää -strong osittain */
            tip.textContent = op.tip;
          }
        })();
      }

      /* DuuniMinä */
      if (tet.duunimina) {
        var dm = tet.duunimina;
        var hero = document.querySelector('.duunimina-hero');
        if (hero) {
          var badge = hero.querySelector('.duunimina-badge');
          if (badge) {
            var icon = badge.querySelector('i');
            badge.textContent = dm.badge;
            if (icon) badge.insertBefore(icon, badge.firstChild);
          }
          setTxt('.duunimina-hero h3', dm.h3);
          setTxt('.duunimina-hero p', dm.p);
          var openBtn = hero.querySelector('.btn-duunimina');
          if (openBtn) {
            var icon2 = openBtn.querySelector('i');
            openBtn.textContent = dm.btn_open;
            if (icon2) openBtn.insertBefore(icon2, openBtn.firstChild);
          }
        }
        var closeBtn = document.querySelector('.duunimina-sulje-btn');
        if (closeBtn) {
          var icon3 = closeBtn.querySelector('i');
          closeBtn.textContent = dm.btn_close;
          if (icon3) closeBtn.insertBefore(icon3, closeBtn.firstChild);
        }
      }

      /* Reppu */
      if (tet.reppu) {
        var rp = tet.reppu;
        var repHero = document.querySelector('#reppu-tehtava');
        if (repHero) {
          var badge = repHero.querySelector('.tetjakso-badge');
          if (badge) {
            var icon = badge.querySelector('i');
            badge.textContent = rp.badge;
            if (icon) badge.insertBefore(icon, badge.firstChild);
          }
          setTxt('#reppu-tehtava h3', rp.h3);
          setTxt('#reppu-tehtava p', rp.p);
          var openBtn = repHero.querySelector('.btn-tetjakso');
          if (openBtn) {
            var icon2 = openBtn.querySelector('i');
            openBtn.textContent = rp.btn_open;
            if (icon2) openBtn.insertBefore(icon2, openBtn.firstChild);
          }
        }
        var closeBtn = document.querySelector('#reppuContainer .tetjakso-sulje-btn');
        if (closeBtn) {
          var icon3 = closeBtn.querySelector('i');
          closeBtn.textContent = rp.btn_close;
          if (icon3) closeBtn.insertBefore(icon3, closeBtn.firstChild);
        }
      }

      /* Opettajan materiaali – TET */
      (function () {
        var el = document.querySelector('#tet .opettaja-toggle .opettaja-toggle-left span:last-child');
        if (el && tet.opettaja_btn) el.textContent = tet.opettaja_btn;
        var link = document.querySelector('#opettaja-sisalto-tet .opettaja-lataus');
        if (link && tet.opettaja_link) {
          var linkSpan = link.querySelector('span');
          link.textContent = tet.opettaja_link;
          if (linkSpan) link.insertBefore(linkSpan, link.firstChild);
        }
      })();
    })();

  /* ── Tapahtumakuuntelijat ── */
  document.addEventListener('digiopo:langchange', function (e) {
    applyG9(e.detail.t);
  });

  /* Jos käännökset on jo ladattu ennen tätä skriptiä */
  if (window.DIGIOPO_T) {
    applyG9(window.DIGIOPO_T);
  }

})();
