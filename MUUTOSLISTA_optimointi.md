# DigiOpo – optimoinnin muutoslista (tiedosto kerrallaan)

Tavoite: nopeampi ja luotettavampi lataus hitaassa/suodatetussa kouluverkossa.
Järjestys on priorisoitu: **CDN-riippuvuuksien itse-hostaus ensin** (suurin riski
kouluverkossa), sitten kuvat, välimuisti ja git-siivous.

Merkinnät: 🟢 helppo / matala riski · 🟡 keskisuuri · 🔴 iso työ tai tuotantoriski.

---

## OSA 1 — CDN-riippuvuuksien itse-hostaus (aloitus)

Peruste: jokainen ulkoinen domain (`cdnjs`, `fonts.googleapis`, `fonts.gstatic`,
`jsdelivr`, `unpkg`) on ylimääräinen DNS + TLS-kättely, render-blocking-lataus ja
mahdollinen palomuurin esto koulussa. Kun kaikki tarjoillaan omasta originista,
myös service worker voi välimuistittaa ne (`cache-first`).

Kaikki vendoroitavat tiedostot sijoitetaan kansioon **`/vendor/`**:
```
/vendor/
  supabase/supabase.js
  chart/chart.umd.js
  fontawesome/all.min.css        (tai subset.css)
  fontawesome/webfonts/…         (vain käytetyt .woff2)
  fonts/…                        (self-host woff2 + fonts.css)
  react/react.production.min.js
  react/react-dom.production.min.js
```

> **Huom lataamisesta:** varsinaiset tiedostot (fontit, minitetyt JS-niput) pitää
> ladata omalla koneella — Cowork-hiekkalaatikko ei saa hakea binäärejä verkosta.
> Alla jokaisen kohdan lataus­komennot. Kun tiedostot ovat paikallaan, viittausten
> vaihto on suoraviivaista (annan valmiit `sed`-korvaukset / teen editit).

### 1a. 🟢 Supabase JS — kriittinen kirjautumis-/maksumuuripolku (3 viittausta)

Nyt: `https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js`

| Tiedosto | Rivi | Muutos |
|---|---|---|
| `kirjaudu.html` | 213 | `src` → `/vendor/supabase/supabase.js` |
| `js/opettaja-keskus.js` | 15 | `SB_CDN` → `/vendor/supabase/supabase.js` |
| `js/lisenssiportti.js` | 42 | `script.src` → `/vendor/supabase/supabase.js` |

Lataus: `npm view @supabase/supabase-js dist-tags.latest` → hae vastaava
`dist/umd/supabase.js` ja tallenna `/vendor/supabase/supabase.js`.
Tämä on tärkein yksittäinen kohde: se on kirjautumisen ja lisenssiportin polulla.

### 1b. 🟢 Chart.js — 1 viittaus

Nyt: `https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js`

| Tiedosto | Rivi | Muutos |
|---|---|---|
| `pelit/ajattelutavat.html` | 7 | `src` → `/vendor/chart/chart.umd.js` |

Lataus: hae Chart.js 4.4.1 `chart.umd.js` → `/vendor/chart/chart.umd.js`.

### 1c. 🟡 Font Awesome 6.5.0 — 15 tiedostoa, ~90 ikonia

Nyt jokaisessa: `https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css`
(koko paketti: iso CSS + useita webfont-tiedostoja, joista käytät vain murto-osaa).

Tiedostot joissa viittaus vaihdetaan → `/vendor/fontawesome/all.min.css`:
`sivut/7luokka.html`, `sivut/8luokka.html`, `sivut/9luokka.html`,
`tehtava.html`, `vahvuusmatka_ope.html`, `pelit/koulutusalat.html`,
`tehtavat/ala_set_opettaja.html`, `tehtavat/fake-insta_opettaja.html`,
`tehtavat/hakustrategia.html`, `tehtavat/koulutusala_testi_opettaja.html`,
`tehtavat/maailma_tarvitsee_sinua.html`, `tehtavat/maailma_tarvitsee_sinua_opettaja.html`,
`tehtavat/motivaatiohuutokauppa.html`, `tehtavat/tulevaisuus_opettaja.html`,
`tehtavat/vahvuusmatka_opettaja.html`.

