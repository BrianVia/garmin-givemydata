#!/bin/bash
# Hourly Garmin data sync — run via cron
# Crontab entry: 0 * * * * /home/via/Development/Personal/garmin-givemydata/sync_cron.sh

cd /home/via/Development/Personal/garmin-givemydata
.venv/bin/python -m garmin_mcp.sync >> /tmp/garmin-sync.log 2>&1
