/**
 * DigiOpo – Päiväkirjani
 * Viikoittainen oppimispäiväkirjatehtävä. Toimii osion lopussa olevassa
 * [data-paivakirja] -lohkossa. Oppilas valitsee viikon kysymyksistä 1–2 tai
 * kaikki, kirjoittaa lyhyet vastaukset ja lataa merkinnän PDF:nä omaan
 * Drive-kansioonsa. Mitään ei tallenneta palvelimelle. Nimi ja luokka
 * muistetaan vain laitteelle, jottei niitä tarvitse kirjoittaa joka viikko.
 *
 * Kysymykset valikoituvat automaattisesti luokka-asteen (lohkon data-luokka)
 * ja lukuvuoden ajankohdan (selaimen päivämäärä → syksy/talvi/kevät) mukaan.
 */
(function () {
  'use strict';

  /* ── Kysymyspankki: luokka-aste × jakso ─────────────────────────────── */
  var PANKKI = {
    '7': {
      syksy: { teema: 'Uusi alku', kysymykset: [
        'Mikä tapa oppia toimi sinulle tällä viikolla parhaiten?',
        'Mikä koulussa tuntui nyt vaikealta?',
        'Mitä tekisit ensi viikolla toisin?'
      ]},
      talvi: { teema: 'Vahvuudet', kysymykset: [
        'Minkä huomasit osaavasi?',
        'Mistä sait tällä viikolla hyvän fiiliksen tai kehut?',
        'Missä haluaisit tulla paremmaksi?'
      ]},
      kevat: { teema: 'Tulevaisuus', kysymykset: [
        'Mikä sai sinut tällä viikolla innostumaan?',
        'Millaisesta tulevaisuudesta haaveilet juuri nyt?',
        'Mitä uutta opit itsestäsi?'
      ]}
    },
    '8': {
      syksy: { teema: 'Koulutusalat', kysymykset: [
        'Mikä ala alkoi kiinnostaa sinua?',
        'Mikä ala ei tuntunut omalta – ja miksi?',
        'Mitä haluaisit vielä tietää jostain alasta?'
      ]},
      talvi: { teema: 'Vahvuudet', kysymykset: [
        'Minkä vahvuuden tunnistit itsessäsi?',
        'Miten toimit tällä viikolla yhdessä muiden kanssa?',
        'Muuttuiko jokin käsitys itsestäsi?'
      ]},
      kevat: { teema: 'Tulevaisuus', kysymykset: [
        'Mikä tulevaisuudessa jännittää sinua?',
        'Mikä tuntuu mahdolliselta, mikä ei?',
        'Mitä haluaisit kokeilla?'
      ]}
    },
    '9': {
      syksy: { teema: 'Työelämä', kysymykset: [
        'Millainen työntekijä haluaisit olla?',
        'Mikä työelämässä mietityttää sinua?',
        'Mitä odotat TET-jaksolta?'
      ]},
      talvi: { teema: 'TET', kysymykset: [
        'Mitä TET opetti sinusta itsestäsi?',
        'Muuttiko TET ajatuksiasi tulevaisuudesta?',
        'Mikä tuntui raskaalta tai yllättävältä?'
      ]},
      kevat: { teema: 'Valinnat', kysymykset: [
        'Mihin suuntaan olet nyt kallistumassa?',
        'Mikä valinnassa on vaikeaa?',
        'Mitä sanoisit itsellesi vuoden takaa?'
      ]}
    }
  };

  var JSPDF_URL = '/vendor/jspdf/jspdf.umd.min.js';
  var KK = ['tammikuuta','helmikuuta','maaliskuuta','huhtikuuta','toukokuuta','kesäkuuta',
            'heinäkuuta','elokuuta','syyskuuta','lokakuuta','marraskuuta','joulukuuta'];

  /* ── Apurit ─────────────────────────────────────────────────────────── */
  function jaksoNyt(d) {
    var m = d.getMonth() + 1;            // 1–12
    if (m >= 8 && m <= 10) return 'syksy';
    if (m === 11 || m === 12 || m === 1) return 'talvi';
    return 'kevat';                       // helmi–heinä
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function pvmISO(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function pvmFI(d) { return d.getDate() + '. ' + KK[d.getMonth()] + ' ' + d.getFullYear(); }
  function pvmLyhyt(d) { return pad(d.getDate()) + '.' + pad(d.getMonth() + 1) + '.' + d.getFullYear(); }

  function siisti(s) {
    return (s || '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^A-Za-z0-9ÅÄÖåäö._-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
  function esc(s) { return (s == null ? '' : String(s)); }

  /* ── localStorage nimelle ja luokalle (ei päiväkirjan sisältöä) ─────── */
  function muista(avain, arvo) { try { localStorage.setItem(avain, arvo); } catch (e) {} }
  function palauta(avain) { try { return localStorage.getItem(avain) || ''; } catch (e) { return ''; } }

  /* ── PDF ────────────────────────────────────────────────────────────── */
  function lataaJsPDF(cb) {
    if (window.jspdf && window.jspdf.jsPDF) { cb(); return; }
    var s = document.createElement('script');
    s.src = JSPDF_URL;
    s.onload = function () { cb(); };
    s.onerror = function () { cb(new Error('jspdf-lataus epäonnistui')); };
    document.head.appendChild(s);
  }

  function teePDF(tiedot) {
    var jsPDFCtor = window.jspdf.jsPDF;
    var doc = new jsPDFCtor({ unit: 'pt', format: 'a4' });
    var W = doc.internal.pageSize.getWidth();
    var H = doc.internal.pageSize.getHeight();
    var M = 56;                 // marginaali
    var maxW = W - M * 2;
    var y = 0;

    // Ylapalkki
    doc.setFillColor(124, 58, 237);
    doc.rect(0, 0, W, 92, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('Päiväkirjani', M, 46);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text('Mun juttu – mun tarinaa', M, 66);
    y = 128;

    // Metatiedot
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(11);
    function meta(label, val) {
      doc.setFont('helvetica', 'bold'); doc.text(label, M, y);
      doc.setFont('helvetica', 'normal'); doc.text(esc(val), M + 96, y);
      y += 18;
    }
    meta('Nimi:', tiedot.nimi);
    meta('Luokka:', tiedot.luokka);
    meta('Päivämäärä:', tiedot.pvmFI);
    meta('Teema:', tiedot.teema);
    y += 8;

    // Viiva
    doc.setDrawColor(220, 210, 250);
    doc.line(M, y, W - M, y);
    y += 24;

    // Kysymykset ja vastaukset
    function lisaaSivuTarvittaessa(korkeus) {
      if (y + korkeus > H - M) { doc.addPage(); y = M; }
    }
    for (var i = 0; i < tiedot.parit.length; i++) {
      var p = tiedot.parit[i];
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11.5);
      doc.setTextColor(76, 29, 149);
      var kys = doc.splitTextToSize(p.kysymys, maxW);
      lisaaSivuTarvittaessa(kys.length * 15 + 10);
      doc.text(kys, M, y);
      y += kys.length * 15 + 4;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11.5);
      doc.setTextColor(30, 30, 30);
      var vas = doc.splitTextToSize(p.vastaus, maxW);
      lisaaSivuTarvittaessa(vas.length * 15 + 16);
      doc.text(vas, M, y);
      y += vas.length * 15 + 20;
    }

    doc.save(tiedot.tiedostonimi);
  }

  /* ── Renderöinti ja logiikka ────────────────────────────────────────── */
  function init() {
    var root = document.querySelector('[data-paivakirja]');
    if (!root) return;

    var luokka = root.getAttribute('data-luokka') || '7';
    var d = new Date();
    var jakso = jaksoNyt(d);
    var setti = (PANKKI[luokka] && PANKKI[luokka][jakso]) || PANKKI['7'].syksy;

    // Meta: teema · pvm
    var teemaEl = root.querySelector('[data-pk-teema]');
    var pvmEl = root.querySelector('[data-pk-pvm]');
    if (teemaEl) teemaEl.textContent = setti.teema;
    if (pvmEl) pvmEl.textContent = pvmLyhyt(d);

    // Nimi + luokka (muistetaan laitteelle)
    var nimiInput = root.querySelector('[data-pk-nimi]');
    var luokkaInput = root.querySelector('[data-pk-luokka]');
    if (nimiInput) {
      nimiInput.value = palauta('pk_nimi');
      nimiInput.addEventListener('input', function () { muista('pk_nimi', nimiInput.value); });
    }
    if (luokkaInput) {
      luokkaInput.value = palauta('pk_luokka');
      luokkaInput.addEventListener('input', function () { muista('pk_luokka', luokkaInput.value); });
    }

    // Kysymykset
    var lista = root.querySelector('[data-pk-kysymykset]');
    if (lista) {
      lista.innerHTML = '';
      setti.kysymykset.forEach(function (teksti, idx) {
        var kortti = document.createElement('div');
        kortti.className = 'pk-kysymys';

        var yla = document.createElement('label');
        yla.className = 'pk-kysymys-yla';
        yla.setAttribute('for', 'pk-kys-' + idx);

        var cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.id = 'pk-kys-' + idx;

        var kysSpan = document.createElement('span');
        kysSpan.className = 'pk-kysymys-teksti';
        kysSpan.textContent = teksti;

        yla.appendChild(cb);
        yla.appendChild(kysSpan);

        var vastausDiv = document.createElement('div');
        vastausDiv.className = 'pk-vastaus';
        vastausDiv.style.display = 'none';

        var ta = document.createElement('textarea');
        ta.setAttribute('aria-label', 'Vastaus: ' + teksti);
        ta.setAttribute('maxlength', '400');
        ta.placeholder = 'Kirjoita 1–2 lausetta…';

        var merkit = document.createElement('div');
        merkit.className = 'pk-merkit';
        merkit.textContent = '0 / 400';
        ta.addEventListener('input', function () {
          merkit.textContent = ta.value.length + ' / 400';
        });

        vastausDiv.appendChild(ta);
        vastausDiv.appendChild(merkit);

        cb.addEventListener('change', function () {
          if (cb.checked) {
            kortti.classList.add('pk-valittu');
            vastausDiv.style.display = 'block';
            ta.focus();
          } else {
            kortti.classList.remove('pk-valittu');
            vastausDiv.style.display = 'none';
          }
        });

        kortti.appendChild(yla);
        kortti.appendChild(vastausDiv);
        lista.appendChild(kortti);

        // Talletetaan viittaukset latausta varten
        kortti._pk = { teksti: teksti, cb: cb, ta: ta };
      });
    }

    // Lataus
    var nappi = root.querySelector('[data-pk-lataa]');
    var vahvistus = root.querySelector('[data-pk-vahvistus]');

    function nayta(viesti, huom) {
      if (!vahvistus) return;
      vahvistus.textContent = viesti;
      vahvistus.classList.add('pk-nakyy');
      vahvistus.classList.toggle('pk-huom', !!huom);
    }

    if (nappi) {
      nappi.addEventListener('click', function () {
        var nimi = nimiInput ? nimiInput.value.trim() : '';
        var lk = luokkaInput ? luokkaInput.value.trim() : '';

        if (!nimi || !lk) {
          nayta('Kirjoita ensin nimesi ja luokkasi, niin merkintä nimetään oikein.', true);
          return;
        }

        var parit = [];
        if (lista) {
          Array.prototype.forEach.call(lista.children, function (kortti) {
            var ref = kortti._pk;
            if (ref && ref.cb.checked && ref.ta.value.trim()) {
              parit.push({ kysymys: ref.teksti, vastaus: ref.ta.value.trim() });
            }
          });
        }

        if (!parit.length) {
          nayta('Valitse ainakin yksi kysymys ja kirjoita siihen vastaus.', true);
          return;
        }

        nappi.disabled = true;
        var vanhaTeksti = nappi.textContent;
        nappi.textContent = 'Tehdään PDF…';

        lataaJsPDF(function (err) {
          if (err) {
            nappi.disabled = false;
            nappi.textContent = vanhaTeksti;
            nayta('PDF:n teko ei onnistunut. Yritä uudelleen hetken kuluttua.', true);
            return;
          }
          var tiedostonimi = 'paivakirjani_' + pvmISO(d) + '_' + (siisti(lk) || 'luokka') +
                             '_' + (siisti(nimi) || 'oppilas') + '.pdf';
          try {
            teePDF({
              nimi: nimi, luokka: lk, teema: setti.teema,
              pvmFI: pvmFI(d), parit: parit, tiedostonimi: tiedostonimi
            });
            nayta('Merkintä ladattu (' + tiedostonimi + '). Tallenna se päiväkirja-kansioosi Drivessä.');
          } catch (e) {
            nayta('PDF:n teko ei onnistunut. Yritä uudelleen.', true);
          }
          nappi.disabled = false;
          nappi.textContent = vanhaTeksti;
        });
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
