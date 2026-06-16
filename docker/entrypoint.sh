#!/bin/sh
set -e

echo "Running database push (schema sync)..."
npx prisma db push --accept-data-loss

echo "Seeding database..."
npx prisma db seed || echo "Seed may have already been applied"

echo "Starting application..."
exec "$@"
