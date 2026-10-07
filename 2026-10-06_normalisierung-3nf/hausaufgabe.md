# Hausübung KM5-02 — Normalisierung 1NF–3NF

**Fach:** INFI · **Klasse:** 3AHWII · **Name:** Alexander Endl  
**Unterrichtseinheit:** 2026-10-06 (KM5-02 Normalformen)  
**Lehrperson:** Prof. Georg Ernst Graf  

---

## 1. Vorhersage (vor dem Zerlegen)

Ausgangsbasis ist die denormalisierte Relation aus `seed-normalisierung.sql`:

```text
bestellung_denorm(bestell_nr [PK], kunde, plz, ort)
```

Mit den typischen Testdaten:
- `(101, 'Auer', '1020', 'Wien')`
- `(102, 'Beck', '1020', 'Wien')`
- `(103, 'Cevik', '4020', 'Linz')`

### Welche Spalte verletzt welche Normalform — und warum?
Klar ist: Die Spalte **`ort` verletzt die 3. Normalform (3NF)**.
Der Grund liegt im relationalen Datenmodell: `ort` beschreibt die Postleitzahl und nicht die eigentliche Bestellung. Zwar bestimmt die Bestellnummer eindeutig die Postleitzahl, doch der Ort folgt erst aus der Postleitzahl. Damit existiert eine Kette über ein Nicht-Schlüsselattribut:
$$\text{bestell\_nr} \longrightarrow \text{plz} \longrightarrow \text{ort}$$
Das ist die klassische **transitive Abhängigkeit**.

### Ist die 2NF hier überhaupt ein Thema?
**Nein.** Die 2NF greift ausschließlich bei zusammengesetzten Primärschlüsseln. Besteht der Primärschlüssel aus nur einer Spalte — hier `bestell_nr` —, kann rein logisch kein Attribut von einem „Teil" des Schlüssels abhängen. Die 2NF ist somit automatisch und trivial erfüllt.

### Randnotiz zur Unterrichts-Erweiterung (`tracks`):
Wird die Relation um ein Listenfeld erweitert — `bestellung(bestell_nr PK, kunde, tracks, plz, ort)` —, verletzt `tracks` sofort die **1NF**, weil in einer einzelnen Zelle mehrere Werte kommagetrennt abgelegt wären.

---

## 2. Zerlegen bis 3NF (Schritt für Schritt)

### Stufe 1: 1NF — Atomarität
- **Prüfung:** Jedes Feld muss genau einen unteilbaren Skalarwert enthalten. Keine Listen, keine Arrays, keine Wiederholgruppen.
- **Abhängigkeiten:**
  $$\text{bestell\_nr} \longrightarrow \text{kunde}$$
  $$\text{bestell\_nr} \longrightarrow \text{plz}$$
  $$\text{plz} \longrightarrow \text{ort}$$
- **Ergebnis:** Da alle Spalten atomar sind, befindet sich die Tabelle bereits in der **1NF**.

### Stufe 2: 2NF — Volle funktionale Abhängigkeit
- **Prüfung:** Kein Nichtschlüssel darf von einer echten Teilmenge eines zusammengesetzten Schlüssels abhängen.
- **Begründung:** Der Primärschlüssel besteht ausschließlich aus `bestell_nr`. Ein Schlüsselteil existiert nicht.
- **Ergebnis:** Die Relation erfüllt die **2NF** vollständig.

### Stufe 3: 3NF — Keine transitiven Abhängigkeiten
- **Problem:** Die Abhängigkeit $\text{plz} \longrightarrow \text{ort}$ läuft zwischen zwei Nichtschlüsseln. 
- **Folgen ohne Normalisierung:**
  - *Änderungs-Anomalie:* Ändert sich der Name eines Ortes zu PLZ 1020, müssen mehrere Zeilen angefasst werden. Vergisst man eine Zeile, ist der Datenbestand inkonsistent.
  - *Einfüge-Anomalie:* Eine neue Postleitzahl (z. B. 8010 für Graz) lässt sich erst dann anlegen, wenn tatsächlich ein Kunde eine Bestellung tätigt.
  - *Lösch-Anomalie:* Wird Bestellung 103 gelöscht, geht die Information verloren, dass 4020 zu Linz gehört.
- **3NF-Schnitt:** Auslagerung der funktionalen Abhängigkeit $\text{plz} \to \text{ort}$ in eine eigene Tabelle.

#### Normalisierte Tabellenstruktur:
1. **Relation `plz`:**
   $$\text{plz}(\underline{\text{plz}}, \text{ort})$$
2. **Relation `bestellung`:**
   $$\text{bestellung}(\underline{\text{bestell\_nr}}, \text{kunde}, \text{plz}^{\uparrow})$$
   *(wobei $\text{plz}$ als Fremdschlüssel auf $\text{plz}(\text{plz})$ verweist)*

### Interleaving: Rekonstruktion der Ur-Daten via JOIN
Damit Applikationen denselben Stand wie vor der Zerlegung sehen, werden die Tabellen über den Fremdschlüssel zusammengeführt:

```sql
SELECT 
  b.bestell_nr,
  b.kunde,
  b.plz,
  p.ort
FROM bestellung b
JOIN plz p ON b.plz = p.plz;
```

---

## 3. Zwei eigene Tabellen aus den Lesson-Quizzen

Sämtliche DDL-Befehle und Inserts sind lauffähig in [`loesung.sql`](loesung.sql) hinterlegt und getestet.

