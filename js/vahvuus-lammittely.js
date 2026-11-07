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
  if (!n || !elTeksti || !elLaskuri || !elVahv || !btnSeur || !btnPalj) return;

  var jono = [];
  var i = 0;              // montako lausetta on näytetty tällä kierroksella
  var nykyinen = -1;      // näytettävän lauseen indeksi
  var tila = 'alku';      // 'alku' | 'lause' | 'valmis'
  var naytetty = false;   // onko vahvuus paljastettu tälle lauseelle

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

  btnSeur.addEventListener('click', function () {
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
  });

  btnPalj.addEventListener('click', function () {
    if (tila !== 'lause') return;
    naytetty = true;
    piirra();
  });

  // Kielenvaihto: päivitä näkyvät tekstit uudelle kielelle
  document.addEventListener('digiopo:langchange', piirra);

  sekoita();
  root.classList.add('lammittely-js');
  piirra();
})();
