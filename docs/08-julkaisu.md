# 08 – Julkaisu ja välimuisti

Miten muutos viedään tuotantoon, miksi se ei aina näy heti, ja miten se
perutaan jos jokin menee pieleen.

---

## 1. Julkaisu

Build-vaihetta ei ole. Vercel tarjoilee tiedostot sellaisenaan ja kääntää
`api/`-kansion serverless-funktioiksi.

```bash
git push origin main
```

macOS: `julkaise.command` tekee saman kaksoisklikkauksella. **Se toimii vain
macOS:llä** – Windowsissa käytä `git push origin main`.

Vercel julkaisee automaattisesti `main`-haaran jokaisesta pushista, 1–2
minuutissa. Tilanne näkyy osoitteessa `vercel.com/dashboard`.

Tuotanto: **app.digiopo.fi**

> Markkinointisivusto `digiopo.fi` on **eri projekti** (`digiopo-home`), jolla
> on oma repo ja oma julkaisu. Tilauslomake ja lisenssien automaattinen luonti
> ovat siellä – ks. [06 – Lisenssit](06-lisenssit.md).

---

## 2. Välimuisti on kolmessa kerroksessa

Tämä on syy siihen, miksi julkaistu muutos ei aina näy heti. Kerrokset
toimivat toisistaan riippumatta.

| Kerros | Missä | Kuinka kauan |
|---|---|---|
| Service worker | Käyttäjän selain | Kunnes `CACHE_VERSION` nousee |
| Vercelin reunavälimuisti | CDN | `s-maxage` (osiodatalla 300 s) |
| Selaimen oma välimuisti | Käyttäjän selain | `no-cache` → tarkistaa aina |

### Vercelin otsakkeet (`vercel.json`)

```
/(.*).(html|js|mjs|css|json)   →  no-cache
/js/osio-data-Xlk.js           →  s-maxage=300, stale-while-revalidate=86400
/js/tehtavat.json              →  s-maxage=300, stale-while-revalidate=86400
```

`no-cache` ei tarkoita "ei välimuistia" vaan "tarkista aina ennen käyttöä".
Sisältö haetaan uudelleen vain jos se on muuttunut.

Osiodatalla on erilliset säännöt, koska ne ovat maksumuurin takana ja
suuritöisiä hakea: CDN pitää niitä 5 minuuttia ja tarjoilee vanhaa versiota
taustapäivityksen ajan. Muutos näkyy siis enintään 5 minuutin viiveellä
myös oikein julkaistuna.

---

## 3. Service worker – milloin versio on nostettava

`sw.js` käyttää kahta strategiaa:

| Sisältö | Strategia | Näkyykö muutos heti? |
|---|---|---|
| HTML-sivut | network-first | **Kyllä** |
| JSON-datatiedostot | network-first | Kyllä |
| CSS, JS, kuvat | **cache-first** | **Ei** – vasta versionoston jälkeen |
| Suojatut polut | ohitetaan kokonaan | Kyllä |
| `/api/*` | ei välimuistiteta | Kyllä |

### Sääntö

**Nosta `CACHE_VERSION`, jos muutit tiedostoa joka on `PRECACHE_ASSETS`-listalla
tai jota tarjoillaan cache-first-strategialla** – eli CSS, JS tai kuvat.

```js
const CACHE_VERSION = "digiopo-v11";  // → "digiopo-v12"
```

Aktivointikäsittelijä poistaa vanhat `digiopo-*`-välimuistit automaattisesti,
kun nimi ei enää vastaa nykyistä versiota.

### Jos unohdat

Käyttäjien selaimet tarjoilevat vanhaa tiedostoa **rajattoman ajan**. Korjaus
ei näy kentällä lainkaan, eikä mikään ilmoita siitä. Sinä näet oman koneesi
tuloksen ja luulet asian olevan kunnossa.

Näin kävi 19.7.2026: service workerin korjaus kirjoitettiin
`lisenssiportti.js`-tiedostoon, joka on `PRECACHE_ASSETS`-listalla – eli vanha
service worker tarjoili juuri sitä tiedostoa, jonka oli määrä poistaa se.

### Jos nostat turhaan

Kaikki käyttäjät lataavat koko staattisen sisällön uudelleen. Ei vaarallista,
mutta koulun jaetulla kaistalla turha kuormituspiikki. Älä siis nosta
jokaisen HTML-muutoksen yhteydessä.

