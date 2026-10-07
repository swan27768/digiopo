-- DigiOpo: Tiedon temppelin tulostaulun tyhjennys
-- ─────────────────────────────────────────────────────────────
-- Miksi: tulostaulussa on vanhoja rivejä, joissa on oppilaiden oikeita nimiä ja luokkatietoja.
-- Julkinen tulostaulu näyttää jatkossa vain nimimerkin ja koulun, eikä luokkaa enää kerätä.
--
-- AJA: Supabase → SQL Editor. POISTO ON PYSYVÄ.
-- Huom: tämä EI muuta tiedostoja eikä käyttöönottoa, vain taulun sisällön.

-- 1) Tarkista ensin, kuinka monta riviä poistetaan (vapaaehtoinen)
select count(*) as rivit from tiedontemppeli_tulostaulu;

-- 2) (Vapaaehtoinen) Ota varmuuskopio: Table Editor → tiedontemppeli_tulostaulu → Export CSV

-- 3) Tyhjennä taulu
delete from tiedontemppeli_tulostaulu;

-- 4) Varmista
select count(*) as rivit_jaljella from tiedontemppeli_tulostaulu;   -- pitäisi olla 0
