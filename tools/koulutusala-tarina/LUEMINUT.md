# Koulutusalojen tarinapelit – rakentaja

Tällä työkalulla tehdään Amispolun alatehtävät (8. lk, Oma reitti → Vaihe 2) samalla mallilla:
3D-kansi → aloitussivu → tarina (5–6 kohtausta) → ammattikortti → "Kenet kutsut paikalle?" (8 korttia) → tulokset ja palautus → loppu.

## Tiedostot

| Tiedosto | Mitä |
|---|---|
| `pelit/koulutusalat/tarina-yhteinen.js` | Yhteinen moottori: kello, ammattikortti, kortin lataus kuvana, Kenet kutsut paikalle?, palautustiedosto, tyhjennys, "Katso ympärille" -nappi |
| `pelit/koulutusalat/tarina-yhteinen.css` | Yhteiset tyylit. Värit tulevat CSS-muuttujista (--a1, --a2, --korostus, --tausta …) |
| `pelit/koulutusalat/tausta3d.js` | 3D-taustat. Jokaisella alalla oma maailma `MAAILMAT`-oliossa (nyt: `tekniikka`, `sote`, `it`, `elintarvike`, `kauppa`) |
| `vendor/three/three.module.min.js` | three.js r187 |
| `tools/koulutusala-tarina/rakenna_tarina.py` | Rakentaja |
| `tools/koulutusala-tarina/alat/*.py` | Alan sisältö: tekstit, kohtaukset, ammatit, kortit, teema |

## Loppuosan tehtävä

Oletuksena loppuosa on "Kenet kutsut paikalle?" (valitse ammattilainen + perustelu). Ala voi vaihtaa tehtävän
tekstit ja mekaniikan `TEHTAVA`-sanakirjalla. Esimerkki: `alat/it.py` = Tietoturvatarkastus
(Turvallinen / Riski + perustelu, kortissa `nakyma`-HTML ja `ammattilainen`). Kenttiä: `nimi, tag, maara,
askeleet, lopuksi, kysymys, korttiSana, seuraava, miksiLabel, placeholder, vihjeValitse, vihjeAlku,
sekoita, etiketit, palaute, ammattilainenTeksti`. Jos `TEHTAVA` puuttuu, kaikki toimii kuten ennen.

Tyyppi `kehitys` (`TEHTAVA["tyyppi"] = "kehitys"`, esimerkki `alat/elintarvike.py`): oppilas rakentaa oman
tuotteen vaihe vaiheelta. `KUTSU_KORTIT` = vaiheet (`otsikko, kysymys, miksi, ammattilainen, ammattikuvaus, tutkinto,
vaihtoehdot[nimi, kuvaus, hinta, allergeenit, tagit, palaute]`). Ensimmäinen vaihe on kohderyhmä (`tarve`,
`kielletty`). Peli laskee hinnan, kerää allergeenit, varoittaa sopimattomista valinnoista ja lopuksi tuote nimetään.

Tyyppi `budjetti` (esimerkki `alat/kauppa.py`): oppilas ostaa valikoiman budjetilla. `KUTSU_KORTIT` = tuotteet
(`nimi, ikoni, kuvaus, osto, myynti, ryhma, trendi, vastuu, menekki`). `TEHTAVA`: `budjetti, askel, maxMaara,
minKaytto, minTuotteita, ryhmat, tavoitteet, kysymykset` (kolme perustelukysymystä, `{top}` = eniten ostettu tuote).

Taustakuvat: `TAUSTAKUVAT = {"kansi": ..., "alku": ..., "tehtava": ...}` ja kohtauksessa `taustakuva`.
Kannen napin värit: CSS-muuttujat `--kansi-nappi-bg, -teksti, -reuna, -varjo, -hehku` teemassa.

Valmiit tehtävätyypit: tekniikka = Kenet kutsut paikalle? (vikatilanne), sote = Kenet kutsut paikalle?,
it = Tietoturvatarkastus, elintarvike = Kehitä oma välipala, kauppa = Sisäänostajan budjetti. Seuraaville aloille kannattaa keksiä taas oma tehtävä.

Huom: 3D-kohtauksen nimi `tehdas` piilottaa Katso-napin (tekniikan aloitussivu). Käytä muilla aloilla muuta nimeä.

## Uuden alan tekeminen

1. Kopioi `alat/sote.py` → `alat/<ala>.py` ja kirjoita sisältö (tarina, ammatit, piirteet, 8 korttia, teemavärit).
2. Lisää `tausta3d.js`:n `MAAILMAT`-olioon alan maailma. Sen kohtausten nimet = sisältötiedoston `tausta`-kentät (+ `kansi`, `loppu` ja `yleisKohtaus`).
3. Rakenna alkuperäisestä Twine-tiedostosta (pidä alkuperäinen tallessa):

   ```
   python3 rakenna_tarina.py alat/<ala>.py <alkuperäinen.html> ../../pelit/koulutusalat/<ala>.html
   ```

   Rakentaja säilyttää SugarCube-moottorin, head-osan skriptit ja `SAILYTA`-listan passaget (oppilaitossivut). Muu korvataan. Lopuksi se tarkistaa, että jokainen linkki osuu olemassa olevaan passageen.
4. Testaa esikatselussa (`esikatselu.command`) koko polku sekä tietokoneella että puhelinkokoisena.

## Muista

- Tekstit nuorten selkokielellä: lyhyet lauseet, ei vitsivaihtoehtoja, jokaisessa valinnassa järkevä palaute.
- Tarkista tutkintonimikkeet ajantasaisista lähteistä (Opintopolku, Työmarkkinatori, OPH:n ePerusteet).
- Kortin vaihtoehtojen järjestys arvotaan automaattisesti.
