#!/bin/bash

cd $(dirname $0)
source common.sh
doLog "Start"

LOCAL_IP=$(/sbin/ifconfig eth1|grep inet|sed "s/:/ /g"|awk '{print $3}')

if [ -f car.list ]; then
	tac log/$(date +%Y%m%d)|grep -i valspeed|grep -i response|mail -s "[Rongche notify]Response - from $LOCAL_IP" 78250611@qq.com 
fi

doLog "Exit"
