# 05 – API-rajapinnat

Kansiossa `api/` on **12 serverless-funktiota** ja alikansio `_lib/` jaetulle
koodille. Vercel Hobby -tason katto on 12 funktiota, eli tila on täynnä: uusi
endpoint vaatii olemassa olevan laajentamista tai Pro-tilausta.
Alikansion `_lib/`-tiedostot eivät kuluta kiintiötä, koska niitä ei julkaista
endpointteina.

Turvamalli, istunnot ja maksumuuri: [04 – Arkkitehtuuri](04-arkkitehtuuri.md).

---

## 1. Yleiset periaatteet

Kaikki funktiot noudattavat samaa kaavaa:

- **CORS-esitarkistus** `OPTIONS` → 204
- **Väärä metodi** → 405
- **Rate limit ylittyy** → 429
- **Virhe** → kirjataan `api_virheet`-tauluun (`_lib/virhelogi.js`) ja
  palautetaan 500

Vastaukset ovat muotoa `{ ok: true, ... }` tai `{ ok: false, virhe: "..." }`.
Huomaa että osa virhetilanteista palautetaan **HTTP 200 -statuksella** ja
`ok: false` -kentällä — esimerkiksi virheellinen lisenssikoodi. Tämä on
tarkoituksellista: selain erottelee virheet `ok`-kentästä, ei statuskoodista.

Kirjoitusoperaatiot käyttävät `toiminto`-kenttää rungossa yhden endpointin
sisällä. Tämä on suora seuraus funktiokatosta — muuten jokainen toiminto olisi
oma tiedostonsa.

---

## 2. Funktiot

### Maksumuuri ja istunnot

| Endpoint | Metodi | Valtuutus |
|---|---|---|
| `/api/lisenssi` | POST | — (tämä *luo* istunnon) |

Kaksi reittiä samassa funktiossa:

- **Koulukoodi:** `{ koodi, laite }` → tarkistaa `aktiivinen` ja `voimassa_asti`,
  asettaa evästeen `typ: 'koulu'`
- **Opettajatili:** `Authorization: Bearer <Supabase-token>` → varmistaa tokenin
  Supabasen `/auth/v1/user`-rajapinnasta, etsii lisenssin sähköpostilla,
  asettaa evästeen `typ: 'opettaja'`

Vastaus: `{ ok: true, voimassa_asti }` tai
`{ ok: false, virhe: "vanhentunut" | "virheellinen" | "liikaa_yrityksia" }`.

Rate limit poikkeaa muista: kolme rinnakkaista rajaa (per koodi 8, per IP 40,
globaali 120 / 10 min) ja **vain epäonnistuneet yritykset kuluttavat budjettia**.

### Opettajan hallinta

| Endpoint | Metodi | Valtuutus |
|---|---|---|
| `/api/jarjestys` | GET / POST | GET julkinen, POST opettajaistunto |
| `/api/aikataulu` | GET / POST | GET julkinen, POST opettajaistunto |

Sama kuvio molemmissa: oppilas lukee pelkällä ryhmäkoodilla, opettaja kirjoittaa
istunnollaan. Valtuutus tulee `_lib/opettaja.js`-funktiosta, joka vertaa
istunnon sähköpostia ryhmän `omistaja_email`-kenttään.

```
GET  /api/jarjestys?ryhma=7A-K3M9&luokka=7
GET  /api/aikataulu?ryhma=7A-K3M9
POST /api/aikataulu  { toiminto: "lisaa" | "muokkaa" | "poista", ... }
```

`jarjestys.js` hyväksyy myös `x-admin-key`-otsakkeen ylläpitotoimintoihin.

### Pelit ja oppilastyöt

| Endpoint | Metodi | Valtuutus |
|---|---|---|
| `/api/maailma-taulu` | GET / POST | Opettajatoiminnot koulukoodilla |
| `/api/fake-insta` | GET / POST | Sama |
| `/api/ammattiset` | GET / POST | Ylläpito `AMMATTISET_ADMIN_KEY`-avaimella |
| `/api/tiedontemppeli` | GET / POST | — |

`maailma-taulu` ja `fake-insta` noudattavat samaa moderointimallia: oppilas
lähettää työn, opettaja hyväksyy sen näkyviin, ja vain hyväksytyt palautuvat
GET-pyynnöllä. Opettajan toiminnot (`tarkista_opettaja`, `hae_kaikki`,
`hyvaksy`, `poista`, `tyhjenna`) vaativat **opettajaistunnon**, ja koulu
luetaan istunnosta — ei pyynnön rungosta.

