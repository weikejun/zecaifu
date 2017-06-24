#!/bin/bash

cd $(dirname $0)
source common.sh
doLog "Start"

FNAME=$1
IMG_FILE="www/captcha/$FNAME.gif"

if [ "$(file --mime-type $IMG_FILE |awk '{print $2}')" != "image/gif" ];then
	doLog "Error gif, $IMG_FILE"
	exit
fi
convert $IMG_FILE -resize 200x60 /tmp/$FNAME.tif > /dev/null
tesseract /tmp/$FNAME.tif /tmp/$FNAME -l zecaptcha -psm 6 > /dev/null
CAPTCHA=$(cat /tmp/$FNAME.txt) 
echo -n $CAPTCHA > www/captcha/$FNAME.res
touch $IMG_FILE
doLog "OCR $f ok, res=$CAPTCHA"

doLog "Exit"
