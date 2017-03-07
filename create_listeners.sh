#!/bin/bash

cd $(dirname $0)
source common.sh
doLog "Start"

doLog "Create listeners"
for USER in $(cat user.list|sed -r "s/\s+//g");do
	NAME=$(echo $USER|awk -F"|" '{print $1}')
	PASS=$(echo $USER|awk -F"|" '{print $2}')
	./user_login.sh $NAME $PASS
	./get_amount.sh $NAME
done

while [ 1 -eq 1 ]; do
	for f in $(ls tigger/*_start);do
		read CAR_ID CAR_NO < <(basename $f|awk -F'_' '{print $1,$2}')
		for USER in $(cat user.list|sed -r "s/\s+//g");do
			NAME=$(echo $USER|awk -F"|" '{print $1}')
			FILE_NAME=$(ls cookies/|grep $NAME|grep -v "login"|tail -n 1)
			STRATEGY=$(cat config/strategy.dat|grep $NAME|grep $CAR_NO)
			if [ "$STRATEGY" != "" ];then
				./process_bid.sh $FILE_NAME $CAR_ID &
			fi
		done
		mv $f tigger/"$CAR_ID"_done
	done
done

doLog "Exit"
