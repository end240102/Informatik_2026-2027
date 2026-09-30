-- loesung.sql — 3NF-Zerlegung der Hausübungsaufgaben (UE 2026-10-06)
-- Führt die normalisierten Tabellenstrukturen ein und befüllt sie mit Testdaten.

-- ============================================================================
-- Aufgabe 1: Zerlegung von bestellung_denorm in 3NF
-- Kette im Original: bestell_nr -> plz -> ort (Ort transitiv abhängig)
-- ============================================================================

DROP TABLE IF EXISTS bestellung;
DROP TABLE IF EXISTS plz;

CREATE TABLE plz (
  plz TEXT PRIMARY KEY,
  ort TEXT NOT NULL
);

CREATE TABLE bestellung (
  bestell_nr INTEGER PRIMARY KEY,
  kunde      TEXT NOT NULL,
  plz        TEXT NOT NULL REFERENCES plz(plz)
);

INSERT INTO plz (plz, ort) VALUES
  ('1020', 'Wien'),
  ('4020', 'Linz'),
  ('8010', 'Graz');

INSERT INTO bestellung (bestell_nr, kunde, plz) VALUES
  (101, 'Auer',  '1020'),
  (102, 'Beck',  '1020'),
  (103, 'Cevik', '4020');


-- ============================================================================
-- Aufgabe 2, Wahl 1 (Quiz 2): Schueler (Klasse -> Klassensprecher transitiv)
-- Kette im Original: matr_nr -> klasse -> klassensprecher
-- ============================================================================

DROP TABLE IF EXISTS schueler;
DROP TABLE IF EXISTS klasse;

CREATE TABLE klasse (
  klasse          TEXT PRIMARY KEY,
  klassensprecher TEXT NOT NULL
);

CREATE TABLE schueler (
  matr_nr INTEGER PRIMARY KEY,
  name    TEXT NOT NULL,
  klasse  TEXT NOT NULL REFERENCES klasse(klasse)
);

INSERT INTO klasse (klasse, klassensprecher) VALUES
  ('3AHWII', 'Beck'),
  ('3BHWII', 'Demir'),
  ('3CHWII', 'Gruber');

INSERT INTO schueler (matr_nr, name, klasse) VALUES
  (1, 'Auer',  '3AHWII'),
  (2, 'Beck',  '3AHWII'),
  (3, 'Cevik', '3BHWII');


-- ============================================================================
-- Aufgabe 2, Wahl 2 (Quiz 5): Konto / SWP-Domäne (BLZ -> Bankname transitiv)
-- Kette im Original: iban -> blz -> bankname
-- ============================================================================

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

INSERT INTO bank (blz, bankname) VALUES
  ('1000', 'Erste Bank'),
  ('2000', 'Bank Austria'),
  ('3000', 'Raiffeisen');

INSERT INTO konto (iban, inhaber, blz) VALUES
  ('AT01', 'Auer',  '1000'),
  ('AT02', 'Beck',  '1000'),
  ('AT03', 'Cevik', '2000');
