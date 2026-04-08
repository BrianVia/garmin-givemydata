#!/bin/bash
# Garmin data sync (every 30 min via cron)
# 1. Fetch from Garmin Connect → local SQLite
# 2. Push recent data → Cloudflare D1
# 3. Push granular sleep detail → D1

cd /home/via/Development/Personal/garmin-givemydata
.venv/bin/python -m garmin_mcp.sync >> /tmp/garmin-sync.log 2>&1

# Push to D1 (only if sync succeeded)
if [ $? -eq 0 ]; then
    .venv/bin/python sync_to_d1.py >> /tmp/garmin-sync.log 2>&1
    .venv/bin/python sync_sleep_detail.py >> /tmp/garmin-sync.log 2>&1
    .venv/bin/python sync_intraday.py >> /tmp/garmin-sync.log 2>&1
fi