> **Korjattu 19.7.2026.** Aiemmin nämä toiminnot valtuutettiin koulukoodilla,
> eli samalla koodilla jonka jokainen oppilas kirjoittaa päästäkseen sivustolle.
> Kuka tahansa oppilas pystyi yhdellä POST-pyynnöllä hyväksymään omat työnsä
> ohi opettajan, poistamaan toisten töitä tai ajamaan `tyhjenna`-toiminnon ja
> pyyhkimään koko luokan taulun. Valtuutus tulee nyt allekirjoitetusta
> istuntoevästeestä (`typ === 'opettaja'`), jota oppilas ei voi saada.
>
> Samalla korjattiin `laheta`: koulu luettiin aiemmin pyynnön rungosta, joten
> oppilas pystyi lähettämään työn toisen koulun tauluun. Nyt koulu luetaan
> istunnosta molemmissa istuntotyypeissä (`_lib/opettaja.js`,
> `haeIstunnonKoulu`). Rungon `koulu`-kenttä on varapolku vain tilanteeseen,
> jossa maksumuuri on kokonaan pois päältä.

### ⚠️ `koulu` on rajausavain – merkkijonon on täsmättävä

Työt rajataan `koulu`-kentän arvolla. Koulun lisenssin ja saman koulun
opettajalisenssien `koulu`-arvon on oltava **täsmälleen sama merkkijono**.

Jos koulukoodilla on `"Mäyrälän koulu"` ja opettajan lisenssillä `"Mäyrälä"`,
opettaja ei näe yhtään oppilaan työtä. Virheilmoitusta ei tule – vain tyhjä
lista. Tämä on tukipyyntöjen kannalta pahin mahdollinen vikatyyppi.

Tarkistus:

```sql
select koulu, tyyppi, count(*)
from lisenssit
group by koulu, tyyppi
order by koulu;
```

Jos samasta koulusta on rivejä eri kirjoitusasuilla, yhtenäistä ne.

Tykkäykset ja tähdet deduplikoidaan laitekohtaisesti tietokannan puolella
(`mt_tykkays_laite`, `fip_tykkays_laite`, `fip_tahti_laite`).

### Seuranta

| Endpoint | Metodi | Valtuutus |
|---|---|---|
| `/api/ping` | POST | — |

`{ sivu: "7luokka" }` kasvattaa päiväkohtaista laskuria. Sallitut sivunimet on
kovakoodattu listaksi, mikä estää roskadatan. Ei tallenna henkilötietoja.

Kirjoitus menee shardattuun `page_views`-tauluun, ks.
[03 – Tietokanta](03-tietokanta.md).

### Hallintapaneeli

| Endpoint | Metodi | Valtuutus |
|---|---|---|
| `/api/admin-tilastot` | GET | `x-admin-key: <ADMIN_DASHBOARD_KEY>` |
| `/api/admin-viesti` | GET / POST | Sama |

`admin-tilastot` palauttaa yhtenä koosteena lisenssitilanteen, käyntimäärät,
viimeisimmät virheet ja Vercelin julkaisutilan (jos `VERCEL_API_TOKEN` on
asetettu).

`admin-viesti` lähettää massaviestin lisenssinhaltijoille. Kolme suojaa:

1. `action: 'esikatselu'` kertoo vastaanottajamäärän lähettämättä mitään
2. `action: 'testi'` lähettää vain `ADMIN_EMAIL`-osoitteeseen
3. `action: 'laheta'` vaatii kentän `vahvistus: 'LAHETA'` — **tarkistetaan
   palvelimella**, ei vain selaimessa

Vastaanottajat: aktiiviset, voimassa olevat, `tyyppi != 'testi'`, sähköpostit
deduplikoituna. Lähetykset kirjataan `admin_viestit`-tauluun.

### Ajastetut (cron)

| Endpoint | Ajo (UTC) | Valtuutus |
|---|---|---|
| `/api/tarkista-kirjaukset` | 06:00 | `Authorization: Bearer <CRON_SECRET>` |
| `/api/tarkista-virheet` | 07:00 | Sama |

`tarkista-kirjaukset` tekee kaksi tarkistusta samassa funktiossa — kirjautumis-
piikin (yli 50 / tunti) ja lisenssien ylikäytön (`lisenssi_kaytto`-näkymä).
Ne yhdistettiin nimenomaan funktiokaton takia.

