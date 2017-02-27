#!/bin/bash

cd $(dirname $0)
source common.sh
doLog "Start"

if [ $# != 1 ];then
	doLog "Usage: $SCRIPT [USERNAME]"
	exit
fi

USER=$1
COOKIE_FILE="cookies/$(ls cookies/|grep $USER|tail -n 1)"

if [ ! -f $COOKIE_FILE ];then
	doLog "User $USER not login"
	exit
fi

doLog "profile request, user=$USER get amount"
curl -b $COOKIE_FILE 'https://www.zecaifu.com/profile/myAccountPie' -H 'Accept-Encoding: gzip, deflate, sdch' -H 'Accept-Language: zh-CN,zh;q=0.8' -H 'User-Agent: Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2490.80 Safari/537.36' -H 'Accept: */*' -H 'Referer: https://www.zecaifu.com/profile' -H 'X-Requested-With: XMLHttpRequest' -H 'Connection: keep-alive' -H 'Cache-Control: max-age=0' --compressed|awk -F'"' '{print $2}' > amount/$USER
doLog "profile response, user=$USER amount=$(cat amount/$USER)"
doLog "Exit"
