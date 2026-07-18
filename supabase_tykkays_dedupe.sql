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
