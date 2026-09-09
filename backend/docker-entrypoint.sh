#!/bin/sh
set -e

echo "=== Adyapan HMS Backend Initializing ==="

# Synchronize Prisma schema with the PostgreSQL database
echo "Applying database schema..."
if [ -d "prisma/migrations" ] && [ "$(ls -A prisma/migrations 2>/dev/null)" ]; then
  echo "Running prisma migrate deploy..."
  npx prisma migrate deploy || npx prisma db push
else
  echo "No migration files found; running prisma db push..."
  npx prisma db push
fi

# Optional database seeding (runs if SEED_ON_BOOT=true or if first boot)
if [ "$SEED_ON_BOOT" = "true" ]; then
  echo "Running database seed..."
  node prisma/seed.js || echo "Seeding skipped or already applied."
fi

echo "=== Starting Node.js Server ==="
exec "$@"
