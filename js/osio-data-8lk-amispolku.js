/* ══ 8. lk · Oma reitti löytyy tutkimalla · Amispolku Vaihe 3 ══
   Osa 1 "Totta vai tarua?": oppilas arvaa ensin, sitten näkee selityksen.
   Osa 2 "Rakenna oma amispolkusi": kolme valintaa → oma kortti palautukseen.
   Tila: localStorage dg8-amis-v3 (vastaukset) ja dg8-amis-v3-valmis ("1" kun tallennettu).
   Yhteenveto (8luokka.html: tarkistaAmisYhteenveto) aukeaa, kun tämä ja Vaihe 2 ovat valmiit.
   Käännökset: valinnainen ylikirjoitus DIGIOPO_T.g8.tutkija.v3 (sama rakenne kuin FI). */
(function () {
  'use strict';

  var FI = {
    ui: {
      osa1: 'Osa 1: Totta vai tarua?',
      osa1_ohje: 'Lue väite. Valitse, onko se mielestäsi totta vai tarua. Sen jälkeen näet, miten asia oikeasti on.',
      totta: 'Totta', tarua: 'Tarua',
      oikein: 'Osuit oikeaan!', vaarin: 'Ei ihan – moni luulee samoin.',
      vaite_on: 'Väite on',
      laskuri: '{n}/{m} vastattu',
      lue_lisaa: 'Lue lisää',
      tulos: 'Osuit oikeaan {k}/{m}.',
      tulos_kaikki: 'Huippua – tiedät amiksesta jo paljon!',
      tulos_hyva: 'Hyvin meni! Pari asiaa varmaan yllätti.',
      tulos_muu: 'Nyt tiedät amiksesta paljon enemmän kuin äsken. Juuri sitä varten väitteet olivat täällä.',
      seuraavaksi: 'Seuraavaksi: rakenna oma amispolkusi.',
      osa2: 'Osa 2: Rakenna oma amispolkusi',
      osa2_ohje: 'Valitse joka kohdasta se, mikä tuntuu nyt sopivalta. Valinnat eivät sido sinua mihinkään – mieltä saa muuttaa.',
      selvita: 'Mitä haluaisit vielä selvittää amiksesta? (vapaaehtoinen)',
      selvita_esim: 'Esim. Paljonko kokki tienaa? Missä voi opiskella lähellä kotia?',
      kortti_otsikko: 'Oma amispolkuni',
      k_ala: 'Ala, joka kiinnostaa', k_tt: 'Totta vai tarua',
      k_selvita: 'Haluan vielä selvittää',
      ala_auki: 'Vielä auki',
      puuttuu: 'Valitse vielä vastaus jokaiseen kolmeen kohtaan.',
      valmis: 'Valmis – tallenna polkuni',
      tallennettu: '✓ Tallennettu!',
      lataa: 'Lataa polkuni PDF:nä',
      lataa_ohje: 'Tallenna PDF omalle koneellesi ja palauta se opolle Classroomiin.',
      lataa_virhe: 'PDF:n teko ei onnistunut, joten polku latautui tekstitiedostona. Palauta se Classroomiin.',
      nimi: 'Nimesi (näkyy vain PDF:ssä, vapaaehtoinen)',
      pdf_ala: 'DigiOpo · 8. luokka · Oma reitti löytyy tutkimalla',
      pdf_pvm: 'Päivämäärä', pdf_nimi: 'Nimi',
      pdf_polku: 'Polkuni', pdf_tt: 'Totta vai tarua – vastaukseni',
      pdf_vastasin: 'Vastasin', pdf_oikein: 'oikein', pdf_vaarin: 'oikea vastaus',
      pdf_loppu: 'Palauta tämä tiedosto opinto-ohjaajalle Classroomiin.',
      tyhjenna: 'Tyhjennä vastaukset',
      tyhjenna_varmista: 'Haluatko varmasti tyhjentää Vaihe 3:n vastaukset?',
      erityis_nappi: 'Katso erityisammattioppilaitokset ↓',
      erityis_piilota: 'Piilota erityisammattioppilaitokset ↑'
    },
    vaitteet: [
      { id: 'yliopisto', vaite: 'Amiksesta ei pääse yliopistoon.', oikea: 'tarua',
        selitys: 'Ammatillinen perustutkinto antaa oikeuden hakea ammattikorkeakouluun ja yliopistoon – ihan kuten lukio. Osa jatkaa opiskelua heti, osa käy ensin töissä.',
        linkki: 'https://opintopolku.fi/konfo/fi/sivu/opinnot-ammatillisessa-koulutuksessa' },
      { id: 'yto', vaite: 'Amiksessa opiskellaan myös matikkaa ja kieliä.', oikea: 'totta',
        selitys: 'Jokaiseen tutkintoon kuuluu yhteisiä opintoja eli YTO-aineita: matikkaa, äidinkieltä, ruotsia, englantia sekä yhteiskunta- ja työelämätaitoja. Niitä on noin viidesosa opinnoista.',
        linkki: 'https://opintopolku.fi/konfo/fi/sivu/opinnot-ammatillisessa-koulutuksessa' },
      { id: 'oppisopimus', vaite: 'Oppisopimuksella opiskelija saa palkkaa.', oikea: 'totta',
        selitys: 'Oppisopimuksessa olet töissä ja opiskelet samalla. Työnantaja maksaa sinulle palkkaa. Työpaikka pitää yleensä etsiä itse, mutta oppilaitos auttaa.',
        linkki: 'https://oppisopimus.fi/' },
      { id: 'tyopaikka', vaite: 'Työpaikalla oppiessa keität lähinnä kahvia.', oikea: 'tarua',
        selitys: 'Työpaikalla teet alan oikeita töitä, ja sinulla on oma ohjaaja. Osaaminen arvioidaan näytöissä: teet työtehtäviä ja näytät, mitä osaat. Monen mielestä tämä on amiksen paras osa.' },
      { id: 'yo', vaite: 'Amiksessa voi myös kirjoittaa ylioppilaaksi.', oikea: 'totta',
        selitys: 'Kaksoistutkinnossa teet ammatillisen tutkinnon ja lisäksi lukio-opintoja ja yo-kirjoitukset. Yo-tutkintoon kuuluu vähintään viisi koetta. Opiskelu kestää yleensä 3–4 vuotta.',
        linkki: 'https://opintopolku.fi/konfo/fi/sivu/kaksoistutkinto' },
      { id: 'tuki', vaite: 'Jos opiskelu tuntuu vaikealta, amiksessa ei saa apua.', oikea: 'tarua',
        selitys: 'Apua saat esimerkiksi opettajilta, opinto-ohjaajalta ja erityisopettajalta. Jos tarvitset paljon tukea, voit hakea myös erityisammattioppilaitokseen. Siellä ryhmät ovat pienempiä.',
        erityis: true }
    ],
    kysymykset: [
      { id: 'oppiminen', kysymys: 'Miten haluaisit oppia?', kortti: 'Näin haluan oppia', vaihtoehdot: [
        { id: 'oppilaitos', teksti: 'Oppilaitoksessa ja välillä työpaikalla', kortti: 'Oppilaitoksessa ja työpaikalla',
          selitys: 'Näin moni amislainen opiskelee. Opit oppilaitoksessa, ja välillä olet työpaikalla tekemässä alan töitä.' },
        { id: 'oppisopimus', teksti: 'Enimmäkseen töissä ja palkkaa saaden', kortti: 'Oppisopimuksella töissä',
          selitys: 'Silloin oppisopimus voi sopia sinulle. Olet töissä, saat palkkaa ja opiskelet samalla.' },
        { id: 'eos', teksti: 'En tiedä vielä', kortti: 'Vielä auki',
          selitys: 'Ei haittaa. Oppisopimukseen voi siirtyä myös kesken opintojen.' } ] },
      { id: 'yo', kysymys: 'Haluaisitko myös yo-tutkinnon?', kortti: 'Tutkinto', vaihtoehdot: [
        { id: 'kaksois', teksti: 'Kyllä, kaksoistutkinto kiinnostaa', kortti: 'Kaksoistutkinto (ammatti + yo)',
          selitys: 'Kerro siitä jo yhteishaussa tai kysy oppilaitoksesta. Kaksoistutkinto vie yleensä 3–4 vuotta ja vaatii vähän enemmän työtä.' },
        { id: 'ammatti', teksti: 'En, keskityn ammattiin', kortti: 'Ammatillinen perustutkinto',
          selitys: 'Hyvä valinta sekin. Ammatillisella tutkinnolla voit hakea myös jatko-opintoihin.' },
        { id: 'eos', teksti: 'En tiedä vielä', kortti: 'Vielä auki',
          selitys: 'Ei tarvitse päättää nyt. Kaksoistutkinnon voi valita myös opintojen aikana.' } ] },
      { id: 'jatko', kysymys: 'Mitä voisit tehdä valmistumisen jälkeen?', kortti: 'Valmistumisen jälkeen', vaihtoehdot: [
        { id: 'toihin', teksti: 'Mennä töihin', kortti: 'Töihin omalle alalle',
          selitys: 'Amiksesta pääset suoraan töihin omalle alallesi. Joskus työpaikka löytyy sieltä, missä olit oppimassa.' },
        { id: 'opiskelu', teksti: 'Jatkaa opiskelua', kortti: 'Jatko-opintoihin (AMK tai yliopisto)',
          selitys: 'Voit hakea ammattikorkeakouluun tai yliopistoon. Voit myös opiskella lisää myöhemmin töiden ohessa.' },
        { id: 'eos', teksti: 'En tiedä vielä', kortti: 'Vielä auki',
          selitys: 'Ihan ok. Moni päättää vasta opintojen lopussa – ja suunta voi muuttua myöhemminkin.' } ] }
    ]
  };

  var AVAIN = 'dg8-amis-v3', VALMIS = 'dg8-amis-v3-valmis';

  /* ── apurit ── */
  function yhdista(a, b) {
    if (!b || typeof b !== 'object') return a;
    if (Array.isArray(a)) return a.map(function (x, i) { return yhdista(x, b[i]); });
    var o = {};
    Object.keys(a).forEach(function (k) {
      o[k] = (a[k] && typeof a[k] === 'object') ? yhdista(a[k], b[k]) : (b[k] != null && b[k] !== '' ? b[k] : a[k]);
    });
    return o;
  }
  function D() {
    var t = window.DIGIOPO_T && window.DIGIOPO_T.g8 && window.DIGIOPO_T.g8.tutkija;
    return yhdista(FI, t && t.v3);
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  function f(s, o) { return s.replace(/\{(\w+)\}/g, function (_, k) { return o[k]; }); }
  function lue() {
    try { var v = JSON.parse(localStorage.getItem(AVAIN) || 'null'); if (v && typeof v === 'object') return { tt: v.tt || {}, polku: v.polku || {}, selvita: v.selvita || '', nimi: v.nimi || '' }; } catch (e) {}
    return { tt: {}, polku: {}, selvita: '', nimi: '' };
  }
  function tallenna() { try { localStorage.setItem(AVAIN, JSON.stringify(tila)); } catch (e) {} }
  function onValmis() { try { return localStorage.getItem(VALMIS) === '1'; } catch (e) { return false; } }
  function $(id) { return document.getElementById(id); }

  var tila = lue();

  function pisteet(d) {
    var k = 0, n = 0;
    d.vaitteet.forEach(function (v) { if (tila.tt[v.id]) { n++; if (tila.tt[v.id] === v.oikea) k++; } });
    return { k: k, n: n, m: d.vaitteet.length };
  }
  function polkuValmis(d) { return d.kysymykset.every(function (q) { return !!tila.polku[q.id]; }); }
  function valinta(q, id) { for (var i = 0; i < q.vaihtoehdot.length; i++) if (q.vaihtoehdot[i].id === id) return q.vaihtoehdot[i]; return null; }

  function alaTeksti(d) {
    var nimet = [];
    try {
      var valmiit = JSON.parse(localStorage.getItem('dg8-amis-tarina-valmis') || '[]');
      if (typeof AMIS_V3_NIMET !== 'undefined') valmiit.forEach(function (a) { if (AMIS_V3_NIMET[a]) nimet.push(typeof alaNimi === 'function' ? alaNimi(a) : AMIS_V3_NIMET[a]); });
    } catch (e) {}
    if (!nimet.length) {
      document.querySelectorAll('#tutkija-amis .tj-nappi.valittu-amis').forEach(function (b) { nimet.push(b.textContent.trim()); });
    }
    return nimet.length ? nimet.join(', ') : d.ui.ala_auki;
  }

  /* ── Osa 1: väitteet ── */
  function piirraVaitteet(d) {
    var lista = $('amis-tt-lista');
    if (!lista) return;
    /* Erityisammattioppilaitosten paneeli talteen ennen listan uudelleenpiirtoa */
    var er = $('erityis-sisalto'), varasto = $('amis-erityis-varasto');
    if (er && varasto && er.parentNode !== varasto) varasto.appendChild(er);
    lista.innerHTML = d.vaitteet.map(function (v, i) {
      var vas = tila.tt[v.id];
      var nappi = function (arvo, teksti) {
        var cls = 'amis-tt-nappi' + (vas === arvo ? ' valittu' : '') + (vas && arvo === v.oikea ? ' oikea' : '');
        return '<button type="button" class="' + cls + '" data-vaite="' + v.id + '" data-arvo="' + arvo + '"' +
          (vas ? ' aria-disabled="true"' : '') + ' aria-pressed="' + (vas === arvo) + '">' + esc(teksti) + '</button>';
      };
      var palaute = '';
      if (vas) {
        var ok = vas === v.oikea;
        palaute = '<p class="amis-tt-otsake ' + (ok ? 'ok' : 'ei') + '"><span aria-hidden="true">' + (ok ? '✓ ' : '✗ ') + '</span>' +
          esc(ok ? d.ui.oikein : d.ui.vaarin) + ' ' + esc(d.ui.vaite_on) + ' <strong>' + esc(v.oikea === 'totta' ? d.ui.totta : d.ui.tarua).toLowerCase() + '</strong>.</p>' +
          '<p>' + esc(v.selitys) + '</p>' +
          (v.linkki ? '<p><a href="' + esc(v.linkki) + '" target="_blank" rel="noopener">' + esc(d.ui.lue_lisaa) + ' →</a></p>' : '') +
          (v.erityis ? '<p><button type="button" class="amis-tt-erityis" data-erityis="1" aria-controls="erityis-sisalto" aria-expanded="false">' + esc(d.ui.erityis_nappi) + '</button></p>' : '');
      }
      return '<li class="amis-tt-kortti' + (vas ? ' vastattu ' + (vas === v.oikea ? 'tulos-ok' : 'tulos-ei') : '') + '">' +
        '<p class="amis-tt-vaite"><span class="amis-tt-nro" aria-hidden="true">' + (i + 1) + '</span>' + esc(v.vaite) + '</p>' +
        '<div class="amis-tt-napit" role="group" aria-label="' + esc(v.vaite) + '">' + nappi('totta', d.ui.totta) + nappi('tarua', d.ui.tarua) + '</div>' +
        '<div class="amis-tt-palaute" id="amis-tt-palaute-' + v.id + '" aria-live="polite"' + (vas ? '' : ' hidden') + '>' + palaute + '</div>' +
        (vas && v.erityis ? '<div class="amis-erityis-paikka"></div>' : '') +
        '</li>';
    }).join('');
    kiinnitaErityis(d);

    var p = pisteet(d);
    var laskuri = $('amis-tt-laskuri');
    if (laskuri) laskuri.textContent = f(d.ui.laskuri, { n: p.n, m: p.m });
    var tulos = $('amis-tt-tulos');
    var polku = $('amis-polku');
    var kaikki = p.n === p.m;
    if (tulos) {
      tulos.hidden = !kaikki;
      if (kaikki) {
        var kom = p.k === p.m ? d.ui.tulos_kaikki : (p.k >= p.m - 2 ? d.ui.tulos_hyva : d.ui.tulos_muu);
        tulos.innerHTML = '<strong>' + esc(f(d.ui.tulos, { k: p.k, m: p.m })) + '</strong> ' + esc(kom) + '<br>' + esc(d.ui.seuraavaksi) + ' <span aria-hidden="true">↓</span>';
      }
    }
    if (polku) polku.hidden = !kaikki;
  }

  /* ── Osa 2: oma polku ── */
  function piirraPolku(d) {
    var alue = $('amis-polku-kysymykset');
    if (!alue) return;
    alue.innerHTML = d.kysymykset.map(function (q, qi) {
      var val = valinta(q, tila.polku[q.id]);
      return '<fieldset class="amis-polku-kys"><legend><span class="amis-tt-nro" aria-hidden="true">' + (qi + 1) + '</span>' + esc(q.kysymys) + '</legend>' +
        '<div class="amis-polku-napit">' + q.vaihtoehdot.map(function (vv) {
          var on = tila.polku[q.id] === vv.id;
          return '<button type="button" class="amis-polku-nappi' + (on ? ' valittu' : '') + '" data-kys="' + q.id + '" data-vaihto="' + vv.id + '" aria-pressed="' + on + '">' + esc(vv.teksti) + '</button>';
        }).join('') + '</div>' +
        '<p class="amis-polku-selitys" aria-live="polite"' + (val ? '' : ' hidden') + '>' + (val ? esc(val.selitys) : '') + '</p>' +
        '</fieldset>';
    }).join('');
    var ta = $('amis-polku-selvita');
    if (ta && document.activeElement !== ta) ta.value = tila.selvita || '';
    var ni = $('amis-polku-nimi');
    if (ni && document.activeElement !== ni) ni.value = tila.nimi || '';
    piirraKortti(d);
  }

  function korttiRivit(d) {
    var p = pisteet(d);
    var rivit = [[d.ui.k_ala, alaTeksti(d)]];
    d.kysymykset.forEach(function (q) { var v = valinta(q, tila.polku[q.id]); rivit.push([q.kortti, v ? v.kortti : '–']); });
    rivit.push([d.ui.k_tt, p.k + '/' + p.m]);
    if ((tila.selvita || '').trim()) rivit.push([d.ui.k_selvita, tila.selvita.trim()]);
    return rivit;
  }

  function piirraKortti(d) {
    var kortti = $('amis-polku-kortti'), nappi = $('amis-v3-valmis-nappi'), lataa = $('amis-v3-lataa'), vihje = $('amis-polku-puuttuu');
    var ok = polkuValmis(d);
    if (kortti) {
      kortti.hidden = !ok;
      if (ok) {
        kortti.innerHTML = '<p class="amis-polku-kortti-tag">' + esc(d.ui.kortti_otsikko) + '</p><dl>' +
          korttiRivit(d).map(function (r) { return '<div><dt>' + esc(r[0]) + '</dt><dd>' + esc(r[1]) + '</dd></div>'; }).join('') + '</dl>';
      }
    }
    if (vihje) vihje.hidden = ok;
    var valmis = onValmis();
    if (nappi) {
      nappi.hidden = !ok;
      nappi.disabled = valmis;
      nappi.textContent = valmis ? d.ui.tallennettu : d.ui.valmis;
      nappi.classList.toggle('kuitattu', valmis);
    }
    if (lataa) lataa.hidden = !(ok && valmis);
    var lOhje = $('amis-v3-lataa-ohje');
    if (lOhje) { lOhje.hidden = !(ok && valmis); lOhje.textContent = d.ui.lataa_ohje; }
  }

  function piirraTekstit(d) {
    var set = function (id, t) { var el = $(id); if (el) el.textContent = t; };
    /* Osa-otsikot: "Osa 1: Otsikko" → merkki + otsikko */
    var otsikko = function (id, t) {
      var el = $(id); if (!el) return;
      var m = String(t).match(/^([^:]+):\s*(.+)$/);
      el.innerHTML = m ? '<span class="amis-v3-osa-nro">' + esc(m[1]) + '</span> ' + esc(m[2]) : esc(t);
    };
    otsikko('amis-tt-otsikko', d.ui.osa1);
    otsikko('amis-polku-otsikko', d.ui.osa2);
    set('amis-tt-ohje', d.ui.osa1_ohje);
    set('amis-polku-ohje', d.ui.osa2_ohje);
    set('amis-polku-selvita-label', d.ui.selvita);
    set('amis-polku-puuttuu', d.ui.puuttuu);
    set('amis-v3-lataa', d.ui.lataa);
    set('amis-v3-tyhjenna', d.ui.tyhjenna);
    set('amis-polku-nimi-label', d.ui.nimi);
    var ta = $('amis-polku-selvita'); if (ta) ta.placeholder = d.ui.selvita_esim;
    /* Kieliviesti: sisältö on toistaiseksi suomeksi, ellei käännöstä ole */
    var t = window.DIGIOPO_T && window.DIGIOPO_T.g8 && window.DIGIOPO_T.g8.tutkija;
    var huom = $('amis-v3-kieli');
    if (huom) {
      var kaannetty = !!(t && t.v3);
      var lang = (document.documentElement.getAttribute('lang') || 'fi').slice(0, 2);
      huom.hidden = kaannetty || lang === 'fi' || !(t && t.lang_warning);
      if (!huom.hidden) huom.textContent = t.lang_warning;
    }
  }

  function piirra() {
    var d = D();
    piirraTekstit(d);
    piirraVaitteet(d);
    piirraPolku(d);
    if (typeof window.tarkistaAmisYhteenveto === 'function') window.tarkistaAmisYhteenveto();
  }

  function pvm() { var d = new Date(); return d.getDate() + '.' + (d.getMonth() + 1) + '.' + d.getFullYear(); }
  function tiedostonimi(paate) {
    var n = (tila.nimi || '').trim().replace(/\s+/g, '-').replace(/[^A-Za-z0-9ÅÄÖåäö_-]/g, '');
    var d = new Date(), iso = d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
    return 'oma-amispolkuni' + (n ? '-' + n : '') + '-' + iso + '.' + paate;
  }
  function vastausTeksti(d, v) {
    var vas = tila.tt[v.id];
    if (!vas) return '–';
    var nimi = function (x) { return x === 'totta' ? d.ui.totta : d.ui.tarua; };
    return nimi(vas) + (vas === v.oikea ? ' – ' + d.ui.pdf_oikein : ' (' + d.ui.pdf_vaarin + ': ' + nimi(v.oikea).toLowerCase() + ')');
  }

  /* Varalla: tekstitiedosto, jos PDF-kirjasto ei lataudu */
  function lataaTxt(d) {
    var rivit = korttiRivit(d);
    var t = [d.ui.kortti_otsikko.toUpperCase(), d.ui.pdf_ala, ''];
    if ((tila.nimi || '').trim()) t.push(d.ui.pdf_nimi + ': ' + tila.nimi.trim());
    t.push(d.ui.pdf_pvm + ': ' + pvm(), '');
    rivit.forEach(function (r) { t.push(r[0] + ':', r[1], ''); });
    t.push(d.ui.pdf_tt, '');
    d.vaitteet.forEach(function (v, i) { t.push((i + 1) + '. ' + v.vaite, '   ' + d.ui.pdf_vastasin + ': ' + vastausTeksti(d, v)); });
    t.push('', d.ui.pdf_loppu);
    var blob = new Blob([t.join('\n')], { type: 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = tiedostonimi('txt');
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  var JSPDF_URL = '/vendor/jspdf/jspdf.umd.min.js';
  function lataaJsPDF(cb) {
    if (window.jspdf && window.jspdf.jsPDF) { cb(); return; }
    var vanha = document.querySelector('script[data-amis-jspdf]');
    if (vanha) { vanha.addEventListener('load', function () { cb(); }); vanha.addEventListener('error', function () { cb(new Error('jspdf')); }); return; }
    var sc = document.createElement('script');
    sc.src = JSPDF_URL; sc.setAttribute('data-amis-jspdf', '1');
    sc.onload = function () { cb(); };
    sc.onerror = function () { cb(new Error('jspdf')); };
    document.head.appendChild(sc);
  }

  /* PDF (A4). Helvetica-fontissa ei ole ✓/✗-merkkejä, joten käytetään sanoja. */
  function teePDF(d) {
    var doc = new window.jspdf.jsPDF({ unit: 'pt', format: 'a4' });
    var W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight();
    var M = 50, maxW = W - M * 2, y;
    function uusiSivuJos(k) { if (y + k > H - 60) { doc.addPage(); y = M; } }

    doc.setFillColor(217, 119, 6); doc.rect(0, 0, W, 88, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(24); doc.text(d.ui.kortti_otsikko, M, 46);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10.5); doc.text(d.ui.pdf_ala, M, 68);
    y = 120;

    doc.setTextColor(55, 65, 81); doc.setFontSize(11);
    if ((tila.nimi || '').trim()) {
      doc.setFont('helvetica', 'bold'); doc.text(d.ui.pdf_nimi + ':', M, y);
      doc.setFont('helvetica', 'normal'); doc.text(tila.nimi.trim(), M + 80, y); y += 18;
    }
    doc.setFont('helvetica', 'bold'); doc.text(d.ui.pdf_pvm + ':', M, y);
    doc.setFont('helvetica', 'normal'); doc.text(pvm(), M + 80, y); y += 26;

    /* Polkuni-laatikko */
    var rivit = korttiRivit(d), sisalto = [];
    doc.setFont('helvetica', 'bold'); doc.setFontSize(12.5);   /* rivitys samalla fontilla kuin piirto */
    rivit.forEach(function (r) { sisalto.push({ otsake: r[0], arvo: doc.splitTextToSize(r[1], maxW - 32) }); });
    var korkeus = 40 + sisalto.reduce(function (s, r) { return s + 16 + r.arvo.length * 15 + 8; }, 0);
    uusiSivuJos(korkeus);
    doc.setFillColor(254, 243, 199); doc.setDrawColor(245, 158, 11); doc.setLineWidth(1.5);
    doc.roundedRect(M, y, maxW, korkeus, 10, 10, 'FD');
    var yy = y + 26;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(146, 64, 14);
    doc.text(d.ui.pdf_polku.toUpperCase(), M + 16, yy); yy += 22;
    sisalto.forEach(function (r) {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(180, 83, 9);
      doc.text(r.otsake.toUpperCase(), M + 16, yy); yy += 14;
      doc.setFont('helvetica', 'bold'); doc.setFontSize(12.5); doc.setTextColor(31, 41, 55);
      doc.text(r.arvo, M + 16, yy); yy += r.arvo.length * 15 + 10;
    });
    y += korkeus + 30;

    /* Totta vai tarua -vastaukset */
    var p = pisteet(d);
    uusiSivuJos(40);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor(146, 64, 14);
    doc.text(d.ui.pdf_tt + ' (' + p.k + '/' + p.m + ')', M, y); y += 20;
    d.vaitteet.forEach(function (v, i) {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
      var vaite = doc.splitTextToSize((i + 1) + '. ' + v.vaite, maxW);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(10.5);
      var vas = doc.splitTextToSize(d.ui.pdf_vastasin + ': ' + vastausTeksti(d, v), maxW - 14);
      uusiSivuJos(vaite.length * 14 + vas.length * 14 + 12);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(31, 41, 55);
      doc.text(vaite, M, y); y += vaite.length * 14;
      var ok = tila.tt[v.id] === v.oikea;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(10.5);
      if (ok) doc.setTextColor(6, 95, 70); else doc.setTextColor(154, 52, 18);
      doc.text(vas, M + 14, y); y += vas.length * 14 + 10;
    });

    /* Alatunniste joka sivulle */
    var sivuja = doc.getNumberOfPages();
    for (var s = 1; s <= sivuja; s++) {
      doc.setPage(s);
      doc.setDrawColor(253, 230, 138); doc.setLineWidth(1); doc.line(M, H - 44, W - M, H - 44);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.setTextColor(120, 53, 15);
      doc.text(d.ui.pdf_loppu, M, H - 28);
    }
    doc.save(tiedostonimi('pdf'));
  }

  function lataa() {
    var d = D(), nappi = $('amis-v3-lataa'), ohje = $('amis-v3-lataa-ohje');
    if (nappi) nappi.disabled = true;
    lataaJsPDF(function (err) {
      if (nappi) nappi.disabled = false;
      if (!err) {
        try { teePDF(d); return; } catch (e) { err = e; }
      }
      lataaTxt(d);
      if (ohje) ohje.textContent = d.ui.lataa_virhe;
    });
  }

  /* ── Erityisammattioppilaitokset: paneeli tukiväitteen alle, avaa/sulje ── */
  function kiinnitaErityis(d) {
    var er = $('erityis-sisalto');
    var paikka = document.querySelector('#amis-tt-lista .amis-erityis-paikka');
    if (er && paikka) paikka.appendChild(er);
    paivitaErityisNappi(d);
  }
  function paivitaErityisNappi(d) {
    var er = $('erityis-sisalto');
    var b = document.querySelector('#amis-tt-lista .amis-tt-erityis[data-erityis]');
    if (!er || !b) return;
    var auki = !er.hidden;
    b.setAttribute('aria-expanded', String(auki));
    b.textContent = auki ? d.ui.erityis_piilota : d.ui.erityis_nappi;
  }
  function vaihdaErityis(d, auki) {
    var er = $('erityis-sisalto');
    if (!er) return;
    er.hidden = !auki;
    paivitaErityisNappi(d);
    var b = document.querySelector('#amis-tt-lista .amis-tt-erityis[data-erityis]');
    if (!auki && b) { try { b.focus(); b.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) {} }
  }

  /* ── tapahtumat (delegointi) ── */
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('#amis-v3-tehtava button');
    if (!t) return;
    var d = D();
    if (t.dataset.vaite) {
      if (tila.tt[t.dataset.vaite]) return;               // arvaus on lopullinen
      tila.tt[t.dataset.vaite] = t.dataset.arvo; tallenna();
      piirraVaitteet(d);
      var uusi = document.querySelector('#amis-tt-lista button[data-vaite="' + t.dataset.vaite + '"][data-arvo="' + t.dataset.arvo + '"]');
      if (uusi) uusi.focus();
      if (pisteet(d).n === pisteet(d).m) piirraPolku(d);
    } else if (t.dataset.erityis) {
      var er = $('erityis-sisalto');
      vaihdaErityis(d, !!(er && er.hidden));
    } else if (t.dataset.erityisSulje) {
      vaihdaErityis(d, false);
    } else if (t.dataset.kys) {
      tila.polku[t.dataset.kys] = t.dataset.vaihto; tallenna();
      piirraPolku(d);
      var u = document.querySelector('#amis-polku-kysymykset button[data-kys="' + t.dataset.kys + '"][data-vaihto="' + t.dataset.vaihto + '"]');
      if (u) u.focus();
    } else if (t.id === 'amis-v3-valmis-nappi') {
      if (!polkuValmis(d)) return;
      try { localStorage.setItem(VALMIS, '1'); } catch (err) {}
      piirraKortti(d);
      if (typeof window.tarkistaAmisYhteenveto === 'function') window.tarkistaAmisYhteenveto();
      var l = $('amis-v3-lataa'); if (l) l.focus();
    } else if (t.id === 'amis-v3-lataa') {
      lataa();
    } else if (t.id === 'amis-v3-tyhjenna') {
      if (!window.confirm(d.ui.tyhjenna_varmista)) return;
      tila = { tt: {}, polku: {}, selvita: '', nimi: '' };
      var erP = $('erityis-sisalto'); if (erP) erP.hidden = true;
      try { localStorage.removeItem(AVAIN); localStorage.removeItem(VALMIS); } catch (err) {}
      piirra();
    }
  });
  document.addEventListener('input', function (e) {
    if (e.target && e.target.id === 'amis-polku-selvita') {
      tila.selvita = e.target.value.slice(0, 300); tallenna();
      piirraKortti(D());
    } else if (e.target && e.target.id === 'amis-polku-nimi') {
      tila.nimi = e.target.value.slice(0, 60); tallenna();
    }
  });
  document.addEventListener('digiopo:langchange', function () { setTimeout(piirra, 0); });
  /* Vaihe 2:n tarina valmistui → päivitä kortin ala (8luokka.html tallentaa tiedon ensin) */
  window.addEventListener('message', function (e) {
    if (e.origin === location.origin && e.data && e.data.type === 'koulutusala-tarina-valmis') setTimeout(function () { piirraKortti(D()); }, 0);
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', piirra);
  else piirra();
})();
