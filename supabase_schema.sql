-- DigiOpo – Supabase-tietokantaskeema
-- Aja tämä Supabase SQL Editorissa

-- ─── Lisenssitaulu ───────────────────────────────────────────────────────────

create table if not exists lisenssit (
  id          uuid primary key default gen_random_uuid(),
  koodi       text not null unique,           -- esim. "MÄYRÄLÄ-2026"
  koulu       text not null,                  -- koulun nimi
  yhteyshenkilö text,                         -- opettajan nimi
  email       text,                           -- opettajan sähköposti
  tyyppi      text not null default 'testi'   -- 'testi' | 'vuosi' | 'kunta'
              check (tyyppi in ('testi', 'vuosi', 'kunta')),
  voimassa_asti date not null,               -- esim. 2026-12-31
  aktiivinen  boolean not null default true,
  luotu_at    timestamptz not null default now(),
  muokattu_at timestamptz not null default now()
);

-- Indeksi koodihaun nopeuttamiseen
create index if not exists lisenssit_koodi_idx on lisenssit (koodi);

-- Automaattinen muokattu_at-päivitys
create or replace function paivita_muokattu_at()
returns trigger language plpgsql as $$
begin
  new.muokattu_at = now();
  return new;
end;
$$;

create trigger lisenssit_muokattu_at
  before update on lisenssit
  for each row execute function paivita_muokattu_at();

-- ─── Row Level Security ───────────────────────────────────────────────────────
-- Suojataan taulu: vain service_role-avaimella pääsee lukemaan (Netlify Function)
-- Selain ei koskaan kommunikoi suoraan Supabaseen

alter table lisenssit enable row level security;

-- Kielletään kaikki julkinen pääsy
create policy "Ei julkista pääsyä" on lisenssit
  for all using (false);

-- ─── Esimerkkidataa testaukseen ──────────────────────────────────────────────
-- Poista tai muuta ennen tuotantoa!

insert into lisenssit (koodi, koulu, yhteyshenkilö, email, tyyppi, voimassa_asti)
values
  ('TESTI-2026',   'DigiOpo testaus',      'Admin',          'admin@digiopo.fi', 'testi', '2026-12-31'),
  ('KOULU-2026',   'Esimerkkikoulu',       'Matti Meikäläinen', 'matti@koulu.fi', 'vuosi', '2027-05-31')
on conflict (koodi) do nothing;
