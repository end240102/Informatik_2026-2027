// demo.ts — Drizzle ORM am Musik-Katalog: Lesen, Schreiben, Auswerten.
// Zeigt zu jeder Query das erzeugte SQL (toSQL()) — ein ORM ersetzt SQL
// nicht, es erzeugt es. Laufen mit:  deno task demo
import { and, asc, count, desc, eq, like } from "drizzle-orm";
import { oeffneDb } from "./db.ts";
import { album, artist, track } from "./schema.ts";

// Datei-DB im Projektordner — bei jedem Lauf neu anlegen.
await Deno.remove("musik.db").catch(() => {/* Datei fehlt: egal */});
const db = oeffneDb("musik.db");

console.log("=== 1. DATEN INITIALISIEREN (INSERT & RETURNING) ===");
const aera = await db.insert(artist)
  .values({ name: "Aera", gruendungsjahr: 1999 })
  .returning();
const nova = await db.insert(artist)
  .values({ name: "Nova", gruendungsjahr: 2012 })
  .returning();
const stille = await db.insert(album)
  .values({ titel: "Silent Lines", jahr: 2015, artistId: aera[0].id })
  .returning();
const night = await db.insert(album)
  .values({ titel: "Night Ferry", jahr: 2012, artistId: nova[0].id })
  .returning();
await db.insert(track)
  .values({ titel: "Silent Lines", dauerSek: 215, albumId: stille[0].id });
await db.insert(track)
  .values({ titel: "Echo Room", dauerSek: 187, albumId: stille[0].id });

console.log("Initialisierte Artists:", [aera[0].name, nova[0].name]);
console.log("Initialisierte Alben:", [stille[0].titel, night[0].titel]);

console.log("\n=== 2. STANDARD LESEN: SELECT, FROM, WHERE ===");
const fragen = db.select().from(album).where(eq(album.artistId, aera[0].id));
console.log("Lesen, erzeugtes SQL:", fragen.toSQL().sql);
console.log("Lesen, Parameter:", fragen.toSQL().params);
console.log("Lesen, Ergebnis:", await fragen);

console.log("\n=== 3. HÜ-AUFGABE 1: VORHERSAGE-QUERIES VERIFIZIEREN ===");
// a) db.select().from(artist).where(eq(artist.gruendungsjahr, 1999))
const query1a = db.select().from(artist).where(eq(artist.gruendungsjahr, 1999));
console.log("Query 1a SQL:", query1a.toSQL().sql);
console.log("Query 1a Parameter:", query1a.toSQL().params);
console.log("Query 1a Ergebnis:", await query1a);

// b) db.select({ n: count() }).from(album).where(eq(album.artistId, 1))
const query1b = db.select({ n: count() }).from(album).where(eq(album.artistId, 1));
console.log("Query 1b SQL:", query1b.toSQL().sql);
console.log("Query 1b Parameter:", query1b.toSQL().params);
console.log("Query 1b Ergebnis:", await query1b);

console.log("\n=== 4. HÜ-AUFGABE 2: DREI ERGÄNZTE QUERIES ===");

// 1. Das älteste Album (orderBy + limit)
const aeltestesQuery = db.select().from(album).orderBy(asc(album.jahr)).limit(1);
console.log("HÜ 2.1 - Ältestes Album SQL:", aeltestesQuery.toSQL().sql);
console.log("HÜ 2.1 - Parameter:", aeltestesQuery.toSQL().params);
const aeltestes = await aeltestesQuery;
console.log("HÜ 2.1 - Ergebnis:", aeltestes[0].titel, "(", aeltestes[0].jahr, ")");

// Zum Vergleich: Neuestes Album (desc)
const neueste = await db.select().from(album).orderBy(desc(album.jahr)).limit(1);
console.log("Neuestes Album (desc zum Vergleich):", neueste[0].titel, "(", neueste[0].jahr, ")");

// 2. Tracks eines Albums mit Titel-Anfang „Echo“ (and + eq + like)
const echoTracksQuery = db.select().from(track)
  .where(and(eq(track.albumId, stille[0].id), like(track.titel, "Echo%")));
console.log("HÜ 2.2 - Tracks mit Titel-Anfang 'Echo' SQL:", echoTracksQuery.toSQL().sql);
console.log("HÜ 2.2 - Parameter:", echoTracksQuery.toSQL().params);
const echoTracks = await echoTracksQuery;
console.log("HÜ 2.2 - Ergebnis:", echoTracks);

// 3. Anzahl Tracks je Album (count + groupBy + innerJoin)
const tracksProAlbumQuery = db.select({ titel: album.titel, tracks: count() })
  .from(track)
  .innerJoin(album, eq(track.albumId, album.id))
  .groupBy(album.id);
console.log("HÜ 2.3 - Tracks pro Album SQL:", tracksProAlbumQuery.toSQL().sql);
console.log("HÜ 2.3 - Parameter:", tracksProAlbumQuery.toSQL().params);
const tracksProAlbum = await tracksProAlbumQuery;
console.log("HÜ 2.3 - Ergebnis:", tracksProAlbum);

console.log("\n=== 5. ÄNDERN & LÖSCHEN (UPDATE & DELETE) ===");
await db.update(track)
  .set({ dauerSek: 220 })
  .where(and(eq(track.albumId, stille[0].id), like(track.titel, "Silent%")));
const korrigiert = await db.select().from(track)
  .where(eq(track.titel, "Silent Lines"));
console.log("Nach update:", korrigiert[0].dauerSek, "Sekunden");

await db.delete(track).where(eq(track.titel, "Echo Room"));
const rest = await db.select({ anzahl: count() }).from(track);
console.log("Tracks nach delete:", rest[0].anzahl);

db.$client.close();
