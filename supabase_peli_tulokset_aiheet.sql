-- Duuniskaba – aihekohtainen yhteenveto tulostauluun
-- Aja Supabase SQL Editorissa kerran. Peli ja API toimivat myös ilman tätä,
-- mutta luokan aihe-yhteenveto näkyy tulostaulussa vasta kun sarake on olemassa.
--
-- Muoto: {"tyonhaku":[oikein,yhteensä], "raha":[3,4], ...}
alter table peli_tulokset add column if not exists aiheet jsonb;
