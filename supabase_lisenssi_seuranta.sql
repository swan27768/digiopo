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
