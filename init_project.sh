#!/bin/bash

cd $(dirname $0)
source common.sh

# set dirs and files
mkdir -p log tigger amount http cookies captcha/archives 
touch user.list
chmod 777 log tigger amount http cookies captcha/archives captcha user.list
echo "qwerty163|wkj12345678" > user.list
echo "2878|/Info/T493000657/Front/InsideTwo/InsideTwo.aspx?Id=0CFA5440348BDE13" > car.list.debug

# set crontab
crontab -l > /tmp/cron.tmp
cat crontab.dat >> /tmp/cron.tmp
crontab /tmp/cron.tmp

# set dependences
apt-get install samba
apt-get install smbfs
apt-get install cifs-utils
apt-get install tesseract-ocr 
apt-get install heirloom-mailx
apt-get install imagemagick

mount.cifs //10.29.101.60/rongche_tigger /usr/local/apps/rongche/tigger -o user=root

