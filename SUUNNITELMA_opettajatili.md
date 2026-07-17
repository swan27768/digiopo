# DigiOpo — Opettajatili ja ryhmien hallinta

**Suunnitteludokumentti · v2 (yhtenäinen tilimalli) · 17.7.2026 · ehdotus (ei vielä toteutettu)**

## 1. Tavoite

Opettaja hallitsee omia opetusryhmiään — perustaminen, osioiden järjestys ja piilotus, lukuvuoden aikataulut, ryhmien poisto — kirjautumalla **omalla sähköpostitilillään**. Ei PIN-koodeja, ei ylläpitäjää välissä, ja synkka laitteiden välillä. Toimii sekä henkilökohtaisen lisenssin että **koululisenssin** opettajille.

## 2. Ydinperiaate: identiteetti ≠ lisenssi

Koko malli nojaa siihen, että kirjautuminen ja lisenssi ovat kaksi eri asiaa:

- **Lisenssi** = maksumuurin avaus (kuka saa käyttää sisältöä). Voi olla koululisenssi (jaettu koodi) tai henkilökohtainen (sähköpostiin sidottu).
- **Opettajatili (sähköposti)** = hallintaoikeus (kuka saa luoda ja muokata ryhmiä). Erillinen lisenssistä.

Näin **koululisenssin ostaneen koulun opettaja voi silti saada henkilökohtaisen hallintatilin**. Oppilaat käyttävät edelleen jaettua koulukoodia sisältöön; opettaja kirjautuu omalla sähköpostillaan hallintaan. Hallintatili on pelkkä identiteetti, ei erillinen lisenssi — teknisesti ilmainen tarjota (sisältyminen koululisenssiin on tuotepäätös).

## 3. Lähtötilanne (mitä on jo olemassa)

- Supabase (Postgres) vain palvelinpuolen API:n kautta (service_key); selain ei koskaan puhu suoraan tietokantaan.
- Maksumuuri: allekirjoitettu `digiopo_lisenssi`-eväste (HMAC-SHA256, `LISENSSI_JWT_SECRET`), tarkistetaan `middleware.js`:ssä.
- **Opettajan sähköpostikirjautuminen on jo rakennettu:** `kirjaudu.html` käyttää Supabase Auth **magic linkiä** (`signInWithOtp`); `api/lisenssi.js` verifioi Supabase-tokenin (`/auth/v1/user`), lukee sähköpostin ja tarkistaa opettajalisenssin `lisenssit`-taulusta.
- Rinnalla toimii **koulukoodi** (koululisenssi): jaettu koodi, jonka oppilaat syöttävät (`lisenssiportti.js` / `liity.html`).
- Lisenssieväste kantaa nyt vain `{ typ, koulu }` — **ei sähköpostia**.
- `opetusryhmat`: `ryhmakoodi`, `avain_hash` (PIN), `koulukoodi`, `nimi`, `luotu_at`. Järjestykset ja aikataulu `ON DELETE CASCADE`.

## 4. Roolit (mikä hoitaa minkä)

- **Sähköposti-/tilikirjautuminen** = opettajan identiteetti ja hallinta.
- **Koulukoodi** = oppilaiden ja koko koulun pääsy sisältöön.
- **Ryhmäkoodi** = oppilaan tapa nähdä oikea ryhmä (jaettava linkki). Säilyy.
- **PIN** = poistuu opettajilta (korvautuu tilikirjautumisella). Oppilaat eivät ole koskaan käyttäneet PIN:iä.

## 5. Tietomallin muutos

- `opetusryhmat.omistaja_email text` — nullable, indeksoitu. Kertoo kuka ryhmän omistaa.
- Opettajaidentiteetti tulee Supabase Authista (sähköposti); erillistä `opettajat`-taulua ei tarvita alussa. Koulun ja opettajan side voidaan tallentaa esim. `lisenssit`-tauluun tai kevyeen `opettaja_koulu`-liitostauluun aktivoinnin yhteydessä.

## 6. Tunnistautuminen ja valtuutus

Kaksi erillistä tarkistusta:

1. **Maksumuuri** (kuten nyt): `digiopo_lisenssi`-eväste → pääsy sisältöön. Sekä oppilaat että opettajat läpäisevät tämän.
2. **Hallinta**: erillinen **opettajaistunto**. Palvelin tarkistaa jokaisessa hallintakutsussa (a) voimassa olevan opettajaistunnon ja (b) että kirjautunut sähköposti = ryhmän `omistaja_email`.

