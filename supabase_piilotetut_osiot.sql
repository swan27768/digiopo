-- DigiOpo – Osioiden piilotus oppilailta
-- Aja tämä Supabase SQL Editorissa ENNEN kuin julkaiset "Piilota / Tuo näkyviin" -toiminnon.
-- Turvallinen ajaa uudelleen (if not exists), eikä muuta olemassa olevia rivejä.
--
-- Lisää jarjestykset-tauluun listan oppilailta piilotetuista osio-id:istä
-- (esim. ["tet", "klinikka"]). Tyhjä lista = kaikki osiot näkyvät.
-- Piilotettu osio ei näy oppilaalle lainkaan; lukittu (lukitut) näkyy otsikkona + viestinä.

alter table jarjestykset
  add column if not exists piilotetut jsonb not null default '[]'::jsonb;

-- RLS on jo päällä (supabase_jarjestys.sql): selain ei pääse tauluun suoraan,
-- kaikki kulkee api/jarjestys.js:n kautta service_role-avaimella.
