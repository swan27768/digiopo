-- DigiOpo – Koulukohtainen lukuvuoden aikataulu
-- Aja tämä Supabase SQL Editorissa supabase_schema.sql:n JA supabase_jarjestys.sql:n
-- jälkeen (viittaa opetusryhmat-tauluun ja käyttää paivita_muokattu_at()-funktiota).
--
-- Malli (sama kuin järjestyksessä):
--   - Opettaja luo/omistaa opetusryhmän (ryhmakoodi + salainen opettaja-avain).
--   - Oppilaat näkevät koulun tapahtumat pelkällä ryhmäkoodilla (luku).
--   - Vain opettaja-avaimella voi lisätä/muokata/poistaa tapahtumia (kirjoitus).
-- Selain EI koskaan puhu suoraan Supabaseen — kaikki kulkee api/aikataulu.js:n
-- (service_role-avain) kautta, kuten lisenssintarkistus ja järjestys.

-- ─── Lukuvuoden tapahtumat ───────────────────────────────────────────────────
create table if not exists lukuvuosi_tapahtumat (
  id           uuid        primary key default gen_random_uuid(),
  ryhmakoodi   text        not null references opetusryhmat (ryhmakoodi) on delete cascade,
  luokka       text        not null default '9' check (luokka in ('7', '8', '9')),
  otsikko      text        not null check (char_length(otsikko) <= 80),
  tyyppi       text        not null default 'muu'
                           check (tyyppi in ('tet','yhteishaku','palautus','tapahtuma','muu')),
  alku_pvm     date        not null,
  loppu_pvm    date,                                    -- null = yksittäinen päivä
  kuvaus       text        check (char_length(kuvaus) <= 200),
  luotu_at     timestamptz not null default now(),
  muokattu_at  timestamptz not null default now(),
  -- jos loppupäivä on annettu, sen on oltava alkupäivänä tai sen jälkeen
  constraint lukuvuosi_pvm_jarjestys check (loppu_pvm is null or loppu_pvm >= alku_pvm)
);

create index if not exists lukuvuosi_tapahtumat_ryhma_luokka_idx
  on lukuvuosi_tapahtumat (ryhmakoodi, luokka, alku_pvm);

-- ─── Automaattinen muokattu_at-päivitys (käyttää supabase_schema.sql:n funktiota) ─
drop trigger if exists lukuvuosi_tapahtumat_muokattu_at on lukuvuosi_tapahtumat;
create trigger lukuvuosi_tapahtumat_muokattu_at
  before update on lukuvuosi_tapahtumat
  for each row execute function paivita_muokattu_at();

-- ─── Row Level Security ──────────────────────────────────────────────────────
-- Estetään kaikki julkinen pääsy. Vain service_role (api/aikataulu.js) pääsee.
alter table lukuvuosi_tapahtumat enable row level security;

drop policy if exists "Ei julkista paasya aikataulu" on lukuvuosi_tapahtumat;
create policy "Ei julkista paasya aikataulu" on lukuvuosi_tapahtumat for all using (false);