**Oppilas ei pääse hallintaan:** hänellä on lisenssieväste, muttei opettajaistuntoa. Vaikka hallintanappi näkyisi, palvelin hylkää jokaisen hallintakutsun ilman istuntoa + omistajuutta.

Toteutustapa istunnolle: joko (A) lisätään opettajan sähköposti allekirjoitettuun evästeeseen kirjautumisen yhteydessä, ja hallinta-API lukee sen, tai (B) selain lähettää Supabase-tokenin joka hallintakutsuun ja palvelin verifioi. Suositus **A** (yksi tarkistus, ei jatkuvia Auth-kutsuja).

## 7. Miten opettajatili aktivoidaan (valittu hybridimalli)

Opettajatilin hallintaoikeutta **ei saa myöntää jaetulla koulukoodilla**, koska se on juuri se koodi, joka oppilailla on hallussaan. Muuten oppilas voisi rekisteröidä itsensä opettajaksi. Valittu malli nojaa jo olemassa olevaan dataan ja on turvallinen sekä vähätöinen:

1. **Tilaajan sähköposti = ensimmäinen opettaja-admin, automaattisesti.** Tilauslomake kerää jo ostajan sähköpostin ja koulun (`lisenssit`-taulussa). Kun tilaaja kirjautuu tuolla sähköpostilla, hän saa hallintaoikeudet omaan kouluunsa — ei erillistä aktivointia. Yhden opon koululle tämä riittää sellaisenaan.
2. **Kutsut kollegoille.** Tilaaja-admin kutsuu muut opettajat sähköpostilla omasta paneelistaan (Resend jo käytössä). Vain kutsutut sähköpostit saavat oikeudet → oppilaat eivät voi rekisteröityä.
3. **Henkilökohtainen opettajalisenssi** toimii automaattisesti niille, jotka sen ovat ostaneet (jo rakennettu).

Erillistä opettajakoodia (jaettava vain opettajille) ei oteta ensisijaiseksi sen heikomman turvan takia (koodi voi vuotaa oppilaille). Se voidaan lisätä myöhemmin valinnaisena, jos halutaan täysin kitkaton kollegoiden liittyminen.

## 7b. Roolit ja näkyvyys

- Jokainen opettaja (ostaja ja kutsutut kollegat) saa oman tilin ja **täydet oikeudet vain omiin ryhmiinsä** (`omistaja_email` = hänen sähköpostinsa): perustaminen, osioiden järjestys ja piilotus, aikataulut, poisto.
- Näkyvyys on henkilökohtainen: opettaja ei näe eikä muokkaa kollegan ryhmiä. Itse sisältö (sivut) on yhteinen; henkilökohtaista on kunkin **ryhmän** asettelu.
- **PÄÄTETTY:** kukin opettaja — **myös ostaja** — näkee ja hallitsee vain omia ryhmiään. Ostaja-adminilla ei ole koulunlaajuista valvontanäkymää; hänen ainoa lisäroolinsa on **kutsuoikeus** (voi kutsua kollegoita). Yksinkertaisin ja yksityisin malli: kenenkään ryhmät eivät näy toiselle.

## 8. PIN:n poistuminen ja siirtymä

- **Uudet ryhmät:** luodaan tilille kirjautuneena → `omistaja_email` leimataan; opettajalle ei generoida PIN:iä.
- **Vanhat PIN-ryhmät:** kertaluontoinen **"ota haltuun"** — opettaja antaa ryhmäkoodin + nykyisen PIN:n kirjautuneena → jos PIN täsmää ja omistaja on tyhjä → ryhmä liitetään hänen tiliinsä. Tämän jälkeen PIN:iä ei enää tarvita.
- **Siirtymäaika:** PIN voi jäädä fallbackiksi niille, jotka eivät vielä ole ottaneet ryhmiä haltuun; lopuksi PIN poistetaan opettajapuolelta kokonaan.
- **Oppilaisiin ei vaikutusta** — ryhmäkoodi säilyy ennallaan.

## 9. Kirjautumistapa (PÄÄTETTY: magic link numerokoodilla)

Kolme vaihtoehtoa punnittiin:

- **Magic link (linkki):** ei salasanoja, mutta kirjautuminen syntyy sinne missä linkki klikataan → monilaitekitka (koodi puhelimessa, työ koneella).
- **Magic link (numerokoodi):** opettaja pyytää koodin, lukee sen sähköpostista ja **kirjoittaa** kirjautumiskenttään. Ei salasanoja *eikä* monilaitekitkaa.
- **Sähköposti + salasana:** ei sähköpostiriippuvuutta joka kirjautumisella, mutta tuo takaisin salasanojen hallinnan ja palautuksen — saman kivun, josta tilimallilla pyritään eroon.

