#!/bin/bash
#IT IS EXACTLY THE SAME FILE CONTENT FOR RTL AND NON-RTL VERSION
# Argument 1: timestamp - provide backup name. It will be generate as BACKUP_NAME.tar.gz
BACKUP_NAME=$1
PWD=$(dirname "$0")
mkdir -p $PWD/backups
docker-compose -f $PWD/docker-compose.yaml down
# package only contents of .lnd directory
tar -zcvf $PWD/backups/$BACKUP_NAME.tar.gz -C $PWD/volumes/lnd .
echo 'Backup succeed'
