import postgres from "postgres";

/**
 * Single Postgres client for all data access, pointed at the Supabase
 * session pooler. Connects as the `postgres` role, which bypasses RLS —
 * authorization is enforced in the API layer (see `lib/auth.ts`).
 */
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Copy .env.example to .env.local.");
}

// Parse int8 (bigint) columns to plain numbers so ids and COUNT(*) behave
// like they did under better-sqlite3. Our ids stay well within Number range.
const int8AsNumber = {
  to: 20,
  from: [20] as number[],
  serialize: (x: number | string) => String(x),
  parse: (x: string) => Number(x),
};

// Return date / timestamp columns as plain strings (like the old SQLite TEXT
// columns) instead of JS Date objects, so pages can `.slice(0, 10)` them and
// render them directly. OIDs: date, time, timestamp, timestamptz.
const dateAsString = {
  to: 1184,
  from: [1082, 1083, 1114, 1184] as number[],
  serialize: (x: string) => x,
  parse: (x: string) => x,
};

const globalForDb = globalThis as unknown as { sql?: ReturnType<typeof postgres> };

const sql =
  globalForDb.sql ??
  postgres(connectionString, {
    prepare: false,
    max: 5,
    idle_timeout: 20,
    types: { int8: int8AsNumber, date: dateAsString },
  });

if (process.env.NODE_ENV !== "production") globalForDb.sql = sql;

export default sql;