Kaksi tapaa, valitse toinen:
- **Kevyt (suositus): subset.** Vendoroi FA:sta vain käytetyt ~90 ikonia
  (esim. Fontello/IcoMoon-subset tai FA:n oma subsetting). Lopputulos muutama kt
  CSS + 1 woff2 koko ~100+ kt paketin sijaan.
- **Nopea: koko paketti paikallisesti.** Kopioi FA 6.5.0:n `css/all.min.css` +
  `webfonts/`-kansio `/vendor/fontawesome/`. Poistaa ulkoisen riippuvuuden heti,
  mutta ei pienennä kokoa.

### 1d. 🔴 Google Fonts — 24 HTML-tiedostoa + 4 CSS:ää, 14 eri fonttiyhdistelmää

Nyt haetaan render-blocking `@import`/`<link>` kahdesta domainista
(`fonts.googleapis.com` + `fonts.gstatic.com`). Käytössä on poikkeuksellisen monta
perhettä: Playfair Display, Lato, Lora, DM Sans/Serif/Mono, Plus Jakarta Sans,
Inter, Nunito, Nunito Sans, Space Grotesk, Fraunces, Newsreader, IBM Plex Sans,
Fredoka One, Caveat.

HTML-tiedostot (24): `index.html`, `kirjaudu.html`, `liity.html`,
`supervoima_ope.html`, `tulevaisuus_8lk_ope.html`, `valinnat_ope.html`,
`sivut/7luokka.html`, `sivut/8luokka.html`, `sivut/Tulevaisuus_7lk.html`,
`sivut/Tulevaisuus_8lk.html`, `sivut/tet_tehtava.html`, `sivut/valinnat.html`,
`sivut/tulevaisuus_7lk_ope.html`, `sivut/tulevaisuus_7lk_aikamatka_ope.html`,
`pelit/amisristikko.html`, `pelit/amissanasto.html`, `pelit/lukioristikko.html`,
`pelit/lukiosanasto.html`, `pelit/lukio_vs_amis.html`,
`pelit/lukio_vs_amis_ohjeet.html`, `pelit/reppu.html`, `pelit/supervoimat.html`,
`pelit/kadonnut_motivaatio/ohje.html`, `pelit/vahvuusmatka-uusi/index.dc.html`.

CSS-tiedostot (4, `@import`): `css/variant-a.css`, `css/variant-b.css`,
`css/variant-c.css`, `css/kirja-pohja.css`.

Toteutus:
1. Vendoroi tarvittavat perheet+leikkaukset woff2:na `/vendor/fonts/`-kansioon
   (esim. `google-webfonts-helper` tai `npm i @fontsource/<perhe>`).
2. Tee yksi `/vendor/fonts/fonts.css`, joka sisältää kaikki `@font-face`-säännöt
   (`font-display: swap`).
3. Korvaa jokaisessa yllä olevassa tiedostossa Google-linkki/`@import` yhdellä
   `<link rel="stylesheet" href="/vendor/fonts/fonts.css">` (CSS:ssä `@import "/vendor/fonts/fonts.css";`).
4. **Karsi samalla perheiden määrää** — 14 yhdistelmää on paljon. Jos yhtenäistät
   esim. 3–4 perheeseen, vendoroitava fonttimäärä ja sivupaino putoavat selvästi.
   (Erillinen designpäätös, voidaan tehdä myöhemmin.)

### 1e. 🔴 React + ReactDOM + Babel-standalone (unpkg) — vahvuusmatka-uusi

`pelit/vahvuusmatka-uusi/support.js` (rivit ~1037–1041) lataa unpkgista Reactin,
ReactDOMin ja **Babel-standalonen**. Babel-standalone on ~3 MB ja kääntää JSX:n
selaimessa joka latauskerralla — tämä on koko projektin raskain yksittäinen
lataus ja hidas erityisesti kouluverkossa.

| Vaihe | Muutos |
|---|---|
| Heti 🟡 | Vendoroi React + ReactDOM `/vendor/react/`-kansioon ja päivitä 2 URLia. |
| Oikea korjaus 🔴 | Esikäännä JSX rakennusvaiheessa → poista Babel-standalone kokonaan. Säästää ~3 MB per lataus. |

### 1f. 🟢 CSP kiristys — `vercel.json`

