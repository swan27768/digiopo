/*
 * Järjestä osiot -ikkuna (Google Forms -tyylinen)
 *
 * Käyttö:
 *   DigiopoJarjestys.avaa({
 *     osiot: [{ id: 'a', otsikko: 'Vahvuudet', piilotettu: false, lukittu: false },
 *             { id: 'b', otsikko: 'Valinnat',  piilotettu: true,  lukittu: true }],
 *     onTallenna: function (idJarjestys, piilotetutIdt, lukitutIdt) { ... },
 *                                                   // ['b', 'a'], ['b'], ['b']
 *     onPeruuta: function () { ... },               // valinnainen
 *     piilotus: true,                               // false = ei Piilota-nappeja (oletus true)
 *     lukitus: true,                                // false = ei Lukitse-nappeja (oletus true)
 *     tekstit: { otsikko: 'Järjestä osiot' }        // valinnainen, i18n-ylikirjoitus
 *   });
 *
 * - Nuolipainikkeet siirtävät osiota yhden paikan (toimii hyvin puhelimella ja näppäimistöllä).
 * - Piilota / Tuo näkyviin: piilotettu osio ei näy oppilaalle lainkaan.
 * - Lukitse / Avaa lukitus: lukittu osio näkyy otsikkona + viestinä, sisältö on kiinni.
 * - Kahvasta voi edelleen raahata (hiiri + kosketus).
 * - Mikään ei tallennu ennen kuin painetaan Tallenna; Peruuta ja Esc hylkäävät muutokset.
 * - Tiedosto ei riipu muista kirjastoista eikä oleta mitään sivun elementtejä.
 */
