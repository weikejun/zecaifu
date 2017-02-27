#!/bin/bash

cd $(dirname $0)
source common.sh
doLog "Start"

declare -A IDS=();
doLog "Create detectors"
while [ 1 -eq 1 ];do
	ID_DATA=$(curl 'https://www.zecaifu.com/list/car/run' -H 'Accept-Encoding: gzip, deflate, sdch' -H 'Accept-Language: zh-CN,zh;q=0.8' -H 'Upgrade-Insecure-Requests: 1' -H 'User-Agent: Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2490.80 Safari/537.36' -H 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8' -H 'Referer: https://www.zecaifu.com/list/car/saling' -H 'Connection: keep-alive' -H 'Cache-Control: max-age=0' --compressed|egrep "第[0-9]+期"|awk -F'"' '{print $4}'|awk -F'/' '{print $5}')
	TS=$(date +%s)
	for id in $ID_DATA;do
		if [ "${IDS[$id]}" == "1" ];then
			continue
		fi
		IDS[$id]="1"
		echo -n $TS > tigger/"$id"_start
	done
done

doLog "Exit"