Kun ulkoiset lähteet on poistettu, tiukenna `Content-Security-Policy` (rivi 57):
poista `https://cdnjs.cloudflare.com`, `https://fonts.googleapis.com`,
`https://fonts.gstatic.com`, `https://unpkg.com`, `https://cdn.jsdelivr.net`.
Jää käytännössä `script-src 'self' 'unsafe-inline'` + `connect-src 'self'
https://*.supabase.co`. Tämä sekä nopeuttaa (ei kättelyä vieraisiin) että
parantaa tietoturvaa. Tee **vasta** kun kaikki 1a–1e on vendoroitu, muuten sivut
hajoavat.

### 1g. 🟢 SW-precache + versio — `sw.js`

Lisää `PRECACHE_ASSETS`-listaan (rivi 32) uudet paikalliset vendorit, jotka ovat
kriittisiä (esim. `/vendor/supabase/supabase.js`, `/vendor/fonts/fonts.css`,
`/vendor/fontawesome/all.min.css`). Nosta `CACHE_VERSION` (rivi 11) → `digiopo-v32`.

---

## OSA 2 — Kuvat

### 2a. 🟢 Lazy loading loppuun — 46/106 `<img>`-tagissa nyt `loading="lazy"`
Lisää `loading="lazy"` (ja isoille `decoding="async"`) niihin `<img>`-elementteihin,
jotka eivät ole heti näkyvissä. Painavimmat sivut: `sivut/9luokka.html` (388 kt),
`sivut/8luokka.html` (260 kt), `pelit/koulutusalat/*`. Älä lisää sitä
ns. "above the fold" -kuviin (hero/robo-maskotti sivun yläreunassa).

### 2b. 🟡 Muunna jäljellä olevat PNG:t webp:ksi
uploads-muotokuvat (käytössä `vahvuusmatka-uusi/index.dc.html`):
`pelit/vahvuusmatka-uusi/uploads/Screenshot 2026-07-08 at 22.*.png`
(4 kpl, ~1,2 MB) → webp ja päivitä `index.dc.html`:n `src`-viittaukset (rivit
279–282). Muut isot PNG:t: `images/nuoren-valinnat.png` (204 kt),
`robo-peli/robo-maskotti.png` (268 kt) — muunna jos yhä käytössä.

---

## OSA 3 — Välimuisti (`vercel.json`)

### 3a. 🟡 Poista `no-cache` staattisilta CSS/JS-tiedostoilta
Nyt sääntö (rivit 77–85) pakottaa `no-cache`:n kaikille `html|js|mjs|css|json`.
HTML:lle se on ok (sisältö tuoreena), mutta **CSS ja JS** revalidoidaan turhaan
joka latauksella → ylimääräinen edestakainen kierros hitaalla verkolla.

Suositus: versioimalla staattiset tiedostonimet (esim. `base.css` →
`base.v3.css` tai hash) ja antamalla niille `Cache-Control: public,
max-age=31536000, immutable`. Vaihtoehto ilman nimien versiointia: `public,
max-age=0, s-maxage=86400, stale-while-revalidate=604800` (kuten `osio-data-*`
jo tekee). Vendor-tiedostoille (`/vendor/*`) pitkä `immutable`-cache.

---

## OSA 4 — Git-historia (kloonauskoko)

### 4a. 🟡 Aja `siivoa-git-historia.sh`
`.git` on 60 MB vs. ~28 MB sisältö → historiassa isoja binäärejä (mm. juuri
poistetut robo_ai.png / robo-emoji.png elävät yhä historiassa). Repossa on valmis
`siivoa-git-historia.sh`. **Varmuuskopioi ensin** (`varmuuskopio.command`), koska
historian uudelleenkirjoitus on peruuttamaton ja vaatii force-pushin.

### 4b. 🟢 Committoi jo tehdyt poistot
Aiemmin poistetut 3 PNG:tä ovat gitissä tilassa `D` (poistettu, ei committoitu).
Committoi ne (`julkaise.command` tai `git commit`).

---

## Ehdotettu etenemisjärjestys

1. **1a Supabase + 1b Chart.js** (helpot, korkea arvo, kirjautumispolku) → testaa.
2. **1c Font Awesome** (koko paketti paikallisesti nopeana, subset myöhemmin).
3. **1d Google Fonts** (isoin työ; harkitse samalla perheiden karsintaa).
4. **1e React/Babel** (vendoroi React heti, Babelin esikäännös myöhemmin).
5. **1f CSP + 1g SW** kun 1a–1e valmiit.
6. **Osa 2–4** rinnalla / perässä.