**Valittu: magic link numerokoodilla.** Se on kevyin (ei salasanoja, ei palautuskuormaa), toimii monella laitteella (koodin voi lukea puhelimesta ja kirjoittaa koneelle), ja nojaa jo olemassa olevaan Supabase Auth -pohjaan. Toteutus on pieni muutos nykyiseen: `signInWithOtp` lähettää koodin, ja `verifyOtp({ email, token, type:'email' })` kirjaa sisään linkkiin ohjaamisen sijaan. Istunto säilyy pitkään, joten kirjautuminen on harvinaista.

## 10. Uudet / muutettavat rajapinnat (istuntosuojatut, omistajuustarkistus)

- `omat_ryhmat` — listaa kirjautuneen opettajan omat ryhmät.
- `luo_ryhma` — luo ryhmä, leimaa omistaja (ei PIN:iä).
- `nimea_oma`, `poista_oma`, `nollaa_oma_pin` — vaativat omistajuuden.
- Järjestyksen tallennus, osion lukitus ja aikataulun muokkaus valtuutetaan **istunnolla + omistajuudella** PIN:n sijaan.
- `ota_haltuun` — koodi + nykyinen PIN → liitä tiliin (jos omistaja tyhjä).

Nykyiset admin-toiminnot säilyvät ylläpitoa varten.

## 11. Toteutusvaiheet

1. **Perusta:** `omistaja_email`-sarake + migraatio-SQL; opettajan sähköposti istuntoon (eväste); API-apuri `haeKirjautunutOpettaja(req)`.
2. **Aktivointi (turva):** opettajatilin liittäminen kouluun kutsulla tai erillisellä opettajakoodilla — **ei** jaetulla oppilaskoodilla.
3. **Omistajuus:** leimaus luonnissa + `ota_haltuun`-endpoint.
4. **Hallinta-API + valtuutus:** siirrä muokkaus (järjestys, piilotus, aikataulu, nimeä, poista) istunto+omistajuus-tarkistukseen.
5. **Käyttöliittymä:** muokkaustila istunnon taakse; PIN-portti pois opettajilta; hallinta piilotettu oppilaalta; "ota haltuun" -kohta.
6. **PIN:n poisto + testaus + ohjeiden päivitys.**

## 12. Turvallisuus

- Kaikki hallinta palvelimella; istunnon tarkistus + omistajuus jokaisessa kutsussa.
- Oppilas ei pääse hallintaan (ei opettajaistuntoa).
- Opettajatilin aktivointi **ei** jaetulla koulukoodilla (kohta 7).
- Poistossa vahvistus (ryhmäkoodi uudelleen).
- Haltuunotto vain jos omistaja tyhjä; PIN kertaluontoisena todisteena.

## 13. Avoimet päätökset

1. ~~**Opettajatilin aktivointi**~~ — **PÄÄTETTY** (kohta 7): tilaajan sähköposti auto-adminiksi + kutsut kollegoille; erillinen opettajakoodi valinnaisena myöhemmin.
2. ~~**Ostaja-adminin näkyvyys**~~ — **PÄÄTETTY** (kohta 7b): kukin (myös ostaja) hallitsee vain omia ryhmiään; ostajan lisärooli on vain kutsuoikeus.
3. ~~**Kirjautuminen**~~ — **PÄÄTETTY** (kohta 9): magic link numerokoodilla (ei salasanaa).
4. **Tunnistautuminen:** sähköposti evästeeseen (A) vs. Bearer-token (B) (suositus A).
5. **PIN:n täysi poisto** vs. fallback-siirtymäaika.
6. **Liiketoiminta:** sisältyykö hallintatili koululisenssiin (teknisesti ilmainen; suositus kyllä).

## 14. Riskit

- Jos aktivointi tehdään väärin (jaetulla koodilla), oppilaat voisivat saada hallintaoikeudet → kohta 7 ratkaisee tämän ja on pakollinen.
- Malli nojaa Supabase Authiin; edellyttää että sähköpostikirjautuminen on käytössä.
- Jos opettaja käyttää useaa sähköpostia, omistajuus hajoaa → ohjeistus.

---

*Aktivointimalli on päätetty (kohta 7). Seuraava askel: Vaihe 1 (perusta) voidaan rakentaa pienenä, testattavana kokonaisuutena. Loput avoimet päätökset (13.2–13.6) voi ratkaista matkan varrella — ne eivät estä Vaiheen 1 aloittamista.*
