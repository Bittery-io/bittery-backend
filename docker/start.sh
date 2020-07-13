#!/usr/bin/env bash
set -o errexit
echo 'Waiting for postgres to wake up 10 secs'
sleep 10
echo '###### [%s] Starting bittery-backend 1/2: running database migration started ######\n'
npm run db-migrate-up
echo '###### [%s] Starting bittery-backend 1/2: running database migration finished ######\n'
echo '###### [%s] Starting bittery-backend 2/2: staring ecmr bittery-backend ######\n'
npm run start
