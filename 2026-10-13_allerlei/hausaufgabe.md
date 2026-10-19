# Hausübung KM5-05 — Drizzle ORM (Typsicherer Datenbankzugriff)

**Fach:** INFI (Informatik)  
**Klasse:** 3AHWII  
**Schüler:** Alexander Endl  
**Datum:** 19. Oktober 2026  
**Lehrperson:** Prof. Georg Ernst Graf  
**Thema:** Drizzle ORM mit Deno & `node:sqlite` — Schema, Queries, Parametrisierung & SQL-Interleaving  

---

## 1. Vorhersage des erzeugten SQL (vor dem Ausführen)

### Query a:
```typescript
db.select().from(artist).where(eq(artist.gruendungsjahr, 1999))
```

#### Vorhersage:
- **Spaltenliste:** Da `select()` ohne Objektargument aufgerufen wird, selektiert Drizzle alle im Schema definierten Spalten der Tabelle `artist`. Laut `schema.ts` sind dies `id`, `name` und `gruendungsjahr`.
- **FROM-Klausel:** `from "artist"`
- **WHERE-Klausel:** `where "artist"."gruendungsjahr" = ?`
- **Parameter:** `[ 1999 ]` (Drizzle injiziert Werte niemals direkt in den SQL-String, sondern trennt SQL-Statement und Parameter zur Vermeidung von SQL-Injections).
- **Erwartetes SQL:**
  ```sql
  select "id", "name", "gruendungsjahr" from "artist" where "artist"."gruendungsjahr" = ?
  ```

#### Tatsächlicher Befund (`toSQL()`):
```typescript
{
  sql: 'select "id", "name", "gruendungsjahr" from "artist" where "artist"."gruendungsjahr" = ?',
  params: [ 1999 ]
}
```
**Ergebnis:** `[ { id: 1, name: "Aera", gruendungsjahr: 1999 } ]`  
*Die Vorhersage trifft zu 100% zu.*

---

### Query b:
```typescript
db.select({ n: count() }).from(album).where(eq(album.artistId, 1))
```

#### Vorhersage:
- **Spaltenliste:** Es wird ein benutzerdefiniertes Projektionsobjekt `{ n: count() }` übergeben. Drizzle erzeugt hieraus die Aggregatfunktion `count(*)`.
- **FROM-Klausel:** `from "album"`
- **WHERE-Klausel & Spalten-Mapping:** Im TypeScript-Schema heisst die Property `artistId`, in der SQLite-Datenbank ist sie jedoch als `artist_id` definiert (`integer("artist_id")`). Drizzle löst die Spaltenbezeichnung automatisch korrekt auf: `"album"."artist_id" = ?`.
- **Parameter:** `[ 1 ]`
- **Erwartetes SQL:**
  ```sql
  select count(*) from "album" where "album"."artist_id" = ?
  ```

#### Tatsächlicher Befund (`toSQL()`):
```typescript
{
  sql: 'select count(*) from "album" where "album"."artist_id" = ?',
  params: [ 1 ]
}
```
**Ergebnis:** `[ { n: 1 } ]`  
*Die Vorhersage trifft exakt zu.*

---

## 2. Erweiterung des Beispielprojekts (`demo.ts`)

In `demo.ts` wurden die drei geforderten Queries implementiert und deren generiertes SQL via `.toSQL()` in der Konsole ausgegeben:

### 2.1 Ältestes Album (`orderBy` + `limit`)
```typescript
const aeltestesQuery = db.select()
  .from(album)
  .orderBy(asc(album.jahr))
  .limit(1);

const aeltestes = await aeltestesQuery;
```
- **Generiertes SQL:**
  ```sql
  select "id", "titel", "jahr", "artist_id" from "album" order by "album"."jahr" asc limit ?
  ```
- **Parameter:** `[ 1 ]` (auch das Limit wird parametrisiert)
- **Ergebnis:** `Night Ferry ( 2012 )`

