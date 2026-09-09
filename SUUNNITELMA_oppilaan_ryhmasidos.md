# DigiOpo – Oppilaan luotettava ryhmäsidos (Chromebook-yhteensopiva)

Laadittu: 2026-09-08 · Tila: suunnitelma (ei toteutettu)

## 1. Ongelma

Oppilaiden Chromebookit **tyhjentävät kaiken selaindatan uloskirjautuessa** –
localStorage JA evästeet katoavat. Nykymalli nojaa molempiin:

- Sisältöpääsy = HttpOnly-JWT-eväste (`/api/lisenssi` + `middleware.js`).
- Ryhmäsidos (järjestys, lukot, kalenteri) = `digiopo-ryhma` localStoragessa,
  joka syntyy vain `?ryhma=`-linkistä.

Kun molemmat katoavat joka istunto, oppilas näkee oletussivun ilman opettajan
järjestystä/piilotuksia, ja joutuu joka kerta syöttämään koulukoodin.

## 2. Päätökset (2026-09-08)

1. **Reitti:** oppilaat tulevat **Google Classroom -linkin** kautta (linkki
   säilyy Classroomissa, vaikka kone tyhjenee).
2. **Vaiva:** yksi klikkaus / koodi per istunto riittää. EI oppilaskohtaisia
   tunnuksia eikä alaikäisten henkilötietoja (ei Google-kirjautumista).
3. **Koodit yhdeksi:** yksi **luokkakoodi** (= ryhmäkoodi) avaa sisällön JA
   valitsee ryhmän. Korvaa erillisen koulukoodin oppilaille.

## 3. Ratkaisun ydin

Pysyvä "muisti" on **Google Classroom (linkki) + Supabase (palvelin)** — ei
koskaan oppilaan kone. Siksi kaiken tarvittavan on kuljettava linkissä ja
ratkettava palvelimella joka istunto.

**Yksi luokkalinkki per luokka**, jaettuna Google Classroomiin:

    https://app.digiopo.fi/9luokka?ryhma=EXZ-QPBC

Linkki sisältää sekä luokka-asteen sivun (`/9luokka`) että ryhmäkoodin
(`?ryhma=`). Tämä riittää tekemään KAIKEN yhdellä klikkauksella:

- avaa sisällön (maksumuuri) — ryhmäkoodi → koulukoodi → lisenssi
- soveltaa opettajan **järjestyksen ja lukot** (toimii jo `?ryhma=`:lla)
- näyttää ryhmän **kalenterin** (toimii jo `?ryhma=`:lla)

Feasibility varmistettu: kaikilla ryhmillä on `koulukoodi` kytkettynä
(12/12 kannassa), joten ryhmäkoodi → koulukoodi → lisenssi -ketju on valmis.

## 4. Oppilaan polku (tyhjä kone, joka istunto)

1. Oppilas avaa Classroomista luokkansa linkin `/9luokka?ryhma=EXZ-QPBC`.
2. `lisenssiportti.js`: ei evästettä (tyhjentynyt). **UUSI:** jos URLissa on
   `?ryhma=`, kutsu automaattisesti `/api/lisenssi` tällä koodilla → palvelin
   avaa sisällön → sisältö aukeaa **ilman että oppilas kirjoittaa mitään.**
3. `jarjestys.js`: `?ryhma=` → soveltaa julkaistun järjestyksen + lukot.
4. Kalenteri: `?ryhma=` → näyttää ryhmän aikataulun.

Tulos: yksi klikkaus → sisältö auki + oikea järjestys + lukot + kalenteri.
Toimii joka istunto, koska linkki elää Classroomissa.

**Varareitti (ei linkkiä):** maksumuurin kenttä hyväksyy myös luokkakoodin.
Oppilas kirjoittaa opettajan antaman luokkakoodin → sama palvelinlogiikka avaa
sisällön ja asettaa ryhmän istunnoksi.

## 5. Tekniset muutokset

### 5.1 Palvelin: `api/lisenssi.js` (ydinmuutos)
Laajenna kooditarkistus hyväksymään myös **ryhmäkoodi**:

- Nykyinen: `haeSupabasesta(koodi)` hakee `lisenssit`-taulusta koodilla.
- UUSI: jos koodia ei löydy `lisenssit`-taulusta, hae `opetusryhmat`-taulusta
  `ryhmakoodi=eq.<koodi>` → ota `koulukoodi` → tarkista sen lisenssi
  (`aktiivinen`, `voimassa_asti`) → jos OK, myönnä sama HttpOnly-eväste.
- Palauta vastauksessa `ryhma` (ryhmäkoodi), jotta frontend voi sitoa ryhmän.
- **Laiteseuranta:** kirjaa laite ryhmän **koulukoodin** alle (paikkalaskenta
  pysyy koulukohtaisena, kuten nyt).
