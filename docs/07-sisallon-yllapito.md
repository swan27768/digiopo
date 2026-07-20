# 07 – Sisällön ylläpito

Miten lisätään uusi tehtävä, muokataan olemassa olevaa ja pidetään käännökset
sekä kuvat kunnossa.

Julkaisu ja välimuistin nollaus: [08 – Julkaisu](08-julkaisu.md).

---

## 1. Mistä sisältö koostuu

| Missä | Mitä |
|---|---|
| `sivut/7luokka.html`, `8luokka.html`, `9luokka.html` | Luokka-asteen etusivu, osiot ja kortit |
| `tehtavat/*.html` | Yksittäiset tehtäväsivut |
| `pelit/*.html` | Interaktiiviset pelit |
| `js/osio-data-Xlk.js` | Osioiden tavoitteet, rakenne ja yhteenvedot |
| `js/tehtavat.json` | Tehtävälistaus hakua ja kortteja varten |
| `translations/*.json` | 11 kielen käännökset |
| `images/*.webp` | Kuvat |

Sisältö on **HTML-tiedostoissa**, ei tietokannassa. Muokkaus tarkoittaa
tiedoston editointia ja julkaisua – ei hallintapaneelia.

---

## 2. Osiodata (`js/osio-data-Xlk.js`)

Tiedosto määrittelee kunkin osion pedagogisen rungon: mitä tunnilla tehdään,
mitä tavoitellaan, miksi aihe on tärkeä ja mitä oppilaan pitäisi osata lopuksi.

```js
window.OSIO_DATA = {
  luokka: "8",
  osiot: {
    "koulutus": {
      rakenne:    [ "Aloitus: ... (10 min)", "..." ],  // tunnin kulku
      tavoitteet: [ "Hahmotat Suomen koulutusjärjestelmän", "..." ],
      miksi:      "Yhdeksännellä luokalla teet yhteishaun — ...",
      yhteenveto: [ "Tiedät, mikä ero on ...", "..." ]
    }
  }
};
```

`rakenne`-kohdassa kannattaa merkitä minuutit. Opettaja suunnittelee
oppitunnin näiden varassa, ja aikatiedon puuttuminen on yleisin syy siihen,
ettei osiota uskalleta ottaa käyttöön.

⚠️ Nämä tiedostot ovat **maksumuurin takana** (`middleware.js`) ja niillä on
oma välimuistisääntö `vercel.json`-tiedostossa (`s-maxage=300`). Muutos näkyy
siis viiveellä myös oikein julkaistuna.

---

## 3. Uusi tehtävä – vaiheet

### 1. Luo HTML-tiedosto

Kopioi pohjaksi lähin vastaava tiedosto kansiosta `tehtavat/`. Tarkista että
`<head>`-osiossa on:

```html
<link rel="icon" type="image/svg+xml" href="../favicon.svg" />
<link rel="manifest" href="../manifest.json" />
<meta name="theme-color" content="#7c3aed" />
<script src="../js/lisenssiportti.js"></script>
```

Juuritasolla polut ilman `../`-etuliitettä.

### 2. Lisää tehtävälistaukseen

`js/tehtavat.json`:

```json
{
  "aiheId": "tasks-vahvuudet",
  "title": "Vaikuttaja ammattina – Haave vai painajainen?",
  "description": "Onko somesisällön tuottaminen oikeaa työtä?",
  "href": "../tehtava.html?id=keskustelu-vaikuttaja",
  "tag": "Keskustelu",
  "tagClass": "tag-keskustelu",
  "icon": "fa-comments"
}
```

`aiheId` sitoo tehtävän osioon, jolloin se ilmestyy oikean otsikon alle.

### 3. Päivitä osiodata

Lisää tehtävä `rakenne`-listaan minuutteineen, ja täydennä `tavoitteet` jos
tehtävä tuo uuden oppimistavoitteen.

### 4. Suojaa polku

Jos tehtävä on uudessa kansiossa, lisää polku **kahteen paikkaan**:

- `middleware.js` → `config.matcher`
- `sw.js` → `onSuojattuPolku`

Puuttuminen ensimmäisestä jättää sisällön julkiseksi. Puuttuminen toisesta
tallentaa suojatun sisällön välimuistiin, jossa se on luettavissa ilman
lisenssiä. Kumpikaan ei ilmoita itsestään mitenkään.

### 5. Käännökset

Ks. kohta 4.

### 6. Nosta välimuistiversio jos tarpeen

Vain jos muutit `sw.js`-tiedoston `PRECACHE_ASSETS`-listan tiedostoa.
HTML-sivut ovat network-first eivätkä vaadi nostoa. Ks.
[08 – Julkaisu](08-julkaisu.md).

---

## 4. Käännökset

Käytössä 11 kieltä: `fi, sv, en, ru, et, ar, es, so, sq, fa, tr`.
Arabia ja farsi ovat RTL-kieliä, ja `js/i18n.js` kääntää sivun suunnan
automaattisesti.