(function (global) {
  'use strict';

  var OLETUSTEKSTIT = {
    otsikko: 'Järjestä osiot',
    sija: 'Osio {n} / {m}',
    ylos: 'Siirrä ylös: {nimi}',
    alas: 'Siirrä alas: {nimi}',
    kahva: 'Raahaa siirtääksesi: {nimi}',
    peruuta: 'Peruuta',
    tallenna: 'Tallenna',
    siirretty: '{nimi} siirretty paikalle {n} / {m}',
    ohje: 'Siirrä osioita nuolilla tai raahaa kahvasta. Piilotettua osiota oppilaat eivät näe.',
    piilota: 'Piilota',
    naytaNappi: 'Tuo näkyviin',
    piilotaAria: 'Piilota oppilailta: {nimi}',
    naytaAria: 'Tuo näkyviin oppilaille: {nimi}',
    piilotettuTeksti: 'Piilotettu oppilailta',
    piilotettuIlmoitus: '{nimi} piilotettu oppilailta',
    naytettyIlmoitus: '{nimi} tuotu näkyviin',
    kaikkiPiilossa: 'Kaikki osiot on piilotettu. Oppilaat näkevät tyhjän sivun.',
    lukitse: 'Lukitse',
    avaaLukitus: 'Avaa lukitus',
    lukitseAria: 'Lukitse oppilailta: {nimi}',
    avaaLukitusAria: 'Avaa lukitus oppilaille: {nimi}',
    lukittuTeksti: 'Lukittu',
    lukittuIlmoitus: '{nimi} lukittu',
    lukitusAvattuIlmoitus: '{nimi}: lukitus avattu',
    alavihje: ''
  };

  var SVG_YLOS = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 15l6-6 6 6"/></svg>';
  var SVG_ALAS = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 9l6 6 6-6"/></svg>';
  var SVG_SILMA = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
    '<path d="M1.5 12S5.5 5 12 5s10.5 7 10.5 7-4 7-10.5 7S1.5 12 1.5 12z"/><circle cx="12" cy="12" r="3"/></svg>';
  var SVG_SILMA_POIS = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
    '<path d="M1.5 12S5.5 5 12 5s10.5 7 10.5 7-4 7-10.5 7S1.5 12 1.5 12z"/><circle cx="12" cy="12" r="3"/>' +
    '<path d="M4 4l16 16"/></svg>';
  var SVG_LUKKO = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
    '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
  var SVG_LUKKO_AUKI = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
    '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 7.5-2"/></svg>';
  var SVG_KAHVA = '<svg viewBox="0 0 14 22" aria-hidden="true" focusable="false">' +
    '<circle cx="3" cy="3" r="1.8"/><circle cx="11" cy="3" r="1.8"/>' +
    '<circle cx="3" cy="11" r="1.8"/><circle cx="11" cy="11" r="1.8"/>' +
    '<circle cx="3" cy="19" r="1.8"/><circle cx="11" cy="19" r="1.8"/></svg>';

  var laskuri = 0;

  function el(tag, luokka, teksti) {
    var e = document.createElement(tag);
    if (luokka) e.className = luokka;
    if (teksti != null) e.textContent = teksti;
    return e;
  }

  function avaa(valinnat) {
    valinnat = valinnat || {};
    var osiot = valinnat.osiot || [];
    var tekstit = {};
    var k;
    for (k in OLETUSTEKSTIT) tekstit[k] = OLETUSTEKSTIT[k];
    for (k in (valinnat.tekstit || {})) tekstit[k] = valinnat.tekstit[k];

    function t(avain, arvot) {
      var s = tekstit[avain] || '';
      for (var a in (arvot || {})) s = s.split('{' + a + '}').join(arvot[a]);
      return s;
    }

    if (typeof HTMLDialogElement === 'undefined') {
      // Hyvin vanha selain: ei kaadeta sivua, jätetään järjestys ennalleen
      if (valinnat.onPeruuta) valinnat.onPeruuta();
      return null;
    }

    var piilotusKaytossa = valinnat.piilotus !== false;
    var lukitusKaytossa = valinnat.lukitus !== false;
    var tunniste = 'jo-otsikko-' + (++laskuri);
    var ohjeTunniste = 'jo-ohje-' + laskuri;
    var tallennettu = false;

    var dialogi = el('dialog', 'jo-ikkuna');
    dialogi.setAttribute('aria-labelledby', tunniste);
    dialogi.setAttribute('aria-describedby', ohjeTunniste);

    var otsikko = el('h2', 'jo-otsikko', t('otsikko'));
    otsikko.id = tunniste;
    dialogi.appendChild(otsikko);

    var ohjeTeksti = (piilotusKaytossa || lukitusKaytossa) ? t('ohje') : '';
    var ohje = el('p', 'jo-ohje', ohjeTeksti);
    ohje.id = ohjeTunniste;
    if (!ohjeTeksti) ohje.hidden = true;
    dialogi.appendChild(ohje);

    var lista = el('ul', 'jo-lista');
    dialogi.appendChild(lista);

    var kuulutus = el('div', 'jo-kuulutus');
    kuulutus.setAttribute('role', 'status');
    kuulutus.setAttribute('aria-live', 'polite');
    dialogi.appendChild(kuulutus);

    // Näkyvä varoitus jos kaikki osiot piilotetaan (ei estä tallennusta)
    var varoitus = el('div', 'jo-varoitus', t('kaikkiPiilossa'));
    varoitus.setAttribute('role', 'status');
    varoitus.hidden = true;
    dialogi.appendChild(varoitus);

    // Valinnainen vihje alareunassa (esim. "muutokset näkyvät oppilaille vasta julkaisun jälkeen")
    if (t('alavihje')) dialogi.appendChild(el('p', 'jo-alavihje', t('alavihje')));

    var toiminnot = el('div', 'jo-toiminnot');
    var peruutaNappi = el('button', 'jo-nappi jo-peruuta', t('peruuta'));
    peruutaNappi.type = 'button';
    var tallennaNappi = el('button', 'jo-nappi jo-tallenna', t('tallenna'));
    tallennaNappi.type = 'button';
    toiminnot.appendChild(peruutaNappi);
    toiminnot.appendChild(tallennaNappi);
    dialogi.appendChild(toiminnot);

    function rivit() {
      return Array.prototype.slice.call(lista.children);
    }

    // Päivittää numeroinnin, nuolten tilat ja saavutettavuusnimet DOM-järjestyksen mukaan
    function onPiilossa(rivi) {
      return rivi.getAttribute('data-piilotettu') === '1';
    }
    function onLukossa(rivi) {
      return rivi.getAttribute('data-lukittu') === '1';
    }

    function paivita() {
      var kaikki = rivit();
      var m = kaikki.length;
      var piilossa = 0;
      kaikki.forEach(function (rivi, i) {
        var nimi = rivi.getAttribute('data-nimi');
        var piilo = onPiilossa(rivi);
        if (piilo) piilossa++;
        var lukossa = onLukossa(rivi);
        rivi.classList.toggle('jo-piilotettu', piilo);
        rivi.classList.toggle('jo-lukittu', lukossa);
        // Tila kerrotaan tekstillä, ei vain värillä tai himmennyksellä
        rivi.querySelector('.jo-sija').textContent = t('sija', { n: i + 1, m: m }) +
          (piilo ? ' · ' + t('piilotettuTeksti') : '') +
          (lukossa ? ' · ' + t('lukittuTeksti') : '');
        var ylos = rivi.querySelector('.jo-ylos');
        var alas = rivi.querySelector('.jo-alas');
        ylos.disabled = (i === 0);
        alas.disabled = (i === m - 1);
        ylos.setAttribute('aria-label', t('ylos', { nimi: nimi }));
        alas.setAttribute('aria-label', t('alas', { nimi: nimi }));
        rivi.querySelector('.jo-kahva').setAttribute('aria-label', t('kahva', { nimi: nimi }));

        var nakyvyys = rivi.querySelector('.jo-piilotus');
        if (nakyvyys) {
          var teksti = piilo ? t('naytaNappi') : t('piilota');
          nakyvyys.querySelector('.jo-nakyvyys-teksti').textContent = teksti;
          nakyvyys.querySelector('.jo-nakyvyys-kuva').innerHTML = piilo ? SVG_SILMA : SVG_SILMA_POIS;
          nakyvyys.setAttribute('aria-label', t(piilo ? 'naytaAria' : 'piilotaAria', { nimi: nimi }));
          nakyvyys.title = teksti;
        }

        var lukitus = rivi.querySelector('.jo-lukitus');
        if (lukitus) {
          var lukkoTeksti = lukossa ? t('avaaLukitus') : t('lukitse');
          lukitus.querySelector('.jo-nakyvyys-teksti').textContent = lukkoTeksti;
          lukitus.querySelector('.jo-nakyvyys-kuva').innerHTML = lukossa ? SVG_LUKKO_AUKI : SVG_LUKKO;
          lukitus.setAttribute('aria-label', t(lukossa ? 'avaaLukitusAria' : 'lukitseAria', { nimi: nimi }));
          lukitus.title = lukkoTeksti;
        }
      });
      varoitus.hidden = !(m > 0 && piilossa === m);
    }

    function ilmoita(rivi) {
      var kaikki = rivit();
      kuulutus.textContent = t('siirretty', {
        nimi: rivi.getAttribute('data-nimi'),
        n: kaikki.indexOf(rivi) + 1,
        m: kaikki.length
      });
    }

    function korosta(rivi) {
      rivi.classList.remove('jo-juuri-siirretty');
      void rivi.offsetWidth; // käynnistää animaation uudelleen
      rivi.classList.add('jo-juuri-siirretty');
    }

    function siirra(rivi, suunta, mihinNappiin) {
      if (suunta < 0) {
        var edellinen = rivi.previousElementSibling;
        if (!edellinen) return;
        lista.insertBefore(rivi, edellinen);
      } else {
        var seuraava = rivi.nextElementSibling;
        if (!seuraava) return;
        lista.insertBefore(seuraava, rivi);
      }
      paivita();
      korosta(rivi);
      ilmoita(rivi);
      // Pidä fokus samassa napissa; jos se meni pois käytöstä (reuna), vaihda vastakkaiseen
      var nappi = rivi.querySelector(mihinNappiin);
      if (nappi.disabled) {
        nappi = rivi.querySelector(mihinNappiin === '.jo-ylos' ? '.jo-alas' : '.jo-ylos');
      }
      nappi.focus();
    }

    function luoRivi(osio) {
      var rivi = el('li', 'jo-rivi');
      rivi.setAttribute('data-id', osio.id);
      rivi.setAttribute('data-nimi', osio.otsikko);
      rivi.setAttribute('data-piilotettu', osio.piilotettu ? '1' : '0');
      rivi.setAttribute('data-lukittu', osio.lukittu ? '1' : '0');

      var kahva = el('button', 'jo-kahva');
      kahva.type = 'button';
      kahva.innerHTML = SVG_KAHVA;

      var teksti = el('div', 'jo-teksti');
      teksti.appendChild(el('div', 'jo-nimi', osio.otsikko));
      teksti.appendChild(el('div', 'jo-sija'));

      var nuolet = el('div', 'jo-nuolet');
      var ylos = el('button', 'jo-nuoli jo-ylos');
      ylos.type = 'button';
      ylos.innerHTML = SVG_YLOS;
      var alas = el('button', 'jo-nuoli jo-alas');
      alas.type = 'button';
      alas.innerHTML = SVG_ALAS;
      nuolet.appendChild(ylos);
      nuolet.appendChild(alas);

      ylos.addEventListener('click', function () { siirra(rivi, -1, '.jo-ylos'); });
      alas.addEventListener('click', function () { siirra(rivi, 1, '.jo-alas'); });

      // Osion tilanapit (Piilota, Lukitse) omalla rivillään nimen alla: näin ne mahtuvat
      // myös puhelimelle eikä otsikko jää kapeaksi.
      var valinnatRyhma = el('div', 'jo-valinnat');
      teksti.appendChild(valinnatRyhma);

      var nakyvyys = null;
      if (piilotusKaytossa) {
        nakyvyys = el('button', 'jo-nakyvyys jo-piilotus');
        nakyvyys.type = 'button';
        nakyvyys.appendChild(el('span', 'jo-nakyvyys-kuva'));
        nakyvyys.appendChild(el('span', 'jo-nakyvyys-teksti'));
        nakyvyys.addEventListener('click', function () {
          var piiloon = !onPiilossa(rivi);
          rivi.setAttribute('data-piilotettu', piiloon ? '1' : '0');
          paivita();
          korosta(rivi);
          kuulutus.textContent = t(piiloon ? 'piilotettuIlmoitus' : 'naytettyIlmoitus', {
            nimi: rivi.getAttribute('data-nimi')
          });
          // Nappi pysyy samassa paikassa, joten fokus säilyy siinä
        });
        valinnatRyhma.appendChild(nakyvyys);
      }

      if (lukitusKaytossa) {
        var lukitus = el('button', 'jo-nakyvyys jo-lukitus');
        lukitus.type = 'button';
        lukitus.appendChild(el('span', 'jo-nakyvyys-kuva'));
        lukitus.appendChild(el('span', 'jo-nakyvyys-teksti'));
        lukitus.addEventListener('click', function () {
          var lukkoon = !onLukossa(rivi);
          rivi.setAttribute('data-lukittu', lukkoon ? '1' : '0');
          paivita();
          korosta(rivi);
          kuulutus.textContent = t(lukkoon ? 'lukittuIlmoitus' : 'lukitusAvattuIlmoitus', {
            nimi: rivi.getAttribute('data-nimi')
          });
        });
        valinnatRyhma.appendChild(lukitus);
      }

      // Raahaus kahvasta (pointer events: toimii hiirellä ja kosketuksella)
      kahva.addEventListener('pointerdown', function (e) {
        if (e.button != null && e.button !== 0) return;
        e.preventDefault();
        kahva.setPointerCapture(e.pointerId);
        rivi.classList.add('jo-raahataan');
      });
      kahva.addEventListener('pointermove', function (e) {
        if (!rivi.classList.contains('jo-raahataan')) return;
        var kohde = document.elementFromPoint(e.clientX, e.clientY);
        kohde = kohde && kohde.closest ? kohde.closest('.jo-rivi') : null;
        if (!kohde || kohde === rivi || kohde.parentNode !== lista) return;
        // Siirretään KOHDE raahattavan ympärille, ei raahattavaa itseään: DOM-siirto
        // irrottaisi raahattavan rivin kahvan pointer capturesta kesken raahauksen.
        var kaikki = rivit();
        if (kaikki.indexOf(rivi) > kaikki.indexOf(kohde)) {
          lista.insertBefore(kohde, rivi.nextSibling); // raahataan ylös
        } else {
          lista.insertBefore(kohde, rivi); // raahataan alas
        }
        paivita();
      });
      function lopetaRaahaus() {
        if (!rivi.classList.contains('jo-raahataan')) return;
        rivi.classList.remove('jo-raahataan');
        ilmoita(rivi);
      }
      kahva.addEventListener('pointerup', lopetaRaahaus);
      kahva.addEventListener('pointercancel', lopetaRaahaus);

      // Näppäimistö kahvalla: nuoli ylös / alas siirtää myös
      kahva.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowUp') { e.preventDefault(); siirra(rivi, -1, '.jo-kahva'); }
        if (e.key === 'ArrowDown') { e.preventDefault(); siirra(rivi, 1, '.jo-kahva'); }
      });

      rivi.appendChild(kahva);
      rivi.appendChild(teksti);
      rivi.appendChild(nuolet);
      return rivi;
    }

    osiot.forEach(function (osio) { lista.appendChild(luoRivi(osio)); });
    paivita();

    function sulje() {
      if (dialogi.open) dialogi.close();
    }

    peruutaNappi.addEventListener('click', sulje);
    tallennaNappi.addEventListener('click', function () {
      tallennettu = true;
      sulje();
    });

    // Klikkaus taustaan sulkee (kuten Peruuta)
    dialogi.addEventListener('click', function (e) {
      if (e.target === dialogi) sulje();
    });

    // close laukeaa myös Esc-näppäimestä
    dialogi.addEventListener('close', function () {
      var jarjestys = rivit().map(function (r) { return r.getAttribute('data-id'); });
      var piilotetut = rivit().filter(onPiilossa).map(function (r) { return r.getAttribute('data-id'); });
      var lukitut = rivit().filter(onLukossa).map(function (r) { return r.getAttribute('data-id'); });
      if (dialogi.parentNode) dialogi.parentNode.removeChild(dialogi);
      if (tallennettu) {
        if (valinnat.onTallenna) valinnat.onTallenna(jarjestys, piilotetut, lukitut);
      } else if (valinnat.onPeruuta) {
        valinnat.onPeruuta();
      }
    });

    document.body.appendChild(dialogi);
    dialogi.showModal();
    // Fokus ensimmäiseen käytössä olevaan nuoleen
    var ensimmainen = dialogi.querySelector('.jo-nuoli:not(:disabled)') || tallennaNappi;
    ensimmainen.focus();

    return dialogi;
  }

  global.DigiopoJarjestys = { avaa: avaa };
})(window);
