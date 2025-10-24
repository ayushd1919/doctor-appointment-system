#!/usr/bin/env sh
set -e

# Wait for Postgres to be available (basic)
# env vars expected in backend/.env or passed via docker-compose env_file
DB_HOST=${DB_HOST:-db}
DB_PORT=${DB_PORT:-5432}

echo "Waiting for postgres at ${DB_HOST}:${DB_PORT}..."
until nc -z "$DB_HOST" "$DB_PORT"; do
  echo "Postgres unavailable - sleeping 1s"
  sleep 1
done

# Run migrations (idempotent) and seed
# Use ts-node CLI only if built? We have compiled dist; migrations use typeorm CLI in built environment
# If your project uses TypeORM CLI with ts-node in dev, ensure compiled migrations exist under dist/migrations
if [ -f ./node_modules/.bin/typeorm ]; then
  echo "Running migrations..."
  # If using JS migrations in dist:
  ./node_modules/.bin/typeorm migration:run -d ./dist/ormconfig.js || true
else
  echo "typeorm CLI not present — skipping migration run. Make sure migrations were applied during build."
fi

# Run seed script if exists (compiled into dist)
if [ -f ./dist/src/seed.js ]; then
  echo "Seeding database (if not already seeded)..."
  node ./dist/src/seed.js || true
else
  # If seed.ts not compiled or different path, try npm script
  if npm run | grep -q seed; then
    npm run seed || true
  else
    echo "No seed script found. Skipping."
  fi
fi

echo "Starting backend..."
exec "$@"