### 2.2 Tracks eines Albums mit Titel-Anfang „Echo“ (`and` + `eq` + `like`)
```typescript
const echoTracksQuery = db.select()
  .from(track)
  .where(and(eq(track.albumId, stille[0].id), like(track.titel, "Echo%")));

const echoTracks = await echoTracksQuery;
```
- **Generiertes SQL:**
  ```sql
  select "id", "titel", "dauer_sek", "album_id" from "track" 
  where (("track"."album_id" = ?) and ("track"."titel" like ?))
  ```
- **Parameter:** `[ 1, "Echo%" ]`
- **Ergebnis:** `[ { id: 2, titel: "Echo Room", dauerSek: 187, albumId: 1 } ]`

### 2.3 Anzahl Tracks je Album (`count` + `groupBy` + `innerJoin`)
```typescript
const tracksProAlbumQuery = db.select({ titel: album.titel, tracks: count() })
  .from(track)
  .innerJoin(album, eq(track.albumId, album.id))
  .groupBy(album.id);

const tracksProAlbum = await tracksProAlbumQuery;
```
- **Generiertes SQL:**
  ```sql
  select "album"."titel", count(*) from "track" 
  inner join "album" on "track"."album_id" = "album"."id" 
  group by "album"."id"
  ```
- **Parameter:** `[]`
- **Ergebnis:** `[ { titel: "Silent Lines", tracks: 2 } ]`

---

## 3. SQL-Vergleich (Interleaving)

### Abfrage „Tracks pro Album“ in reinem SQL:
```sql
SELECT 
    album.titel, 
    count(*) AS tracks
FROM track
INNER JOIN album ON track.album_id = album.id
GROUP BY album.id;
```

### Baustein-Gegenüberstellung (Drizzle vs. SQL):

| Baustein | Drizzle ORM TypeScript-Syntax | Reines SQL-Statement | Erläuterung & Mapping |
|:---|:---|:---|:---|
| **Projektion & Aggregation** | `db.select({ titel: album.titel, tracks: count() })` | `SELECT "album"."titel", count(*)` | Drizzle typisiert das Rückgabe-Array exakt anhand des Selektionsobjekts (`{ titel: string, tracks: number }`). `count()` mappt direkt auf SQL-Standard `count(*)`. |
| **Quelltabelle (FROM)** | `.from(track)` | `FROM "track"` | Definiert die primäre Relation der Abfrage. |
| **Relationen-Verknüpfung (JOIN)** | `.innerJoin(album, eq(track.albumId, album.id))` | `INNER JOIN "album" ON "track"."album_id" = "album"."id"` | Expliziter `INNER JOIN`. Das `eq()`-Prädikat erzeugt die `ON`-Bedingung. CamelCase (`albumId`) wird auf SnakeCase (`album_id`) aufgelöst. |
| **Gruppierung (GROUP BY)** | `.groupBy(album.id)` | `GROUP BY "album"."id"` | Gruppiert das Ergebnis nach dem Primärschlüssel des Albums, damit das Aggregat `count(*)` je Album berechnet wird. |

### Erkenntnis:
Im Gegensatz zu traditionellen "Heavyweight"-ORMs (wie Hibernate oder Prisma), die komplexe Objektgraphen laden oder SQL hinter abstrakten APIs verstecken, fungiert Drizzle primär als **typsicherer SQL-Query-Builder**. Die Drizzle-Syntax bildet relationale SQL-Primitiven (`JOIN`, `WHERE`, `GROUP BY`, `ORDER BY`) nahezu 1:1 ab, verhindert aber Tippfehler in Tabellen- und Spaltennamen zur Compile-Zeit.

---

## 4. Nachweis: Ausführung & Testergebnisse

