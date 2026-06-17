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
