# DigiOpo – palvelinpuolisen maksumuurin käyttöönotto

Tämä muuri estää **sisällön käytön ilman voimassa olevaa lisenssiä**: palvelin
(Vercel Edge Middleware) tarkistaa allekirjoitetun evästeen ennen kuin suojattu
sivu tarjoillaan. Toisin kuin vanha `lisenssiportti.js`-overlay, tätä ei voi
ohittaa devtoolsilla.

## Mitä muuttui koodissa

- `api/_lib/token.mjs` – allekirjoitettu token (HMAC-SHA256, Web Crypto).
- `api/lisenssi.js` – asettaa `digiopo_lisenssi`-evästeen (HttpOnly, ~lukuvuosi /
  300 vrk) kun koulukoodi tai opettajakirjautuminen onnistuu. `lisenssiportti.js`
  uusii evästeen taustalla 24 h välein ja poistaa sen jos lisenssi on peruttu.
- `middleware.mjs` – vartioi suojattuja polkuja (`/sivut/*`, `/pelit/*`,
  `/tehtavat/*`, `/robo-peli/*`, `/7luokka`–`/9luokka`, `osio-data-*.js`,
  `tehtavat.json`). Ilman kelvollista evästettä: sivut → ohjaus `liity.html`:iin,
  data → 401.
- `liity.html` – jos tänne on ohjattu (`?redirect=`), pelkkä koulukoodi riittää
  ja käyttäjä palautetaan alkuperäiselle sivulle.
- `sw.js` – ei enää tallenna suojattua sisältöä välimuistiin (ei offline-kiertoa).
- `package.json` – lisätty `@vercel/functions` (middlewaren `next()`).

## Tärkein turvaominaisuus: fail-open

**Muuri on pois päältä niin kauan kuin `LISENSSI_JWT_SECRET`-ympäristömuuttujaa
ei ole asetettu.** Voit siis julkaista koodin turvallisesti – mikään ei muutu
oppilaille ennen kuin asetat salaisuuden. Ja jos jokin menee pieleen, muurin saa
pois päältä poistamalla ympäristömuuttujan (ei uutta deployta tarvita).

## Käyttöönotto vaihe vaiheelta

### 1. Asenna riippuvuus ja committaa

```bash
cd ~/Projects/digiopo
npm install @vercel/functions
git add -A
git commit -m "Palvelinpuolinen maksumuuri: token + middleware + eväste (fail-open)"
git push
```

Tässä vaiheessa muuri on vielä **pois päältä** (salaisuutta ei ole asetettu).
Sivusto toimii täsmälleen kuten ennenkin.

### 2. Luo salaisuus ja testaa PREVIEW-ympäristössä ensin

Älä laita salaisuutta suoraan tuotantoon. Testaa ensin Preview-deployssa:

```bash
# Luo satunnainen salaisuus:
openssl rand -hex 32
```

Vercelin hallinnasta: **Settings → Environment Variables** → lisää
`LISENSSI_JWT_SECRET` (arvoksi yllä luotu merkkijono) ja rajaa se **Preview**-
ympäristöön. Tee sitten Preview-deploy (esim. push haaraan tai
`vercel --prebuilt`), ja testaa listan mukaan (alla).

### 3. Testilista (Preview-URL)

- [ ] Avaa `/8luokka` **ilman** kirjautumista → ohjaa `liity.html`:iin.
- [ ] Syötä oikea koulukoodi → pääset takaisin `/8luokka`-sivulle.
- [ ] Päivitä sivu → pysyt sisällä (eväste toimii, ei uutta kysymistä).
- [ ] Avaa suoraan `/js/tehtavat.json` ilman evästettä → 401.
- [ ] Etusivu `/`, `/liity`, `/kayttoehdot.html`, `/kirjaudu.html` → aukeavat
      ilman lisenssiä.
- [ ] Opettaja: kirjaudu magic linkillä → pääsee sisään ilman koulukoodia.
- [ ] Tarkista selaimen devtoolsista: eväste `digiopo_lisenssi` on `HttpOnly`.

### 4. Aktivoi tuotannossa

Kun Preview toimii: lisää sama `LISENSSI_JWT_SECRET` **Production**-ympäristöön
ja tee tuotantodeploy. Muuri on nyt päällä.

> Oppilailla jotka ovat jo kirjautuneet (vanha localStorage) ei ole vielä
> evästettä. Ensimmäisellä käynnillä heidät ohjataan kerran `liity.html`:iin
> syöttämään koulukoodi uudelleen – sen jälkeen eväste kestää koko lukuvuoden
> eikä koodia tarvitse enää syöttää tällä laitteella.

## Rollback

Poista `LISENSSI_JWT_SECRET` Vercelin ympäristömuuttujista (ja redeploy jos
tarpeen). Muuri menee välittömästi pois päältä, sivusto palaa entiselleen.

## Rajoitukset (tietoisia)

- Eväste on voimassa koko lukuvuoden (oppilas kirjautuu kerran per laite), mutta
  taustatarkistus 24 h välein poistaa pääsyn ~vuorokaudessa jos lisenssi perutaan.
- Maksumuuri estää **ei-maksaneet**, mutta valtuutettu käyttäjä voi silti jakaa
  yksittäisiä sivuja/kuvia. Tämä on hyväksytty (ei DRM).
- Middleware ei aja paikallisessa `dev-server.js`:ssä – testaus vaatii Vercelin.
- Suojatut polut on lueteltu `middleware.mjs`:n `matcher`-listassa. Jos lisäät
  uutta maksullista sisältöä muualle, lisää polku sinne (ja `sw.js`:n
  `onSuojattuPolku`-funktioon).
