#!/bin/bash
export DB_USER=2ab2da5f-4eff-4dc6-ae1e-788b5449d4a3
export DB_PASSWORD="91af48cd-ac44-46ba-8fb5-f5c993587003"
export DB_HOST=bittery.io
export DB_PORT=5431
export DB_DATABASE=bitteryio_testnet

#Prod
#export DB_USER=2ab2da5f-4eff-4dc6-ae1e-788b5449d4a3
#export DB_PASSWORD=91af48cd-ac44-46ba-8fb5-f5c993587003
#export DB_HOST=bittery.io
#export DB_PORT=5431
#export DB_DATABASE=bitteryio_testnet
npm run db-migrate-reset