### Tabelle 1 (Fokus 2NF): Quiz 7 — Song in Playlists (`song_playlist_denorm`)

#### Ausgangsrelation:
```text
song_playlist_denorm(song_id, playlist_id, song_titel)
PK: (song_id, playlist_id)
```
- **Fehler:** Der Primärschlüssel ist zusammengesetzt. Das Attribut `song_titel` beschreibt allerdings ausschließlich den Song, nicht die Zuordnung zur Playlist.
- **Partielle Abhängigkeit:**
  $$\text{song\_id} \longrightarrow \text{song\_titel}$$
- **2NF-Fix:** Die Entität `song` wird separiert. Die Zwischentabelle `song_playlist` führt nur noch die beiden Fremdschlüssel.

```sql
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

-- Beispieldaten (je 3 Zeilen)
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
```

---

### Tabelle 2 (Fokus 3NF / SWP-Crossover): Quiz 13 — Bankkonto (`konto_denorm`)

#### Ausgangsrelation:
```text
konto_denorm(iban [PK], inhaber, blz, bankname)
```
- **Fehler:** 1NF und 2NF sind erfüllt (atomare Felder, Einzelschlüssel `iban`). Allerdings bestimmt die Bankleitzahl den Banknamen.
- **Transitive Kette:**
  $$\text{iban} \longrightarrow \text{blz} \longrightarrow \text{bankname}$$
- **3NF-Fix:** Auslagerung von `bank(blz [PK], bankname)`. In `konto` bleibt `blz` als Fremdschlüssel.

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

-- Beispieldaten (je 3 Zeilen)
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

## 4. Demo-Nachweis: Konsolenzeilen

Ausführung des Referenzskripts `demo.ts` im Projektordner:

```text
> deno task demo
Task demo deno run --allow-read --allow-write demo.ts
1NF: WHERE hobbys = 'Schwimmen' findet 0 Zeilen (die Zelle ist eine Liste).
1NF-Fix: eine Zeile pro Wert -> 1 Treffer.
2NF: song_id 1 hat 2 verschiedene Titel (Titel hängt nur an song_id).
2NF-Fix: der Titel steht 1 Mal fuer song_id 1.
3NF: PLZ 1020 hat 2 verschiedene Orte (Ort hängt an PLZ).
```

Zusätzlich wurden alle 4 Unit-Tests erfolgreich ausgeführt:

```text
> deno task test
Task test deno test
Check demo_test.ts
running 4 tests from ./demo_test.ts
1NF: Liste in der Zelle bricht die Gleichheitssuche ... ok (1ms)
2NF: partielle Abhängigkeit erlaubt widersprüchliche Titel ... ok (762µs)
3NF: transitive Abhängigkeit erlaubt widersprüchliche Orte ... ok (656µs)
3NF-Fix: PLZ -> Ort steht genau einmal ... ok (385µs)

ok | 4 passed | 0 failed (10ms)
```

---

## 5. Umsetzung in Prisma 7 („mit prisma!!“)

Gemäß Vorgabe für die 3AHWII wurde die normalisierte Architektur in einem Prisma-7-Schema modelliert (`prisma/schema.prisma`).

### Auszug aus `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client"
  output   = "../generated/prisma"
}

datasource db {
  provider = "sqlite"
}

// --- 3NF: Beseitigung transitiver Abhängigkeiten ---
model Plz {
  plz          String       @id
  ort          String
  bestellungen Bestellung[]
}

model Bestellung {
  bestellNr  Int               @id
  kunde      String
  plz        String
  ortRef     Plz               @relation(fields: [plz], references: [plz])
  positionen Bestellposition[]
}

// --- 2NF: Beseitigung partieller Abhängigkeiten ---
model Song {
  id        Int            @id @default(autoincrement())
  titel     String
  dauerSek  Int
  playlists SongPlaylist[]
}

model Playlist {
  id    Int            @id @default(autoincrement())
  name  String
  songs SongPlaylist[]
}

model SongPlaylist {
  songId     Int
  playlistId Int
  song       Song     @relation(fields: [songId], references: [id], onDelete: Cascade)
  playlist   Playlist @relation(fields: [playlistId], references: [id], onDelete: Cascade)

  @@id([songId, playlistId])
}

// --- 3NF Crossover: Bank & Konto ---
model Bank {
  blz      String  @id
  bankname String
  konten   Konto[]
}

model Konto {
  iban    String @id
  inhaber String
  blz     String
  bank    Bank   @relation(fields: [blz], references: [blz])
}
```

### Wie Prisma Anomalien auf Schemaebene verhindert:
1. **Keine widersprüchlichen Stammdaten:** Ein Datensatz existiert pro Primärschlüssel exakt einmal (z. B. `Plz` oder `Bank`). Relationen verweisen per Fremdschlüssel zwingend auf diesen einen Eintrag.
2. **Referentielle Integrität:** Fehlende Eltern-Einträge werden zur Laufzeit durch Foreign-Key-Constraints abgewiesen. Einfüge- und Lösch-Anomalien sind unmöglich.
3. **Validierungs-Nachweis:**
   ```text
   > deno task prisma:validate
   Task prisma:validate deno run -A npm:prisma@7 validate --schema prisma/schema.prisma
   Prisma schema loaded from prisma\schema.prisma.
   The schema at prisma\schema.prisma is valid 🚀
   ```
