#!/bin/bash

cd $(dirname $0)
source common.sh
doLog "Start"

for u in $(cat user.list|xargs);do

	./user_login.sh $(echo $u|sed -r "s/\s+//g"|awk -F"|" '{print $1,$2}')
	./get_amount.sh $(echo $u|awk -F"|" '{print $1}')
done

doLog "Exit"
