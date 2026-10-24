# DigiOpon CSS lyhyesti

## Miten CSS ladataan

Jokainen luokka-astesivu (`7luokka.html`, `8luokka.html`, `9luokka.html`) lataa yhden tiedoston: `css/paketti-Nlk.css`.

- `paketti-Nlk.css` on automaattisesti rakennettu. **Älä muokkaa sitä käsin.**
- Sen lähde on `css/kerrokset-Nlk.css`. Se on lista, joka kertoo, mitkä tiedostot kuuluvat pakettiin ja missä kerroksessa.
- Paketin rakentaa `npm run css` (`tools/yhdista-css.mjs`). Aina kun muutat jotain CSS-tiedostoa, aja se ja committaa myös paketti.

## Kerrokset (`@layer`)

Järjestys, myöhempi voittaa riippumatta valitsimen painoarvosta:

`base` → `teema` → `sivu-alku` → `komponentit` → `sivu`

| Kerros | Mitä sinne kuuluu |
| --- | --- |
| base | sivun perusasiat: `base`, `navbar`, `layout`, `components`, `aihe`, `maskotti`, `utils`, `kirja-oletukset` |
| teema | luokka-asteen väriteema: `teema`, `ysiluokka` / `pinkkiteema` / `seiskaluokka` |
| sivu-alku | sivun ensimmäinen entinen `<style>`-lohko: `sivu-Nlk-alku.css` |
| komponentit | uudelleenkäytettävät osat: `hero-kortti`, `korttityypit`, `edistyminen`, `jarjestys`, `osio-*`, `aihe-lapset` |
| sivu | luokka-asteen omat poikkeukset: `grade-Nlk`, `paivakirja`, `sivu-Nlk`, `inline-Nlk` |

Kerrosten ulkopuolella on vain `fokus.css` (näppäimistön fokusrengas). Kerrostamaton sääntö voittaa aina kerrokselliset, ja se on tarkoituksella näin.

Huomioi:

- `!important` toimii kerroksissa käänteisesti: aiemman kerroksen `!important` voittaa myöhemmän.
- Kerrokset on järjestetty vastaamaan vanhaa latausjärjestystä. Älä järjestä niitä uudelleen ilman kuvavertailua: noin kymmenen kohtaa sivuilla nojaa nykyiseen järjestykseen.

## Mihin uusi sääntö kuuluu

- Koskee kaikkia luokka-asteita ja kaikkia sivuja: `base`-kerroksen tiedosto.
- Uusi toistuva kortti tai osa: oma tiedosto tai olemassa oleva `komponentit`-tiedosto. Hero-kortit: `hero-kortti.css` (HTML:ssä `hero-kortti`-luokat).
- Vain yhdelle luokka-asteelle: `sivu-Nlk.css`.
- Värit ja `--t-*`-teemamuuttujat: `grade-Nlk.css`.
- Inline-tyylin korvaaja: `inline-Nlk.css`, luokat `isN-001`... (luotu toistuvista `style`-attribuuteista).

## Inline-tyylit

Inline-tyylit voi siirtää luokiksi, kun ne toistuvat vähintään kahdesti. Näitä ei kannata siirtää:

- elementit, joilla on `id` tai joita JS näyttää ja piilottaa (`display:none`),
- elementit, joiden tyyliin CSS-valitsin nojaa (`[style*="color:#fff"]`, `.aihe-osio > div[style]`, `#johdanto > div[style]`),
- kertaluonteiset tyylit.

## Käännöskoukut

Käännöskoodi (`js/i18n-8lk.js`, `js/i18n-9lk.js`) ei saa etsiä elementtejä tyylitekstin perusteella (`[style*="..."]`). Käytä `data-kaannos`-attribuuttia: HTML:ssä `data-kaannos="nimi"` ja JS:ssä `[data-kaannos~="nimi"]`.

## Tarkistukset ennen committia

```
npm run css:tarkista     # paketti vastaa lähteitä
npm run kuvat:vertaa     # ulkoasu ei muuttunut (kuvavertailu)
npm run luokat:vertaa    # ei uusia luokkatörmäyksiä
npm run kaannos:vertaa   # käännetyt tekstit eivät muuttuneet
```

Kun muutos on tarkoituksellinen, päivitä vastaava lähtötaso: `kuvat:perusta`, `luokat`, `kaannos:perusta`. Muista nostaa `CACHE_VERSION` tiedostossa `sw.js`, kun CSS tai JS muuttuu.
