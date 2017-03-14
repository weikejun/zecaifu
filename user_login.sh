#!/bin/bash

cd $(dirname $0)
source common.sh
doLog "Start"

if [ $# != 2 ];then
	doLog "Usage: $(basename $0) [USERNAME] [PASSWORD]"
	exit
fi

USER=$1
PASS=$2
FILE_NAME=$(ls cookies/|grep $USER|grep -v "login"|tail -n 1)
if [ "$FILE_NAME" != "" ]; then
	doLog "login aready, user=$USER"
	exit
fi

COOKIE_FILE_LOGIN="cookies/$USER""_$(date +%s%N)_login"
COOKIE_FILE="cookies/$USER""_$(date +%s%N)"
HTTP_FILE="http/user_login_$USER.http"

doLog "login show request, get token, user=$USER"
curl -D $COOKIE_FILE_LOGIN 'https://www.zecaifu.com/login' -H 'Accept-Encoding: gzip, deflate, sdch' -H 'Accept-Language: zh-CN,zh;q=0.8' -H 'Upgrade-Insecure-Requests: 1' -H 'User-Agent: Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2490.80 Safari/537.36' -H 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8' -H 'Referer: https://www.zecaifu.com/' -H 'Connection: keep-alive' -H 'Cache-Control: max-age=0' --compressed > $HTTP_FILE
TOKEN=$(cat $HTTP_FILE|grep "_token"|head -n 1|sed -r "s/ //g"|awk -F'"' '{print $6}')

doLog "login post request, submit login, user=$USER, token=$TOKEN"
curl -b $COOKIE_FILE_LOGIN -D $COOKIE_FILE 'https://www.zecaifu.com/login' -H 'Origin: https://www.zecaifu.com' -H 'Accept-Encoding: gzip, deflate' -H 'Accept-Language: zh-CN,zh;q=0.8' -H 'Upgrade-Insecure-Requests: 1' -H 'User-Agent: Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2490.80 Safari/537.36' -H 'Content-Type: application/x-www-form-urlencoded' -H 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8' -H 'Cache-Control: max-age=0' -H 'Referer: https://www.zecaifu.com/login' -H 'Connection: keep-alive' --data "_token=$TOKEN&username=$USER&password=$PASS&button=%E7%99%BB%E5%BD%95" --compressed >> $HTTP_FILE

doLog "Exit"
