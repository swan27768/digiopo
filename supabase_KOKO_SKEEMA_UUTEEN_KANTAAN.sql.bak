-- ============================================================
-- DigiOpo -- KOKO tietokantaskeema uuteen Supabase-projektiin
-- Koottu automaattisesti docs/03-tietokanta.md:n ajojärjestyksen
-- mukaan + projektissa olevat, dokumentaation jälkeen lisätyt
-- tiedostot (ai_vinkit, koulun_siivous, laskutus, lisenssi_koulukoodi,
-- peli_tulokset). Aja tämä KOKONAISUUDESSAAN Supabasen SQL Editorissa
-- kerralla ylhäältä alas.
-- ============================================================


-- ################################################################
-- ###  supabase_schema.sql
-- ################################################################

-- DigiOpo – Supabase-tietokantaskeema
-- Aja tämä Supabase SQL Editorissa

-- ─── Lisenssitaulu ───────────────────────────────────────────────────────────

create table if not exists lisenssit (
  id          uuid primary key default gen_random_uuid(),
  koodi       text not null unique,           -- esim. "MÄYRÄLÄ-2026"
  koulu       text not null,                  -- koulun nimi
  yhteyshenkilö text,                         -- opettajan nimi
  email       text,                           -- opettajan sähköposti
  -- 'opettaja' on pakollinen: api/lisenssi.js hakee opettajalisenssin
  -- kyselyllä ?email=eq.<email>&tyyppi=eq.opettaja. Ilman tätä arvoa
  -- opettajakirjautuminen ei toimi lainkaan.
  tyyppi      text not null default 'testi'   -- 'testi' | 'vuosi' | 'kunta' | 'opettaja'
              check (tyyppi in ('testi', 'vuosi', 'kunta', 'opettaja')),
  voimassa_asti date not null,               -- esim. 2026-12-31
  aktiivinen  boolean not null default true,
  luotu_at    timestamptz not null default now(),
  muokattu_at timestamptz not null default now()
);

-- Indeksi koodihaun nopeuttamiseen
create index if not exists lisenssit_koodi_idx on lisenssit (koodi);

-- Yksi opettajalisenssi per sähköposti.
--
-- MIKSI: api/lisenssi.js hakee opettajalisenssin kyselyllä
--   ?email=eq.<email>&tyyppi=eq.opettaja  →  data[0]
-- Haussa ei ole order by:tä, joten jos samalla sähköpostilla on useampi
-- opettajalisenssi, palautuva rivi on käytännössä sattumanvarainen. Eri
-- voimassaolopäivillä kirjautuminen toimisi tai ei toimisi arvaamattomasti.
--
-- Osittainen indeksi: koskee vain opettajalisenssejä. Koulukoodeilla sama
-- sähköposti voi esiintyä monta kertaa (sama yhteyshenkilö, monta koulua).
-- NULL-sähköpostit eivät ole keskenään ristiriidassa.
--
-- HUOM: luonti kaatuu, jos duplikaatteja on jo olemassa. Siivoa ensin.
create unique index if not exists lisenssit_opettaja_email_idx
  on lisenssit (email) where tyyppi = 'opettaja';

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
-- ⚠️ TIETOISESTI KOMMENTOITU POIS.
--
-- Nämä koodit ovat arvattavia. Jos ne luodaan tuotantokantaan, kuka tahansa
-- pääsee maksumuurin läpi kokeilemalla "TESTI-2026". Aiemmin rivit ajettiin
-- automaattisesti, ja ne jäivät tuotantoon – poistettu 19.7.2026.
--
-- Ota käyttöön vain paikallisessa testauksessa, ja poista ennen julkaisua:
--
-- insert into lisenssit (koodi, koulu, yhteyshenkilö, email, tyyppi, voimassa_asti)
-- values
--   ('TESTI-2026', 'DigiOpo testaus', 'Admin', 'admin@digiopo.fi', 'testi', '2026-12-31'),
--   ('KOULU-2026', 'Esimerkkikoulu', 'Matti Meikäläinen', 'matti@koulu.fi', 'vuosi', '2027-05-31')
-- on conflict (koodi) do nothing;


-- ################################################################
-- ###  supabase_jarjestys.sql
-- ################################################################

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
  lukitut     jsonb not null default '[]'::jsonb, -- lista lukittuja osio-id:itä
  muokattu_at timestamptz not null default now(),
  primary key (ryhmakoodi, luokka)
);

-- Jos taulu on jo luotu ilman lukitut-saraketta, lisää se:
alter table jarjestykset add column if not exists lukitut jsonb not null default '[]'::jsonb;

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


-- ################################################################
-- ###  supabase_opettajatili_vaihe1.sql
-- ################################################################

-- DigiOpo – Opettajatili, Vaihe 1: ryhmän omistajuus
-- Aja tämä Supabase SQL Editorissa.
--
-- Lisää opetusryhmään omistajan sähköposti. Kun opettaja luo ryhmän tililleen
-- kirjautuneena (myöhemmät vaiheet), tähän leimataan hänen sähköpostinsa, ja
-- opettaja voi hallita vain omia ryhmiään (omistaja_email = kirjautunut email).
--
-- Turvallinen ajaa olemassa olevaan tauluun: sarake on nullable, joten vanhat
-- (PIN-pohjaiset) ryhmät jäävät ilman omistajaa eivätkä riko mitään. Ne voidaan
-- ottaa haltuun myöhemmin (koodi + PIN).

alter table opetusryhmat add column if not exists omistaja_email text;

create index if not exists opetusryhmat_omistaja_idx
  on opetusryhmat (omistaja_email);

comment on column opetusryhmat.omistaja_email is
  'Ryhmän omistavan opettajan sähköposti (Supabase Auth). NULL = vanha PIN-pohjainen ryhmä, ei vielä otettu haltuun.';


-- ################################################################
-- ###  supabase_poista_pin.sql
-- ################################################################

-- DigiOpo – Poista PIN-logiikka: pudota opetusryhmat.avain_hash
-- Aja Supabase SQL Editorissa. Turvallinen ajaa uudelleen (idempotentti).
--
-- TAUSTA: ryhmiä hallitaan nyt vain opettajan tilillä (omistaja_email).
-- PIN-pohjainen valtuutus (avain_hash) on poistettu palvelin- ja frontend-
-- koodista, joten sarake pudotetaan.
--
-- ⚠️ AJOJÄRJESTYS: julkaise UUSI KOODI ENSIN (se ei enää viittaa avain_hash:iin),
-- ja aja tämä VASTA sen jälkeen. Jos pudotat sarakkeen ennen deployta, vanha
-- käynnissä oleva koodi yrittää yhä lukea avain_hash-saraketta → virheitä.
-- Uuden koodin julkaisun jälkeen ainoa lyhyt katve on ryhmän LUONTI (avain_hash
-- on vielä NOT NULL kunnes tämä ajetaan) — aja tämä heti deployn perään.

ALTER TABLE opetusryhmat DROP COLUMN IF EXISTS avain_hash;


-- ################################################################
-- ###  supabase_lukuvuosi_aikataulu.sql
-- ################################################################

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


