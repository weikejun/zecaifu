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
		CAR_ID=$(basename $f _start)
		for USER in $(cat user.list|sed -r "s/\s+//g");do
			NAME=$(echo $USER|awk -F"|" '{print $1}')
			FILE_NAME=$(ls cookies/|grep $NAME|grep -v "login"|tail -n 1)
			./process_bid.sh $FILE_NAME $CAR_ID &
		done
		mv $f tigger/"$CAR_ID"_done
		break
	done
done

doLog "Exit"
