-- DigiOpo – Automaattinen kannan siivous (pg_cron, kaksitasoinen)
-- Aja Supabase SQL Editorissa. Turvallinen ajaa uudelleen (idempotentti).
--
-- KAKSI TASOA:
--   A) RUTIINISIIVOUS – 2× kuussa (1. ja 15. päivä klo 03:00). Kevyt, tiheä.
--   B) SUURSIIVOUS    – kerran vuodessa kesällä (1.8. klo 04:00). Laaja, nollaa
--      pelien tulostaulut uutta lukuvuotta varten + poistaa vanhan raakadatan.
--
-- Ei vie yhtään Vercel-funktiota (Hobby-plan 12 funktion raja ei osu).
--
-- HUOM: jos "create extension pg_cron" antaa oikeusvirheen, ota laajennus käyttöön
-- Supabase-dashboardista: Database → Extensions → "pg_cron" → Enable, ja aja
-- tämä tiedosto uudelleen.

-- ─── 1) Ota pg_cron käyttöön ─────────────────────────────────────────────────
create extension if not exists pg_cron;

-- ─── 2) RUTIINISIIVOUS (2× kuussa) ───────────────────────────────────────────
-- Kevyt siivous joka pitää kannan siistinä ilman että hukkaa aktiivista dataa.
create or replace function digiopo_siivoa()
returns void language plpgsql security definer as $$
begin
  -- Menneet aikataulutapahtumat (viimeinen pvm eilinen tai vanhempi)
  delete from lukuvuosi_tapahtumat
    where (loppu_pvm is not null and loppu_pvm < current_date)
       or (loppu_pvm is null and alku_pvm < current_date);

  -- Vanhat virhelokit (> 90 pv)
  delete from api_virheet
    where luotu_at < now() - interval '90 days';

  -- Jumiin jääneet "odottaa"-ilmoitukset (> 30 pv). Hyväksytyt säilyvät.
  delete from maailma_ratkaisut
    where tila = 'odottaa' and created_at < now() - interval '30 days';

  -- Jumiin jääneet fake_insta -profiilit "odottaa" (> 30 pv). Hyväksytyt säilyvät.
  delete from fake_insta_profiilit
    where tila = 'odottaa' and luotu_at < now() - interval '30 days';

  -- Vanhat pelien tulostaulurivit: joita ei ole päivitetty 3 kk.
  -- paivitetty on Date.now() (millisekuntia).
  delete from ammattiset_tulostaulu
    where paivitetty < extract(epoch from now() - interval '3 months') * 1000;
  delete from tiedontemppeli_tulostaulu
    where paivitetty < extract(epoch from now() - interval '3 months') * 1000;

  -- ─── Hylätyt opetusryhmät (> 24 kk koskematta) ──────────────────────────
  --
  -- MIKSI: opetusryhmiä ei siivottu aiemmin lainkaan. Lisenssin päätyttyä
  -- koulun ryhmät, järjestykset ja lukuvuosikalenterit jäivät kantaan
  -- pysyvästi.
  --
  -- ⚠️ TÄMÄ POISTAA OPETTAJAN TYÖTÄ. Poisto vie cascade-säännöllä mukanaan
  -- ryhmän järjestykset ja aikataulutapahtumat, eikä sitä voi perua.
  --
  -- Siksi "koskematta" katsotaan KOLMESTA lähteestä, ei vain ryhmäriviltä:
  -- opettaja on voinut järjestää osiot tai päivittää kalenteria muuttamatta
  -- itse ryhmää. Pelkkä opetusryhmat.muokattu_at olisi antanut väärän kuvan
  -- ja tuhonnut aktiivisessa käytössä olevia ryhmiä.
  --
  -- HUOM: pelkkä KÄYTTÖ (oppilas avaa ryhmän) ei päivitä mitään aikaleimaa,
  -- joten teoriassa vuosia muuttumattomana käytetty ryhmä voi poistua.
  -- 24 kk on siksi tarkoituksella pitkä – lyhennä vain harkiten.
  delete from opetusryhmat o
    where greatest(
            o.muokattu_at,
            coalesce((select max(j.muokattu_at) from jarjestykset j
                       where j.ryhmakoodi = o.ryhmakoodi), o.muokattu_at),
            coalesce((select max(t.muokattu_at) from lukuvuosi_tapahtumat t
                       where t.ryhmakoodi = o.ryhmakoodi), o.muokattu_at)
          ) < now() - interval '24 months';

  -- ─── Vanhat kirjautumislokit (> 12 kk) ──────────────────────────────────
  -- HUOM: taulu on käytännössä tyhjä – mikään ei kirjoita siihen. Kirjaus
  -- korvattiin aikanaan laiteseurannalla (lisenssi_laitteet), mutta taulu ja
  -- näkymät jäivät paikalleen. Siivous on tässä varmuuden vuoksi siltä
  -- varalta, että kirjoitus joskus toteutetaan.
  --
  -- Jos päätät toteuttaa kirjautumislokin, huomaa että taulu tallentaa
  -- ip- ja user_agent-kentät eli HENKILÖTIETOA ALAIKÄISISTÄ. Se on
  -- tietosuojapäätös, ei tekninen – tietosuojaselosteen on vastattava sitä.
  delete from lisenssi_kirjaukset
    where kirjattu_klo < now() - interval '12 months';

  -- ─── Vanhat massaviestilokit (> 24 kk) ──────────────────────────────────
  delete from admin_viestit
    where laheta_at < now() - interval '24 months';

  -- ─── Orvot oppilastyöt (koululla ei lisenssiä 6 kk) ─────────────────────
  --
  -- Kun koulun lisenssi poistetaan, oppilastyöt jäävät kantaan: ne on sidottu
  -- koulun NIMEEN, ei lisenssikoodiin, eikä viite-eheyttä ole.
  --
  -- Kuuden kuukauden armonaika on tarkoituksellinen. Lisenssiä joutuu joskus
  -- poistamaan ja luomaan uudelleen – kirjoitusvirhe koulunimessä, väärä
  -- tyyppi, epäonnistunut uusinta. Ilman armonaikaa yksi korjausliike
  -- pyyhkisi luokan työt saman tien.
  --
  -- Jos haluat poistaa koulun tiedot heti, käytä poista_koulu()-funktiota
  -- (supabase_koulun_siivous.sql).
  delete from fake_insta_profiilit f
    where f.luotu_at < now() - interval '6 months'
      and not exists (select 1 from lisenssit l where l.koulu = f.koulu);

  delete from maailma_ratkaisut m
    where m.created_at < now() - interval '6 months'
      and not exists (select 1 from lisenssit l where l.koulu = m.koulu);
