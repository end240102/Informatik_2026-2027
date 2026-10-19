# UE 2026-10-13 — Drizzle ORM Einstieg (KM5-05)

**Fach:** INFI (Informatik) · **Klasse:** 3AHWII · **Lehrperson:** Prof. Georg Ernst Graf  
**Schüler:** Alexander Endl

---

## Übersicht

Ausarbeitung der Lektion und Hausübung zu **KM5-05 (Drizzle ORM Einstieg)** auf Basis von Deno und `node:sqlite`.
Das Projekt demonstriert typsicheren relationalen Datenbankzugriff mit Drizzle ORM, Schema-Definitionen, parametrisierte Abfragen und den direkten Vergleich zwischen Query-Builder und reinem SQL (Interleaving).

## Dateien

| Datei | Zweck |
|---|---|
| [`hausaufgabe.md`](./hausaufgabe.md) | **Vollständig ausgearbeitete Hausübung** mit SQL-Vorhersage (1a & 1b), Dokumentation der erweiterten Queries, Interleaving-Vergleichstabelle und Testergebnissen |
| [`demo.ts`](./demo.ts) | Erweiterter Demo-Ablauf mit den 3 geforderten Abfragen (ältestes Album, Echo-Tracks, Tracks pro Album) und `.toSQL()`-Logging |
| [`demo_test.ts`](./demo_test.ts) | 13 Unit-Tests (9 Basis-Tests + 4 HÜ-Tests für alle neuen Abfragen und Vorhersagen) |
| [`schema.ts`](./schema.ts) | TypeScript-Schema (`artist`, `album`, `track`) mit SQLite-Typen und Relationen |
| [`db.ts`](./db.ts) | Datenbank-Initialisierung mit `node:sqlite` und Schema-DDL (`CREATE TABLE IF NOT EXISTS`) |
| [`deno.json`](./deno.json) | Deno-Konfiguration mit Tasks `demo` und `test` sowie gepinnten Imports |
| [`lesson.html`](./lesson.html) | Interaktive Unterrichtslektion KM5-05 mit Theorie, Quizzen und Aufgabenstellung |

## Befehle

```bash
deno task demo    # Führt den Demo-Ablauf aus (inkl. aller HÜ-Abfragen & toSQL-Logging)
deno task test    # Führt alle 13 Unit-Tests in-memory aus (100% bestanden)
```
