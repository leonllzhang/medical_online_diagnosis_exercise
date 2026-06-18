#!/bin/sh
set -e

echo "Running database schema sync..."
npx prisma db push --accept-data-loss

echo "Seeding database..."
npx tsx prisma/seed.ts || echo "Seed may have already been applied"

echo "Starting application..."
exec "$@"
