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