### 4.1 Konsolenausgabe von `deno task demo`:
```text
Task demo deno run --allow-read --allow-write demo.ts
=== 1. DATEN INITIALISIEREN (INSERT & RETURNING) ===
Initialisierte Artists: [ "Aera", "Nova" ]
Initialisierte Alben: [ "Silent Lines", "Night Ferry" ]

=== 2. STANDARD LESEN: SELECT, FROM, WHERE ===
Lesen, erzeugtes SQL: select "id", "titel", "jahr", "artist_id" from "album" where "album"."artist_id" = ?
Lesen, Parameter: [ 1 ]
Lesen, Ergebnis: [ { id: 1, titel: "Silent Lines", jahr: 2015, artistId: 1 } ]

=== 3. HÜ-AUFGABE 1: VORHERSAGE-QUERIES VERIFIZIEREN ===
Query 1a SQL: select "id", "name", "gruendungsjahr" from "artist" where "artist"."gruendungsjahr" = ?
Query 1a Parameter: [ 1999 ]
Query 1a Ergebnis: [ { id: 1, name: "Aera", gruendungsjahr: 1999 } ]
Query 1b SQL: select count(*) from "album" where "album"."artist_id" = ?
Query 1b Parameter: [ 1 ]
Query 1b Ergebnis: [ { n: 1 } ]

=== 4. HÜ-AUFGABE 2: DREI ERGÄNZTE QUERIES ===
HÜ 2.1 - Ältestes Album SQL: select "id", "titel", "jahr", "artist_id" from "album" order by "album"."jahr" asc limit ?
HÜ 2.1 - Parameter: [ 1 ]
HÜ 2.1 - Ergebnis: Night Ferry ( 2012 )
Neuestes Album (desc zum Vergleich): Silent Lines ( 2015 )
HÜ 2.2 - Tracks mit Titel-Anfang 'Echo' SQL: select "id", "titel", "dauer_sek", "album_id" from "track" where (("track"."album_id" = ?) and ("track"."titel" like ?))
HÜ 2.2 - Parameter: [ 1, "Echo%" ]
HÜ 2.2 - Ergebnis: [ { id: 2, titel: "Echo Room", dauerSek: 187, albumId: 1 } ]
HÜ 2.3 - Tracks pro Album SQL: select "album"."titel", count(*) from "track" inner join "album" on "track"."album_id" = "album"."id" group by "album"."id"
HÜ 2.3 - Parameter: []
HÜ 2.3 - Ergebnis: [ { titel: "Silent Lines", tracks: 2 } ]

=== 5. ÄNDERN & LÖSCHEN (UPDATE & DELETE) ===
Nach update: 220 Sekunden
Tracks nach delete: 1
```

### 4.2 Testergebnisse von `deno task test`:
```text
Task test deno test
Check demo_test.ts
running 13 tests from ./demo_test.ts
insert mit returning liefert die neue Zeile mit id ... ok (3ms)
select mit where filtert typsicher ... ok (1ms)
Fremdschlüssel verhindert Album ohne Artist ... ok (998µs)
update aendert nur die gewaehlten Zeilen ... ok (1ms)
delete entfernt nur die gewaehlte Zeile ... ok (1ms)
orderBy + limit liefern das juengste Album ... ok (663µs)
innerJoin verbindet Album und Artist ... ok (898µs)
Drizzle parametrisiert: Werte stecken in params, nicht im SQL ... ok (643µs)
assertThrows ist importiert und steht bereit ... ok (764µs)
HÜ 2.1: orderBy(asc) + limit(1) liefert das aelteste Album ... ok (913µs)
HÜ 2.2: and + eq + like filtert Tracks eines Albums mit Titel-Anfang 'Echo' ... ok (1ms)
HÜ 2.3: count + groupBy + innerJoin aggregiert Tracks pro Album ... ok (876µs)
HÜ 1: Vorhersage-Queries Verhalten & Parametrisierung ... ok (993µs)

ok | 13 passed | 0 failed (22ms)
```

Alle 13 Tests bestanden fehlerfrei.
