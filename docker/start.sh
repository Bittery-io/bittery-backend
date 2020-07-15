#!/usr/bin/env bash
set -o errexit
echo 'Waiting for postgres to wake up 5 secs'
sleep 5
echo '###### [%s] Starting bittery-backend 1/3: running database migration started ######\n'
npm run db-migrate-up
echo '###### [%s] Starting bittery-backend 1/3: running database migration finished ######\n'
echo '###### [%s] Starting bittery-backend 2/3: copying static assets from src to dist started ######\n'
cp /src/domain/services/pdf/BITTERY.jpg /dist/domain/services/pdf/BITTERY.jpg
cp /src/domain/services/pdf/Lato-Regular.ttf /dist/domain/services/pdf/Lato-Regular.ttf
echo '###### [%s] Starting bittery-backend 2/3: copying static assets from src to dist finished ######\n'
echo '###### [%s] Starting bittery-backend 3/3: staring ecmr bittery-backend ######\n'
npm run start
