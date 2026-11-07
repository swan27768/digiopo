/**
 * DigiOpo – Vahvuuslämmittely: "Nouse seisomaan, jos…" (7. lk, Selviytymiskeino 3)
 *
 * Kortti näyttää yhden lauseen kerrallaan satunnaisessa järjestyksessä (ei toistoja
 * yhden kierroksen aikana). "Näytä vahvuus" paljastaa, mitä vahvuutta lause kuvaa.
 *
 * Lauseet luetaan sivun omista <li data-vahvuus="…">-elementeistä, jotta
 * käännökset (data-i18n) toimivat ilman erillistä dataa. Ilman JavaScriptiä lista
 * jää näkyviin tavallisena listana (.lammittely-js piilottaa sen vasta kun
 * ohjaimet ovat käytössä). Vahvuuden nimi haetaan sivun vahvuussanastosta.
 */
(function () {
  'use strict';

  var root = document.getElementById('vahvuuslammittely-mission');
  if (!root) return;
  var lauseet = root.querySelectorAll('ul.lammittely-lauseet > li');
  var n = lauseet.length;
  var elTeksti = root.querySelector('.lammittely-teksti');
  var elLaskuri = root.querySelector('.lammittely-laskuri');
  var elVahv = root.querySelector('.lammittely-vahvuus');
  var btnSeur = root.querySelector('[data-lammittely="seuraava"]');
  var btnPalj = root.querySelector('[data-lammittely="paljasta"]');
  var btnSuur = root.querySelector('[data-lammittely="suurenna"]');
  var elOhj = root.querySelector('.lammittely-ohjaimet');
  if (!n || !elOhj || !btnSuur || !elTeksti || !elLaskuri || !elVahv || !btnSeur || !btnPalj) return;

  var jono = [];
  var i = 0;              // montako lausetta on näytetty tällä kierroksella
  var nykyinen = -1;      // näytettävän lauseen indeksi
  var tila = 'alku';      // 'alku' | 'lause' | 'valmis'
  var naytetty = false;   // onko vahvuus paljastettu tälle lauseelle
  var suuri = false;      // onko suurennettu (koko näyttö) -tila päällä

  function t(key) {
    var el = root.querySelector('[data-i18n="vahvuuslammittely.' + key + '"]');
    return el ? el.textContent.trim() : '';
  }

  function sekoita() {
    jono = [];
    for (var k = 0; k < n; k++) jono.push(k);
    for (var a = n - 1; a > 0; a--) {
      var b = Math.floor(Math.random() * (a + 1));
      var tmp = jono[a]; jono[a] = jono[b]; jono[b] = tmp;
    }
    i = 0;
  }

  function vahvuudenNimi(li) {
    var avain = li.getAttribute('data-vahvuus');
    var el = document.querySelector('[data-i18n-html="vahvuussanasto.' + avain + '"] strong');
    return el ? el.textContent.trim() : '';
  }

  function piirra() {
    btnSeur.textContent = tila === 'valmis' ? t('alusta') : t('seuraava');
    btnPalj.textContent = t('paljasta');
    btnSuur.textContent = suuri ? t('pienenna') : t('suurenna');
    btnSuur.setAttribute('aria-pressed', suuri ? 'true' : 'false');
    if (tila === 'lause') {
      var li = lauseet[nykyinen];
      elTeksti.textContent = li.textContent.trim();
      elLaskuri.textContent = t('laskuri').replace('{n}', i).replace('{total}', n);
      if (naytetty) {
        elVahv.textContent = t('vahvuus') + ' ' + vahvuudenNimi(li);
        elVahv.hidden = false;
      } else {
        elVahv.hidden = true;
      }
      btnPalj.disabled = naytetty;
    } else {
      elTeksti.textContent = tila === 'valmis' ? t('loppu') : t('aloitus');
      elLaskuri.textContent = '';
      elVahv.hidden = true;
      btnPalj.disabled = true;
    }
  }

  function seuraava() {
    naytetty = false;
    if (tila === 'valmis') {
      sekoita();
      tila = 'alku';
    } else if (i >= n) {
      tila = 'valmis';
    } else {
      nykyinen = jono[i];
      i += 1;
      tila = 'lause';
    }
    piirra();
  }
  btnSeur.addEventListener('click', seuraava);

  btnPalj.addEventListener('click', function () {
    if (tila !== 'lause') return;
    naytetty = true;
    piirra();
  });

  // Suurenna: koko näytön tila heijastamista varten. Käytetään Fullscreen API:a
  // kun se on tuettu, ja muuten (esim. iPhone) koko ikkunan peittävää tilaa.
  function aseta(arvo) {
    suuri = arvo;
    elOhj.classList.toggle('lammittely-suuri', suuri);
    document.documentElement.classList.toggle('lammittely-lukittu', suuri);
    piirra();
  }

  function fsElementti() {
    return document.fullscreenElement || document.webkitFullscreenElement || null;
  }

  btnSuur.addEventListener('click', function () {
    if (!suuri) {
      aseta(true);
      var pyyda = elOhj.requestFullscreen || elOhj.webkitRequestFullscreen;
      if (pyyda) {
        try {
          var lupaus = pyyda.call(elOhj);
          if (lupaus && lupaus.catch) lupaus.catch(function () {});
        } catch (e) { /* jää koko ikkunan tilaan */ }
      }
    } else {
      var poistu = document.exitFullscreen || document.webkitExitFullscreen;
      if (fsElementti() && poistu) {
        try { poistu.call(document); } catch (e) {}
      }
      aseta(false);
    }
    btnSuur.focus();
  });

  function fsMuuttui() {
    // Käyttäjä poistui koko näytöstä Esc-näppäimellä
    if (suuri && !fsElementti() && elOhj.getAttribute('data-fs') === '1') aseta(false);
    elOhj.setAttribute('data-fs', fsElementti() ? '1' : '0');
  }
  document.addEventListener('fullscreenchange', fsMuuttui);
  document.addEventListener('webkitfullscreenchange', fsMuuttui);

  document.addEventListener('keydown', function (e) {
    if (!suuri) return;
    if (e.key === 'Escape') {
      aseta(false);
    } else if ((e.key === 'ArrowRight' || e.key === 'PageDown') && document.activeElement && !/^(BUTTON)$/.test(document.activeElement.tagName)) {
      e.preventDefault();
      seuraava();
    }
  });

  // Kielenvaihto: päivitä näkyvät tekstit uudelle kielelle
  document.addEventListener('digiopo:langchange', piirra);

  sekoita();
  root.classList.add('lammittely-js');
  piirra();
})();
