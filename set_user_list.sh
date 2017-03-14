#!/bin/bash

cd $(dirname $0)
source common.sh
doLog "Start"

LOCAL_IP=$(/sbin/ifconfig eth1|grep inet|sed "s/:/ /g"|awk '{print $3}')

for u in $(cat user.list); do
	MAIL=""
	read USER PASS PAYPASS MAILADDR < <(echo $u|awk -F"|" '{print $1,$2,$3,$4}')
	./user_login.sh $USER $PASS
	./get_amount.sh $USER
	if [ -f amount/$USER ];then
		AMOUNT=$(cat amount/$USER)
		MAIL=$MAIL"账号 $USER 就绪, 余额 $AMOUNT \n众筹策略：\n"
	else
		MAIL=$MAIL"账号 $USER 余额读取失败，请联系管理员"
	fi

	for s in $(cat config/strategy.dat|grep $USER|sed -r "s/\s+//g");do
		read CAR_ID MONEY < <(echo $s|awk -F'|' '{print $2,$3}')
		MAIL=$MAIL"第 $CAR_ID 期，投入金额 $MONEY \n"
	done
	echo -e $MAIL | mail -s "[ZeRobot notify]Ready - from $LOCAL_IP" -c "78250611@qq.com" "$MAILADDR"
done


doLog "Exit"
