import { Hono } from "hono";
import type { Env } from "../server";

export const activityRoutes = new Hono<Env>();

// GET /api/activities
activityRoutes.get("/", async (c) => {
  const type = c.req.query("type");
  const start = c.req.query("start");
  const end = c.req.query("end");
  const limit = parseInt(c.req.query("limit") || "50", 10);
  const offset = parseInt(c.req.query("offset") || "0", 10);

  const conditions: string[] = ["activity_type IS NOT NULL AND activity_type != ''"];
  const params: (string | number)[] = [];
  let idx = 1;

  if (type) {
    conditions.push(`LOWER(activity_type) = LOWER(?${idx})`);
    params.push(type);
    idx++;
  }
  if (start) {
    conditions.push(`DATE(start_time_local) >= ?${idx}`);
    params.push(start);
    idx++;
  }
  if (end) {
    conditions.push(`DATE(start_time_local) <= ?${idx}`);
    params.push(end);
    idx++;
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  params.push(limit, offset);

  const rows = await c.env.DB.prepare(
    `SELECT
      activity_id AS id,
      activity_name AS name,
      activity_type AS type,
      start_time_local AS date,
      ROUND(duration_seconds / 60.0, 1) AS duration_min,
      ROUND(distance_meters / 1000.0, 2) AS distance_km,
      calories,
      ROUND(average_hr, 0) AS avg_hr,
      ROUND(max_hr, 0) AS max_hr,
      ROUND(elevation_gain, 0) AS elevation_gain_m,
      ROUND(avg_power, 0) AS avg_power_w,
      ROUND(training_load, 1) AS training_load,
      ROUND(aerobic_training_effect, 1) AS aerobic_te,
      location_name AS location
    FROM activity
    ${where}
    ORDER BY start_time_local DESC
    LIMIT ?${idx} OFFSET ?${idx + 1}`
  )
    .bind(...params)
    .all();

  return c.json(rows.results);
});

// GET /api/activities/types
activityRoutes.get("/types", async (c) => {
  const rows = await c.env.DB.prepare(
    `SELECT DISTINCT activity_type AS type, COUNT(*) AS count
    FROM activity
    WHERE activity_type IS NOT NULL AND activity_type != ''
    GROUP BY activity_type ORDER BY count DESC`
  ).all();
  return c.json(rows.results);
});

// GET /api/activities/:id
activityRoutes.get("/:id", async (c) => {
  const id = c.req.param("id");
  const db = c.env.DB;

  const [activity, splits, hrZones, weather, sets] = await Promise.all([
    db
      .prepare(
        `SELECT activity_id AS id, activity_name AS name, activity_type AS type,
          start_time_local AS date, duration_seconds, elapsed_duration_seconds,
          moving_duration_seconds, distance_meters, calories, bmr_calories,
          average_hr, max_hr, average_speed, max_speed,
          elevation_gain, elevation_loss, min_elevation, max_elevation,
          avg_power, max_power, norm_power,
          training_stress_score, intensity_factor,
          aerobic_training_effect, anaerobic_training_effect,
          vo2max_value, avg_cadence, max_cadence, avg_respiration,
          training_load, location_name,
          start_latitude, start_longitude
        FROM activity WHERE activity_id = ?1`
      )
      .bind(id)
      .first(),
    db
      .prepare(
        `SELECT split_number, distance_meters, duration_seconds,
          average_speed, average_hr, max_hr, elevation_gain, elevation_loss, avg_cadence
        FROM activity_splits WHERE activity_id = ?1 ORDER BY split_number`
      )
      .bind(id)
      .all(),
    db.prepare(`SELECT * FROM activity_hr_zones WHERE activity_id = ?1`).bind(id).first(),
    db.prepare(`SELECT * FROM activity_weather WHERE activity_id = ?1`).bind(id).first(),
    db
      .prepare(
        `SELECT set_number, exercise_name, exercise_category, reps, weight, duration_seconds
        FROM activity_exercise_sets WHERE activity_id = ?1 ORDER BY set_number`
      )
      .bind(id)
      .all(),
  ]);

  if (!activity) return c.json({ error: "Activity not found" }, 404);

  return c.json({
    activity,
    splits: splits.results,
    hr_zones: hrZones,
    weather,
    exercise_sets: sets.results,
  });
});
