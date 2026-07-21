# 04 – Arkkitehtuuri ja turvamalli

Tämä on dokumentaation turvakriittisin osa. Alla kuvatut periaatteet on
ymmärrettävä ennen kuin `api/`-kansioon, `middleware.js`-tiedostoon tai
tietokannan käytäntöihin koskee.

---

## 1. Kaksi periaatetta joita ei saa rikkoa

### Selain ei koskaan puhu suoraan Supabaseen

Jokainen tietokantaoperaatio kulkee palvelinfunktion kautta
`service_role`-avaimella. Tauluissa on RLS päällä ja käytäntö `using(false)`,
eli anon-avaimella ei pääse mihinkään.

Tämä ei ole tyylivalinta vaan koko mallin perusta. Jos joku lisää selainpuolen
Supabase-clientin, hän joutuu samalla avaamaan RLS-käytännön — ja siinä hetkessä
maksumuurin ohittaa kuka tahansa lukemalla taulut suoraan.

Käytännössä: `SUPABASE_SERVICE_KEY` esiintyy vain `api/`-kansiossa. Jos näet sen
missään `js/`-kansion tiedostossa tai HTML:ssä, kyseessä on vakava vuoto.

### Pääsy ratkaistaan palvelimella, ei selaimessa

Maksumuuri on Vercelin Edge Middleware, joka ajetaan **ennen kuin tiedostoa
tarjoillaan**. Selaimen JavaScript ei voi ohittaa sitä, koska se ei ehdi ajoon
lainkaan ilman kelvollista evästettä.

`js/lisenssiportti.js` on pelkkä käyttöliittymä portille — ei suojausmekanismi.
Sen poistaminen ei avaa mitään.

---

## 2. Maksumuurin kulku

```
Selain pyytää /8luokka
        │
        ▼
middleware.js
        │  Onko LISENSSI_JWT_SECRET asetettu?
        ├─ ei  → next()  (muuri POIS PÄÄLTÄ, fail-open)
        │
        │  Onko evästettä digiopo_lisenssi?
        ├─ ei  → sivupyyntö:  302 → /liity.html?redirect=...
        │        datapyyntö:  401 {"virhe":"ei_lisenssia"}
        │
        │  Onko allekirjoitus ja voimassaolo kunnossa?
        ├─ ei  → sama kuin yllä
        │
        └─ kyllä → next()  → sisältö tarjoillaan
```

Suojatut polut luetellaan `middleware.js`-tiedoston `config.matcher`-listassa:
`/sivut/*`, `/pelit/*`, `/tehtavat/*`, `/robo-peli/*`, `/7luokka`, `/8luokka`,
`/9luokka`, osio-datatiedostot ja `/js/tehtavat.json`.

**Uusi suojattava sivu on lisättävä tähän listaan.** Jos unohtuu, sisältö on
julkista eikä mikään huomauta siitä.

### Miksi data-pyynnöt saavat 401 eivätkä ohjausta

`fetch()` ei hyödy 302-ohjauksesta — se seuraisi sitä ja saisi HTML-sivun JSONin
sijaan, mikä näkyisi käyttäjälle sekavana jäsennysvirheenä. Siksi `/js/`-polut
ja `.json`-päätteiset pyynnöt saavat selkeän 401-vastauksen.

---

## 3. Istuntotoken

Toteutus: `api/_lib/token.js`. Ei ulkoista JWT-kirjastoa.

```
base64url(JSON-payload) + "." + base64url(HMAC-SHA256(payload, secret))
```

Allekirjoitus tehdään Web Cryptolla, joka toimii sekä Node- että
Edge-ympäristössä. Tarkistus `tarkistaToken()` varmistaa allekirjoituksen ja
`exp`-kentän, ja palauttaa `null` kaikissa virhetilanteissa — myös
poikkeuksissa. Kutsujan ei tarvitse erotella virhetyyppejä.

Tiedostopääte on tarkoituksella `.js` eikä `.mjs`: Vercel ajaa API-funktioita
CommonJS-tilassa eikä voi `require()`-ladata ES-moduulia. `.mjs` aiheutti
`ERR_REQUIRE_ESM`-virheen.

