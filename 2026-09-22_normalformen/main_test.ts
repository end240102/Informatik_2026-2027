import { assertEquals, assertExists } from "@std/assert";
import { handler, createBeispiel, getAllBeispiele, prisma } from "./main.ts";

Deno.test("returns html on /", async () => {
  const res = handler(new Request("http://localhost/"));
  assertEquals(res.headers.get("content-type"), "text/html");
  const body = await res.text();
  assertEquals(body.includes("Welcome to Deno"), true);
});

Deno.test("returns json on /api", async () => {
  const res = handler(new Request("http://localhost/api"));
  const data = await res.json();
  assertEquals(data.message, "Hello, world!");
  assertEquals(typeof data.time, "string");
});

Deno.test("prisma database create and read", async () => {
  const testName = `Test-${Date.now()}`;
  const created = await createBeispiel(testName);
  assertExists(created.id);
  assertEquals(created.name, testName);

  const all = await getAllBeispiele();
  const found = all.find((item) => item.name === testName);
  assertExists(found);
  assertEquals(found.id, created.id);

  // Aufräumen
  await prisma.beispiel.delete({ where: { id: created.id } });
  await prisma.$disconnect();
});