- Rate limit: käytä nykyistä (per koodi + per IP).

### 5.2 Frontend: `js/lisenssiportti.js`
- Lataussa: jos ei voimassa olevaa evästettä JA URLissa on `?ryhma=<koodi>`,
  kutsu `/api/lisenssi` automaattisesti tuolla koodilla ennen maksumuurin
  näyttöä. Onnistuu → ei porttia. Epäonnistuu → näytä portti.
- Portin kenttä: teksti "Syötä koulu- tai luokkakoodi" (sama endpoint hoitaa
  molemmat). Onnistuneen luokkakoodin jälkeen aseta ryhmä istunnolle
  (localStorage `digiopo-ryhma` — riittää istunnon ajaksi, katoaa uloskirjautuessa).

### 5.3 Opettajan työnkulku (kevyt)
- Hallintapaneelin "Jaa linkki oppilaille" -laatikko sisältää jo oikean
  `?ryhma=`-linkin. Lisää selkeä "Kopioi Google Classroomiin" -ohje/painike.
- Ohjeisiin: "Jaa tämä linkki luokkasi Google Classroomiin. Oppilaat pääsevät
  sisään yhdellä klikkauksella joka kerta."

## 6. Mitä EI tarvitse muuttaa

- Järjestys + lukot: toimivat jo `?ryhma=`:lla (todennettu livenä).
- Kalenteri: toimii jo `?ryhma=`:lla.
- Opettajan oma näkymä: korjattu erikseen (automaattinen ryhmänhaku istunnosta).
- Tietokantarakenne: `opetusryhmat.koulukoodi` on jo olemassa ja täytetty.

## 7. Turvallisuus & tietosuoja

- Ryhmäkoodi antaa nyt sisältöpääsyn — yhtä vahva kuin koulukoodi (vain
  sisältö), sidottu aktiiviseen lisenssiin. Lisenssin deaktivointi tai ryhmän
  poisto katkaisee pääsyn.
- Ryhmäkoodeja on enemmän ja ne jaetaan oppilaille → suurempi vuotoriski kuin
  yhdellä koulukoodilla. Riski rajattu: vain sisältö, ei henkilötietoa, ei
  kirjoitusoikeutta (kirjoitus vaatii opettajan istunnon).
- **Ei alaikäisten henkilötietoja** (päätös 2: ei Google-kirjautumista) → ei
  uutta tietosuojakuormaa.

## 8. Reunatapaukset

- Lisenssi vanhentunut/deaktivoitu → endpoint palauttaa `vanhentunut/virheellinen`
  → selkeä viesti oppilaalle.
- Väärä/typo luokkakoodi → maksumuurin virheviesti (kuten nyt).
- Ryhmä usealla luokka-asteella → yksi linkki per luokka-astesivu (harvinaista).
- Vanha koulukoodin syöttö toimii yhä (taaksepäin yhteensopiva).

## 9. Testaus (tyhjän Chromebookin simulaatio)

1. Tyhjennä selaimen localStorage + evästeet (simuloi uloskirjautumista).
2. Avaa `/9luokka?ryhma=EXZ-QPBC`.
3. Odotus: sisältö aukeaa ilman koodin syöttöä; järjestys + lukot + kalenteri
   sovellettu; ei maksumuuria.
4. Toista väärällä ryhmäkoodilla → maksumuuri + virheviesti.
5. Toista vanhentuneella lisenssillä → selkeä viesti.
6. Varareitti: tyhjä tila, kirjoita luokkakoodi maksumuuriin → sama tulos.

## 10. Vaiheet ja työmäärä-arvio

1. Palvelin `api/lisenssi.js`: ryhmäkoodin resoluutio + laitekirjaus (S–M).
2. Frontend `lisenssiportti.js`: auto-avaus `?ryhma=`:lla + kentän teksti (S).
3. Opettajan jako-UX + ohjeet (S).
4. Testaus tyhjän koneen simulaatiolla (S).

Kokonaisuus pieni, koska ryhmädatan sovellus (järjestys/lukot/kalenteri) toimii
jo — muutos koskee vain maksumuurin avausta ryhmäkoodilla.

## 11. Heikko verkko ja ruuhka — päätös (2026-09-08)

**Todellinen käyttö:** kaikki ~30 oppilasta eivät kirjaudu yhtä aikaa —
käytännössä 5–9 kerrallaan. Tämä ei ole ruuhka: Vercel + Supabase hoitavat sen
vaivatta, ja koska rate limit laskee **vain epäonnistumisia**, jaetun koulun
IP:n lukkiutumisriskiä ei käytännössä ole.

