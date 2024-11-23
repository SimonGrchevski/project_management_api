#!/bin/sh

echo "Waiting for the database to be ready..."
./wait-for-it.sh db:3306 -- echo "Database is ready!"


if [ "$NODE_ENV" != "production" ]; then
    echo "Running migrations in development..."
    npm run typeorm -- migration:run -d ./dist/data-source.js
fi

# Shoot
npm run dev
