-- DigiOpo – Koulun tietojen tarkastelu ja poisto
-- Aja Supabase SQL Editorissa. Turvallinen ajaa uudelleen (idempotentti).
--
-- TAUSTA: oppilaiden työt (fake_insta_profiilit, maailma_ratkaisut) on sidottu
-- koulun NIMEEN, ei lisenssikoodiin. Lisenssin poisto ei siis poista töitä,
-- ja ne jäävät kantaan orvoiksi.
--
-- MIKSI EI AUTOMAATTISTA POISTOA LISENSSIN MUKANA:
-- Lisenssiä joutuu joskus poistamaan ja luomaan uudelleen – kirjoitusvirhe
-- koulunimessä, väärä tyyppi, epäonnistunut uusinta. Jos poisto kaataisi
-- samalla oppilastyöt, yksi korjausliike pyyhkisi luokan koko vuoden työn
-- eikä sitä voisi perua. Poisto on siksi tietoinen, erillinen toimenpide.

-- ─── 1) Näkymä: oppilastyöt joilla ei ole lisenssiä ──────────────────────────
-- Kertoo mitä kantaan on jäänyt roikkumaan. Aja tämä silloin tällöin.
create or replace view oppilastyot_ilman_lisenssia as
select
  koulu,
  'fake_insta'                       as taulu,
  count(*)                           as toita,
  count(*) filter (where tila = 'odottaa') as odottaa,
  max(luotu_at)::date                as viimeisin
from fake_insta_profiilit f
where not exists (select 1 from lisenssit l where l.koulu = f.koulu)
group by koulu

union all

select
  koulu,
  'maailma_taulu'                    as taulu,
  count(*)                           as toita,
  count(*) filter (where tila = 'odottaa') as odottaa,
  max(created_at)::date              as viimeisin
from maailma_ratkaisut m
where not exists (select 1 from lisenssit l where l.koulu = m.koulu)
group by koulu

order by koulu, taulu;

-- ─── 2) Mitä koululla on? (katso ENNEN poistoa) ──────────────────────────────
-- Käyttö:  select * from koulun_tiedot('Digikoulu');
create or replace function koulun_tiedot(p_koulu text)
returns table (mita text, maara bigint)
language sql stable as $$
  select 'lisenssit',            count(*) from lisenssit            where koulu = p_koulu
  union all
  select 'opetusryhmat',         count(*) from opetusryhmat         where koulukoodi in
         (select koodi from lisenssit where koulu = p_koulu)
  union all
  select 'fake_insta_profiilit', count(*) from fake_insta_profiilit where koulu = p_koulu
  union all
  select 'maailma_ratkaisut',    count(*) from maailma_ratkaisut    where koulu = p_koulu;
$$;

-- ─── 3) Poista koulun KAIKKI tiedot ──────────────────────────────────────────
-- Käyttö:  select * from poista_koulu('Digikoulu');
--
-- ⚠️ POISTAA OPPILAIDEN TYÖT PYSYVÄSTI. Ei voi perua.
-- Aja ensin koulun_tiedot() ja katso luvut.
--
-- Opetusryhmät poistuvat vain jos ne on sidottu koulukoodiin (koulukoodi-kenttä
-- on vapaaehtoinen). Ryhmän poisto vie cascadella mukanaan järjestykset ja
-- lukuvuoden aikataulun.
create or replace function poista_koulu(p_koulu text)
returns table (mita text, poistettu bigint)
language plpgsql security definer as $$
declare
  n_tyot_fi bigint; n_tyot_mt bigint; n_ryhmat bigint; n_lis bigint;
begin
  delete from fake_insta_profiilit where koulu = p_koulu;
  get diagnostics n_tyot_fi = row_count;

  delete from maailma_ratkaisut where koulu = p_koulu;
  get diagnostics n_tyot_mt = row_count;

  delete from opetusryhmat
   where koulukoodi in (select koodi from lisenssit where koulu = p_koulu);
  get diagnostics n_ryhmat = row_count;

  delete from lisenssit where koulu = p_koulu;
  get diagnostics n_lis = row_count;

  return query
    select 'fake_insta_profiilit', n_tyot_fi union all
    select 'maailma_ratkaisut',    n_tyot_mt union all
    select 'opetusryhmat',         n_ryhmat  union all
    select 'lisenssit',            n_lis;
end;
$$;

-- ─── Käyttöohje ──────────────────────────────────────────────────────────────
-- 1) Katso mitä on:        select * from koulun_tiedot('Digikoulu');
-- 2) Poista kaikki:        select * from poista_koulu('Digikoulu');
-- 3) Orvot työt yleisesti: select * from oppilastyot_ilman_lisenssia;
