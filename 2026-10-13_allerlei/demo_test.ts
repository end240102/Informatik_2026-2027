// demo_test.ts — Tests zur Drizzle-Einstiegs-Lesson (In-Memory-DB).
import { assertEquals, assertThrows } from "@std/assert";
import { and, asc, count, desc, eq, like } from "drizzle-orm";
import { oeffneDb } from "./db.ts";
import { album, artist, track } from "./schema.ts";

function testDb() {
  const db = oeffneDb(":memory:");
  return db;
}

Deno.test("insert mit returning liefert die neue Zeile mit id", async () => {
  const db = testDb();
  const neu = await db.insert(artist)
    .values({ name: "Aera", gruendungsjahr: 1999 })
    .returning();
  assertEquals(neu.length, 1);
  assertEquals(neu[0].id, 1);
  assertEquals(neu[0].name, "Aera");
});

Deno.test("select mit where filtert typsicher", async () => {
  const db = testDb();
  const a = await db.insert(artist)
    .values({ name: "Aera", gruendungsjahr: 1999 })
    .returning();
  await db.insert(artist).values({ name: "Nova", gruendungsjahr: 2012 });
  const treffer = await db.select().from(artist)
    .where(eq(artist.gruendungsjahr, 2012));
  assertEquals(treffer.length, 1);
  assertEquals(treffer[0].name, "Nova");
  // a nur verwenden, damit der Import nicht als unbenutzt gilt:
  assertEquals(a[0].gruendungsjahr, 1999);
});

Deno.test("Fremdschlüssel verhindert Album ohne Artist", async () => {
  const db = testDb();
  await db.insert(artist).values({ name: "Aera", gruendungsjahr: 1999 });
  const fehler = await db.insert(album)
    .values({ titel: "Ohne Herkunft", jahr: 2020, artistId: 99 })
    .catch((e) => e);
  assertEquals(String(fehler?.cause ?? fehler).includes("FOREIGN KEY"), true);
});

Deno.test("update aendert nur die gewaehlten Zeilen", async () => {
  const db = testDb();
  const a = await db.insert(artist)
    .values({ name: "Aera", gruendungsjahr: 1999 })
    .returning();
  const al = await db.insert(album)
    .values({ titel: "Silent Lines", jahr: 2015, artistId: a[0].id })
    .returning();
  await db.insert(track)
    .values({ titel: "Silent Lines", dauerSek: 215, albumId: al[0].id });
  await db.insert(track)
    .values({ titel: "Echo Room", dauerSek: 187, albumId: al[0].id });

  await db.update(track)
    .set({ dauerSek: 220 })
    .where(and(eq(track.albumId, al[0].id), like(track.titel, "Silent%")));

  const tracks = await db.select().from(track).orderBy(track.id);
  assertEquals(tracks[0].dauerSek, 220);
  assertEquals(tracks[1].dauerSek, 187); // unberuehrt
});

Deno.test("delete entfernt nur die gewaehlte Zeile", async () => {
  const db = testDb();
  const a = await db.insert(artist)
    .values({ name: "Aera", gruendungsjahr: 1999 })
    .returning();
  const al = await db.insert(album)
    .values({ titel: "Silent Lines", jahr: 2015, artistId: a[0].id })
    .returning();
  await db.insert(track)
    .values({ titel: "Silent Lines", dauerSek: 215, albumId: al[0].id });
  await db.insert(track)
    .values({ titel: "Echo Room", dauerSek: 187, albumId: al[0].id });

  await db.delete(track).where(eq(track.titel, "Echo Room"));
  const rest = await db.select({ anzahl: count() }).from(track);
  assertEquals(rest[0].anzahl, 1);
});

Deno.test("orderBy + limit liefern das juengste Album", async () => {
  const db = testDb();
  const a = await db.insert(artist)
    .values({ name: "Aera", gruendungsjahr: 1999 })
    .returning();
  await db.insert(album)
    .values({ titel: "Night Ferry", jahr: 2012, artistId: a[0].id });
  await db.insert(album)
    .values({ titel: "Silent Lines", jahr: 2015, artistId: a[0].id });

  const neueste = await db.select().from(album)
    .orderBy(desc(album.jahr)).limit(1);
  assertEquals(neueste[0].titel, "Silent Lines");
});

Deno.test("innerJoin verbindet Album und Artist", async () => {
  const db = testDb();
  const a = await db.insert(artist)
    .values({ name: "Aera", gruendungsjahr: 1999 })
    .returning();
  await db.insert(album)
    .values({ titel: "Silent Lines", jahr: 2015, artistId: a[0].id });

  const joined = await db
    .select({ titel: album.titel, artist: artist.name })
    .from(album)
    .innerJoin(artist, eq(album.artistId, artist.id));
  assertEquals(joined, [{ titel: "Silent Lines", artist: "Aera" }]);
});

Deno.test("Drizzle parametrisiert: Werte stecken in params, nicht im SQL", () => {
  const db = testDb();
  const fragen = db.select().from(album).where(eq(album.jahr, 2015));
  const { sql, params } = fragen.toSQL();
  assertEquals(sql.includes("2015"), false); // kein Wert im SQL-Text
  assertEquals(params, [2015]); // der Wert steckt als Parameter
});

