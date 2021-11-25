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
echo '[Bitcoin]' > lnd.conf
echo 'bitcoin.active=true' >> lnd.conf
echo 'bitcoin.testnet=true' >> lnd.conf
echo 'bitcoin.node=bitcoind' >> lnd.conf
# Zeby nie rezerwowal UTXO per kanał, przez to nie moge wyciagnac kasy
echo '[protocol]' >> lnd.conf
echo 'protocol.no-anchors=true' >> lnd.conf
echo '[Bitcoind]' >> lnd.conf
echo 'bitcoind.rpcuser='${BITCOIND_RPC_USER} >> lnd.conf
echo 'bitcoind.rpcpass='${BITCOIND_RPC_PASSWORD} >> lnd.conf
echo 'bitcoind.rpchost='${BITCOIND_RPC_HOST}':43783' >> lnd.conf
echo 'bitcoind.zmqpubrawblock=tcp://'${BITCOIND_RPC_HOST}':28334' >> lnd.conf
echo 'bitcoind.zmqpubrawtx=tcp://'${BITCOIND_RPC_HOST}':28335' >> lnd.conf
echo '[Application Options]' >> lnd.conf
# tymczasowo to komentuje, zobaczymy
# to zrobilem po to zeby z getinfo mieć uris=[pubkey@ip:port] a nie pubkey@0.0.0.0:port
#echo 'externalip=0.0.0.0:9735' >> lnd.conf
echo 'externalip='${LND_IP}':9735' >> lnd.conf
echo 'listen=0.0.0.0:9735' >> lnd.conf
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

chmod u+rwx $PWD/docker-compose.yaml
# Sometimes due to probably race conditions (restarted 2 time very fast) - 2 networks are created
# it should not cause problems until there is single docker-compose.yaml
docker network prune --force
docker-compose -f $PWD/docker-compose.yaml down
docker-compose -f $PWD/docker-compose.yaml up -d

# Is is incorrect docker-compose up handler (no matter what the reason)
# It will restart docker.service and try to up again
COUNTER_LIMIT=2
COUNTER=0
while [ ! -d "$PWD/volumes/nginx/conf" ]
do
  sleep 5
  COUNTER=$((COUNTER+1));
  if [[ $COUNTER -eq $COUNTER_LIMIT ]]; then
    systemctl restart docker.service
    docker-compose -f $PWD/docker-compose.yaml up -d
    COUNTER=0
    # counter limit should be now longer
    COUNTER_LIMIT=$((COUNTER_LIMIT+5))
  fi
done
cp $PWD/lnd.nginx.conf $PWD/volumes/nginx/conf/lnd.nginx.conf
docker exec -t nginx sh -c 'nginx -s reload' 2>&1
