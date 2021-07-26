#!/bin/bash
#IT IS EXACTLY THE SAME FILE CONTENT FOR RTL AND NON-RTL VERSION
PWD=$(dirname "$0")
docker-compose -f $PWD/docker-compose.yaml down
# move tls.cert and tls.key to main folder - later will restore it
mv $PWD/volumes/lnd/tls.cert $PWD/tls.cert
mv $PWD/volumes/lnd/tls.key $PWD/tls.key
rm -rf $PWD/volumes/lnd
