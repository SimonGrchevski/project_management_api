#!/bin/sh

#Dont rush now
./wait-for-it.sh db:3306 -- echo "Database is ready!"

#Migrate it
# npm run typeorm migration:run -- -d ./dist/data-source.js

# Shoot
npm run dev
