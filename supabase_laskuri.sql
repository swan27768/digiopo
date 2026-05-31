-- DigiOpo – Käyttölaskurin SQL-funktio
-- Aja Supabase SQL Editorissa supabase_schema.sql:n jälkeen

-- Kasvata laskuria atomisesti (UPSERT)
CREATE OR REPLACE FUNCTION kasvata_laskuri(p_sivu text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO page_views (sivu, paiva, maara)
  VALUES (p_sivu, current_date, 1)
  ON CONFLICT (sivu, paiva)
  DO UPDATE SET maara = page_views.maara + 1;
END;
$$;

-- Hyödyllisiä näkymiä Supabasen Table Editorissa

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
