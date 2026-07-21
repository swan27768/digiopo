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

ALTER TABLE fake_insta_profiilit ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Ei julkista paasya fake_insta_profiilit" ON fake_insta_profiilit;
CREATE POLICY "Ei julkista paasya fake_insta_profiilit" ON fake_insta_profiilit FOR ALL USING (false);