### Eväste

```
digiopo_lisenssi=<token>; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=25920000
```

`HttpOnly` estää lukemisen JavaScriptistä, `Secure` vaatii HTTPS:n,
`SameSite=Lax` suojaa CSRF:ltä.

Voimassaolo on ~300 vrk eli koko lukuvuosi, jotta oppilas kirjautuu kerran per
laite. Pitkä ikä kompensoidaan taustatarkistuksella: `lisenssiportti.js` kysyy
lisenssin tilan 24 tunnin välein ja **poistaa evästeen**, jos lisenssi on
peruttu tai vanhentunut. Peruutus tehoaa siis noin vuorokaudessa.

### Kaksi istuntotyyppiä samassa evästeessä

| `typ` | Syntyy | Sisältää | Antaa |
|---|---|---|---|
| `koulu` | Koulukoodi `liity.html`-portissa | `koulu` | Oppilasnäkymä |
| `opettaja` | Supabase Auth -kirjautuminen | `koulu`, `email` | Hallintapaneeli, muokkaustila |

Molemmat kirjoittavat **samaan evästeeseen**. Käytännön seuraus: koulukoodin
syöttäminen samassa selaimessa korvaa opettajaistunnon. Oppilasnäkymän
testaamiseen kannattaa käyttää yksityistä ikkunaa.

`api/_lib/opettaja.js` lukee opettajan sähköpostin ja vaatii nimenomaan
`payload.typ === 'opettaja'`. Koulukoodilla kirjautunut ei siis voi saada
opettajan oikeuksia, vaikka eväste on sama.

---

## 4. Kaksi kirjautumisreittiä

Molemmat kulkevat `api/lisenssi.js`-funktion läpi.

**Koulukoodi.** POST, rungossa `{ koodi }`. Palvelin hakee rivin
`lisenssit`-taulusta ja tarkistaa `aktiivinen`- ja `voimassa_asti`-kentät.

⚠️ **`tyyppi` ei rajoita pääsyä.** Myös `testi`-tyyppinen lisenssi avaa koko
sisällön. Kenttä on raportointia varten. Ks. [03 – Tietokanta](03-tietokanta.md).

**Opettajatili.** `Authorization: Bearer <Supabase-token>`. Palvelin varmistaa
tokenin Supabasen `/auth/v1/user`-rajapinnasta, saa sähköpostin, ja etsii
lisenssin kyselyllä `?email=eq.<email>&tyyppi=eq.opettaja`. Koodia ei käytetä.

Auth-käyttäjää ei tarvitse luoda etukäteen: `kirjaudu.html` käyttää asetusta
`shouldCreateUser: true`, joten tili syntyy ensimmäisen kirjautumislinkin
myötä. **Käyttöoikeus ratkeaa lisenssistä**, ei Auth-käyttäjän olemassaolosta –
kuka tahansa voi pyytää kirjautumislinkin, mutta ilman `tyyppi = 'opettaja'`
-lisenssiä istunto ei anna mitään oikeuksia.

---

## 5. Hallintaoikeus ryhmiin

Opettaja hallitsee ryhmää, jonka `omistaja_email` vastaa hänen istuntonsa
sähköpostia. Oppilaan lukuoikeus on julkinen pelkällä ryhmäkoodilla.

**Aiempi PIN-malli on poistettu** (heinäkuu 2026). Ryhmää hallittiin salaisella
avaimella, joka tallennettiin SHA-256-tiivisteenä `avain_hash`-kenttään. Sarake
on pudotettu eikä esiinny koodissa enää missään. Jos näet siihen viittauksia,
kyseessä on vanha dokumentti tai koodihaara.

---

## 6. Hyökkäyspinnan rajaus

### Rate limit

`api/_lib/rate.js`, jaettu Upstash Redis -laskuri. Ilman Redistä turvaudutaan
instanssikohtaiseen muistilaskuriin, joka nollautuu cold startissa eikä päde
serverless-instanssien yli.