-- ################################################################
-- ###  supabase_lisenssi_kirjaukset.sql
-- ################################################################

-- DigiOpo – Lisenssikirjausten taulu
-- Aja Supabase SQL Editorissa (supabase_schema.sql:n jälkeen)

-- Kirjaustauluun tallennetaan jokainen onnistunut kirjautuminen
CREATE TABLE IF NOT EXISTS lisenssi_kirjaukset (
  id            bigserial PRIMARY KEY,
  koodi         text        NOT NULL,
  koulu         text,
  kirjattu_klo  timestamptz NOT NULL DEFAULT now(),
  ip            text,
  user_agent    text
);

-- Indeksit nopeaan hakuun
CREATE INDEX IF NOT EXISTS idx_lk_koodi       ON lisenssi_kirjaukset (koodi);
CREATE INDEX IF NOT EXISTS idx_lk_kirjattu    ON lisenssi_kirjaukset (kirjattu_klo DESC);

-- Row Level Security: palvelin kirjoittaa service_role-avaimella, ei julkista lukuoikeutta
ALTER TABLE lisenssi_kirjaukset ENABLE ROW LEVEL SECURITY;

-- Hyödyllisiä näkymiä Supabasen Table Editoriin

-- Kirjautumiset koodittain
CREATE OR REPLACE VIEW kirjautumiset_koodittain AS
SELECT
  koodi,
  koulu,
  COUNT(*)                          AS kirjautumisia_yhteensa,
  MIN(kirjattu_klo)                 AS ensimmainen_kirjautuminen,
  MAX(kirjattu_klo)                 AS viimeisin_kirjautuminen
FROM lisenssi_kirjaukset
GROUP BY koodi, koulu
ORDER BY viimeisin_kirjautuminen DESC;

-- Viimeisimmät 100 kirjautumista
CREATE OR REPLACE VIEW viimeisimmat_kirjautumiset AS
SELECT
  kirjattu_klo,
  koodi,
  koulu,
  ip,
  user_agent
FROM lisenssi_kirjaukset
ORDER BY kirjattu_klo DESC
LIMIT 100;


-- ################################################################
-- ###  supabase_lisenssi_seuranta.sql
-- ################################################################

-- DigiOpo – Koululisenssin käytön seuranta (vaihtoehto C: seuranta, ei estä)
-- Aja Supabase SQL Editorissa. Turvallinen ajaa uudelleen (idempotentti).
--
-- IDEA: koululisenssi on jaettu koodi eikä oppilailla ole henkilökohtaisia
-- tunnuksia, joten "käyttäjämäärää" arvioidaan LAITTEIDEN kautta (selaimen
-- pysyvä satunnaistunniste digiopo_laite). Palvelin kirjaa jokaisen onnistuneen
-- koodikirjautumisen laitetunnisteen tähän tauluun deduplattuna (yksi rivi per
-- koodi + laite). Näin näet montako eri laitetta kutakin koodia käyttää ja voit
-- verrata sitä myytyihin paikkoihin. TÄMÄ EI ESTÄ mitään – se on seurantaa.
--
-- HUOM laitemäärän tulkinta: yksi oppilas kahdella laitteella = 2, selaimen
-- tyhjennys/incognito = uusi laite, luokan yhteiskone = monta oppilasta yhdellä
-- laitteella. Luku on siis suuntaa-antava, ei tarkka päälukumäärä.

-- ─── 1) Myytyjen paikkojen määrä lisenssille (informatiivinen, ei pakota) ──────
-- Täytä tämä kunkin lisenssin kohdalla sen mukaan montako paikkaa on myyty.
-- NULL = ei asetettu (näkymä ei tällöin osaa laskea ylikäyttöä).
ALTER TABLE lisenssit
  ADD COLUMN IF NOT EXISTS paikat integer;

-- ─── 2) Laitteet per koodi (dedupe: yksi rivi per koodi + laite) ──────────────
CREATE TABLE IF NOT EXISTS lisenssi_laitteet (
  koodi       text        NOT NULL,
  laite       text        NOT NULL,
  koulu       text,
  ensi_nahty  timestamptz NOT NULL DEFAULT now(),  -- ensimmäinen aktivointi
  viim_nahty  timestamptz NOT NULL DEFAULT now(),  -- viimeisin kirjautuminen/tarkistus
  PRIMARY KEY (koodi, laite)
);

CREATE INDEX IF NOT EXISTS idx_ll_koodi ON lisenssi_laitteet (koodi);

-- Estä suora selainpääsy (vain palvelin kirjoittaa service_role-avaimella).
ALTER TABLE lisenssi_laitteet ENABLE ROW LEVEL SECURITY;

-- ─── 3) Käyttönäkymä: laitteita per koodi vs. myydyt paikat ───────────────────
-- laitteita_yht   = kaikki koskaan aktivoituneet laitteet
-- laitteita_30pv  = viimeisen 30 pv aikana aktiiviset laitteet (realistisempi)
-- ylikaytto       = onko 30 pv aktiivisia enemmän kuin myytyjä paikkoja
CREATE OR REPLACE VIEW lisenssi_kaytto AS
SELECT
  l.koodi,
  l.koulu,
  l.paikat,
  COUNT(d.laite)                                                              AS laitteita_yht,
  COUNT(d.laite) FILTER (WHERE d.viim_nahty > now() - interval '30 days')     AS laitteita_30pv,
  MAX(d.viim_nahty)                                                           AS viimeksi_kaytetty,
  CASE
    WHEN l.paikat IS NULL THEN NULL
    ELSE COUNT(d.laite) FILTER (WHERE d.viim_nahty > now() - interval '30 days') > l.paikat
  END                                                                        AS ylikaytto
FROM lisenssit l
LEFT JOIN lisenssi_laitteet d ON d.koodi = l.koodi
GROUP BY l.koodi, l.koulu, l.paikat
ORDER BY laitteita_30pv DESC;


-- ################################################################
-- ###  supabase_laskuri.sql
-- ################################################################

-- DigiOpo – Käyttölaskurin SQL-funktio (SHARDED, kuormankestävä)
-- Aja Supabase SQL Editorissa. Turvallinen ajaa uudelleen (idempotentti).
-- Ei vaadi manuaalisia askelia – poistaa vanhan yksikäsitteisyyden nimestä
-- riippumatta (ks. lohko 2).
--
-- MIKSI SHARDING: aiemmin jokainen /api/ping teki UPSERTin YHTEEN riviin
-- (sivu, paiva) → kaikki saman sivun samanaikaiset pingit kilpailivat samasta
-- rivilukosta (kuuma rivi). Tuhat oppilasta avaa "7luokka" yhtä aikaa =
-- tuhat kilpailevaa UPDATEa samaan riviin → lukkojonoa ja timeoutteja.
--
-- RATKAISU: kirjataan laskuri satunnaiseen "bucketiin" (0–19), jolloin
-- kirjoitukset jakautuvat 20 riville per (sivu, paiva) ja lukkokilpailu
-- pienenee ~20-kertaisesti. Lukijat summaavat bucketit yhteen (SUM(maara)),
-- joten kokonaisluvut säilyvät ennallaan – näkymiä eikä admin-tilastoja
-- tarvitse muuttaa (ne käyttävät jo SUM(maara):a).

