#!/bin/bash

cd $(dirname $0)
source common.sh
doLog "Start"

declare -A IDS=();
doLog "Create detectors"
while [ 1 -eq 1 ];do
	JSON=$(curl 'https://api.zecaifu.com/api/v2/list/car/all/all?page=1' -H 'Accept-Encoding: gzip' -H 'User-Agent: Dalvik/2.1.0 (Linux; U; Android 7.0; VIE-AL10 Build/HUAWEIVIE-AL10)' --compressed)
	ID_DATA=$(php tools/parse_cars.php "$JSON")
	TS=$(date +%s)
	for id in $ID_DATA;do
		if [ "${IDS[$id]}" == "1" ];then
			continue
		fi
		doLog "car $id ready"
		IDS[$id]="1"
		echo -n $TS > tigger/"$id"_start
	done
done

doLog "Exit"
