# Koulutusalojen tarinapelit – rakentaja

Tällä työkalulla tehdään Amispolun alatehtävät (8. lk, Oma reitti → Vaihe 2) samalla mallilla:
3D-kansi → aloitussivu → tarina (5–6 kohtausta) → ammattikortti → "Kenet kutsut paikalle?" (8 korttia) → tulokset ja palautus → loppu.

## Tiedostot

| Tiedosto | Mitä |
|---|---|
| `pelit/koulutusalat/tarina-yhteinen.js` | Yhteinen moottori: kello, ammattikortti, kortin lataus kuvana, Kenet kutsut paikalle?, palautustiedosto, tyhjennys, "Katso ympärille" -nappi |
| `pelit/koulutusalat/tarina-yhteinen.css` | Yhteiset tyylit. Värit tulevat CSS-muuttujista (--a1, --a2, --korostus, --tausta …) |
| `pelit/koulutusalat/tausta3d.js` | 3D-taustat. Jokaisella alalla oma maailma `MAAILMAT`-oliossa (nyt: `tekniikka`, `sote`) |
| `vendor/three/three.module.min.js` | three.js r187 |
| `tools/koulutusala-tarina/rakenna_tarina.py` | Rakentaja |
| `tools/koulutusala-tarina/alat/*.py` | Alan sisältö: tekstit, kohtaukset, ammatit, kortit, teema |

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
