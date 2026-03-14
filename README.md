# DigiOpo – Minun polkuni

DigiOpo on peruskoulun oppilaanohjauksen digitaalinen oppikirja, joka on suunniteltu erityisesti 7.–9.-luokkalaisille. Sivusto kokoaa yhteen tehtäviä, interaktiivisia sisältöjä ja oppilaan oman pohdinnan tukemista selkeään ja nuorille sopivaan muotoon.

Projektin tavoitteena on tehdä oppilaanohjauksesta visuaalisempi, helpommin käytettävä ja digitaalisesti toimiva kokonaisuus.

## Sisältö

- Seitsemään luokan oppilaanohjauksen tehtävät
- Kahdeksannen luokan oppilaanohjauksen tehtävät
- Yhdeksännen luokan oppilaanohjauksen tehtävät
- interaktiiviset tehtävät ja pelit
- oppilaan omien vastausten kirjoittaminen
- automaattinen tallennus selaimen localStorageen
- Word-lataus oppilaan vastauksista
- tehtävähaku
- responsiivinen käyttöliittymä tietokoneelle ja mobiiliin

## Tavoite

DigiOpon tarkoitus on tukea oppilasta:

- tunnistamaan omia vahvuuksiaan
- kehittämään opiskelutaitojaan
- pohtimaan tulevaisuuden suunnitelmiaan
- tutustumaan jatko-opintoihin
- harjoittelemaan valintojen tekemistä turvallisesti ja kiinnostavasti

## Teknologiat

Projekti on rakennettu kevyesti ilman erillisiä kirjastoja tai frameworkeja.

Käytetyt teknologiat:

- HTML5
- CSS3
- JavaScript
- Font Awesome -ikonit
- localStorage selaintallennukseen

## Projektin rakenne

Esimerkkirakenne:

```bash
digiopo/
│
├── index.html
├── tehtava.html
├── interactive.html
│
├── css/
│   └── style.css
│
├── js/
│   ├── tehtavat.js
│   ├── tehtava.js
│   ├── luokka.js
│   └── haku.js
│
├── sivut/
│   ├── 7luokka.html
│   ├── 8luokka.html
│   └── 9luokka.html
│
└── tehtavat/
    ├── vahvuudet.pdf
    ├── opiskelutaidot.pdf
    └── tet.pdf
