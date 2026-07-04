-- DigiOpo – Admin-paneelin virhelokitaulu
-- Aja Supabasen SQL Editorissa.
-- Käyttötarkoitus: kerää API-funktioiden (Vercel serverless) virheet yhteen paikkaan,
-- jotta ne näkyvät admin-paneelissa "Vikatilanteet"-osiossa.
--
-- Selain ei koskaan kirjoita tähän tauluun suoraan – vain palvelinpuolen
-- funktiot (service_role-avaimella) kirjoittavat, ja vain service_role lukee.

create table if not exists api_virheet (
  id          bigint generated always as identity primary key,
  endpoint    text not null,             -- esim. "lisenssi POST", "tilaus opettajalisenssi"
  viesti      text not null,             -- virheviesti (err.message)
  lisatiedot  jsonb not null default '{}'::jsonb,  -- vapaamuotoista lisäkontekstia
  luotu_at    timestamptz not null default now()
);

create index if not exists idx_api_virheet_luotu on api_virheet (luotu_at desc);
create index if not exists idx_api_virheet_endpoint on api_virheet (endpoint);

-- Siivoa automaattisesti yli 30 vrk vanhat virheet (ettei taulu kasva loputtomiin)
create or replace function siivoa_vanhat_virheet()
returns void language sql security definer as $$
  delete from api_virheet where luotu_at < now() - interval '30 days';
$$;

-- ─── Row Level Security ───────────────────────────────────────────────────
-- Sama malli kuin lisenssit-taulussa: ei julkista pääsyä, vain service_role.
alter table api_virheet enable row level security;

create policy "Ei julkista pääsyä" on api_virheet
  for all using (false);
