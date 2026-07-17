-- DigiOpo – Opettajatili, Vaihe 1: ryhmän omistajuus
-- Aja tämä Supabase SQL Editorissa.
--
-- Lisää opetusryhmään omistajan sähköposti. Kun opettaja luo ryhmän tililleen
-- kirjautuneena (myöhemmät vaiheet), tähän leimataan hänen sähköpostinsa, ja
-- opettaja voi hallita vain omia ryhmiään (omistaja_email = kirjautunut email).
--
-- Turvallinen ajaa olemassa olevaan tauluun: sarake on nullable, joten vanhat
-- (PIN-pohjaiset) ryhmät jäävät ilman omistajaa eivätkä riko mitään. Ne voidaan
-- ottaa haltuun myöhemmin (koodi + PIN).

alter table opetusryhmat add column if not exists omistaja_email text;

create index if not exists opetusryhmat_omistaja_idx
  on opetusryhmat (omistaja_email);

comment on column opetusryhmat.omistaja_email is
  'Ryhmän omistavan opettajan sähköposti (Supabase Auth). NULL = vanha PIN-pohjainen ryhmä, ei vielä otettu haltuun.';
