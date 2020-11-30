#!/bin/bash
PWD=$(dirname "$0")
chmod u+rwx /root/docker-compose.user.without.rtl.yaml
docker-compose -f /root/docker-compose.user.without.rtl.yaml down
docker-compose -f /root/docker-compose.user.without.rtl.yaml up -d

cp $PWD/lnd.nginx.conf $PWD/volumes/nginx/conf/lnd.nginx.conf
sleep 1
echo "Started all LNDs. Reloading nginx"
# Reload running nginx configuration
docker exec -t nginx sh -c 'nginx -s reload' 2>&1
sleep 5
