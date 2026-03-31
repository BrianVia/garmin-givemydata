#!/bin/bash
# Start the Garmin MCP server for Poke (HTTP transport)
cd /home/via/Development/Personal/garmin-givemydata
MCP_TRANSPORT=http exec .venv/bin/python -m garmin_mcp.server