---

## 4. Julkaisun jälkeen

Avaa **app.digiopo.fi** ja tarkista:

- [ ] Sivu latautuu
- [ ] Selaimen konsolissa ei virheitä – erityisesti ei CSP-virheitä
- [ ] Application → Service Workers: `sw.js` aktiivinen, oikea `CACHE_VERSION`
- [ ] Yksityinen ikkuna: suojattu sivu ohjaa `liity.html`-portille
- [ ] Kelvollinen koodi päästää läpi

CSP-muutoksia **ei voi testata paikallisesti** – `vercel.json`-otsakkeet ovat
Vercelin ominaisuus, eikä `dev-server.cjs` lähetä niitä. Ne näkyvät vasta
tuotannossa.

### Jos muutos ei näy

1. Kova päivitys: **Cmd + Shift + R**
2. Yksityinen ikkuna – ohittaa service workerin ja evästeet
3. DevTools → Application → Service Workers → **Update on reload**
4. Odota 5 minuuttia jos muutit osiodataa (CDN `s-maxage`)
5. Tarkista `CACHE_VERSION` – pitikö sitä nostaa?

Järjestys kannattaa noudattaa. Useimmiten vika on kohdassa 1 tai 5.

---

## 5. Peruminen

Nopein tapa on Vercelin oma palautus, joka ei vaadi git-toimenpiteitä:

**Deployments → valitse aiempi toimiva julkaisu → `···` → Promote to
Production.**

Vaihtoehtoisesti gitistä:

```bash
git revert HEAD
git push origin main
```

`git revert` on turvallisempi kuin `reset`, koska se ei kirjoita historiaa
uudelleen – ja historia on tässä projektissa ainoa dokumentaatio siitä, mitä
tuotantokantaan on ajettu ja milloin.

### Maksumuurin hätäkatkaisu

Jos maksumuuri rikkoutuu kesken koulupäivän eikä syy selviä nopeasti:

**Vercel → Settings → Environment Variables → poista `LISENSSI_JWT_SECRET` →
Redeploy.**

Muuri menee pois päältä (fail-open) ja koko sisältö avautuu kaikille. Opetus
jatkuu, ja korjaus voidaan tehdä rauhassa. Muista palauttaa muuttuja jälkeenpäin.

---

## 6. Tietokantamuutokset

SQL-tiedostot ajetaan **käsin** Supabasen SQL Editorissa. Migraatiotyökalua ei
ole, eikä julkaisu aja niitä automaattisesti.

⚠️ **Järjestys on tärkeä.** Jos muutos poistaa sarakkeen tai muuttaa rajoitetta:

1. Julkaise koodi ensin
2. Aja SQL vasta sen jälkeen

Muuten vanha käynnissä oleva koodi yrittää käyttää rakennetta, jota ei enää
ole. Tämä varoitus on kirjattu myös `supabase_poista_pin.sql`-tiedostoon.

Lisäävät muutokset (uusi taulu, uusi sarake) voi ajaa ennen julkaisua – ne
eivät riko vanhaa koodia.

**Tietokanta on jaettu kahden projektin kesken.** Rajoitteita muutettaessa on
tarkistettava myös `digiopo-home/api/tilaus.js`. Ks.
[03 – Tietokanta](03-tietokanta.md), kohta skeeman ajautumisesta.

---

## 7. Paikallinen esikatselu

```bash
npm run dev          # http://localhost:8000
```

macOS: `esikatselu.command`.

Kehityspalvelin jäljittelee osan rajapinnoista (`/api/lisenssi`, `/api/ping`,
`/api/fake-insta`, `/api/maailma-taulu`, `/api/ammattiset`,
`/api/tiedontemppeli`), mutta **jäljitelmä ei vastaa tuotantoa
valtuutuksessa** – esimerkiksi `tarkista_opettaja` päästää paikallisesti
kaikki läpi.

Turvamuutoksia ei siis voi todentaa paikallisesti. Ne on testattava
tuotannossa tai Vercelin preview-julkaisussa.

Service worker ei rekisteröidy localhostissa (korjattu 19.7.2026), joten
paikallinen esikatselu ei kärsi välimuistiongelmista.
