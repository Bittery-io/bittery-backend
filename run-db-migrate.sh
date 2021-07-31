#!/bin/bash
export DB_USER=master
export DB_PASSWORD=ofpuppets
export DB_HOST=localhost
export DB_PORT=5431
export DB_DATABASE=bitteryio_testnet
npm run db-migrate-up
