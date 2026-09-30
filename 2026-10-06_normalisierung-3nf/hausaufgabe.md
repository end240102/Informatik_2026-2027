# Hausübung zu UE 2026-10-06 — Dritte Normalform (3NF)

**Fach:** INFI · **Klasse:** 3AHWII · **Name:** Alexander Endl  
**Abgabe:** bis 13.10.2026  

---

## 1. Zerlegung von `bestellung_denorm` bis zur 3NF

### Ausgangslage
Gegeben ist die denormalisierte Relation:
```text
bestellung_denorm(bestell_nr [PK], kunde, plz, ort)
```

Beispieldaten aus `seed-3nf.sql`:
- `(101, 'Auer', '1020', 'Wien')`
- `(102, 'Beck', '1020', 'Wien')`
- `(103, 'Cevik', '4020', 'Linz')`

---

### Schritt 1: Prüfung auf 1. Normalform (1NF)
- **Kriterium:** Jedes Attribut muss atomare Werte enthalten (keine Listen, keine Wiederholungsgruppen).
- **Bewertung:** Alle Spalten (`bestell_nr`, `kunde`, `plz`, `ort`) enthalten ausschließlich unteilbare Einzelwerte.
- **Ergebnis:** Die Tabelle befindet sich bereits in der **1NF**.

---

### Schritt 2: Prüfung auf 2. Normalform (2NF)
- **Kriterium:** Die Tabelle muss in der 1NF sein und jedes Nicht-Schlüsselattribut muss vom *gesamten* Primärschlüssel voll funktional abhängen (keine partiellen Abhängigkeiten).
- **Bewertung:** Der Primärschlüssel ist ein atomarer Einzelschlüssel (`bestell_nr`). Eine partielle Abhängigkeit von Schlüsselbestandteilen scheidet rein strukturell aus.
- **Ergebnis:** Die Tabelle befindet sich bereits in der **2NF**.

---

### Schritt 3: Prüfung auf 3. Normalform (3NF) & Fehleranalyse
- **Kriterium:** Die Tabelle muss in der 2NF sein und kein Nicht-Schlüsselattribut darf transitiv vom Primärschlüssel abhängen (kein Nicht-Schlüssel bestimmt einen anderen Nicht-Schlüssel).
- **Abhängigkeitsanalyse:**
  1. `bestell_nr → kunde` (voll funktional abhängig vom Primärschlüssel)
  2. `bestell_nr → plz` (voll funktional abhängig vom Primärschlüssel)
  3. `plz → ort` (funktionale Abhängigkeit zwischen zwei Nicht-Schlüsseln!)
- **Transitive Kette:**
  $$\text{bestell\_nr} \longrightarrow \text{plz} \longrightarrow \text{ort}$$
- **Problem:**
  `ort` hängt nicht unmittelbar am Primärschlüssel `bestell_nr`, sondern wird erst über den Umweg der Postleitzahl `plz` bestimmt.
  Dadurch entstehen gravierende Datenanomalien:
  - **Änderungs-Anomalie:** Erhält eine Postleitzahl eine neue Ortsbezeichnung, müssen sämtliche Bestellzeilen mit dieser PLZ geändert werden. Passiert das nicht überall, entsteht Dateninkonsistenz.
  - **Einfüge-Anomalie:** Eine neue PLZ mit zugehörigem Ort lässt sich nicht abspeichern, solange kein Kunde eine Bestellung aufgibt.
  - **Lösch-Anomalie:** Wird die letzte Bestellung aus Linz (`103`) gelöscht, geht die Information verloren, dass `4020` zu Linz gehört.

---

### Schritt 4: 3NF-Zerlegung
Zur Beseitigung der Transitivität wird die funktionale Abhängigkeit $\text{plz} \to \text{ort}$ in eine eigene Relation ausgelagert:

1. **Relation `plz`:**
   $$\text{plz}(\underline{\text{plz}}, \text{ort})$$
2. **Relation `bestellung`:**
   $$\text{bestellung}(\underline{\text{bestell\_nr}}, \text{kunde}, \text{plz}^{\uparrow})$$
   *(wobei $\text{plz}$ als Fremdschlüssel auf $\text{plz}(\text{plz})$ verweist)*

