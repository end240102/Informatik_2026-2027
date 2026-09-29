import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "./generated/prisma/client.ts";

const dbUrl = Deno.env.get("DATABASE_URL") ?? "file:./prisma/dev.db";
const adapter = new PrismaLibSql({ url: dbUrl });
export const prisma = new PrismaClient({ adapter });
