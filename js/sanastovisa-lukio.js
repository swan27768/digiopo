/* Lukion sanastopeli – sanalista. Moottori: js/sanastovisa.js
   Selitykset lyhyitä ja selkokielisiä. ryhma = aihepiiri (väärät vaihtoehdot valitaan mieluiten samasta ryhmästä). */
window.SANASTOVISA = {
  id: "lukio",
  otsikko: "Lukion sanastopeli",
  ohje: "Lue selitys ja valitse oikea käsite. Jokaisesta oikeasta vastauksesta saat 10 pistettä.",
  kysymyksia: 12,
  vari: "#1d4ed8", variTumma: "#1e3a8a", variVaalea: "#dbeafe",
  sanat: [
    /* Opintojen rakenne */
    { ryhma: "rakenne", termi: "Opintojakso", selitys: "Yksi lukion opintokokonaisuus, josta saat opintopisteitä.", esim: "Aino valitsi syksyksi uuden opintojakson, jossa tehdään kokeita ja työselostuksia." },
    { ryhma: "rakenne", termi: "Opintopiste", selitys: "Mittaa, kuinka laaja lukion opintojakso on.", esim: "Lukiossa suoritat opintoja yhteensä vähintään 150 opintopisteen verran." },
    { ryhma: "rakenne", termi: "Luokaton lukio", selitys: "Opinnot eivät etene vuosiluokka kerrallaan vaan oman suunnitelman mukaan.", esim: "Omassa ryhmässäsi voi olla opiskelijoita eri vaiheissa opintojaan." },
    { ryhma: "rakenne", termi: "Jakso", selitys: "Lukuvuoden osa, jonka aikana opiskellaan tiettyjä opintojaksoja." },
    { ryhma: "rakenne", termi: "Opintotarjotin", selitys: "Lista opintojaksoista, joista valitset omat opintosi.", esim: "Opintotarjottimesta näet, mitkä opintojaksot ovat samaan aikaan." },
    { ryhma: "rakenne", termi: "Pakolliset opinnot", selitys: "Opinnot, jotka kaikkien lukiolaisten täytyy suorittaa.", esim: "Äidinkieli kuuluu pakollisiin opintoihin." },
    { ryhma: "rakenne", termi: "Valinnaiset opinnot", selitys: "Opinnot, jotka voit valita omien kiinnostusten mukaan.", esim: "Valitsit valinnaisena opintojaksona esimerkiksi psykologiaa." },
    { ryhma: "rakenne", termi: "Pitkä oppimäärä", selitys: "Laajempi vaihtoehto esimerkiksi matematiikassa.", esim: "Pitkä matematiikka auttaa, jos haluat hakea esimerkiksi tekniikan alalle." },
    { ryhma: "rakenne", termi: "Lyhyt oppimäärä", selitys: "Suppeampi vaihtoehto esimerkiksi matematiikassa.", esim: "Valitsin lyhyen matematiikan, koska haluan keskittyä muihin aineisiin." },
    { ryhma: "rakenne", termi: "Henkilökohtainen opintosuunnitelma", selitys: "Oma suunnitelma siitä, mitä opintoja suoritat ja missä järjestyksessä.", esim: "Suunnittelen sen yhdessä opon kanssa ja päivitän sitä matkan varrella." },
    { ryhma: "rakenne", termi: "Lukiodiplomi", selitys: "Erillinen näyttö erityisestä osaamisesta, esimerkiksi musiikissa tai kuvataiteessa.", esim: "Tein lukiodiplomin kuvataiteessa." },

    /* Tuki ja ohjaus */
    { ryhma: "tuki", termi: "Ryhmänohjaaja", selitys: "Opettaja, joka tukee oman ryhmänsä opiskelijoita opintojen aikana.", esim: "Ryhmänohjaaja kysyi, miltä ensimmäiset viikot ovat tuntuneet." },
    { ryhma: "tuki", termi: "Opinto-ohjaaja (opo)", selitys: "Auttaa opintojen suunnittelussa ja jatko-opintoihin liittyvissä valinnoissa.", esim: "Varasin opolle ajan, kun mietin yliopiston hakuvaihtoehtoja." },
    { ryhma: "tuki", termi: "Kuraattori", selitys: "Koulun sosiaalityöntekijä, jolta saa apua esimerkiksi jaksamiseen tai poissaoloihin." },
    { ryhma: "tuki", termi: "Koulupsykologi", selitys: "Auttaa esimerkiksi stressin ja mielialan kanssa." },
    { ryhma: "tuki", termi: "Tutor", selitys: "Vanhempi opiskelija, joka auttaa uusia opiskelijoita lukion alussa.", esim: "Tutor esitteli minulle koulun tilat ensimmäisenä päivänä." },
    { ryhma: "tuki", termi: "Wilma", selitys: "Järjestelmä, jossa teet opintovalintoja, saat viestejä ja seuraat opintojasi.", esim: "Ilmoittauduin opintojaksolle Wilmassa." },

    /* Ylioppilastutkinto */
    { ryhma: "yo", termi: "Ylioppilastutkinto", selitys: "Valtakunnallinen tutkinto, jonka suoritat lukion aikana tai lopussa.", esim: "Ylioppilastutkinnossa on useita kokeita, esimerkiksi äidinkielen koe." },
    { ryhma: "yo", termi: "Yo-koe", selitys: "Yksi ylioppilastutkinnon koe, esimerkiksi äidinkielen koe.", esim: "Kirjoitin ensimmäisen yo-kokeeni keväällä." },
    { ryhma: "yo", termi: "Abiturientti (abi)", selitys: "Opiskelija, joka valmistautuu ylioppilaskirjoituksiin.", esim: "Abit saavat lukea kokeisiin lukulomalla." },
    { ryhma: "yo", termi: "Preliminääri", selitys: "Harjoituskoe ennen ylioppilaskirjoituksia.", esim: "Preliminäärissä näet, mitä pitää vielä harjoitella." },
    { ryhma: "yo", termi: "Laudatur", selitys: "Ylioppilastutkinnon paras arvosana.", esim: "Hän sai äidinkielen kokeesta laudaturin." },
    { ryhma: "yo", termi: "Approbatur", selitys: "Ylioppilastutkinnon alin hyväksytty arvosana." },
    { ryhma: "yo", termi: "Päättötodistus", selitys: "Todistus, jonka saat, kun olet suorittanut lukion oppimäärän." },

    /* Arviointi */
    { ryhma: "arviointi", termi: "Formatiivinen arviointi", selitys: "Palaute, joka ohjaa oppimista opiskelun aikana.", esim: "Opettaja kertoi kesken jakson, mitä pitää vielä harjoitella." },
    { ryhma: "arviointi", termi: "Summatiivinen arviointi", selitys: "Arviointi, joka kertoo oppimisen lopputuloksen, esimerkiksi koe.", esim: "Opintojakson päätteeksi tehtiin koe." },
    { ryhma: "arviointi", termi: "Vertaisarviointi", selitys: "Toinen opiskelija arvioi sinun työtäsi, tai sinä hänen.", esim: "Kaverini antoi palautetta esitelmästäni." },
    { ryhma: "arviointi", termi: "Itsearviointi", selitys: "Arvioit itse omaa oppimistasi ja työskentelyäsi.", esim: "Mietin, mikä meni hyvin ja mitä haluan parantaa." },
    { ryhma: "arviointi", termi: "Opintosuoritusote", selitys: "Yhteenveto suorittamistasi opinnoista ja arvosanoista.", esim: "Tulostin opintosuoritusotteen jatko-opintohakua varten." }
  ]
};
