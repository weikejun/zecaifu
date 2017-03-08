#!/bin/bash

cd $(dirname $0)
source common.sh
doLog "Start"

LOCAL_IP=$(/sbin/ifconfig eth1|grep inet|sed "s/:/ /g"|awk '{print $3}')

for u in $(cat user.list);do
	read USER PASS PAYPASS MAILADDR < <(echo $u|awk -F"|" '{print $1,$2,$3,$4}')
	tac log/$(date +%Y%m%d)|grep $USER|grep "message"|mail -s "[ZeRobot notify]Response - from $LOCAL_IP" -c 78250611@qq.com $MAILADDR
done

doLog "Exit"
