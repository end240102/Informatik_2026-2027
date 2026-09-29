import { prisma } from "./db.ts";

export { prisma };

export async function createBeispiel(name: string) {
  return await prisma.beispiel.create({
    data: { name },
  });
}

export async function getAllBeispiele() {
  return await prisma.beispiel.findMany();
}

export function handler(req: Request): Response {
  const url = new URL(req.url);

  if (url.pathname === "/api") {
    return Response.json({
      message: "Hello, world!",
      time: new Date().toISOString(),
    });
  }

  return new Response("<h1>Welcome to Deno!</h1>", {
    headers: { "content-type": "text/html" },
  });
}

if (import.meta.main) {
  console.log("Prisma SQLite Demo gestartet.");
  const count = await prisma.beispiel.count();
  console.log(`Aktuelle Datensätze in dev.db: ${count}`);
  if (count === 0) {
    const neu = await createBeispiel("Erster Eintrag");
    console.log("Neuen Eintrag angelegt:", neu);
  }
  const alle = await getAllBeispiele();
  console.log("Vorhandene Datensätze:", alle);
}
