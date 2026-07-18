-- DigiOpo – Poista PIN-logiikka: pudota opetusryhmat.avain_hash
-- Aja Supabase SQL Editorissa. Turvallinen ajaa uudelleen (idempotentti).
--
-- TAUSTA: ryhmiä hallitaan nyt vain opettajan tilillä (omistaja_email).
-- PIN-pohjainen valtuutus (avain_hash) on poistettu palvelin- ja frontend-
-- koodista, joten sarake pudotetaan.
--
-- ⚠️ AJOJÄRJESTYS: julkaise UUSI KOODI ENSIN (se ei enää viittaa avain_hash:iin),
-- ja aja tämä VASTA sen jälkeen. Jos pudotat sarakkeen ennen deployta, vanha
-- käynnissä oleva koodi yrittää yhä lukea avain_hash-saraketta → virheitä.
-- Uuden koodin julkaisun jälkeen ainoa lyhyt katve on ryhmän LUONTI (avain_hash
-- on vielä NOT NULL kunnes tämä ajetaan) — aja tämä heti deployn perään.

ALTER TABLE opetusryhmat DROP COLUMN IF EXISTS avain_hash;
