-- DigiOpo – Oppilaan itsearviointi (lukuvuoden lopussa)
-- Aja Supabase SQL Editorissa. Turvallinen ajaa uudelleen (idempotentti).
--
-- TIETOSUOJA: rivi EI sisällä nimeä, sähköpostia, IP-osoitetta eikä laitetunnistetta.
-- Vain luokka-aste, lukuvuosi, koulukoodi (palvelin lukee sen allekirjoitetusta
-- lisenssievästeestä), valinnainen ryhmäkoodi ja vastaukset 1–5.
-- Opettaja näkee vain ryhmäkeskiarvot, ja vasta kun vastauksia on vähintään 5.
-- Selain EI puhu suoraan Supabaseen – kaikki kulkee api/jarjestys.js:n kautta.

create table if not exists itsearviointi (
  id          bigserial primary key,
  koulukoodi  text,                                    -- evästeestä, ei selaimelta
  ryhmakoodi  text,                                    -- ?ryhma=-linkistä, voi puuttua
  luokka      text not null check (luokka in ('7', '8', '9')),
  lukuvuosi   text not null,                           -- esim. "2026-2027" (palvelin laskee)
  v1          smallint not null check (v1 between 1 and 5),
  v2          smallint not null check (v2 between 1 and 5),
  v3          smallint not null check (v3 between 1 and 5),
  v4          smallint not null check (v4 between 1 and 5),
  v5          smallint not null check (v5 between 1 and 5),
  v6          smallint not null check (v6 between 1 and 5), -- "miten taitosi ovat muuttuneet"
  luotu_at    timestamptz not null default now()
);

create index if not exists itsearviointi_ryhma_idx
  on itsearviointi (ryhmakoodi, luokka, lukuvuosi);
create index if not exists itsearviointi_luotu_idx
  on itsearviointi (luotu_at);

alter table itsearviointi enable row level security;
drop policy if exists "Ei julkista paasya itsearviointi" on itsearviointi;
create policy "Ei julkista paasya itsearviointi" on itsearviointi for all using (false);