-- ─── 0) Perustaulu ─────────────────────────────────────────────────────────────
-- HUOM: tämä lohko puuttui pitkään tiedostosta. Taulu oli luotu tuotantoon
-- käsin, joten kaikki alla oleva toimi siellä mutta tyhjä kanta kaatui heti
-- kohdan 1 alter tableen. Lisätty 19.7.2026 tuotannon rakenteen mukaisena.
create table if not exists page_views (
  id     uuid     primary key default gen_random_uuid(),
  sivu   text     not null,
  paiva  date     not null default current_date,
  maara  integer  not null default 1,
  bucket smallint not null default 0
);

-- Estä suora selainpääsy (vain palvelin kirjoittaa service_role-avaimella).
alter table page_views enable row level security;

-- ─── 1) Lisää bucket-sarake (oletus 0 → vanhat rivit säilyvät kelvollisina) ─────
alter table page_views
  add column if not exists bucket smallint not null default 0;

-- ─── 2) Poista vanha (sivu, paiva) -yksikäsitteisyys NIMESTÄ RIIPPUMATTA ────────
-- Käsittelee kaikki tapaukset automaattisesti:
--   a) primary key (mikä tahansa nimi),
--   b) unique constraint täsmälleen sarakkeille (sivu, paiva),
--   c) erillinen unique index sarakkeille (sivu, paiva).
-- Näin samalle (sivu, paiva) -parille mahtuu useampi bucket-rivi.
DO $$
DECLARE
  nimi text;
BEGIN
  -- a) Primary key (nimestä riippumatta)
  SELECT conname INTO nimi
  FROM pg_constraint
  WHERE conrelid = 'page_views'::regclass AND contype = 'p';
  IF nimi IS NOT NULL THEN
    EXECUTE format('ALTER TABLE page_views DROP CONSTRAINT %I', nimi);
  END IF;

  -- b) Unique constraint, jonka sarakkeet ovat TÄSMÄLLEEN {sivu, paiva}
  FOR nimi IN
    SELECT c.conname
    FROM pg_constraint c
    WHERE c.conrelid = 'page_views'::regclass AND c.contype = 'u'
      AND (
        SELECT array_agg(a.attname::text ORDER BY a.attname::text)
        FROM unnest(c.conkey) AS k(attnum)
        JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = k.attnum
      ) = ARRAY['paiva', 'sivu']
  LOOP
    EXECUTE format('ALTER TABLE page_views DROP CONSTRAINT %I', nimi);
  END LOOP;

  -- c) Erillinen unique index (ei constraint), jonka sarakkeet ovat {sivu, paiva}
  FOR nimi IN
    SELECT i.relname
    FROM pg_index x
    JOIN pg_class i ON i.oid = x.indexrelid
    JOIN pg_class t ON t.oid = x.indrelid
    WHERE t.relname = 'page_views' AND x.indisunique AND NOT x.indisprimary
      AND (
        SELECT array_agg(a.attname::text ORDER BY a.attname::text)
        FROM unnest(x.indkey) AS k(attnum)
        JOIN pg_attribute a ON a.attrelid = x.indrelid AND a.attnum = k.attnum
      ) = ARRAY['paiva', 'sivu']
  LOOP
    EXECUTE format('DROP INDEX IF EXISTS %I', nimi);
  END LOOP;
END $$;

-- ─── 3) Uusi yksikäsitteisyys kattaa bucketin → UPSERT osuu oikeaan bucket-riviin
create unique index if not exists page_views_sivu_paiva_bucket_idx
  on page_views (sivu, paiva, bucket);

-- ─── 4) Kasvata laskuria atomisesti satunnaiseen bucketiin (UPSERT) ────────────
-- Bucket-määrä (20) on tasapaino: enemmän bucketteja = vähemmän lukkokilpailua,
-- mutta enemmän rivejä. 20 riittää tuhansien samanaikaisten pingien hajautukseen.
CREATE OR REPLACE FUNCTION kasvata_laskuri(p_sivu text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO page_views (sivu, paiva, bucket, maara)
  VALUES (p_sivu, current_date, floor(random() * 20)::smallint, 1)
  ON CONFLICT (sivu, paiva, bucket)
  DO UPDATE SET maara = page_views.maara + 1;
END;
$$;

-- ─── 5) Näkymät (SUM(maara) laskee bucketit yhteen → toimivat ennallaan) ───────

-- Kaikki käynnit sivuittain (yhteensä)
CREATE OR REPLACE VIEW kayntimaarat AS
SELECT
  sivu,
  SUM(maara) AS kaynteya_yhteensa,
  COUNT(DISTINCT paiva) AS aktiivisia_paiviya,
  MIN(paiva) AS ensimmainen_kaynte,
  MAX(paiva) AS viimeisin_kaynte
FROM page_views
GROUP BY sivu
ORDER BY kaynteya_yhteensa DESC;

-- Viikon käynnit
CREATE OR REPLACE VIEW viikon_kayntimaarat AS
SELECT
  sivu,
  SUM(maara) AS kaynteya
FROM page_views
WHERE paiva >= current_date - INTERVAL '7 days'
GROUP BY sivu
ORDER BY kaynteya DESC;

-- Päivittäinen yhteenveto
CREATE OR REPLACE VIEW paivittainen_yhteenveto AS
SELECT
  paiva,
  SUM(maara) AS kaynteya_yhteensa,
  COUNT(DISTINCT sivu) AS eri_sivuja
FROM page_views
GROUP BY paiva
ORDER BY paiva DESC;


-- ################################################################
-- ###  supabase_maailma_taulu.sql
-- ################################################################

-- DigiOpo: Maailma tarvitsee sinua – Luokan taulu
-- Aja tämä Supabase SQL Editorissa