**Ergebnis:** Jedes Nicht-Schlüsselattribut hängt nun direkt vom Schlüssel ab, vom gesamten Schlüssel (2NF) und von nichts als dem Schlüssel (3NF).

---

## 2. Zerlegung von zwei Quiz-Tabellen eigener Wahl

Die Skripte und Testdaten sind lauffähig in [`loesung.sql`](loesung.sql) hinterlegt.

### Wahl 1: Quiz 2 — Schüler (`schueler_denorm`)

#### Ausgangsrelation
```text
schueler_denorm(matr_nr [PK], name, klasse, klassensprecher)
```

- **Transitive Kette:**
  $$\text{matr\_nr} \longrightarrow \text{klasse} \longrightarrow \text{klassensprecher}$$
- **Begründung:** Der Klassensprecher ist eine Eigenschaft der Schulklasse, nicht des einzelnen Schülers. Er hängt damit transitiv über das Attribut `klasse` an `matr_nr`.

#### Normalisierte 3NF-Struktur
```sql
CREATE TABLE klasse (
  klasse          TEXT PRIMARY KEY,
  klassensprecher TEXT NOT NULL
);

CREATE TABLE schueler (
  matr_nr INTEGER PRIMARY KEY,
  name    TEXT NOT NULL,
  klasse  TEXT NOT NULL REFERENCES klasse(klasse)
);
```

#### Beispieldatensätze (je 3 Zeilen)
```sql
INSERT INTO klasse (klasse, klassensprecher) VALUES
  ('3AHWII', 'Beck'),
  ('3BHWII', 'Demir'),
  ('3CHWII', 'Gruber');

INSERT INTO schueler (matr_nr, name, klasse) VALUES
  (1, 'Auer',  '3AHWII'),
  (2, 'Beck',  '3AHWII'),
  (3, 'Cevik', '3BHWII');
```

---

### Wahl 2: Quiz 5 — Bankkonto (`konto_denorm`) aus der SWP-Domäne

#### Ausgangsrelation
```text
konto_denorm(iban [PK], inhaber, blz, bankname)
```

- **Transitive Kette:**
  $$\text{iban} \longrightarrow \text{blz} \longrightarrow \text{bankname}$$
- **Begründung:** Der Bankname hängt eindeutig an der Bankleitzahl (`blz`) und nicht direkt am individuellen Konto (`iban`). Bei Tausenden Konten derselben Bank würde der Bankname unzählige Male redundant dupliziert.

#### Normalisierte 3NF-Struktur
```sql
CREATE TABLE bank (
  blz      TEXT PRIMARY KEY,
  bankname TEXT NOT NULL
);

CREATE TABLE konto (
  iban    TEXT PRIMARY KEY,
  inhaber TEXT NOT NULL,
  blz     TEXT NOT NULL REFERENCES bank(blz)
);
```

#### Beispieldatensätze (je 3 Zeilen)
```sql
INSERT INTO bank (blz, bankname) VALUES
  ('1000', 'Erste Bank'),
  ('2000', 'Bank Austria'),
  ('3000', 'Raiffeisen');

INSERT INTO konto (iban, inhaber, blz) VALUES
  ('AT01', 'Auer',  '1000'),
  ('AT02', 'Beck',  '1000'),
  ('AT03', 'Cevik', '2000');
```

---

## 3. Nachweis: Ausführung von `deno task demo`

Die Konsolenausgabe zeigt die Änderungs-Anomalie im denormalisierten Zustand und die korrekte Konsistenz nach dem 3NF-Schnitt:

```text
Task demo deno run --allow-read --allow-write demo.ts
PLZ 1020 hat 2 verschiedene Orte -> Anomalie!
PLZ-Tabelle hat 1 Zeile fuer 1020 -> genau einmal.
```

Alle Unit-Tests (`deno task test`) wurden ebenfalls erfolgreich durchlaufen:
```text
Task test deno test
running 2 tests from ./demo_test.ts
plz-tatsache steht genau einmal ... ok (1ms)
denormalisiert erlaubt widerspruch ... ok (1ms)

ok | 2 passed | 0 failed (5ms)
```
