-- queries.sql — 5 Auffrischungs-Queries aus Lesson 0001 §4 (UE 2026-09-29)
-- Datenbank: Mini-Musik-DB (seed-musik-mini.sql)

-- ============================================================================
-- 1. Top-5-Künstler nach Track-Anzahl (JOIN + GROUP BY + ORDER BY DESC LIMIT 5)
-- Beantwortet: Welche 5 Interpreten haben die meisten Songs in der Datenbank
-- veröffentlicht, absteigend sortiert nach Titel-Anzahl?
-- ============================================================================
SELECT k.name, COUNT(*) AS tracks
FROM kuenstler k
JOIN song s ON s.kuenstler_id = k.id
GROUP BY k.id
ORDER BY tracks DESC
LIMIT 5;

-- ============================================================================
-- 2. Künstlerpaare desselben Labels (Self-JOIN mit x.id < y.id)
-- Beantwortet: Welche Künstler stehen beim selben Plattenlabel unter Vertrag,
-- ohne dass Selbstbeziehungen (A=A) oder gespiegelte Doppelpaare (A-B und B-A) auftauchen?
-- ============================================================================
SELECT x.name AS kuenstler_a, y.name AS kuenstler_b, l.name AS label
FROM kuenstler x
JOIN kuenstler y ON x.label_id = y.label_id AND x.id < y.id
JOIN label l ON l.id = x.label_id;

-- ============================================================================
-- 3. Labels mit mehr als x Künstlern (HAVING)
-- Beantwortet: Welche Plattenlabels betreuen mehr als eine bestimmte Anzahl an
-- Künstlern (z. B. > 5 in großen Beständen bzw. > 1 im vorliegenden Mini-Seed)?
-- HAVING filtert hier erst die fertig gruppierten Datensätze nach dem Aggregat.
-- ============================================================================
SELECT l.name, COUNT(*) AS kuenstler_anzahl
FROM kuenstler k
JOIN label l ON l.id = k.label_id
GROUP BY l.id
HAVING COUNT(*) > 1;

-- ============================================================================
-- 4. COUNT(*) vs. COUNT(label_id) auf derselben Tabelle
-- Beantwortet: Wie viele Künstler sind insgesamt erfasst und wie viele davon
-- besitzen ein zugewiesenes Label?
-- Differenz: COUNT(*) zählt schlicht jede Zeile der Tabelle, während COUNT(spalte)
-- alle NULL-Werte überspringt — der Independent-Künstler "Frei" wird daher nur
-- von COUNT(*) erfasst.
-- ============================================================================
SELECT 
  COUNT(*) AS gesamt_kuenstler,
  COUNT(label_id) AS kuenstler_mit_label
FROM kuenstler;

-- ============================================================================
-- 5. Kombinierte Abfrage mit WHERE und HAVING
-- Beantwortet: Welche Künstler besitzen mindestens 2 Songs mit einer Spieldauer
-- von jeweils über 200 Sekunden?
-- WHERE filtert vorab die einzelnen Song-Zeilen (dauer_sek > 200), HAVING filtert
-- anschließend die aggregierten Künstler-Gruppen (mindestens 2 solche Songs).
-- ============================================================================
SELECT k.name, COUNT(*) AS anzahl_lange_tracks
FROM kuenstler k
JOIN song s ON s.kuenstler_id = k.id
WHERE s.dauer_sek > 200
GROUP BY k.id
HAVING COUNT(*) >= 2;
