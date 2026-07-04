-- DigiOpo – Massaviestien loki
-- Aja Supabasen SQL Editorissa.
-- Käyttötarkoitus: kirjaa admin-paneelista lähetetyt massaviestit (esim.
-- häiriötiedotteet kaikille tilaajille) historiaa ja tilivelvollisuutta varten.

create table if not exists admin_viestit (
  id                bigint generated always as identity primary key,
  otsikko           text not null,
  viesti            text not null,
  vastaanottajamaara integer not null default 0,
  onnistuneet       integer not null default 0,
  epaonnistuneet    integer not null default 0,
  laheta_at         timestamptz not null default now()
);

create index if not exists idx_admin_viestit_laheta on admin_viestit (laheta_at desc);

-- ─── Row Level Security ───────────────────────────────────────────────────
-- Sama malli kuin muissa admin-tauluissa: ei julkista pääsyä, vain service_role.
alter table admin_viestit enable row level security;

create policy "Ei julkista pääsyä" on admin_viestit
  for all using (false);
