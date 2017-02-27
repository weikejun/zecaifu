#!/bin/bash

cd $(dirname $0)
source common.sh
doLog "Start"

USER_MAP=(
"xxxwkj|wkj12345678"
"sangsangdong|bababu523"
"jimdev|wkj12345678"
)

source user_map.sh

USER_NUM=${#USER_MAP[*]}
MAIL=""
LOCAL_IP=$(/sbin/ifconfig eth1|grep inet|sed "s/:/ /g"|awk '{print $3}')

if [ -f car.list ]; then

	> user.list

	i=0

	while [ $i -lt $USER_NUM ];do
		USER=$(echo ${USER_MAP[$i]}|awk -F'|' '{print $1}')
		PASS=$(echo ${USER_MAP[$i]}|awk -F'|' '{print $2}')
		./user_login.sh $USER $PASS
		./get_amount.sh $USER
		if [ -f amount/$USER ];then
			AMOUNT=$(cat amount/$USER|sed -r "s/\s+//g")
			if [ $AMOUNT != "0.00" ];then
				echo ${USER_MAP[$i]} >> user.list
				MAIL=$MAIL"$USER balance=$AMOUNT; "
			fi
		fi
		let i+=1
	done

	if [ "$MAIL" == "" ];then
		#echo "zhangyongkang|wkj12345678" >> user.list
		MAIL="no formal user"
	fi

	echo "car.list ready, $(cat car.list|wc -l) cars; "$MAIL | mail -s "[Rongche notify]Ready - from $LOCAL_IP" 78250611@qq.com
fi

doLog "Exit"
