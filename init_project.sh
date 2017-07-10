#!/bin/bash

cd $(dirname $0)
source common.sh

# set dirs and files
mkdir -p log amount http cookies www/captcha/archives www/captcha/login /tmp/login
touch user.list
touch config/strategy.dat
chmod 777 log amount http cookies www/captcha/archives www/captcha/login /tmp/login
chmod 666 user.list config/strategy.dat
#echo "13811311608|Wkj12345678|bababu523|78250611@qq.com" > user.list

# set crontab
crontab -l > /tmp/cron.tmp
cat config/crontab.dat >> /tmp/cron.tmp
crontab /tmp/cron.tmp

# set dependences
apt install nodejs
apt install npm
apt install imagemagick
#apt install tesseract-ocr
apt install php7.0-gd
