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
