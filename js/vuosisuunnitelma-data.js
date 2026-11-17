/* VUOSISUUNNITELMA — osioiden suositellut tuntimäärät (opettajan näkymä).
   Tämä on ainoa paikka, jossa tuntimäärät ovat. Luokkakohtaiset sivut
   ohjeet/vuosisuunnitelma-7.html, -8.html ja -9.html sekä koontisivu
   ohjeet/vuosisuunnitelma.html rakentavat taulukkonsa tästä.

   Muokkaus: kirjoita tunnit-kenttään oppituntien määrä (45 min), esim. "2" tai "2–3".
   Tyhjä "" = näkyy taulukossa "täydentyy". */
window.VUOSISUUNNITELMA = [
  { luokka: 7, sivu: "/sivut/7luokka.html", osiot: [
    { id: "johdanto",       nimi: "Tervetuloa yläkouluun",                    tunnit: "2–3" },
    { id: "opiskelutaidot", nimi: "Selviytymiskeino 1: Opi oppimaan",          tunnit: "4–6" },
    { id: "mina-oppijana",  nimi: "Selviytymiskeino 2: Löydä motivaatiosi",    tunnit: "2" },
    { id: "omat-vahvuudet", nimi: "Selviytymiskeino 3: Opi tuntemaan itsesi",  tunnit: "2" },
    { id: "tulevaisuus",    nimi: "Selviytymiskeino 4: Haaveile tulevaisuudesta", tunnit: "2" },
    { id: "itsearviointi",  nimi: "Itsearviointi",                             tunnit: "1" },
    { id: "koulun-jalkeen", nimi: "Koulupäivän jälkeen",                       tunnit: "1" }
  ]},
  { luokka: 8, sivu: "/sivut/8luokka.html", osiot: [
    { id: "johdanto",      nimi: "Tänä vuonna otat suunnan",          tunnit: "1" },
    { id: "koulutus",      nimi: "Oma reitti löytyy tutkimalla",      tunnit: "3–5" },
    { id: "klinikka",      nimi: "Oppimaan oppimisen klinikka",       tunnit: "2" },
    { id: "vahvuudet",     nimi: "Mitä osaan – mitä haluan?",         tunnit: "2–3" },
    { id: "tet",           nimi: "Kurkistus työelämään",              tunnit: "1–2" },
    { id: "tulevaisuus",   nimi: "Mitä jos? – tulevaisuustuumailua",  tunnit: "2" },
    { id: "itsearviointi", nimi: "Itsearviointi",                     tunnit: "1" }
  ]},
  { luokka: 9, sivu: "/sivut/9luokka.html", osiot: [
    { id: "johdanto",      nimi: "Opo-tunnit 9. luokalla",                   tunnit: "1–2" },
    { id: "jatko",         nimi: "Ysiluokka edessä – suunnitelma taskuun",   tunnit: "1–2" },
    { id: "ajattelu",      nimi: "Ajattelun taidot – oma pää käyttöön",      tunnit: "2" },
    { id: "tet",           nimi: "Duuniin! – työelämä tutuksi: ennen TET-jaksoa",   tunnit: "1–2" },
    { id: "tet",           nimi: "Duuniin! – työelämä tutuksi: TET-jakson jälkeen", tunnit: "2–3" },
    { id: "paatoksenteko", nimi: "Päätöksentekotaitoja",                     tunnit: "1–2" },
    { id: "yhteishaku",    nimi: "Yhteishaku",                               tunnit: "3–4" },
    { id: "epavarmuus",    nimi: "Mitä jos suunnitelma ei toimi?",           tunnit: "1–2" },
    { id: "testi",         nimi: "Seuraava askel – oletko valmis?",          tunnit: "2–4" },
    { id: "valinnat",      nimi: "Valinnat ratkaisee",                       tunnit: "1–2" },
    { id: "tulevaisuus",   nimi: "Tulevaisuus",                              tunnit: "1–2" },
    { id: "itsearviointi", nimi: "Itsearviointi",                            tunnit: "1" }
  ]}
];