Kooditarkistuksessa kolme rinnakkaista rajaa, ikkuna 10 minuuttia:

| Raja | Arvo | Tarkoitus |
|---|---|---|
| Per koodi | 8 | Yhden koodin arvailu |
| Per IP | 40 | Yksittäinen hyökkääjä |
| Globaali | 120 | Laaja arvailukampanja |

**Vain epäonnistuneet yritykset kuluttavat budjettia.** Tämä on olennaista:
koulussa koko luokka tulee ulos samasta NAT-osoitteesta, ja onnistuneiden
kirjautumisten laskeminen lukitsisi oppilaat ulos joka aamu.

### IP:n tunnistus

`api/_lib/turva.js`, funktio `haeIp()`. Käyttää Vercelin `x-real-ip`-otsaketta,
jota asiakas ei voi väärentää. `x-forwarded-for` on vasta viimeinen vaihtoehto,
koska sen vasemman pään voi asiakas itse asettaa — aiempi versio käytti sitä
ensisijaisena, mikä mahdollisti rate limitin kiertämisen.

### Vakioaikainen vertailu

`vertaaSalaisuus()` käyttää `crypto.timingSafeEqual`-funktiota ja tekee
dummy-vertailun myös pituuseron tapauksessa. Näin vastausaika ei paljasta,
kuinka monta merkkiä arvauksesta osui oikein.

### Otsakkeet

`vercel.json` asettaa CSP:n, `X-Frame-Options: SAMEORIGIN`,
`X-Content-Type-Options: nosniff`, `Referrer-Policy` ja `Permissions-Policy`
(kamera, mikrofoni ja sijainti estetty).

CSP:n `connect-src` sallii vain `'self'` ja `https://*.supabase.co`.

---

## 7. Service worker ja suojattu sisältö

`sw.js` **ohittaa suojatut polut kokonaan** (`onSuojattuPolku`). Pyyntö menee
selaimen natiivin polun kautta, jolloin middleware pääsee tarkistamaan
lisenssin.

Jos suojattu sisältö tallennettaisiin välimuistiin, se olisi luettavissa
offline-tilassa ilman voimassa olevaa lisenssiä — eli maksumuurin ohi.

---

## 8. Fail-open-venttiilit

Kolme kohtaa toimii puuttuvalla asetuksella niin, että **suojaus on pois
päältä** eikä mikään ilmoita siitä.

| Muuttuja | Puuttuessa |
|---|---|
| `LISENSSI_JWT_SECRET` | Maksumuuri pois päältä, koko sisältö julkista |
| `CRON_SECRET` | Cron-endpointit avoimia kenelle tahansa |
| `UPSTASH_REDIS_REST_*` | Rate limit vain instanssikohtainen |

Ensimmäinen on **tarkoituksellinen turvaventtiili**: jos muuri rikkoutuu kesken
koulupäivän, nopein korjaus on poistaa ympäristömuuttuja ja tehdä uusi julkaisu.
Sisältö avautuu kaikille, mutta opetus jatkuu.

Kaksi jälkimmäistä ovat lähinnä varomattomuutta. Molemmat on syytä asettaa.

**Tarkista tuotannosta säännöllisesti:** avaa suojattu sivu ilman evästettä
(yksityinen ikkuna). Jos et ohjaudu portille, muuri on pois päältä.

---

## 9. Tarkistuslista muutoksen jälkeen

Kun kosket maksumuuriin, istuntoihin tai API-funktioihin:

- [ ] Uudet suojattavat polut lisätty `middleware.js`-tiedoston `config.matcher`-listaan
- [ ] Uudet suojattavat polut lisätty `sw.js`-tiedoston `onSuojattuPolku`-funktioon
- [ ] `SUPABASE_SERVICE_KEY` ei esiinny selainpuolen koodissa
- [ ] Yksityinen ikkuna: suojattu sivu ohjaa portille
- [ ] Kelvollinen koodi päästää läpi ja pääsy säilyy sivunvaihdossa
- [ ] Opettajaistunto antaa hallintapaneelin, koulukoodi ei
- [ ] Selaimen konsolissa ei CSP-virheitä
