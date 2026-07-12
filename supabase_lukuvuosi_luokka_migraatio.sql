-- DigiOpo – Lukuvuoden aikataulu: luokkakohtaisuus (7/8/9)
-- Aja tämä Supabase SQL Editorissa, jos olet jo ajanut supabase_lukuvuosi_aikataulu.sql:n
-- (eli taulu lukuvuosi_tapahtumat on jo olemassa ilman luokka-saraketta).
--
-- Lisää luokka-sarakkeen, jotta 7., 8. ja 9. luokalla voi olla oma aikataulunsa.
-- Olemassa olevat tapahtumat saavat oletuksena luokan '9' (ne luotiin 9. luokan käyttöön).

alter table lukuvuosi_tapahtumat
  add column if not exists luokka text not null default '9';

-- Rajaa luokka arvoihin 7/8/9 (lisätään vain jos rajoitetta ei vielä ole)
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'lukuvuosi_luokka_check'
  ) then
    alter table lukuvuosi_tapahtumat
      add constraint lukuvuosi_luokka_check check (luokka in ('7', '8', '9'));
  end if;
end $$;

-- Hakuindeksi ryhmä + luokka + päivä
create index if not exists lukuvuosi_tapahtumat_ryhma_luokka_idx
  on lukuvuosi_tapahtumat (ryhmakoodi, luokka, alku_pvm);
