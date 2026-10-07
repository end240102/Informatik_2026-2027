# UE 2026-10-06 — Normalisierung 1NF–3NF (KM5-02)

**Fach:** INFI · **Klasse:** 3AHWII · **Lehrperson:** Prof. Georg Ernst Graf

## Übersicht

Lektion und Hausübung zu Normalformen (1NF, 2NF, 3NF als Lückenschluss aus KM3) mit SQLite, Deno und Prisma 7.

## Dateien

| Datei | Zweck |
|---|---|
| `hausaufgabe.md` | Vollständig ausgearbeitete Hausübung mit Vorhersage, Abhängigkeitspfeilen, Quiz-Tabellen, Demo-Nachweis und Prisma-Erklärung |
| `loesung.sql` | SQL-Lösung mit DDL (`CREATE TABLE`), Beispieldatensätzen (je 3 Zeilen) und JOIN-Rekonstruktionsabfragen |
| `demo.ts` | Anomalie-Demo (1NF, 2NF, 3NF) in In-Memory SQLite |
| `demo_test.ts` | 4 Deno-Tests zu den Normalisierungs-Anomalien |
| `seed-normalisierung.sql` | Alle Lesson-Tabellen (1NF, 2NF, 3NF) denormalisiert und normalisiert |
| `prisma/schema.prisma` | Vollständiges Prisma-7-Datenmodell der normalisierten Relationen („mit prisma!!“) |
| `deno.json` | Deno-Tasks für `demo`, `test`, `prisma:validate` und `prisma:format` |
| `lesson.html` | Interaktive Unterrichtslektion KM5-02 mit Theorie und Quizzen |

## Befehle

```bash
deno task demo             # Führt die Anomalie-Demo aus (1NF, 2NF, 3NF)
deno task test             # Führt alle 4 Unit-Tests aus
deno task prisma:validate  # Validiert das Prisma-Schema
deno task prisma:format    # Formatiert das Prisma-Schema
```