**Päätös:** toteutetaan **A + B**. **C (allekirjoitettu linkkitunniste)
jätetään pois** ylimitoitettuna — sen ainoa hyöty olisi ruuhkan poisto, jota
ei ole.

- **A. Selaimen sitkeys (`lisenssiportti.js`):** jos automaattinen avaus
  epäonnistuu (verkko), yritä uudelleen porrastetulla viiveellä + jitterillä
  (esim. 3 yritystä). Epäonnistuessa ystävällinen "verkko on hidas, yritetään
  uudelleen" -viesti, ei pelottavaa maksumuuria.
- **B. Nopeampi vastaus (`api/lisenssi.js`):** laitekirjaus fire-and-forget
  (ei odoteta ennen vastausta). Seuranta on muutenkin likimääräistä, joten
  satunnainen kirjaamatta jäänti on hyväksyttävää.

**Valinnainen pieni suoja:** laske väärät yritykset per (IP + koodi) eikä
pelkkä IP, jottei yhden oppilaan näppäilyvirheet voi lukita koko luokkaa.
Matala prioriteetti pienellä yhtäaikaismäärällä.

## 12. Opettaja → koulu -kytkös: eksplisiittinen kytkös (päämekanismi)

**Ongelma:** ryhmä tarvitsee `koulukoodin` (ryhmä → koulukoodi → lisenssi
-ketju), mutta ryhmää luotaessa koulukoodi luetaan nyt selaimen muistista
(`digiopo_lisenssi`). Koska opettaja kirjautuu sähköpostilla eikä koodilla,
koulukoodi ei välttämättä ole selaimessa → ryhmä voi jäädä ilman koulukoodia
ja koko oppilasmalli hajoaa hiljaa sille ryhmälle.

**Kannan tarkistus (2026-09-09):** 3/6 opettajalisenssistä on "orpoja" —
`koulu`-nimi ei täsmää yhteenkään aktiiviseen koululisenssiin (pilotti-/testi-/
kehittäjätilit). Oikean tilatun koulun (Ruusuvuori) opettajat täsmäävät.
Kunta-lisenssejä 0, duplikaattikoulunimiä 0 (mutta kunta on realistinen tulevaisuudessa).
→ Pelkkä nimipäättely ei riitä luotettavaksi päämekanismiksi.

**Päämekanismi: eksplisiittinen kytkös.** Lisää opettajalisenssiin (`lisenssit`,
`tyyppi='opettaja'`) uusi kenttä, joka tallentaa koulukoodin **suoraan**:

    alter table lisenssit add column if not exists koulukoodi text;

- **Tilausautomaatio** (`api/tilaus.js`) luo koulukoodin JA opettajalisenssit
  samassa operaatiossa → kirjoittaa koulukoodin tähän kenttään heti.
- **Käsin luodut** (pilotit/sijaiset): koulukoodi mukaan SQL:ään.
- **Vanhat rivit**: kertaluontoinen täydennys — nimimätsäyksellä täsmäävät
  saavat kentän automaattisesti; orvot ratkaistaan tapauskohtaisesti.

**Ryhmän luonti (`api/jarjestys.js`, `luo_oma`) — koulukoodin lähde palvelimella,
tässä järjestyksessä:**

1. **Eksplisiittinen kytkös:** opettajalisenssin `koulukoodi`-kenttä (jos on). ← päämekanismi
2. **Nimimätsäys (vara):** tarkka `koulu`-nimi → aktiivinen, voimassa oleva
   koululisenssi; jos useita, uusin `voimassa_asti`.
3. **Selaimesta luettu koulukoodi (vara):** nykyinen käytös, taaksepäin yhteensopivuus.
4. **Jos ei mitään → KOVA VIRHE:** estä ryhmän luonti selkeällä viestillä
   ("Ryhmää ei voi kytkeä koulun lisenssiin — ota yhteys ylläpitoon"). EI hiljaista
   orpo-ryhmää.

**Hyöty:** opettajan ja koulun yhteys on tallennettu tosiasiana, ei pääteltävissä
→ deterministinen, ei riipu selaimen muistista eikä nimen kirjoitusasusta, kestää
myös kunta-lisenssit ja duplikaattinimet. Nimimätsäys jää vain varamekanismiksi.

**Vaiheet (lisäys osioon 10):**
5. `lisenssit`: uusi `koulukoodi`-sarake + vanhojen rivien täydennys (S).
6. `api/tilaus.js`: kirjoita koulukoodi opettajalisenssiin luontihetkellä (S).
7. `api/jarjestys.js` `luo_oma`: koulukoodin haku yllä kuvatussa järjestyksessä
   + kova virhe (S–M).
