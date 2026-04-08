import { Hono } from "hono";
import type { Env } from "../server";

export const metaRoutes = new Hono<Env>();

metaRoutes.get("/", async (c) => {
  const db = c.env.DB;

  const tables = await db
    .prepare(
      `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' ORDER BY name`
    )
    .all();

  const counts: Record<string, number> = {};
  for (const t of tables.results) {
    const row = await db.prepare(`SELECT COUNT(*) as count FROM "${t.name}"`).first();
    counts[t.name as string] = (row?.count as number) ?? 0;
  }

  const lastSync = await db
    .prepare(`SELECT sync_date, records_upserted FROM sync_log ORDER BY id DESC LIMIT 1`)
    .first();

  const dateRange = await db
    .prepare(
      `SELECT MIN(calendar_date) as earliest, MAX(calendar_date) as latest FROM daily_summary`
    )
    .first();

  return c.json({
    tables: counts,
    last_sync: lastSync ?? null,
    date_range: dateRange ?? null,
  });
});
