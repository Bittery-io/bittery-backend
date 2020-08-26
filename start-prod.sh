#!/bin/bash
export APP_PORT=3001
export DB_HOST=localhost
# CHANGE IT
export DB_USER=master
# CHANGE IT
export DB_DATABASE=bitteryio
# CHANGE IT
export DB_PASSWORD=ofpuppets
export DB_PORT=5431
export BITTERY_INFRASTRUCTURE_PATH=/home/pzet/bittery-infrastructure
export ENCRYPTION_PASSWORD_SALT_ROUNDS=8
# CHANGE IT
export OAUTH2_TOKEN_CLIENT_SECRET=1bdb8fba-2088-4cac-b44f-e7089d717419
export SESSION_EXPIRES_IN_HOURS=1
export RTL_URL=/rtl
export BTCPAY_URL=https://btcpay.bittery.io
export CLIENT_URL_ADDRESS=https://app.bittery.io
export IS_DEVELOPMENT_ENV=false
# CHANGE IT
export MAILGUN_API_KEY=9f5866cc80a8850ea8dde149cb869c94-1b6eb03d-9e643989
export BTCPAY_ADMIN_LOGIN=peerzet3@gmail.com
# CHANGE IT
export BTCPAY_ADMIN_PASSWORD=a8fc6d30-dc17-11ea-87d0-0242ac130003
export PASSWORD_RESET_LINK_VALIDITY_HOURS=4
export PASSWORD_RESET_EMAIL_HOURS_MEASURE_PERIOD_HOURS=24
export PASSWORD_RESET_EMAIL_MEASURE_PERIOD_LIMIT=2
export REGISTRATION_ENABLED=true
export LOGIN_ENABLED=true
export CREATE_INVOICE_ENABLED=true
export BTCPAY_PAYMENT_EXPIRATION_MINUTES=34560

npm run lint
npm run compile
npm run copy-static-assets
npm run start
