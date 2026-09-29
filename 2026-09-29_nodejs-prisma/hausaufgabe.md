# Aufgabe — KM5-01 (Node.js + Prisma 7)

1. **Vorhersage** (vor dem Ausführen): erwartetes Ergebnis von Query 1 (Top-Künstler);
   begründe, warum `COUNT(*)` = 4, `COUNT(labelId)` aber 3 ergibt.
2. **Setup wiederholen:** `npm i prisma@7 @prisma/client@7 @prisma/adapter-better-sqlite3@7 dotenv`,
   `npm approve-scripts --all`, `cp .env.example .env`, `npm run db:migrate`, `npm run db:seed`;
   danach `npm run run` und `npm test` grün bekommen (Screenshot der 5 Konsolen-Zeilen).
3. **Erweitern:** Model `Playlist` mit N:M zu `Song` ergänzen, migrieren und **eine** Prisma-Query
   schreiben, die pro Playlist die Song-Anzahl liefert.
4. **Reflexion (5–6 Sätze):** Wo war Prisma kürzer als SQL, wo musstest du auf `$queryRaw`
   ausweichen? Bleibst du vorerst bei Prisma?

---

# Ausarbeitung & Lösung

## 1. Vorhersage & Begründung

### Erwartetes Ergebnis von Query 1 (Top-Künstler)
Anhand der Seed-Daten (`src/seed.js`) ergibt sich folgende Verteilung der Tracks pro Künstler:
- **Nova:** 3 Songs (*Nordlicht*, *Glut*, *Funkeln*)
- **Pixel:** 2 Songs (*Pixelstaub*, *Raster*)
- **Solveig:** 1 Song (*Fjord*)
- **Ohne Label:** 1 Song (*Kurz*)

Erwartetes Resultat der Abfrage (`take: 5`, absteigend sortiert):
Nova belegt mit 3 Tracks unangefochten Platz 1. Dahinter reiht sich Pixel mit 2 Tracks ein. Den Abschluss bilden Solveig und „Ohne Label“ mit jeweils einem Song.

### Begründung: `COUNT(*)` = 4 vs. `COUNT(labelId)` = 3
`COUNT(*)` zählt schlicht jede Zeile in der Tabelle `Kuenstler`, ungeachtet der enthaltenen Spaltenwerte — das ergibt exakt 4 Datensätze. 
Dagegen ignoriert `COUNT(spalte)` in SQL (und folglich auch bei Prismas Aggregation) alle `NULL`-Werte. Da der Datensatz „Ohne Label“ für `labelId` explizit den Wert `NULL` aufweist, fällt er aus der Zählung heraus. Übrig bleiben genau 3 Künstler mit zugewiesenem Label.

---

## 2. Setup & Ausführung (`npm run run` + `npm test`)

Das Setup wurde mit Node.js LTS, gepinntem Prisma 7 (`^7.10.0`) und dem nativen `better-sqlite3`-Adapter aufgesetzt.

### Konsolenausgabe von `npm run run` (5 Diagnose-Queries):
```text
1) Top-Künstler:           [
  { name: 'Nova', tracks: 3 },
  { name: 'Pixel', tracks: 2 },
  { name: 'Ohne Label', tracks: 1 },
  { name: 'Solveig', tracks: 1 }
]
2) Label-Paare:            [ { a: 'Nova', b: 'Pixel', label: 'Ohrwurm Records' } ]
3) Labels mit >1 Künstler: [ { name: 'Ohrwurm Records', anzahl: 2 } ]
4) COUNT(*) vs. mit Label: { alle: 4, mitLabel: 3 }
5) Künstler mit 2+ langen: [ { name: 'Nova', anzahl: 2 }, { name: 'Pixel', anzahl: 2 } ]
```

### Testergebnis von `npm test` (alle Tests grün):
```text
✔ Top-Künstler liefert absteigend nach Track-Anzahl (70.003ms)
✔ COUNT(*) zählt auch Künstler ohne Label (4.7301ms)
✔ Volle Labels: genau Ohrwurm Records hat 2 Künstler (4.5998ms)
✔ Label-Paare (Self-JOIN) findet Nova/Pixel (2.3122ms)
✔ WHERE+HAVING: Nova und Pixel haben je 2+ Songs über 200 s (4.3252ms)
✔ N:M Playlist-Query: liefert Songs pro Playlist (3.5458ms)
ℹ tests 6
ℹ suites 0
ℹ pass 6
ℹ fail 0
```

---

## 3. Erweiterung: Model `Playlist` (N:M zu `Song`) & Query

### Schema-Erweiterung (`prisma/schema.prisma`)
In `schema.prisma` wurde das Modell `Playlist` eingeführt und die Many-to-Many-Relation zu `Song` definiert:
```prisma
model Song {
  id          Int        @id @default(autoincrement())
  titel       String
  dauerSek    Int
  kuenstlerId Int
  kuenstler   Kuenstler  @relation(fields: [kuenstlerId], references: [id])
  playlists   Playlist[]
}

model Playlist {
  id    Int    @id @default(autoincrement())
  name  String
  songs Song[]
}
```

Die Migration wurde über `npx prisma migrate dev --name add_playlist` durchgeführt. Prisma legte automatisch die Verbindungstabelle `_PlaylistToSong` mit Primär- und Fremdschlüsseln sowie passenden Indizes an.

### Prisma-Query (`src/queries.js`)
Abfrage zur Ermittlung der Song-Anzahl pro Playlist:
```javascript
export async function songsProPlaylist() {
  const playlists = await prisma.playlist.findMany({
    select: {
      name: true,
      _count: {
        select: { songs: true },
      },
    },
    orderBy: { name: "asc" },
  });
  return playlists.map((p) => ({ name: p.name, songAnzahl: p._count.songs }));
}
```

### Ausgabe der Abfrage:
```text
6) Songs pro Playlist:     [
  { name: 'Abendruhe', songAnzahl: 2 },
  { name: 'Leer', songAnzahl: 0 },
  { name: 'Roadtrip', songAnzahl: 3 }
]
```

---

## 4. Reflexion

Bei einfachen Filterungen und Relationen spart Prisma spürbar Tipparbeit. Ein schlichtes `_count` im Objekt ersetzt lästige JOIN-Kaskaden samt manuellem `GROUP BY`. Sobald es kniffliger wird, stößt der Abstraktionsgrad jedoch an harte Grenzen: Für den Self-JOIN gab es keinen nativen Prisma-Weg — hier rettete nur `$queryRaw` mit reinem SQL die Abfrage. Der Grund liegt auf der Hand: Prisma versucht komplexe Relationen in JavaScript-Objekte zu pressen, statt die SQL-Engine machen zu lassen. Unterm Strich bleibe ich zwiegespalten. Für Standard-CRUD im Node-Ökosystem taugt Prisma allemal, doch im Unterricht mit Deno und analytischen SQL-Abfragen wirkt das System oft sperrig.