Deno.test("assertThrows ist importiert und steht bereit", () => {
  assertThrows(
    () => {
      throw new Error("FOREIGN KEY constraint failed");
    },
    Error,
    "FOREIGN KEY",
  );
});

// --- HÜ-Erweiterungs-Tests (KM5-05) ---

Deno.test("HÜ 2.1: orderBy(asc) + limit(1) liefert das aelteste Album", async () => {
  const db = testDb();
  const a = await db.insert(artist)
    .values({ name: "Aera", gruendungsjahr: 1999 })
    .returning();
  await db.insert(album)
    .values({ titel: "Night Ferry", jahr: 2012, artistId: a[0].id });
  await db.insert(album)
    .values({ titel: "Silent Lines", jahr: 2015, artistId: a[0].id });

  const aeltestes = await db.select().from(album)
    .orderBy(asc(album.jahr)).limit(1);
  assertEquals(aeltestes.length, 1);
  assertEquals(aeltestes[0].titel, "Night Ferry");
  assertEquals(aeltestes[0].jahr, 2012);

  // SQL-Parametrisierung prüfen
  const toSql = db.select().from(album).orderBy(asc(album.jahr)).limit(1).toSQL();
  assertEquals(toSql.params, [1]);
});

Deno.test("HÜ 2.2: and + eq + like filtert Tracks eines Albums mit Titel-Anfang 'Echo'", async () => {
  const db = testDb();
  const a = await db.insert(artist)
    .values({ name: "Aera", gruendungsjahr: 1999 })
    .returning();
  const al1 = await db.insert(album)
    .values({ titel: "Silent Lines", jahr: 2015, artistId: a[0].id })
    .returning();
  const al2 = await db.insert(album)
    .values({ titel: "Night Ferry", jahr: 2012, artistId: a[0].id })
    .returning();

  await db.insert(track).values({ titel: "Silent Lines", dauerSek: 215, albumId: al1[0].id });
  await db.insert(track).values({ titel: "Echo Room", dauerSek: 187, albumId: al1[0].id });
  await db.insert(track).values({ titel: "Echo Waves", dauerSek: 200, albumId: al2[0].id }); // anderes Album!

  const echoAl1 = await db.select().from(track)
    .where(and(eq(track.albumId, al1[0].id), like(track.titel, "Echo%")));

  assertEquals(echoAl1.length, 1);
  assertEquals(echoAl1[0].titel, "Echo Room");
  assertEquals(echoAl1[0].albumId, al1[0].id);

  const { sql, params } = db.select().from(track)
    .where(and(eq(track.albumId, al1[0].id), like(track.titel, "Echo%")))
    .toSQL();
  assertEquals(params, [al1[0].id, "Echo%"]);
  assertEquals(sql.includes("like"), true);
});

Deno.test("HÜ 2.3: count + groupBy + innerJoin aggregiert Tracks pro Album", async () => {
  const db = testDb();
  const a = await db.insert(artist)
    .values({ name: "Aera", gruendungsjahr: 1999 })
    .returning();
  const al1 = await db.insert(album)
    .values({ titel: "Silent Lines", jahr: 2015, artistId: a[0].id })
    .returning();
  const al2 = await db.insert(album)
    .values({ titel: "Night Ferry", jahr: 2012, artistId: a[0].id })
    .returning();

  await db.insert(track).values({ titel: "Track 1", dauerSek: 100, albumId: al1[0].id });
  await db.insert(track).values({ titel: "Track 2", dauerSek: 200, albumId: al1[0].id });
  await db.insert(track).values({ titel: "Track 3", dauerSek: 300, albumId: al2[0].id });

  const agg = await db.select({ titel: album.titel, tracks: count() })
    .from(track)
    .innerJoin(album, eq(track.albumId, album.id))
    .groupBy(album.id)
    .orderBy(album.id);

  assertEquals(agg.length, 2);
  assertEquals(agg[0], { titel: "Silent Lines", tracks: 2 });
  assertEquals(agg[1], { titel: "Night Ferry", tracks: 1 });
});

Deno.test("HÜ 1: Vorhersage-Queries Verhalten & Parametrisierung", async () => {
  const db = testDb();
  await db.insert(artist).values({ name: "Aera", gruendungsjahr: 1999 });
  await db.insert(artist).values({ name: "Nova", gruendungsjahr: 2012 });

  // 1a)
  const qA = db.select().from(artist).where(eq(artist.gruendungsjahr, 1999));
  const resA = await qA;
  assertEquals(resA.length, 1);
  assertEquals(resA[0].name, "Aera");
  assertEquals(qA.toSQL().params, [1999]);

  // 1b)
  const qB = db.select({ n: count() }).from(album).where(eq(album.artistId, 1));
  const resB = await qB;
  assertEquals(resB[0].n, 0); // Noch kein Album fuer Artist 1
  assertEquals(qB.toSQL().params, [1]);
});
