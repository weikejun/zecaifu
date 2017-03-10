#!/bin/bash

cd $(dirname $0)
source common.sh

# set dirs and files
mkdir -p log tigger amount http cookies  
touch user.list
chmod 777 log tigger amount http cookies user.list
echo "13811311608|Wkj12345678" > user.list

# set crontab
crontab -l > /tmp/cron.tmp
cat config/crontab.dat >> /tmp/cron.tmp
crontab /tmp/cron.tmp

# set dependences
apt install nodejs
