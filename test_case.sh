#!/bin/bash

NAME=13811311608
PASS=Wkj12345678
CARID=NqcirS3D

./user_login.sh $NAME $PASS
./get_amount.sh $NAME 

FILE_NAME=$(ls cookies/|grep $NAME|grep -v "login"|tail -n 1)
./process_bid.sh $FILE_NAME $CARID
