#!/bin/bash

cd $(dirname $0)
source common.sh

# set dirs and files
mkdir -p log amount http cookies  
touch user.list
touch config/strategys.dat
chmod 777 log amount http cookiest
chmod 666 user.list config/strategy.dat
echo "13811311608|Wkj12345678|bababu523|78250611@qq.com" > user.list

# set crontab
crontab -l > /tmp/cron.tmp
cat config/crontab.dat >> /tmp/cron.tmp
crontab /tmp/cron.tmp

# set dependences
apt install nodejs
apt install npm