⚠️ `CRON_SECRET` on fail-open: jos muuttujaa ei ole asetettu, tarkistusta ei
tehdä lainkaan ja endpointit ovat avoimia.

Ajastukset määritellään `vercel.json`-tiedostossa, eivät koodissa.

---

## 3. Rate limitit

Kaikki käyttävät jaettua Redis-laskuria (`_lib/rate.js`), avain muotoa
`rl:<endpoint>:ip:<ip>`.

| Endpoint | Raja | Ikkuna |
|---|---|---|
| `ping` | 300 | 1 min |
| `ammattiset`, `fake-insta`, `maailma-taulu`, `tiedontemppeli` | 120 | 5 min |
| `jarjestys`, `aikataulu` | 40 | 10 min |
| `lisenssi` | 8 / 40 / 120 | 10 min |

Rajat on mitoitettu koululuokan mukaan: `ping` sallii eniten, koska se laukeaa
jokaisella sivulatauksella, ja koko luokka tulee ulos samasta NAT-osoitteesta.
Kirjoituspainotteiset endpointit ovat tiukempia.

### ⚠️ Koko koulu jakaa saman budjetin

Rate limit on IP-kohtainen, ja koulussa kaikki laitteet ovat saman NAT-osoitteen
takana. **Yhden luokan 25 oppilasta ja opettaja jakavat siis saman 120 pyynnön
budjetin.** Tämä on syytä muistaa aina kun lisää automaattista pollausta.

Konkreettinen esimerkki: `fake-insta.html`-sivun opettajanäkymä haki tiedot
5 sekunnin välein POST-pyynnöllä. Se on 60 pyyntöä viiden minuutin ikkunassa
eli puolet koko koulun budjetista — pelkästään siitä, että opettajalla oli
välilehti auki. Oppilaat alkoivat saada `liikaa_yrityksia`-virheitä kesken
oppitunnin.

Korjattu 19.7.2026: pollausväli 20 sekuntiin ja haku pysäytetään kun välilehti
on piilossa (`document.hidden`).

Nyrkkisääntö uudelle pollaukselle: laske `(60 / väli_sekunteina) × 5` ja vertaa
sitä endpointin rajaan. Jos tulos on yli 10 % rajasta, väli on liian tiheä.

**Ilman Upstash-muuttujia rajat eivät päde.** Muistilaskuri on
instanssikohtainen ja nollautuu cold startissa.

---

## 4. Jaettu koodi (`api/_lib/`)

| Tiedosto | Tehtävä |
|---|---|
| `token.js` | Allekirjoitettu istuntotoken, HMAC-SHA256 Web Cryptolla. Toimii sekä Node- että Edge-ympäristössä |
| `opettaja.js` | Lukee opettajan sähköpostin istuntoevästeestä. Vaatii `typ === 'opettaja'` |
| `turva.js` | `haeIp()` — väärentämätön IP Vercelin `x-real-ip`-otsakkeesta. `vertaaSalaisuus()` — vakioaikainen vertailu |
| `rate.js` | Jaettu Redis-rate limit, muistilaskuri varalla |
| `virhelogi.js` | Kirjaa virheet `api_virheet`-tauluun hallintapaneelia varten |

Nämä eivät ole endpointteja eivätkä kuluta funktiokiintiötä.

---

## 5. Uuden endpointin lisääminen

**Kiintiö on täynnä.** Ennen uuden tiedoston luomista:

1. Voiko toiminnon lisätä olemassa olevaan funktioon `toiminto`-kentällä?
   Tätä on käytetty johdonmukaisesti — ks. `fake-insta.js`, jossa on kahdeksan
   toimintoa yhdessä funktiossa.
2. Onko kyseessä ajastettu tehtävä, jonka voi tehdä Supabasen pg_cronilla?
   Siivoukset on toteutettu näin (`supabase_siivous_cron.sql`).
3. Vasta jos kumpikaan ei sovi: Vercel Pro.

Jos lisäät funktion, muista:

- Rate limit `_lib/rate.js`-funktiolla, oma avainetuliite
- Virheet `_lib/virhelogi.js`-funktiolla, jotta ne näkyvät hallintapaneelissa
- IP `_lib/turva.js`-funktiolla `haeIp()`, ei suoraan otsakkeista
- Salaisuuksien vertailu `vertaaSalaisuus()`-funktiolla, ei `===`-operaattorilla
- Jos endpoint palvelee suojattua sisältöä, lisää polku myös
  `middleware.js`- ja `sw.js`-tiedostoihin
