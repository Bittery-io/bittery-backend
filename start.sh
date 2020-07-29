#!/bin/bash
export DB_USER=master
export DB_PASSWORD=ofpuppets
export DB_HOST=localhost
export DB_PORT=5431
export DB_DATABASE=bitteryio
export BITTERY_INFRASTRUCTURE_PATH=/home/peer/Programowanie/bittery/bittery-infrastructure
export ENCRYPTION_PASSWORD_SALT_ROUNDS=8
export OAUTH2_TOKEN_CLIENT_SECRET=u8eFLaz_oXsB
export SESSION_EXPIRES_IN_HOURS=1
export AUTH_EXCLUDED_URLS="['/auth/refreshToken','/user/register','/user/login','/public']"
export RTL_URL=/rtl
export BTCPAY_URL=http://localhost
export SUDO_PASS=http://localhost

npm run lint
npm run compile
npm run start
