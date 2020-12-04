#!/bin/bash
PWD=$(dirname "$0")
export LND_ENTRYPOINT=$1
export LND_HOSTED_VERSION=$2
export RTL_HOSTED_VERSION=$3
export RTL_INIT_PASSWORD=$4

chmod u+rwx /root/docker-compose.user.without.rtl.yaml
cp $PWD/lnd.nginx.conf $PWD/volumes/nginx/conf/lnd.nginx.conf

sleep 2
docker exec -t nginx sh -c 'nginx -s reload' 2>&1
