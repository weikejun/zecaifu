#!/bin/bash

cd $(dirname $0)
source common.sh
doLog "Start"

source user_map.sh

USER_NUM=${#USER_MAP[*]}
MAIL=""
LOCAL_IP=$(/sbin/ifconfig eth1|grep inet|sed "s/:/ /g"|awk '{print $3}')

echo -n > user.list

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

echo "$(cat user.list|wc -l) user ready; "$MAIL | mail -s "[Zecaifu notify]Ready - from $LOCAL_IP" 78250611@qq.com

doLog "Exit"