### Merkintä HTML:ssä

```html
<h1 data-i18n="g8.hero.h1">8. luokka – suunta löytyy</h1>
```

Elementin sisältö korvataan avaimen arvolla. HTML-muotoiltuun sisältöön
käytetään `data-i18n-html`, jolloin arvo lisätään `innerHTML`-kenttään –
käytä sitä vain omaan sisältöön, ei käyttäjän syöttämään tekstiin.

Avain on pistenotaatiota ja vastaa JSON-rakennetta:

```json
{ "g8": { "hero": { "h1": "8. luokka – suunta löytyy" } } }
```

### Uuden avaimen lisääminen

Avain on lisättävä **kaikkiin 11 tiedostoon**. Jos se puuttuu jostain,
elementtiin jää HTML:ssä oleva suomenkielinen oletusteksti – sivu ei hajoa,
mutta kieli vaihtuu kesken sivun.

Tarkista kattavuus:

```bash
cd translations
python3 - <<'PY'
import json, glob
def avaimet(o, etu=''):
    s = set()
    for k, v in o.items():
        polku = f'{etu}{k}'
        s.add(polku)
        if isinstance(v, dict): s |= avaimet(v, polku + '.')
    return s
fi = avaimet(json.load(open('fi.json')))
for t in sorted(glob.glob('*.json')):
    if t == 'fi.json': continue
    puuttuu = fi - avaimet(json.load(open(t)))
    print(f'{t}: puuttuu {len(puuttuu)}')
    for p in sorted(puuttuu)[:5]: print('   ', p)
PY
```

**Tilanne 19.7.2026:** 1047 avainta, ei yhtään puuttuvaa yhdessäkään
kielessä.

Neljä avainta esiintyy vain muissa kielissä kuin suomessa, ja se on
tarkoituksellista – ne ovat varoituksia siitä, että jokin sisältö on
saatavilla vain suomeksi:

```
g8.fi_only_warning        g8.tutkija.lang_warning
g8.tet.spinner_questions  g9.tet.lang_warning
```

Suomenkieliselle käyttäjälle niitä ei näytetä, joten `fi.json`-tiedostossa
niitä ei tarvita. Yllä oleva tarkistus raportoi ne "ylimääräisinä" – se ei ole
virhe.

### Suomenkielinen teksti

Kohderyhmä on 13–16-vuotiaat. Lyhyet lauseet, arkiset sanat, suora ja lämmin
sävy. Vältä virkakieltä ja väkinäistä slangia.

---

## 5. Kuvat

**Käytä WebP-muotoa.** Kansiossa on 79 WebP-kuvaa, yksi JPG ja yksi PNG –
poikkeukset ovat jäänteitä.

**Älä koskaan upota kuvia base64-muodossa HTML:ään.** Se paisuttaa sivun,
estää selainta välimuistittamasta kuvaa erikseen ja hidastaa ensimmäistä
latausta koulun verkossa, jossa kaistaa jaetaan koko luokan kesken.

Muunto ja pakkaus:

```bash
cwebp -q 80 kuva.png -o kuva.webp
```

Tavoitekoko alle 200 kt. Suurimmat nykyiset kuvat (`valinnat.webp`,
`opiskelutaidot.webp`) ovat noin 410 kt ja hyötyisivät uudelleenpakkauksesta.

Muista `alt`-teksti aina – se on saavutettavuusvaatimus, ei valinnainen.

---

## 6. Opettajan materiaalit

Opettajan ohjeet ovat omissa tiedostoissaan (`*_ope.html`) ja
`tehtavat/`-kansion tulostettavissa PDF-tiedostoissa.

Kun muutat tehtävää, tarkista lopuksi:

- Vastaako opettajan ohje yhä tehtävän kulkua?
- Ovatko `rakenne`-kohdan minuutit yhä realistiset?
- Onko PDF ajan tasalla?

Opettajan materiaalin ja tehtävän erkaantuminen on hiljainen vika: kaikki
toimii teknisesti, mutta opettaja ohjeistaa luokkaa väärin.

---

## 7. Tarkistuslista ennen julkaisua

- [ ] Sivu latautuu paikallisesti (`npm run dev`)
- [ ] Mobiilinäkymä toimii – testaa kapealla ikkunalla
- [ ] Kuvat WebP-muodossa, `alt`-tekstit paikallaan
- [ ] `data-i18n`-avaimet lisätty kaikkiin 11 kielitiedostoon
- [ ] Uudet polut lisätty `middleware.js`- ja `sw.js`-tiedostoihin
- [ ] Tehtävä näkyy haussa (`js/tehtavat.json`)
- [ ] Osiodata päivitetty (`js/osio-data-Xlk.js`)
- [ ] Opettajan ohje vastaa tehtävää
- [ ] `CACHE_VERSION` nostettu **jos** muutit esiladattua tiedostoa
