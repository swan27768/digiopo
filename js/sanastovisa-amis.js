/* Amiksen sanastopeli – sanalista. Moottori: js/sanastovisa.js
   Selitykset lyhyitä ja selkokielisiä. ryhma = aihepiiri (väärät vaihtoehdot valitaan mieluiten samasta ryhmästä). */
window.SANASTOVISA = {
  id: "amis",
  otsikko: "Amiksen sanastopeli",
  ohje: "Lue selitys ja valitse oikea käsite. Jokaisesta oikeasta vastauksesta saat 10 pistettä.",
  kysymyksia: 12,
  vari: "#15803d", variTumma: "#14532d", variVaalea: "#dcfce7",
  sanat: [
    /* Tutkinnot ja opintojen rakenne */
    { ryhma: "tutkinto", termi: "Ammatillinen perustutkinto", selitys: "Tutkinto, jolla opit ammatin perustaidot. Laajuus on 180 osaamispistettä.", esim: "Mikael opiskelee autoalan perustutkintoa." },
    { ryhma: "tutkinto", termi: "Ammattitutkinto", selitys: "Tutkinto aikuiselle, jolla on jo työkokemusta alalta." },
    { ryhma: "tutkinto", termi: "Erikoisammattitutkinto", selitys: "Tutkinto kokeneelle ammattilaiselle, joka haluaa syventää osaamistaan." },
    { ryhma: "tutkinto", termi: "Tutkinnon osa", selitys: "Yksi tutkinnon osa, jonka osaaminen osoitetaan erikseen.", esim: "Hän suoritti ensin asiakaspalvelun tutkinnon osan." },
    { ryhma: "tutkinto", termi: "Osaamispiste (osp)", selitys: "Mittaa ammatillisten opintojen laajuutta.", esim: "Tutkinnon osa on laajuudeltaan 30 osaamispistettä." },
    { ryhma: "tutkinto", termi: "Yhteiset tutkinnon osat", selitys: "Kaikille yhteiset opinnot, esimerkiksi viestintä ja matematiikka.", esim: "Yhteisissä opinnoissa harjoitellaan myös työelämätaitoja." },
    { ryhma: "tutkinto", termi: "Valinnaiset tutkinnon osat", selitys: "Osat, jotka voit valita oman kiinnostuksesi mukaan." },
    { ryhma: "tutkinto", termi: "Tutkintotodistus", selitys: "Todistus, jonka saat, kun olet suorittanut tutkinnon." },
    { ryhma: "tutkinto", termi: "Kaksoistutkinto", selitys: "Suoritat ammatillisen tutkinnon ja ylioppilastutkinnon samaan aikaan.", esim: "Kaksoistutkinto sopii, jos haluat sekä ammatin että mahdollisuuden jatkaa yliopistoon." },

    /* Oppiminen työpaikalla */
    { ryhma: "tyopaikka", termi: "Työpaikalla oppiminen", selitys: "Opiskelet oikealla työpaikalla osana tutkintoa." },
    { ryhma: "tyopaikka", termi: "Koulutussopimus", selitys: "Opiskelet työpaikalla ilman työsopimusta. Et saa palkkaa.", esim: "Mikael teki koulutussopimuksella harjoittelua autokorjaamolla." },
    { ryhma: "tyopaikka", termi: "Oppisopimus", selitys: "Opiskelet työpaikalla työsuhteessa ja saat palkkaa.", esim: "Hän teki oppisopimuksen rakennusyrityksen kanssa." },
    { ryhma: "tyopaikka", termi: "Työpaikkaohjaaja", selitys: "Työpaikan ammattilainen, joka opastaa sinua ja arvioi osaamistasi yhdessä opettajan kanssa." },
    { ryhma: "tyopaikka", termi: "Näyttö", selitys: "Osoitat osaamisesi käytännön työtehtävissä.", esim: "Näytössä hoidin oikeita asiakkaita ohjaajan seuratessa." },

    /* Suunnittelu ja tuki */
    { ryhma: "tuki", termi: "HOKS", selitys: "Henkilökohtainen suunnitelma siitä, mitä opiskelet ja miten.", esim: "Tein HOKSin yhdessä opettajan kanssa opintojen alussa." },
    { ryhma: "tuki", termi: "Osaamisen tunnustaminen", selitys: "Aiemmin oppimasi hyväksytään osaksi tutkintoa.", esim: "Hän oli ollut kesätöissä kaupassa, ja osaaminen tunnustettiin." },
    { ryhma: "tuki", termi: "Ryhmänohjaaja", selitys: "Opettaja, joka tukee oman ryhmänsä opiskelijoita opintojen aikana." },
    { ryhma: "tuki", termi: "Opinto-ohjaaja (opo)", selitys: "Auttaa opintojen suunnittelussa ja jatko-opintoihin liittyvissä valinnoissa." },
    { ryhma: "tuki", termi: "Erityinen tuki", selitys: "Lisätukea opiskeluun, jos oppiminen vaikeutuu.", esim: "Hän sai erityistä tukea lukivaikeuden vuoksi." },
    { ryhma: "tuki", termi: "Opiskelijakunta", selitys: "Opiskelijoiden oma ryhmä, joka vaikuttaa koulun asioihin." },

    /* Haku ja jatko */
    { ryhma: "haku", termi: "Yhteishaku", selitys: "Keväällä tehtävä haku toisen asteen opintoihin.", esim: "Haimme amikseen yhteishaussa maaliskuussa." },
    { ryhma: "haku", termi: "Jatkuva haku", selitys: "Voit hakea ammatillisiin opintoihin myös muulloin kuin yhteishaussa." },
    { ryhma: "haku", termi: "Ammattikorkeakoulu", selitys: "Jatko-opintopaikka, johon voit hakea ammatillisen tutkinnon jälkeen." }
  ]
};
