#!/bin/sh
set -e

# Fix permissions for the data directory if running as root
if [ "$(id -u)" = "0" ]; then
  echo "[entrypoint] Fixing /app/data permissions..."
  mkdir -p /app/data
  chown -R nextjs:nodejs /app/data
  chmod 755 /app/data
  echo "[entrypoint] Permissions fixed. Dropping to nextjs user..."
  exec su-exec nextjs "$@"
else
  exec "$@"
fi
