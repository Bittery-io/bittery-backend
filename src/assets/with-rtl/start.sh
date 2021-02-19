#!/bin/bash
PWD=$(dirname "$0")
BITCOIND_RPC_HOST="$1"
BITCOIND_RPC_USER="$2"
BITCOIND_RPC_PASSWORD="$3"
export LND_HOSTED_VERSION="$4"
export RTL_HOSTED_VERSION="$5"
export LND_IP="$6"
LN_ALIAS="$7"
WUMBO_CHANNELS="$8"
export RTL_INIT_PASSWORD="$9"

###############################
# create lnd.conf
export BITCOIND_RPC_HOST=bittery.io
echo '[Bitcoin]' > lnd.conf
echo 'bitcoin.active=1' >> lnd.conf
echo 'bitcoin.mainnet=1' >> lnd.conf
echo 'bitcoin.node=bitcoind' >> lnd.conf
echo '[Bitcoind]' >> lnd.conf
echo 'bitcoind.rpcuser='${BITCOIND_RPC_USER} >> lnd.conf
echo 'bitcoind.rpcpass='${BITCOIND_RPC_PASSWORD} >> lnd.conf
echo 'bitcoind.rpchost='${BITCOIND_RPC_HOST}':43783' >> lnd.conf
echo 'bitcoind.zmqpubrawblock=tcp://'${BITCOIND_RPC_HOST}':28334' >> lnd.conf
echo 'bitcoind.zmqpubrawtx=tcp://'${BITCOIND_RPC_HOST}':28335' >> lnd.conf
echo '[Application Options]' >> lnd.conf
echo 'listen=0.0.0.0:9735' >> lnd.conf
echo 'externalip=0.0.0.0:9735' >> lnd.conf
echo 'rpclisten=0.0.0.0:10009' >> lnd.conf
echo 'tlsextraip='${LND_IP} >> lnd.conf
echo 'restlisten=0.0.0.0:8080' >> lnd.conf

if [ "$LN_ALIAS" != "NO_LN_ALIAS" ]; then
  echo 'alias="'$LN_ALIAS'"' >> lnd.conf
fi
if [ "$WUMBO_CHANNELS" = "true" ]; then
  echo '[protocol]' >> lnd.conf
  echo 'protocol.wumbo-channels=1' >> lnd.conf
fi
mkdir -p $PWD/volumes/lnd/
mv $PWD/lnd.conf $PWD/volumes/lnd/lnd.conf
###############################

# Set RTL init password in config
# if file was not already moved and init with password
if [ -f "$PWD/RTL-Config.json" ]; then
  mkdir -p ./volumes/rtl/config
  echo "$(sed -e "s/\$RTL_INIT_PASSWORD/${RTL_INIT_PASSWORD}/g" \
  $PWD/RTL-Config.json | sed -e $'s/\\\\n/\\\n        /g')" > $PWD/RTL-Config.json
  mv $PWD/RTL-Config.json $PWD/volumes/rtl/config/RTL-Config.json
fi
sleep 10
chmod u+rwx /root/docker-compose.user.with.rtl.yaml
docker-compose -f /root/docker-compose.user.with.rtl.yaml down
docker-compose -f /root/docker-compose.user.with.rtl.yaml up -d
cp $PWD/lnd.nginx.conf $PWD/volumes/nginx/conf/lnd.nginx.conf


sleep 2
docker exec -t nginx sh -c 'nginx -s reload' 2>&1
