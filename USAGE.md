# MCP Tools Reference

## Available Tools

| Tool | Description |
|---|---|
| `garmin_sync()` | Trigger an on-demand data refresh from Garmin Connect |
| `garmin_schema()` | Show all tables, columns, and row counts |
| `garmin_query(sql)` | Run a custom SELECT query against the database |
| `garmin_health_summary(start_date, end_date, days)` | Health overview for a date range (defaults to last 7 days) |
| `garmin_activities(activity_type, start_date, end_date, limit)` | Query activities with optional filters |
| `garmin_trends(metric, period)` | Trend data aggregated by week or month |

## Syncing Data

Data syncs automatically every 30 minutes via cron. To request a fresh sync on demand, call the `garmin_sync` tool — no parameters needed.

Example response:

```json
{
  "status": "success",
  "result": {
    "target_date": "2026-04-07",
    "yesterday": "2026-04-06",
    "total_upserted": 392,
    "records": { "heart_rate": 2, "sleep": 2, "steps": 2, "..." : "..." }
  }
}
```

## Example Queries

### Recent resting heart rate
```
garmin_query(sql="SELECT calendar_date, resting_hr FROM daily_summary ORDER BY calendar_date DESC LIMIT 7")
```

### Sleep data for the past week
```
garmin_health_summary(days=7)
```

### Running activities this month
```
garmin_activities(activity_type="running", start_date="2026-04-01")
```

### Weekly step trends
```
garmin_trends(metric="steps", period="week")
```
