# Hausübung zu UE 2026-09-29 — Rep ohne Node

**Fach:** INFI · **Klasse:** 3AHWII · **Name:** Alexander Endl  
**Abgabe:** bis 06.10.2026  

---

## 1. Die 5 Auffrischungs-Queries (Lesson 0001 §4)

Die Abfragen liegen gesammelt als ausführbare SQL-Datei unter [`queries.sql`](queries.sql).

### Query 1: Top-5-Künstler nach Track-Anzahl
- **Frage:** Welche Künstler haben die meisten Songs in der Datenbank veröffentlicht?
- **SQL:**
  ```sql
  SELECT k.name, COUNT(*) AS tracks
  FROM kuenstler k
  JOIN song s ON s.kuenstler_id = k.id
  GROUP BY k.id
  ORDER BY tracks DESC
  LIMIT 5;
  ```
- **Ergebnis:**
  - Auer: 3 Tracks
  - Frei: 2 Tracks
  - Demir: 2 Tracks
  - Egger: 1 Track
  - Cevik: 1 Track

### Query 2: Künstlerpaare desselben Labels (Self-JOIN)
- **Frage:** Welche Künstler stehen gemeinsam beim selben Label unter Vertrag?
- **SQL:**
  ```sql
  SELECT x.name AS kuenstler_a, y.name AS kuenstler_b, l.name AS label
  FROM kuenstler x
  JOIN kuenstler y ON x.label_id = y.label_id AND x.id < y.id
  JOIN label l ON l.id = x.label_id;
  ```
- **Besonderheit:** Die Bedingung `x.id < y.id` filtert Selbstverknüpfungen (`Auer = Auer`) sowie gespiegelte Duplikate (`Beck / Auer`) zuverlässig heraus.
- **Ergebnis:**
  - Auer & Beck (Nordklang)
  - Cevik & Demir (Suedton)
  - Cevik & Egger (Suedton)
  - Demir & Egger (Suedton)

### Query 3: Labels mit mehreren Künstlern (`HAVING`)
- **Frage:** Welche Musiklabels betreuen mehr als einen Künstler?
- **SQL:**
  ```sql
  SELECT l.name, COUNT(*) AS kuenstler_anzahl
  FROM kuenstler k
  JOIN label l ON l.id = k.label_id
  GROUP BY l.id
  HAVING COUNT(*) > 1;
  ```
- **Besonderheit:** `HAVING` greift erst nach der Gruppenbildung durch `GROUP BY l.id`. In größeren Datenbeständen wird der Schwellenwert auf `> 5` gesetzt.
- **Ergebnis:**
  - Suedton: 3 Künstler
  - Nordklang: 2 Künstler

### Query 4: `COUNT(*)` vs. `COUNT(label_id)`
- **Frage:** Wie viele Künstler existieren insgesamt und wie viele davon sind bei einem Label unter Vertrag?
- **SQL:**
  ```sql
  SELECT 
    COUNT(*) AS gesamt_kuenstler,
    COUNT(label_id) AS kuenstler_mit_label
  FROM kuenstler;
  ```
- **Erklärung:** `COUNT(*)` ermittelt ausnahmslos alle 6 Tabellenzeilen, während `COUNT(label_id)` `NULL`-Werte ignoriert — der Independent-Künstler „Frei“ (ohne Label) wird deshalb nur bei `COUNT(*)` gezählt (Ergebnis: 6 vs. 5).

### Query 5: Kombination aus `WHERE` und `HAVING`
- **Frage:** Welche Interpreten verfügen über mindestens zwei Stücke mit einer Spieldauer über 200 Sekunden?
- **SQL:**
  ```sql
  SELECT k.name, COUNT(*) AS anzahl_lange_tracks
  FROM kuenstler k
  JOIN song s ON s.kuenstler_id = k.id
  WHERE s.dauer_sek > 200
  GROUP BY k.id
  HAVING COUNT(*) >= 2;
  ```
- **Unterschied:** `WHERE` siebt vorab einzelne Songzeilen (`dauer_sek > 200`) aus, bevor aggregiert wird; `HAVING` prüft erst die zusammengefassten Künstlergruppen auf das Kriterium `COUNT(*) >= 2`.
- **Ergebnis:**
  - Auer: 2 lange Songs (*Silent Lines* mit 210s, *Hafenlicht* mit 240s)

---

## 2. Transferfrage: Leseauftrag Frage 6

> **Frage 6:** Setze den Artikel zu unserer Lage in Beziehung: Deno mit eingebautem `node:sqlite`, Prisma-7-Adapter-Pflicht (`better-sqlite3` nativ) und npm-`latest`, das auf einen 8.0.0-RC zeigt. Begründe, warum wir im Unterricht zuerst reines SQL fahren und ein ORM erst später — und wenn, eher Drizzle — evaluieren.

### Ausarbeitung:

Deno liefert mit `node:sqlite` eine extrem schlanke, native SQLite-Anbindung direkt im Core mit — ganz ohne instabile NPM-Abhängigkeiten oder aufgeblähte Build-Schritte. Demgegenüber erzwingt Prisma 7 sperrige Treiber-Adapter wie `better-sqlite3`, während ein unbedachtes `npm install` im Hintergrund fehleranfällige Vorabversionen wie den Release-Candidate 8 zieht. Wer relationale Datenmodelle wirklich verstehen will, muss zuerst das SQL-Handwerk beherrschen. Genau deshalb arbeiten wir vorerst direkt auf der Konsole und mit reinem SQL. Ein schwergewichtiges ORM verschleiert relationale Grundlagen hinter generiertem TypeScript-Code, statt das Verständnis für Indizes, Joins und Aggregationen zu schärfen. Sollten wir später auf ein ORM umsteigen, spricht vieles für Drizzle: Es bleibt nah an der SQL-Syntax, agiert als leichtgewichtige Typschicht und schleppt keine millionenschwere Runtime mit.