-- ─── Taulu ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS maailma_ratkaisut (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  koulu       TEXT        NOT NULL,
  ongelma     TEXT        NOT NULL CHECK (char_length(ongelma) <= 80),
  jasenet     JSONB       NOT NULL,  -- [{nimi: "...", rooli: "..."}, ...]
  idea        TEXT        NOT NULL CHECK (char_length(idea) <= 200),
  tila        TEXT        NOT NULL DEFAULT 'odottaa'
                          CHECK (tila IN ('odottaa', 'hyvaksytty')),
  tykkaukset  INT         NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Indeksit ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS maailma_ratkaisut_koulu_idx ON maailma_ratkaisut(koulu);
CREATE INDEX IF NOT EXISTS maailma_ratkaisut_tila_idx  ON maailma_ratkaisut(tila);

-- ─── RLS ─────────────────────────────────────────────────────────────────────
ALTER TABLE maailma_ratkaisut ENABLE ROW LEVEL SECURITY;

-- API käyttää service_keytä – ei tarvita RLS-politiikkoja
-- (service_key ohittaa RLS automaattisesti)

-- ─── Tykkäys-RPC (atominen) ──────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION mt_kasvata_tykkays(p_id UUID)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE v_uusi INT;
BEGIN
  UPDATE maailma_ratkaisut
  SET    tykkaukset = tykkaukset + 1
  WHERE  id = p_id;
  SELECT tykkaukset INTO v_uusi FROM maailma_ratkaisut WHERE id = p_id;
  RETURN v_uusi;
END;
$$;


-- ################################################################
-- ###  fake_insta_profiilit (dedikoitu tiedosto supabase_fake_insta.sql
-- ###  puuttuu projektikansiosta -- palautettu koosteesta
-- ###  supabase_KAIKKI_uudet_29-6.sql, RLS lisätty puuttumaan
-- ###  havaittu -- alkuperäisessä koosteessa RLS puuttui kokonaan tältä
-- ###  taululta, mikä olisi ollut poikkeus DigiOpon muuten johdonmukaisesta
-- ###  using(false)-mallista. Lisätty tähän tuoreeseen kantaan)
-- ################################################################

CREATE TABLE IF NOT EXISTS fake_insta_profiilit (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  koulu        TEXT        NOT NULL,
  kayttajanimi TEXT        NOT NULL,
  nimi         TEXT        NOT NULL,
  avatar       TEXT        NOT NULL DEFAULT '🙂',
  bio1         TEXT        NOT NULL DEFAULT '',
  bio2         TEXT        NOT NULL DEFAULT '',
  bio3         TEXT        NOT NULL DEFAULT '',
  hashtags     TEXT        NOT NULL DEFAULT '',
  post1        TEXT        NOT NULL DEFAULT '',
  post2        TEXT        NOT NULL DEFAULT '',
  post3        TEXT        NOT NULL DEFAULT '',
  post4        TEXT        NOT NULL DEFAULT '',
  post5        TEXT        NOT NULL DEFAULT '',
  post6        TEXT        NOT NULL DEFAULT '',
  tila         TEXT        NOT NULL DEFAULT 'odottaa'
                           CHECK (tila IN ('odottaa', 'hyvaksytty')),
  tykkayksiat  INTEGER     NOT NULL DEFAULT 0,
  tahdet_bio1  INTEGER     NOT NULL DEFAULT 0,
  tahdet_bio2  INTEGER     NOT NULL DEFAULT 0,
  tahdet_bio3  INTEGER     NOT NULL DEFAULT 0,
  luotu_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fip_koulu_tila
  ON fake_insta_profiilit (koulu, tila);

CREATE OR REPLACE FUNCTION fip_kasvata_tykkays(p_id uuid)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v integer;
BEGIN
  UPDATE fake_insta_profiilit
    SET tykkayksiat = tykkayksiat + 1
    WHERE id = p_id
    RETURNING tykkayksiat INTO v;
  RETURN COALESCE(v, 0);
END;
$$;

CREATE OR REPLACE FUNCTION fip_kasvata_tahti(p_id uuid, p_kentta text)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v integer;
BEGIN
  IF p_kentta = 'bio1' THEN
    UPDATE fake_insta_profiilit SET tahdet_bio1 = tahdet_bio1 + 1
      WHERE id = p_id RETURNING tahdet_bio1 INTO v;
  ELSIF p_kentta = 'bio2' THEN
    UPDATE fake_insta_profiilit SET tahdet_bio2 = tahdet_bio2 + 1
      WHERE id = p_id RETURNING tahdet_bio2 INTO v;
  ELSIF p_kentta = 'bio3' THEN
    UPDATE fake_insta_profiilit SET tahdet_bio3 = tahdet_bio3 + 1
      WHERE id = p_id RETURNING tahdet_bio3 INTO v;
  ELSE
    RAISE EXCEPTION 'Virheellinen kenttä: %', p_kentta;
  END IF;
  RETURN COALESCE(v, 0);
END;
$$;

-- RLS lisätty (puuttui alkuperäisestä koosteesta) -- yhdenmukainen muiden
-- DigiOpo-taulujen kanssa: selain ei koskaan pääse tauluun suoraan.
ALTER TABLE fake_insta_profiilit ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Ei julkista paasya fake_insta" ON fake_insta_profiilit;
CREATE POLICY "Ei julkista paasya fake_insta" ON fake_insta_profiilit
  FOR ALL USING (false);


-- ################################################################
-- ###  supabase_ammattiset.sql
-- ################################################################

-- ============================================================
--  AmmattiSet – Supabase-skeema
--  Aja tämä Supabase-projektin SQL Editor -välilehdellä.
-- ============================================================

-- ── 1. Tulostaulu ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ammattiset_tulostaulu (
  id         TEXT PRIMARY KEY,          -- localStorage player-id
  nimi       TEXT NOT NULL,
  koulu      TEXT NOT NULL DEFAULT '',
  luokka     TEXT NOT NULL DEFAULT '',
  pisteet    INTEGER NOT NULL DEFAULT 0,
  pvm        TEXT NOT NULL DEFAULT '',
  paivitetty BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_ammattiset_pisteet
  ON ammattiset_tulostaulu (pisteet DESC);

-- ── 2. Asetukset (opettajan sanaryhmät JSONB:nä) ─────────────
CREATE TABLE IF NOT EXISTS ammattiset_asetukset (
  avain      TEXT PRIMARY KEY,
  arvo       JSONB NOT NULL DEFAULT '[]'::jsonb,
  paivitetty TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 3. Atominen tulostallennus (vain jos uusi on parempi) ────
CREATE OR REPLACE FUNCTION ammattiset_tallenna_tulos(
  p_id        TEXT,
  p_nimi      TEXT,
  p_koulu     TEXT,
  p_luokka    TEXT,
  p_pisteet   INTEGER,
  p_pvm       TEXT,
  p_paivitetty BIGINT
) RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_nykyinen INTEGER;
BEGIN
  SELECT pisteet INTO v_nykyinen
  FROM ammattiset_tulostaulu WHERE id = p_id;

  -- Älä tallenna, jos aiempi tulos on yhtä hyvä tai parempi
  IF v_nykyinen IS NOT NULL AND v_nykyinen >= p_pisteet THEN
    RETURN 'aiempi_parempi';
  END IF;

  INSERT INTO ammattiset_tulostaulu
    (id, nimi, koulu, luokka, pisteet, pvm, paivitetty)
  VALUES
    (p_id, p_nimi, p_koulu, p_luokka, p_pisteet, p_pvm, p_paivitetty)
  ON CONFLICT (id) DO UPDATE SET
    nimi       = EXCLUDED.nimi,
    koulu      = EXCLUDED.koulu,
    luokka     = EXCLUDED.luokka,
    pisteet    = EXCLUDED.pisteet,
    pvm        = EXCLUDED.pvm,
    paivitetty = EXCLUDED.paivitetty;

  RETURN 'tallennettu';
END;
$$;

-- ── 4. Tyhjennä koko tulostaulu (opettaja) ───────────────────
CREATE OR REPLACE FUNCTION ammattiset_tyhjenna_tulostaulu()
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  DELETE FROM ammattiset_tulostaulu;
$$;

-- ─── Row Level Security ──────────────────────────────────────────────────────
-- ⚠️ TÄMÄ PUUTTUI 21.7.2026 ASTI.
--
-- Anon-avain on julkinen (js/lisenssiportti.js) – sen turvallisuus perustuu
-- YKSINOMAAN siihen, että jokaisessa taulussa on RLS päällä ja käytäntö
-- using(false). Ilman sitä kuka tahansa sivun lähdekoodin avaava saa avaimen
-- ja voi lukea taulun suoraan PostgREST-rajapinnan kautta.
--
-- Selain ei koskaan puhu suoraan Supabaseen: kaikki kulkee api/-funktioiden
-- kautta service_role-avaimella, joka ohittaa RLS:n. Sovellus ei siis kärsi
-- tästä mitenkään.

ALTER TABLE ammattiset_tulostaulu ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Ei julkista paasya ammattiset_tulostaulu" ON ammattiset_tulostaulu;
CREATE POLICY "Ei julkista paasya ammattiset_tulostaulu" ON ammattiset_tulostaulu FOR ALL USING (false);

ALTER TABLE ammattiset_asetukset ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Ei julkista paasya ammattiset_asetukset" ON ammattiset_asetukset;
CREATE POLICY "Ei julkista paasya ammattiset_asetukset" ON ammattiset_asetukset FOR ALL USING (false);


-- ################################################################
-- ###  supabase_tiedontemppeli.sql
-- ################################################################

-- ============================================================
--  Tiedon Temppeli – Supabase-skeema
--  Aja tämä Supabase-projektin SQL Editor -välilehdellä.
-- ============================================================

-- ── 1. Tulostaulu ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tiedontemppeli_tulostaulu (
  id         TEXT PRIMARY KEY,          -- localStorage player-id
  nimi       TEXT NOT NULL,
  koulu      TEXT NOT NULL DEFAULT '',
  luokka     TEXT NOT NULL DEFAULT '',
  pisteet    INTEGER NOT NULL DEFAULT 0,
  pvm        TEXT NOT NULL DEFAULT '',
  paivitetty BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_tiedontemppeli_pisteet
  ON tiedontemppeli_tulostaulu (pisteet DESC);

-- ── 2. Atominen tulostallennus (vain jos uusi on parempi) ────
CREATE OR REPLACE FUNCTION tiedontemppeli_tallenna_tulos(
  p_id         TEXT,
  p_nimi       TEXT,
  p_koulu      TEXT,
  p_luokka     TEXT,
  p_pisteet    INTEGER,
  p_pvm        TEXT,
  p_paivitetty BIGINT
) RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_nykyinen INTEGER;
BEGIN
  SELECT pisteet INTO v_nykyinen
  FROM tiedontemppeli_tulostaulu WHERE id = p_id;

  IF v_nykyinen IS NOT NULL AND v_nykyinen >= p_pisteet THEN
    RETURN 'aiempi_parempi';
  END IF;

  INSERT INTO tiedontemppeli_tulostaulu
    (id, nimi, koulu, luokka, pisteet, pvm, paivitetty)
  VALUES
    (p_id, p_nimi, p_koulu, p_luokka, p_pisteet, p_pvm, p_paivitetty)
  ON CONFLICT (id) DO UPDATE SET
    nimi       = EXCLUDED.nimi,
    koulu      = EXCLUDED.koulu,
    luokka     = EXCLUDED.luokka,
    pisteet    = EXCLUDED.pisteet,
    pvm        = EXCLUDED.pvm,
    paivitetty = EXCLUDED.paivitetty;

  RETURN 'tallennettu';
END;
$$;

-- ─── Row Level Security ──────────────────────────────────────────────────────
-- ⚠️ TÄMÄ PUUTTUI 21.7.2026 ASTI.
--
-- Anon-avain on julkinen (js/lisenssiportti.js) – sen turvallisuus perustuu
-- YKSINOMAAN siihen, että jokaisessa taulussa on RLS päällä ja käytäntö
-- using(false). Ilman sitä kuka tahansa sivun lähdekoodin avaava saa avaimen
-- ja voi lukea taulun suoraan PostgREST-rajapinnan kautta.
--
-- Selain ei koskaan puhu suoraan Supabaseen: kaikki kulkee api/-funktioiden
-- kautta service_role-avaimella, joka ohittaa RLS:n. Sovellus ei siis kärsi
-- tästä mitenkään.

ALTER TABLE tiedontemppeli_tulostaulu ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Ei julkista paasya tiedontemppeli_tulostaulu" ON tiedontemppeli_tulostaulu;
CREATE POLICY "Ei julkista paasya tiedontemppeli_tulostaulu" ON tiedontemppeli_tulostaulu FOR ALL USING (false);


-- ################################################################
-- ###  supabase_tykkays_dedupe.sql
-- ################################################################

-- DigiOpo – Tykkäys-/tähti-RPC:t: per-laite-esto (idempotentti)
-- Aja Supabase SQL Editorissa. Turvallinen ajaa uudelleen (idempotentti).
--
-- MIKSI: aiemmin jokainen tykkäys/tähti teki UPDATE ... + 1 yhteen riviin
-- ilman estoa → sama laite (tai API-kutsu suoraan) saattoi kasvattaa lukua
-- rajatta, ja samaan suosittuun riviin kohdistui turhia päällekkäisiä
-- kirjoituksia. Nyt kukin laite voi tykätä/tähdittää kohteen VAIN KERRAN:
-- laitetunniste kirjataan dedupe-tauluun, ja laskuria kasvatetaan vain jos
-- kirjaus oli uusi. Tämä poistaa spämmäyksen ja vähentää turhaa rivikuormaa.
--
-- TAAKSEPÄIN YHTEENSOPIVA: jos p_laite on NULL tai tyhjä (esim. vanha
-- välimuistissa oleva frontend joka ei vielä lähetä laitetunnistetta),
-- toimitaan kuten ennen (kasvatetaan aina). Näin mikään ei hajoa siirtymässä.

-- ─── 1) Dedupe-taulut (yksi rivi per kohde + laite) ───────────────────────────
CREATE TABLE IF NOT EXISTS mt_tykkays_laite (
  ratkaisu_id UUID NOT NULL REFERENCES maailma_ratkaisut(id) ON DELETE CASCADE,
  laite       TEXT NOT NULL,
  PRIMARY KEY (ratkaisu_id, laite)
);

CREATE TABLE IF NOT EXISTS fip_tykkays_laite (
  profiili_id UUID NOT NULL REFERENCES fake_insta_profiilit(id) ON DELETE CASCADE,
  laite       TEXT NOT NULL,
  PRIMARY KEY (profiili_id, laite)
);

CREATE TABLE IF NOT EXISTS fip_tahti_laite (
  profiili_id UUID NOT NULL REFERENCES fake_insta_profiilit(id) ON DELETE CASCADE,
  kentta      TEXT NOT NULL,
  laite       TEXT NOT NULL,
  PRIMARY KEY (profiili_id, kentta, laite)
);

-- Estä suora selainpääsy näihin (vain RPC:t koskevat niitä; service_key ja
-- SECURITY DEFINER -funktiot ohittavat RLS:n, anon/authenticated eivät näe).
ALTER TABLE mt_tykkays_laite  ENABLE ROW LEVEL SECURITY;
ALTER TABLE fip_tykkays_laite ENABLE ROW LEVEL SECURITY;
ALTER TABLE fip_tahti_laite   ENABLE ROW LEVEL SECURITY;

-- ─── 2) Maailma-taulun tykkäys: idempotentti per laite ────────────────────────
-- Poistetaan vanha yksiparametrinen versio ja korvataan kaksiparametrisella
-- (p_laite oletuksena NULL → legacy-käytös). DROP tarpeen, koska eri argumentti-
-- lista loisi muuten päällekkäisen funktion (PostgREST-ambiguiteetti).
DROP FUNCTION IF EXISTS mt_kasvata_tykkays(uuid);
CREATE OR REPLACE FUNCTION mt_kasvata_tykkays(p_id uuid, p_laite text DEFAULT NULL)
RETURNS int LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_uusi int; v_rows int;
BEGIN
  IF p_laite IS NOT NULL AND btrim(p_laite) <> '' THEN
    INSERT INTO mt_tykkays_laite (ratkaisu_id, laite)
    VALUES (p_id, btrim(p_laite))
    ON CONFLICT (ratkaisu_id, laite) DO NOTHING;
    GET DIAGNOSTICS v_rows = ROW_COUNT;
    IF v_rows > 0 THEN
      UPDATE maailma_ratkaisut SET tykkaukset = tykkaukset + 1 WHERE id = p_id;
    END IF;
  ELSE
    UPDATE maailma_ratkaisut SET tykkaukset = tykkaukset + 1 WHERE id = p_id;
  END IF;
  SELECT tykkaukset INTO v_uusi FROM maailma_ratkaisut WHERE id = p_id;
  RETURN COALESCE(v_uusi, 0);
END;
$$;

-- ─── 3) Fake Insta -tykkäys: idempotentti per laite ───────────────────────────
DROP FUNCTION IF EXISTS fip_kasvata_tykkays(uuid);
CREATE OR REPLACE FUNCTION fip_kasvata_tykkays(p_id uuid, p_laite text DEFAULT NULL)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v integer; v_rows int;
BEGIN
  IF p_laite IS NOT NULL AND btrim(p_laite) <> '' THEN
    INSERT INTO fip_tykkays_laite (profiili_id, laite)
    VALUES (p_id, btrim(p_laite))
    ON CONFLICT (profiili_id, laite) DO NOTHING;
    GET DIAGNOSTICS v_rows = ROW_COUNT;
    IF v_rows > 0 THEN
      UPDATE fake_insta_profiilit SET tykkayksiat = tykkayksiat + 1 WHERE id = p_id;
    END IF;
  ELSE
    UPDATE fake_insta_profiilit SET tykkayksiat = tykkayksiat + 1 WHERE id = p_id;
  END IF;
  SELECT tykkayksiat INTO v FROM fake_insta_profiilit WHERE id = p_id;
  RETURN COALESCE(v, 0);
END;
$$;

-- ─── 4) Fake Insta -vahvuustähti: idempotentti per laite ja kenttä ────────────
DROP FUNCTION IF EXISTS fip_kasvata_tahti(uuid, text);
CREATE OR REPLACE FUNCTION fip_kasvata_tahti(p_id uuid, p_kentta text, p_laite text DEFAULT NULL)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v integer; v_rows int;
BEGIN
  IF p_kentta NOT IN ('bio1', 'bio2', 'bio3') THEN
    RAISE EXCEPTION 'Virheellinen kenttä: %', p_kentta;
  END IF;

  -- Per-laite-esto: jos tällä laitteella on jo tähti tähän kenttään, ei kasvateta.
  IF p_laite IS NOT NULL AND btrim(p_laite) <> '' THEN
    INSERT INTO fip_tahti_laite (profiili_id, kentta, laite)
    VALUES (p_id, p_kentta, btrim(p_laite))
    ON CONFLICT (profiili_id, kentta, laite) DO NOTHING;
    GET DIAGNOSTICS v_rows = ROW_COUNT;
    IF v_rows = 0 THEN
      -- Jo tähditetty → palauta nykyinen arvo kasvattamatta.
      SELECT CASE p_kentta
               WHEN 'bio1' THEN tahdet_bio1
               WHEN 'bio2' THEN tahdet_bio2
               ELSE tahdet_bio3
             END
        INTO v FROM fake_insta_profiilit WHERE id = p_id;
      RETURN COALESCE(v, 0);
    END IF;
  END IF;

  -- Kasvata oikeaa kenttää (uusi tähti tai legacy-kutsu ilman laitetta).
  IF p_kentta = 'bio1' THEN
    UPDATE fake_insta_profiilit SET tahdet_bio1 = tahdet_bio1 + 1
      WHERE id = p_id RETURNING tahdet_bio1 INTO v;
  ELSIF p_kentta = 'bio2' THEN
    UPDATE fake_insta_profiilit SET tahdet_bio2 = tahdet_bio2 + 1
      WHERE id = p_id RETURNING tahdet_bio2 INTO v;
  ELSE
    UPDATE fake_insta_profiilit SET tahdet_bio3 = tahdet_bio3 + 1
      WHERE id = p_id RETURNING tahdet_bio3 INTO v;
  END IF;
  RETURN COALESCE(v, 0);
END;
$$;


-- ################################################################
-- ###  supabase_admin_virheet.sql
-- ################################################################

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


-- ################################################################
-- ###  supabase_admin_viestit.sql
-- ################################################################

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


-- ################################################################
-- ###  supabase_siivous_cron.sql
-- ################################################################

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

  -- ─── Päättyneiden asiakkuuksien tiedot (ei voimassa olevaa lisenssiä 6 kk) ──
  --
  -- Oppilastyöt on sidottu koulun NIMEEN, ei lisenssikoodiin, eikä
  -- viite-eheyttä ole. Kun asiakkuus päättyy, tiedot jäisivät kantaan
  -- pysyvästi ilman tätä.
  --
  -- ⚠️ EHTO KATSOO VOIMASSAOLOA, EI RIVIN OLEMASSAOLOA.
  -- Vanhentunut lisenssirivi JÄÄ tauluun myyntihistoriaksi. Jos ehto olisi
  -- pelkkä "lisenssiriviä ei ole", se ei täyttyisi koskaan eivätkä työt
  -- poistuisi – vain käsin poistetun lisenssin tapauksessa.
  --
  -- Kuuden kuukauden armonaika kattaa kaksi tilannetta:
  --   · koulu uusii myöhässä (budjettikausi, kesäloma)
  --   · lisenssi poistetaan ja luodaan uudelleen korjauksen vuoksi
  -- Ilman sitä korjausliike tai myöhästynyt uusinta pyyhkisi luokan työt.
  --
  -- Lisenssirivi itse säilytetään: se on myyntihistoriaa ja tarvitaan
  -- uusintamyyntiin. Jos haluat poistaa koulun kaiken heti, käytä
  -- poista_koulu()-funktiota (supabase_koulun_siivous.sql).

  -- Oppilastyöt
  delete from fake_insta_profiilit f
    where not exists (
      select 1 from lisenssit l
       where l.koulu = f.koulu
         and l.aktiivinen
         and l.voimassa_asti > current_date - interval '6 months'
    );

  delete from maailma_ratkaisut m
    where not exists (
      select 1 from lisenssit l
       where l.koulu = m.koulu
         and l.aktiivinen
         and l.voimassa_asti > current_date - interval '6 months'
    );

  -- Opetusryhmät (cascade vie mukanaan järjestykset ja lukuvuoden aikataulun).
  --
  -- ⚠️ EHTO KATSOO KOULUA, EI KOODIA.
  -- Ryhmä on sidottu lisenssin KOODIIN (koulukoodi-kenttä), mutta koululisenssin
  -- uusinta luo aina UUDEN rivin ja UUDEN koodin – vanhaa ei päivitetä. Jos ehto
  -- katsoisi pelkkää koodia, uusineen koulun ryhmät poistuisivat 6 kk uusimisen
  -- jälkeen, koska ne osoittavat vanhaan koodiin. Opettaja menettäisi ryhmänsä,
  -- järjestyksensä ja lukuvuosikalenterinsa vaikka koulu on maksava asiakas.
  --
  -- Siksi koodi ratkaistaan ensin kouluksi, ja voimassaolo tarkistetaan koulun
  -- KAIKISTA lisensseistä.
  --
  -- Ryhmät joilla koulukoodi on tyhjä (kenttä on vapaaehtoinen) eivät kuulu
  -- tähän – ne poistuvat 24 kk koskemattomuussäännöllä yllä.
  delete from opetusryhmat o
    where o.koulukoodi is not null
      and exists (
        select 1 from lisenssit l where l.koodi = o.koulukoodi
      )
      and not exists (
        select 1
          from lisenssit vanha
          join lisenssit voimassa on voimassa.koulu = vanha.koulu
         where vanha.koodi = o.koulukoodi
           and voimassa.aktiivinen
           and voimassa.voimassa_asti > current_date - interval '6 months'
      );

  -- Laiteseuranta: päättyneen asiakkuuden laitehistoria ei ole enää tarpeen
  -- eikä sitä pidä säilyttää pidempään kuin on syytä.
  delete from lisenssi_laitteet d
    where not exists (
      select 1 from lisenssit l
       where l.koodi = d.koodi
         and l.aktiivinen
         and l.voimassa_asti > current_date - interval '6 months'
    );
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


-- ################################################################
-- ###  supabase_laskutus.sql
-- ################################################################

-- DigiOpo – Laskutuksen seuranta ja maksun varmistus
-- Aja Supabase SQL Editorissa. Turvallinen ajaa uudelleen (idempotentti).
--
-- TAUSTA: tilauslomake loi lisenssin täydellä voimassaololla heti lomakkeen
-- lähetyksestä, ennen kuin laskua oli maksettu. Kuka tahansa saattoi täyttää
-- lomakkeen tekaistuilla tiedoilla ja saada toimivan koulukoodin vuodeksi.
--
-- RATKAISU: tilaus luo lisenssin lyhyellä alkuvoimassaololla (30 pv). Kun
-- maksu saapuu, voimassaolo jatketaan ostettuun kauteen hallintapaneelista.
-- Jos laskua ei makseta, pääsy päättyy itsestään – oletusarvo on turvallinen
-- eikä vaadi kenenkään muistavan tehdä mitään.

-- ─── Laskutustiedot ──────────────────────────────────────────────────────────

-- Laskunumero: generoitiin aiemmin, lähetettiin sähköpostissa ja unohtui.
-- Ilman tätä saapunutta maksua ei voi yhdistää lisenssiin muuten kuin
-- sähköpostiarkistosta.
alter table lisenssit add column if not exists laskunumero text;
alter table lisenssit add column if not exists lasku_pvm   date;

-- Ostettu kausi: mihin asti voimassaolo jatketaan, kun lasku on maksettu.
-- Lasketaan tilaushetkellä (tilauspäivä + 1 tai 3 vuotta), jotta asiakas saa
-- sen mitä osti eikä maksun viivästyminen lyhennä hänen kauttaan.
alter table lisenssit add column if not exists taysi_voimassa_asti date;

-- Maksun tila. Käsin luoduilla lisensseillä (kokeilut, pilotit) tämä on true
-- heti, koska niistä ei ole laskua.
alter table lisenssit add column if not exists maksettu boolean not null default true;

-- ─── Laskunumeroiden juokseva varaus ─────────────────────────────────────────
-- api/tilaus.js kutsuu seuraava_laskunumero()-funktiota jokaiselle laskulle.
-- Numero on muotoa VVVVNNNN (vuosi + 4-numeroinen juokseva) ja varataan
-- atomisesti, jotta kaksi samanaikaista tilausta eivät saa samaa numeroa.
--
-- HUOM: sekä tämä taulu että funktio puuttuivat aiemmin kaikista SQL-tiedostoista
-- ja elivät vain tuotannossa (skeeman ajautuma, havaittu ja korjattu 2026-07-27
-- Supabase-siirron yhteydessä). Ilman näitä kantaa ei voinut rakentaa tyhjästä.

create table if not exists laskunumerot (
  vuosi      integer primary key,
  seuraava   integer not null default 1,
  paivitetty timestamptz not null default now()
);

alter table laskunumerot enable row level security;

-- Ei suoraa pääsyä: vain palvelin (service_role) käyttää funktion kautta,
-- joka ohittaa RLS:n. Sama using(false)-malli kuin muilla tauluilla.
drop policy if exists laskunumerot_ei_paasya on laskunumerot;
create policy laskunumerot_ei_paasya on laskunumerot using (false);

-- Varaa ja palauta seuraava laskunumero atomisesti. Palauttaa 'VVVVNNNN'.
create or replace function seuraava_laskunumero() returns text
    language plpgsql
    as $$
declare
  v int := extract(year from current_date)::int;
  n int;
begin
  loop
    update laskunumerot
       set seuraava = seuraava + 1,
           paivitetty = now()
     where vuosi = v
    returning seuraava - 1 into n;

    exit when found;

    -- Vuoden ensimmäinen lasku: rivi puuttuu vielä.
    begin
      insert into laskunumerot (vuosi, seuraava) values (v, 2);
      n := 1;
      exit;
    exception when unique_violation then
      -- Toinen pyyntö ehti luoda rivin. Kierretään uudelleen, jolloin
      -- UPDATE-haara hoitaa varauksen.
      null;
    end;
  end loop;

  -- Muoto on kiinteä 4 numeroa, koska api/tilaus.js pilkkoo laskunumeron
  -- näyttöä varten kohdasta 4 (slice(0,4) + "-" + slice(4)). Jos numeroita
  -- tulisi viisi, näyttömuoto ja viitenumero menisivät hiljaisesti rikki.
  -- Mieluummin kaatuu äänekkäästi.
  if n > 9999 then
    raise exception
      'Laskunumerot loppuivat vuodelta % (max 9999). Laajenna muotoa ennen jatkoa.', v;
  end if;

  return v::text || lpad(n::text, 4, '0');
end;
$$;

-- ─── Indeksi perintätyöjonoa varten ──────────────────────────────────────────
create index if not exists lisenssit_maksamattomat_idx
  on lisenssit (maksettu, voimassa_asti)
  where maksettu = false;

-- ─── Näkymä: maksamattomat tilaukset ─────────────────────────────────────────
-- Hallintapaneelin "pian vanhenevat" -lista näyttää nämä automaattisesti,
-- koska alkuvoimassaolo on 30 päivää. Tämä näkymä on tarkempaa tarkastelua
-- varten: paljonko aikaa on jäljellä ennen kuin pääsy katkeaa.
create or replace view lisenssit_maksamattomat as
select
  koodi,
  koulu,
  yhteyshenkilö,
  email,
  tyyppi,
  laskunumero,
  lasku_pvm,
  voimassa_asti                                  as paasy_paattyy,
  taysi_voimassa_asti                            as jatketaan_asti,
  (voimassa_asti - current_date)                 as paivia_jaljella,
  (current_date - lasku_pvm)                     as paivia_laskusta
from lisenssit
where maksettu = false
  and aktiivinen = true
order by voimassa_asti asc;

-- ─── Vanhat rivit ────────────────────────────────────────────────────────────
-- Ennen tätä muutosta luodut lisenssit merkitään maksetuiksi, koska niiden
-- voimassaolo on jo asetettu täydeksi eikä laskutustietoa ole tallessa.
update lisenssit
   set maksettu = true
 where maksettu is null;

-- ─── Tarkistus ───────────────────────────────────────────────────────────────
-- select * from lisenssit_maksamattomat;


-- ################################################################
-- ###  supabase_lisenssi_koulukoodi.sql
-- ################################################################

-- DigiOpo – Opettajalisenssin eksplisiittinen kytkös koulukoodiin (Vaihe 3)
-- Aja Supabase SQL Editorissa. Idempotentti (turvallinen ajaa uudelleen).
--
-- IDEA: ryhmä tarvitsee koulukoodin (ryhmä → koulukoodi → koululisenssi). Se
-- päätellään nyt opettajan lisenssistä palvelimella (api/jarjestys.js luo_oma).
-- Luotettavin lähde on TALLENNETTU kytkös: opettajalisenssin oma koulukoodi-
-- kenttä, joka täytetään tilaushetkellä (digiopo-home/api/tilaus.js) tai käsin.

-- 1) Uusi sarake: opettajalisenssin koulukoodi
alter table lisenssit add column if not exists koulukoodi text;

