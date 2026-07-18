-- ============================================================
--  ⚠️  HISTORIALLINEN KOOSTETIEDOSTO – ÄLÄ KÄYTÄ UUDESSA PYSTYTYKSESSÄ
-- ============================================================
--
--  Tämä on 29.6.2026 tehty kertaluonteinen kooste, jolla useampi
--  muutos ajettiin tuotantoon yhdellä kertaa. Sisältö on TÄYSIN
--  päällekkäinen alla lueteltujen modulaaristen tiedostojen kanssa
--  (tarkistettu: yhtään riviä ei ole vain tässä tiedostossa).
--
--  KÄYTÄ NÄITÄ – näissä on sama sisältö, mutta ne on jaettu
--  ominaisuuksittain ja ajojärjestys on hallittu:
--
--    supabase_jarjestys.sql            (opetusryhmat, jarjestykset)
--    supabase_lisenssi_kirjaukset.sql  (lisenssi_kirjaukset)
--    supabase_ammattiset.sql           (ammattiset_*)
--    supabase_fake_insta.sql           (fake_insta_profiilit)
--    supabase_tiedontemppeli.sql       (tiedontemppeli_tulostaulu)
--
--  Ajojärjestys kokonaisuudessaan: katso docs/03-tietokanta.md
--
--  Tiedosto on säilytetty vain historiatietona siitä, mitä
--  tuotantokantaan on ajettu ja milloin. Sen voi poistaa, kun
--  docs/03-tietokanta.md on valmis.
--
-- ============================================================
--  Alkuperäinen otsikko:
--  DigiOpo – KAIKKI uudet skeemat (yhdistetty 29.6.2026)
--  Kaikki on CREATE IF NOT EXISTS / OR REPLACE -tyyliä:
--  ei tuhoa olemassa olevaa dataa, turvallinen ajaa.
-- ============================================================


-- ############################################################
-- ###  supabase_tiedontemppeli.sql
-- ############################################################

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


-- ############################################################
-- ###  supabase_ammattiset.sql
-- ############################################################

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


-- ############################################################
-- ###  supabase_fake_insta.sql
-- ############################################################

-- DigiOpo – Fake Insta -taulurakenne
-- Aja Supabase SQL Editorissa:
--   supabase.com → SQL Editor → New query → liitä tämä → Run
--
-- Vaatimukset:
--   • gen_random_uuid() -laajennus (löytyy Supabasesta valmiina)
--   • Olemassa oleva lisenssit-taulu (DigiOpo-perustaulu)

-- ─── Päätaulu ────────────────────────────────────────────────────────────────
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

-- ─── Indeksit ─────────────────────────────────────────────────────────────────
-- Nopea galleriahaku koulun ja tilan mukaan
CREATE INDEX IF NOT EXISTS idx_fip_koulu_tila
  ON fake_insta_profiilit (koulu, tila);

-- ─── Atominen tykkäysinkremetti ───────────────────────────────────────────────
-- Estää kilpailutilanteen kun monta oppilasta tykkää samaan aikaan
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

-- ─── Atominen vahvuustähti-inkremetti ─────────────────────────────────────────
-- p_kentta: 'bio1' | 'bio2' | 'bio3'
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


-- ############################################################
-- ###  supabase_jarjestys.sql
-- ############################################################

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


-- ############################################################
-- ###  supabase_lisenssi_kirjaukset.sql
-- ############################################################

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

