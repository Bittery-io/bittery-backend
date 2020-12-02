#!/bin/bash
PWD=$(dirname "$0")
export BITCOIND_RPC_HOST=$1
export BITCOIND_RPC_USER=$2
export BITCOIND_RPC_PASSWORD=$3
export LND_HOSTED_VERSION=$4
export RTL_HOSTED_VERSION=$5
export RTL_INIT_PASSWORD=$6

# Set RTL init password in config
echo "$(sed -e "s/\$RTL_INIT_PASSWORD/${RTL_INIT_PASSWORD}/g" \
$PWD/RTL-Config.json | sed -e $'s/\\\\n/\\\n        /g')" > $PWD/RTL-Config.json

chmod u+rwx /root/docker-compose.user.with.rtl.yaml
docker-compose -f /root/docker-compose.user.with.rtl.yaml down
docker-compose -f /root/docker-compose.user.with.rtl.yaml up -d
cp $PWD/lnd.nginx.conf $PWD/volumes/nginx/conf/lnd.nginx.conf

# if file was not already moved and init with password
if [ -f "$PWD/RTL-Config.json" ]; then
  mkdir -p ./volumes/rtl/config
  mv $PWD/RTL-Config.json $PWD/volumes/rtl/config/RTL-Config.json
fi

sleep 5
echo "Started all LNDs. Reloading nginx"
# Reload running nginx configuration
docker exec -t nginx sh -c 'nginx -s reload' 2>&1
sleep 5
