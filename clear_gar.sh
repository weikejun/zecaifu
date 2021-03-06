#!/bin/bash

cd $(dirname $0)
source common.sh
doLog "Start"

function doClear() {
DIR=$1
EXPIRE=$2
for f in $(ls $DIR|xargs);do
	LASTMO=$(date -d "$(stat $DIR/$f|grep -i "modify"|sed -r "s/modify:\s+//ig")" +%s)
	LASTMO=$(($LASTMO + $EXPIRE))
	if [ $(date +%s) -gt $LASTMO ];then
		CMD="rm -f $DIR/$f"
		echo $CMD
		eval $CMD
	fi
done
}

for dir in $(echo "cookies amount tigger www/captcha/login");do
	doLog "Clear $dir start"
	doClear "$dir" 1800
	doLog "Clear $dir done"
done

for dir in $(echo "http log");do
	doLog "Clear $dir start"
	doClear "$dir" 172800
	doLog "Clear $dir done"
done

for f in $(ls www/captcha|egrep ".png|.res|.gif"|xargs);do
	LASTMO=$(date -d "$(stat www/captcha/$f|grep -i "modify"|sed -r "s/modify:\s+//ig")" +%s)
	LASTMO=$(($LASTMO + 1800))
	if [ $(date +%s) -gt $LASTMO ];then
		CMD="mv -f www/captcha/$f www/captcha/archives"
		echo $CMD
		eval $CMD
	fi
done

doLog "Clear process start"
for p in $(ps -ef|egrep "detect.js"|grep -v "grep"|grep -v "vim"|awk '{print $2}');do
	STARTED=$(date -d "$(ps -p $p -o lstart|grep -v -i STARTED)" +%s)
	ELAPSED=$(($(date +%s) - $STARTED))
	if [ $ELAPSED -gt 360 ];then
		CMD="kill $p"
		echo $CMD
		eval $CMD
	fi
done
doLog "Clear process done"

doLog "Exit"
