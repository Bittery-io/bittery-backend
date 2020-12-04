#!/bin/bash
PWD=$(dirname "$0")
export BITCOIND_RPC_USER=dupa jasia
export BITCOIND_RPC_HOST=bittery.io
echo 'bitcoin.active=true' > lnd.conf
echo 'bitcoin.mainnet=true' >> lnd.conf
echo 'rpclisten=0.0.0.0:10009' >> lnd.conf
echo 'bitcoind.rpcuser='${BITCOIND_RPC_USER} >> lnd.conf
echo 'bitcoind.rpcpass='${BITCOIND_RPC_PASSWORD} >> lnd.conf
echo 'bitcoind.rpchost='${BITCOIND_RPC_HOST}':43783' >> lnd.conf
echo 'bitcoind.zmqpubrawblock=tcp://'${BITCOIND_RPC_HOST}':28334' >> lnd.conf
echo 'bitcoind.zmqpubrawtx=tcp://'${BITCOIND_RPC_HOST}':28335' >> lnd.conf
echo 'tlsextraip='${LND_IP} >> lnd.conf
echo 'restlisten=0.0.0.0:8080' >> lnd.conf

LN_ALIAS=$1
if [ "$LN_ALIAS" != "NO_LN_ALIAS" ]; then
  echo 'alias="'$LN_ALIAS'"' >> lnd.conf
fi
WUMBO_CHANNEL=$1
if [ "$WUMBO_CHANNEL" = "true" ]; then
  echo 'protocol.wumbo-channels=true' >> lnd.conf
fi
