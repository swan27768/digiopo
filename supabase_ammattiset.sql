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
