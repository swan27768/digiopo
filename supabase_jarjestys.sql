-- DigiOpo – Osiojärjestyksen jako (Vaihe 2)
-- Aja tämä Supabase SQL Editorissa supabase_schema.sql:n jälkeen.
--
-- Malli: opettaja luo "opetusryhmän" (ryhmäkoodi + salainen opettaja-avain).
--   - Oppilaat näkevät opettajan osiojärjestyksen pelkällä ryhmäkoodilla (luku).
--   - Vain opettaja-avaimella voi tallentaa/muuttaa järjestystä (kirjoitus).
-- Selain EI koskaan puhu suoraan Supabaseen — kaikki kulkee api/jarjestys.js:n
-- (service_role-avain) kautta, kuten lisenssintarkistus.

-- ─── Opetusryhmät ────────────────────────────────────────────────────────────
create table if not exists opetusryhmat (
  ryhmakoodi  text primary key,                 -- esim. "7A-K3M9" (jaetaan oppilaille)
  avain_hash  text not null,                     -- opettaja-avaimen SHA-256-tiiviste
  koulukoodi  text,                              -- vapaaehtoinen kytkös lisenssiin
  nimi        text,                              -- vapaaehtoinen ryhmän kuvaus
  luotu_at    timestamptz not null default now(),
  muokattu_at timestamptz not null default now()
);

-- ─── Järjestykset (yksi rivi per ryhmä + luokka-aste) ────────────────────────
create table if not exists jarjestykset (
  ryhmakoodi  text not null references opetusryhmat (ryhmakoodi) on delete cascade,
  luokka      text not null check (luokka in ('7', '8', '9')),
  jarjestys   jsonb not null default '[]'::jsonb, -- lista osio-id:itä järjestyksessä
  muokattu_at timestamptz not null default now(),
  primary key (ryhmakoodi, luokka)
);

create index if not exists jarjestykset_ryhma_idx on jarjestykset (ryhmakoodi);

-- Automaattinen muokattu_at-päivitys (käyttää supabase_schema.sql:n funktiota)
drop trigger if exists opetusryhmat_muokattu_at on opetusryhmat;
create trigger opetusryhmat_muokattu_at
  before update on opetusryhmat
  for each row execute function paivita_muokattu_at();

drop trigger if exists jarjestykset_muokattu_at on jarjestykset;
create trigger jarjestykset_muokattu_at
  before update on jarjestykset
  for each row execute function paivita_muokattu_at();

-- ─── Row Level Security ──────────────────────────────────────────────────────
-- Estetään kaikki julkinen pääsy. Vain service_role (api/jarjestys.js) pääsee.
alter table opetusryhmat enable row level security;
alter table jarjestykset enable row level security;

drop policy if exists "Ei julkista paasya ryhmat" on opetusryhmat;
create policy "Ei julkista paasya ryhmat" on opetusryhmat for all using (false);

drop policy if exists "Ei julkista paasya jarjestykset" on jarjestykset;
create policy "Ei julkista paasya jarjestykset" on jarjestykset for all using (false);