-- 2) Takautuva täydennys: aseta koulukoodi niille opettajalisensseille, joiden
--    koulu-nimi täsmää aktiiviseen koululisenssiin. (Nyt kannassa ei ole
--    duplikaattikoulunimiä; jos niitä joskus tulee, tämä valitsee jonkin niistä.)
update lisenssit o
set koulukoodi = k.koodi
from lisenssit k
where o.tyyppi = 'opettaja'
  and o.koulukoodi is null
  and k.tyyppi in ('vuosi', 'kunta', 'testi')
  and k.aktiivinen
  and k.koulu = o.koulu;

-- 3) Tarkistus: ketkä opettajat jäivät ilman kytköstä (orvot) — näille luo_oma
--    palauttaa selkeän virheen eikä luo orpo-ryhmää.
-- select email, koulu from lisenssit where tyyppi = 'opettaja' and koulukoodi is null;


-- ################################################################
-- ###  supabase_ai_vinkit.sql
-- ################################################################

-- DigiOpo: Luokan AI-taulu – oppilaiden jakamat vinkit tekoälyn käytöstä
-- Aja tämä Supabase SQL Editorissa. Turvallinen ajaa uudelleen (idempotentti).
--
-- Malli: sama kuin maailma_ratkaisut (koulu-kohtainen, opettaja hyväksyy).
-- Ero: yksilövinkki (nimimerkki + aihe + vinkki), ei ryhmää.

