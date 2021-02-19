#!/bin/bash
apt-get install docker-compose
# Restart systemd-resolved.service for proper dns
systemctl stop systemd-resolved.service
systemctl disable systemd-resolved.service
rm /etc/resolv.conf
touch /etc/resolv.conf
echo 'nameserver 8.8.8.8' > /etc/resolv.conf
systemctl restart docker.service
