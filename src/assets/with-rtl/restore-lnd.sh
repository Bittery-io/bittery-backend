#!/bin/bash
#IT IS EXACTLY THE SAME FILE CONTENT FOR RTL AND NON-RTL VERSION
RESTORE_LND_TAR_GZ_FILE=$1
NEW_IP_ADDRESS=$2
PWD=$(dirname "$0")
mkdir -p $PWD/volumes/lnd
tar zxvf $PWD/$RESTORE_LND_TAR_GZ_FILE -C $PWD/volumes/lnd
# 1. Restore new tls.cert and tls.key (initialized as new) for old .lnd
# certs must be regenerated anyway for new IP
rm $PWD/volumes/lnd/tls.cert
rm $PWD/volumes/lnd/tls.key
# restore tls.cert tls.key from removed lnd folder
mv $PWD/tls.cert $PWD/volumes/lnd/tls.cert
mv $PWD/tls.key $PWD/volumes/lnd/tls.key
# 1. Replace externalip= and tlsextraip with new IP addresses
sed -i "/externalip=/c\externalip=$NEW_IP_ADDRESS:9735"  $PWD/volumes/lnd/lnd.conf
sed -i "/tlsextraip=/c\tlsextraip=$NEW_IP_ADDRESS"  $PWD/volumes/lnd/lnd.conf
