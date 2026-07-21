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
