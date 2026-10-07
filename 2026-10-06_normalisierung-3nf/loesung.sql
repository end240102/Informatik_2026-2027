-- loesung.sql — Normalisierung 1NF–3NF (KM5-02 / 3AHWII)
-- Autor: Alexander Endl
-- Fach: INFI · Prof. Georg Ernst Graf

-- ============================================================================
-- 1. Zerlegung von bestellung_denorm bis 3NF
-- ============================================================================
-- Ausgangsrelation: bestellung_denorm(bestell_nr [PK], kunde, plz, ort)
-- Vorhersage: 'ort' verletzt die 3NF. 
-- 1NF hält (atomare Werte).
-- 2NF hält trivial (Einzelschlüssel bestell_nr -> keine partiellen Abhängigkeiten).
-- 3NF verletzt: bestell_nr -> plz -> ort (transitive Abhängigkeit über Nichtschlüssel plz).

DROP TABLE IF EXISTS bestellung;
DROP TABLE IF EXISTS plz;

-- 3NF-Fix: Auslagerung der Relation plz
CREATE TABLE plz (
  plz TEXT PRIMARY KEY,
  ort TEXT NOT NULL
);

CREATE TABLE bestellung (
  bestell_nr INTEGER PRIMARY KEY,
  kunde      TEXT NOT NULL,
  plz        TEXT NOT NULL REFERENCES plz(plz)
);

-- Testdaten (je 3 Zeilen)
INSERT INTO plz (plz, ort) VALUES
  ('1020', 'Wien'),
  ('4020', 'Linz'),
  ('8010', 'Graz');

INSERT INTO bestellung (bestell_nr, kunde, plz) VALUES
  (101, 'Auer',  '1020'),
  (102, 'Beck',  '1020'),
  (103, 'Cevik', '4020');

-- Interleaving-Abfrage: Rekonstruktion der denormalisierten Sicht via JOIN
SELECT 
  b.bestell_nr,
  b.kunde,
  b.plz,
  p.ort
FROM bestellung b
JOIN plz p ON b.plz = p.plz;


-- ============================================================================
-- 2. Quiz-Tabelle 1 (2NF-Zerlegung): Song in Playlists (Quiz 7)
-- ============================================================================
-- Ausgangsrelation: song_playlist_denorm(song_id, playlist_id, song_titel)
-- PK: (song_id, playlist_id)
-- 2NF verletzt, da song_titel nur von einem Teil des Schlüssels abhängt:
--   song_id -> song_titel (partielle funktionale Abhängigkeit)
-- 2NF-Fix: Auslagerung in Entität 'song', Zwischentabelle hält nur Fremdschlüssel.

DROP TABLE IF EXISTS song_playlist;
DROP TABLE IF EXISTS song;
DROP TABLE IF EXISTS playlist;

CREATE TABLE song (
  song_id   INTEGER PRIMARY KEY,
  titel     TEXT NOT NULL,
  dauer_sek INTEGER NOT NULL
);

CREATE TABLE playlist (
  playlist_id INTEGER PRIMARY KEY,
  name        TEXT NOT NULL
);

CREATE TABLE song_playlist (
  song_id     INTEGER NOT NULL REFERENCES song(song_id) ON DELETE CASCADE,
  playlist_id INTEGER NOT NULL REFERENCES playlist(playlist_id) ON DELETE CASCADE,
  PRIMARY KEY (song_id, playlist_id)
);

-- Testdaten (je 3 Zeilen)
INSERT INTO song (song_id, titel, dauer_sek) VALUES
  (1, 'Silent Lines', 215),
  (2, 'Night Ferry',  240),
  (3, 'Dust Choir',   198);

INSERT INTO playlist (playlist_id, name) VALUES
  (10, 'Fokus'),
  (20, 'Nachtfahrt'),
  (30, 'Workout');

INSERT INTO song_playlist (song_id, playlist_id) VALUES
  (1, 10),
  (1, 20),
  (2, 20);

-- Rekonstruktion via JOIN:
SELECT 
  sp.song_id,
  sp.playlist_id,
  s.titel AS song_titel,
  p.name AS playlist_name
FROM song_playlist sp
JOIN song s ON sp.song_id = s.song_id
JOIN playlist p ON sp.playlist_id = p.playlist_id;


-- ============================================================================
-- 3. Quiz-Tabelle 2 (3NF-Zerlegung): Bankkonto aus SWP (Quiz 13)
-- ============================================================================
-- Ausgangsrelation: konto_denorm(iban [PK], inhaber, blz, bankname)
-- 1NF und 2NF halten (atomare Werte, Einzelschlüssel iban).
-- 3NF verletzt durch transitive Kette:
--   iban -> blz -> bankname (bankname hängt an Nichtschlüssel blz).
-- 3NF-Fix: Auslagerung von 'bank(blz [PK], bankname)'.

DROP TABLE IF EXISTS konto;
DROP TABLE IF EXISTS bank;

CREATE TABLE bank (
  blz      TEXT PRIMARY KEY,
  bankname TEXT NOT NULL
);

CREATE TABLE konto (
  iban    TEXT PRIMARY KEY,
  inhaber TEXT NOT NULL,
  blz     TEXT NOT NULL REFERENCES bank(blz)
);

-- Testdaten (je 3 Zeilen)
INSERT INTO bank (blz, bankname) VALUES
  ('1000', 'Erste Bank'),
  ('2000', 'Bank Austria'),
  ('3000', 'Raiffeisen');

INSERT INTO konto (iban, inhaber, blz) VALUES
  ('AT01', 'Auer',  '1000'),
  ('AT02', 'Beck',  '1000'),
  ('AT03', 'Cevik', '2000');

-- Rekonstruktion via JOIN:
SELECT 
  k.iban,
  k.inhaber,
  k.blz,
  b.bankname
FROM konto k
JOIN bank b ON k.blz = b.blz;


-- ============================================================================
-- 4. Bonus (1NF-Zerlegung): Kunde mit Hobbys (Quiz 2)
-- ============================================================================
-- Ausgangsrelation: kunde_hobby_denorm(kunde_id [PK], name, hobbys)
-- 'Lesen, Schwimmen' in einer Zelle verletzt 1NF (nicht atomar).
-- 1NF-Fix: Kindtabelle mit einer Zeile pro Hobby.

DROP TABLE IF EXISTS hobby;
DROP TABLE IF EXISTS kunde;

CREATE TABLE kunde (
  kunde_id INTEGER PRIMARY KEY,
  name     TEXT NOT NULL
);

CREATE TABLE hobby (
  kunde_id INTEGER NOT NULL REFERENCES kunde(kunde_id) ON DELETE CASCADE,
  hobby    TEXT NOT NULL,
  PRIMARY KEY (kunde_id, hobby)
);

INSERT INTO kunde (kunde_id, name) VALUES
  (1, 'Auer'),
  (2, 'Beck'),
  (3, 'Cevik');

INSERT INTO hobby (kunde_id, hobby) VALUES
  (1, 'Lesen'),
  (1, 'Schwimmen'),
  (2, 'Schach');