-- ─── Taulu ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_vinkit (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  koulu       TEXT        NOT NULL,
  nimimerkki  TEXT        NOT NULL DEFAULT '' CHECK (char_length(nimimerkki) <= 40),
  aihe        TEXT        NOT NULL CHECK (aihe IN ('Opiskelu', 'Harrastus')),
  vinkki      TEXT        NOT NULL CHECK (char_length(vinkki) BETWEEN 1 AND 200),
  tila        TEXT        NOT NULL DEFAULT 'odottaa'
                          CHECK (tila IN ('odottaa', 'hyvaksytty')),
  tykkaukset  INT         NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Indeksit ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS ai_vinkit_koulu_idx ON ai_vinkit(koulu);
CREATE INDEX IF NOT EXISTS ai_vinkit_tila_idx  ON ai_vinkit(tila);

-- ─── RLS ─────────────────────────────────────────────────────────────────────
-- API käyttää service_keytä (ohittaa RLS). Selain ei koskaan koske tauluun suoraan.
ALTER TABLE ai_vinkit ENABLE ROW LEVEL SECURITY;

-- ─── Tykkäys: per-laite-esto (idempotentti) ──────────────────────────────────
-- Sama malli kuin supabase_tykkays_dedupe.sql: laitetunniste kirjataan
-- dedupe-tauluun, ja laskuria kasvatetaan vain jos kirjaus oli uusi.
CREATE TABLE IF NOT EXISTS av_tykkays_laite (
  vinkki_id UUID NOT NULL REFERENCES ai_vinkit(id) ON DELETE CASCADE,
  laite     TEXT NOT NULL,
  PRIMARY KEY (vinkki_id, laite)
);
ALTER TABLE av_tykkays_laite ENABLE ROW LEVEL SECURITY;

DROP FUNCTION IF EXISTS av_kasvata_tykkays(uuid);
CREATE OR REPLACE FUNCTION av_kasvata_tykkays(p_id uuid, p_laite text DEFAULT NULL)
RETURNS int LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_uusi int; v_rows int;
BEGIN
  IF p_laite IS NOT NULL AND btrim(p_laite) <> '' THEN
    INSERT INTO av_tykkays_laite (vinkki_id, laite)
    VALUES (p_id, btrim(p_laite))
    ON CONFLICT (vinkki_id, laite) DO NOTHING;
    GET DIAGNOSTICS v_rows = ROW_COUNT;
    IF v_rows > 0 THEN
      UPDATE ai_vinkit SET tykkaukset = tykkaukset + 1 WHERE id = p_id;
    END IF;
  ELSE
    UPDATE ai_vinkit SET tykkaukset = tykkaukset + 1 WHERE id = p_id;
  END IF;
  SELECT tykkaukset INTO v_uusi FROM ai_vinkit WHERE id = p_id;
  RETURN COALESCE(v_uusi, 0);
END;
$$;


-- ################################################################
-- ###  supabase_peli_tulokset.sql
-- ################################################################

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


-- ################################################################
-- ###  supabase_koulun_siivous.sql
-- ################################################################

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

