
import "dotenv/config";
import { readFile } from "node:fs/promises";
import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  throw new Error("Turso credentials are missing");
}

const client = createClient({ url, authToken });

try {
  let sql = await readFile("turso-schema.sql", "utf8");

  sql = sql
    .replace(/^\uFEFF/, "")
    .replaceAll(
      "ON DELETE RESTRICTON UPDATE CASCADE",
      "ON DELETE RESTRICT ON UPDATE CASCADE"
    );

  await client.executeMultiple(sql);

  console.log("SUCCESS: Turso database tables created!");
} catch (error) {
  console.error("DATABASE ERROR:", error);
} finally {
  client.close();
}
