# 11 – Vuosittainen tarkistus (elokuu)

Osa sisällöstä vanhenee: yhteishaku, valintapisteet, TUVA/TELMA, ylioppilastutkinto,
tutkintojen laajuudet. Siksi jokaisella tiedollisella osiolla on "Tiedot tarkistettu
PVM" -merkintä, ja osiot käydään läpi **joka elokuu** ennen lukuvuoden alkua.

## Miten merkintä toimii

- Tiedot ovat yhdessä paikassa: `js/tarkistettu.json` (avain = `sivupolku#osion-id`).
- `js/tarkistettu.js` lisää osion loppuun rivin "Tiedot tarkistettu 25.10.2026. Lähteet: …".
- `pvm: null` = ei vielä tarkistettu → merkintää ei näytetä oppilaille.
- Jos viimeisimmästä tarkistuksesta on kulunut yli yksi elokuu, rivi muuttuu
  muotoon "… – tarkista ajantasaisuus lähteestä".
- Tilan näkee komennolla `npm run tarkistus` (`npm run tarkistus:ci` palauttaa virhekoodin 1,
  jos jokin osio on tarkistamatta tai vanhentunut).

**Periaate:** yhteishakuasiat (hakuajat, hakutoiveet, haettavat koulutukset, valintapisteet, pistelaskuri) tarkistetaan opintopolku.fi-sivustolta. Muut lähteet (OPH, Ylioppilastutkintolautakunta) koskevat vain niitä aiheita, jotka on listattu taulukossa.

## Elokuun työjärjestys

1. Aja `npm run tarkistus` ja katso, mitkä osiot odottavat.
2. Käy jokainen osio läpi alla olevan listan mukaan lähteitä vasten.
3. Korjaa sivun tekstit, käännökset (`translations/`, `tools/kaannokset/`) ja opettajan ohjeet (`ohjeet/`).
4. Aseta osion `pvm` tänään (VVVV-KK-PP) tiedostossa `js/tarkistettu.json`.
5. Julkaise (`julkaise.command`).

## Tarkistuslista

| Osio (avain) | Mitä tarkistetaan | Lähde |
|---|---|---|
| `7luokka.html#johdanto` | Yläkoulun oppiaineet ja niiden jako 7. lk:lla | ePerusteet (OPS) |
| `8luokka.html#koulutus` | Koulutusjärjestelmä, ammatillinen/lukio/kaksoistutkinto, YTO-opinnot, oppisopimus, erityisammattioppilaitokset (nimet, paikkakunnat, linkit) | Opintopolku, OPH |
| `8luokka.html#tet` ja `9luokka.html#tet` | TET-prosessin vaiheet, lomakkeet, ikärajat ja vakuutusasiat | OPH, koulun/kunnan ohje |
| `9luokka.html#jatko` | Jatko-opintopolut (lukio, amis, TUVA, TELMA, kansanopisto), arvosanojen vaikutus (lukuaineiden keskiarvo / valintapisteet), Opintopolun pistelaskuri | Opintopolku, OPH |
| `9luokka.html#yhteishaku` | Hakuajan ajankohta (nyt 2027: 16.2.–16.3.2027), hakutoiveiden enimmäismäärä, hakutoiveiden muuttaminen, haettavat koulutukset, tulosten julkistus | **Opintopolku (opintopolku.fi)** – yhteishakuasiat tarkistetaan aina sieltä |
| `9luokka.html#testi` | Lukio vs. amis -pelin luvut: lukion laajuus (opintopisteet), ammatillisen tutkinnon laajuus (osaamispisteet), YTO-laajuus | OPH, Opintopolku |
| `9luokka.html#valinnat` | Valinta- ja hakuun liittyvät väitteet | Opintopolku |
| `tehtavat/yo_tutkinto_9lk.html` | Kokeiden määrä ja rakenne, taito- ja taideaineiden yo-koe (voimaantulo, ensimmäinen koe, opintopistevaatimukset, koemuoto) | Ylioppilastutkintolautakunta, OPH |

Muut sivut, joissa on samoja tietoja ja jotka kannattaa vilkaista samalla:
`tehtavat/hakustrategia.html`, `tehtavat/varasuunnitelma_9lk.html`, `sivut/valinnat.html`,
`pelit/lukio_vs_amis.html`, `sivut/duuniin-tet.html`, `ohjeet/*_ope.html` sekä opettajan pikaohje-PDF.

## Tunnetut avoimet kohdat (25.10.2026)

- **YO-tehtävä:** OPH vahvistaa, että taito- ja taideaineiden yo-kokeet järjestetään ensimmäisen
  kerran syksyllä 2029. Sivun väite "lukion 1.8.2027 tai sen jälkeen aloittavat", opintopistevaatimukset
  (musiikki 2, kuvataide 2, liikunta 4) ja kaksiosainen koe (näyttö + koe) pitää vielä vahvistaa
  ylioppilastutkinto.fi-sivulta.
- **Ammatilliset YTO:t:** perusteet uudistuvat 1.8.2026 (viestintä, matemaattis-luonnontieteellinen,
  yhteiskunta- ja työelämäosaaminen; mm. talous-, tekoäly- ja tietoturvaosaaminen lisätty). YTO:iden
  laajuus on edelleen 35 osp ja tutkinnon 180 osp. Tarkista, vastaako pelin teksti uusia perusteita.
- **Ajankohtainen yhteishaku on 2027:** hakuaika 16.2.–16.3.2027 (omistajan ilmoittama; vahvista opintopolku.fi-sivustolta). Vuoden 2026 haku (17.2.–17.3.2026) on mennyt. Sivuilla ei ole kovakoodattuja hakupäiviä, joten korjattavaa ei ole, mutta pidä päivät tässä ajan tasalla ja käytä niitä opettajan ohjeissa ja kalenterissa (`sivut/lukuvuosi.html`).
- **Hakutoiveet:** yhteishaussa voi valita 1–7 hakutoivetta (2026 tieto; tarkista 2027). Hakustrategia-tehtävässä on kolme
  kenttää (varma, realistinen, unelma) – tämä on pedagoginen valinta, ei väite enimmäismäärästä.
