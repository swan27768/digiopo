-- Työelämän kaupunki – tulostaulu (kevyt kilpailu luokkakoodilla)
-- Aja tämä Supabase SQL Editorissa samassa projektissa kuin muut DigiOpo-taulut.

create table if not exists peli_tulokset (
  id        uuid primary key default gen_random_uuid(),
  koodi     text not null,                 -- luokkakoodi, esim. "9A-KEVAT"
  nimi      text not null,                 -- pelaajan nimi / nimimerkki
  raha      integer not null default 0,    -- loppusaldo €
  taso      integer not null default 1,    -- saavutettu taso
  oikein    integer not null default 0,    -- oikeita vastauksia yhteensä
  luotu_at  timestamptz not null default now()
);

-- Nopeuttaa tulostaulun hakua koodilla, parhaat ensin
create index if not exists peli_tulokset_koodi_raha_idx on peli_tulokset (koodi, raha desc);

-- Row Level Security: selain EI lue taulua suoraan, kaikki kulkee /api/tulokset-funktion
-- kautta service_role-avaimella (kuten muutkin DigiOpo-taulut).
alter table peli_tulokset enable row level security;

create policy "Ei julkista paasya peli_tuloksiin" on peli_tulokset
  for all using (false);

-- Valinnainen siivous (esim. lukukauden vaihtuessa):
--   delete from peli_tulokset where luotu_at < now() - interval '180 days';
--   delete from peli_tulokset where koodi = '9A-KEVAT';