end;
$$;

-- ─── 3) SUURSIIVOUS (kerran vuodessa, kesällä) ───────────────────────────────
-- Tekee ensin rutiinisiivouksen, sitten raskaammat toimet uuden lukuvuoden alkuun.
create or replace function digiopo_suursiivous()
returns void language plpgsql security definer as $$
begin
  perform digiopo_siivoa();

  -- Nollaa pelien tulostaulut KOKONAAN → tuore kilpailu uudelle lukuvuodelle.
  delete from ammattiset_tulostaulu;
  delete from tiedontemppeli_tulostaulu;

  -- ─── Luokkataulut tyhjiksi uutta lukuvuotta varten ──────────────────────
  --
  -- Rutiinisiivous poistaa vain hyväksymättä jääneet työt (30 pv). HYVÄKSYTYT
  -- jäivät aiemmin kantaan pysyvästi – ne olivat ainoa rajatta kasvava taulu.
  --
  -- Lukuvuoden vaihde on oikea hetki: uusi luokka aloittaa puhtaalta taululta,
  -- eikä edellisen vuoden fake-insta-profiileilla ole enää merkitystä. Sama
  -- periaate kuin pelien tulostauluilla yllä.
  --
  -- ⚠️ TÄMÄ POISTAA OPPILAIDEN TYÖT PYSYVÄSTI. Kerro opettajille, että
  -- luokkataulut tyhjenevät 1.8. – jos he haluavat säilyttää esimerkkejä,
  -- ne on otettava talteen ennen sitä (kuvakaappaus tai tuloste).
  --
  -- Tykkäysten dedupe-taulut (mt_tykkays_laite, fip_tykkays_laite,
  -- fip_tahti_laite) tyhjenevät automaattisesti cascade-säännöllä.
  delete from fake_insta_profiilit;
  delete from maailma_ratkaisut;

  -- Poista vanha analytiikan raakadata (> 12 kk). Näkymät summaavat, joten
  -- kokonaisluvut eivät katoa lähihistorialta.
  delete from page_views
    where paiva < current_date - interval '12 months';

  -- Poista vanhat laiteseurantarivit (ei nähty 12 kk).
  delete from lisenssi_laitteet
    where viim_nahty < now() - interval '12 months';
end;
$$;

-- ─── 4) Aja rutiinisiivous KERRAN heti (ei suursiivousta – ei nollata tauluja) ─
select digiopo_siivoa();

-- ─── 5) Ajasta molemmat (idempotentti: korvaa vanhat) ────────────────────────
do $$
begin
  if exists (select 1 from cron.job where jobname = 'digiopo_siivous_kuukausittain') then
    perform cron.unschedule('digiopo_siivous_kuukausittain'); -- vanha nimi (jos oli)
  end if;
  if exists (select 1 from cron.job where jobname = 'digiopo_rutiinisiivous') then
    perform cron.unschedule('digiopo_rutiinisiivous');
  end if;
  if exists (select 1 from cron.job where jobname = 'digiopo_suursiivous') then
    perform cron.unschedule('digiopo_suursiivous');
  end if;
end $$;

-- Rutiini: 1. ja 15. päivä klo 03:00
select cron.schedule('digiopo_rutiinisiivous', '0 3 1,15 * *', $$ select digiopo_siivoa(); $$);

-- Suursiivous: 1. elokuuta klo 04:00 (ennen uutta lukuvuotta)
select cron.schedule('digiopo_suursiivous', '0 4 1 8 *', $$ select digiopo_suursiivous(); $$);

-- ─── Tarkistuskomennot (aja käsin tarvittaessa) ──────────────────────────────
-- Aja rutiini heti:     select digiopo_siivoa();
-- Aja suursiivous heti:  select digiopo_suursiivous();   -- HUOM: nollaa tulostaulut!
-- Näytä ajastukset:      select jobid, jobname, schedule, active from cron.job;
-- Näytä viime ajot:      select jobid, status, return_message, start_time
--                        from cron.job_run_details order by start_time desc limit 10;
-- Poista ajastus:        select cron.unschedule('digiopo_rutiinisiivous');
--                        select cron.unschedule('digiopo_suursiivous');
