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
