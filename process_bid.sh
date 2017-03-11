#!/bin/bash

cd $(dirname $0)
source common.sh
doLog "Start"

if [ $# != 2 ];then
	doLog "Usage: $SCRIPT [SESSION] [CAR_ID]"
	exit
fi

if [ ! -f cookies/$1 ];then
	doLog "Session $1 not exit"
	exit
fi

CAR_ID=$2
SESSION=$1
COOKIE_FILE="cookies/$SESSION"
URI="https://www.zecaifu.com/detail/$CAR_ID"
AMOUNT=$(cat amount/$(echo $SESSION|awk -F"_" '{print $1}'))
#REMOTE_ADDR=$(nslookup www.zecaifu.com|grep Address|grep -v "#53"|awk '{print $2}')
DETAIL_PAGE="http/detail_"$SESSION"_"$CAR_ID
DETAIL_POST_PAGE="http/detail_post_"$SESSION"_"$CAR_ID
SUBMIT_PAGE="http/submit_"$SESSION"_"$CAR_ID
PUBKEY="http/pubkey_"$SESSION"_"$CAR_ID
TRANSFER_PAGE="http/transfer_"$SESSION"_"$CAR_ID
TRANSFER_FORM="http/transfer_form_"$SESSION"_"$CAR_ID
PAYSIGN="http/paysign_"$SESSION"_"$CAR_ID
PAY_SUBMIT_PAGE="http/pay_submit_"$SESSION"_"$CAR_ID
CALLBACK_PAGE="http/callback_"$SESSION"_"$CAR_ID
RETURN_PAGE="http/return_"$SESSION"_"$CAR_ID
PASS_VERIFY_PAGE="http/pass_verify_"$SESSION"_"$CAR_ID

if [ "$AMOUNT" == "" ];then
	doLog "[$SESSION][$CAR_ID]Exit, get money error"
	exit
fi

if [ "$AMOUNT" == "0.00" ];then
	doLog "[$SESSION][$CAR_ID]Exit, not enough money"
	exit
fi

doLog "[$SESSION][$CAR_ID]Get car detail, balance=$AMOUNT"
curl -b $COOKIE_FILE "https://www.zecaifu.com/detail/$CAR_ID" -H 'Accept-Encoding: gzip, deflate, sdch, br' -H 'Accept-Language: zh-CN,zh;q=0.8' -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.152 Safari/537.36' -H 'Upgrade-Insecure-Requests: 1' -H 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8' -H 'X-Requested-With: XMLHttpRequest' -H 'Connection: keep-alive' -H "Referer: https://www.zecaifu.com/list/car/run" --compressed -i -o $DETAIL_PAGE
TOKEN=$(grep 'id="_token"' $DETAIL_PAGE|grep -Po '(?<=value=")[^"]+')
MAX_AMOUNT=$(grep -Po "(?<=最多买)[0-9]+" $DETAIL_PAGE)
if [ "$MAX_AMOUNT" == "" ];then
	MAX_AMOUNT=500
fi
MAX_AMOUNT=$[$MAX_AMOUNT * 100]
NUM=$(echo $AMOUNT $MAX_AMOUNT|awk '{printf "%d", ($1>$2?$2:$1)/100}')

doLog "[$SESSION][$CAR_ID]Buyin request: num=$NUM, token=$TOKEN"
curl -b $COOKIE_FILE -b $DETAIL_PAGE "https://www.zecaifu.com/detail/$CAR_ID" -H "Host: www.zecaifu.com" -H "Accept-Encoding: gzip, deflate, br" -H "Accept-Language: zh-CN,zh;q=0.8" -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.152 Safari/537.36" -H "Accept: application/json, text/javascript, */*; q=0.01" -H "Referer: https://www.zecaifu.com/detail/$CAR_ID" -H "Connection: keep-alive" -H "Content-Type: application/x-www-form-urlencoded; charset=UTF-8" -H "Origin: https://www.zecaifu.com" -H "X-Requested-With: XMLHttpRequest" -H "X-CSRF-TOKEN: $TOKEN" --data "num=$NUM&_token=$TOKEN" --compressed -i -o $DETAIL_POST_PAGE
STATUS=$(grep -Po '(?<=status":)[0-9]+' $DETAIL_POST_PAGE)
if [ $STATUS != '2' ];then
	doLog "[$SESSION][$CAR_ID]Exit, start buyin error, status=$STATUS"
	exit
fi

RESP_URL=$(grep -Po '(?<=msg":")[^"]+' $DETAIL_POST_PAGE)
RESP_URL=${RESP_URL//\\\//\/}
doLog "[$SESSION][$CAR_ID]Get counter info, url=$RESP_URL"
curl -b $COOKIE_FILE -b $DETAIL_PAGE -b $DETAIL_POST_PAGE "$RESP_URL" -H "Host: www.zecaifu.com" -H "Accept-Encoding: gzip, deflate, sdch, br" -H "Accept-Language: zh-CN,zh;q=0.8" -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.152 Safari/537.36" -H "Accept: application/json, text/javascript, */*; q=0.01" -H "Referer: https://www.zecaifu.com/detail/$CAR_ID" -H "Connection: keep-alive" -H "Upgrade-Insecure-Requests: 1" --compressed -o $SUBMIT_PAGE

doLog "[$SESSION][$CAR_ID]Go counter page"
TRANS_DATA=$(php tools/form_serialize.php $SUBMIT_PAGE "encode")
curl "https://transfer.moneymoremore.com/loan/loan.action" -H "Host: transfer.moneymoremore.com" -H "Accept-Encoding: gzip, deflate, br" -H "Accept-Language: zh-CN,zh;q=0.8" -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.152 Safari/537.36" -H "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8" -H "Referer: $RESP_URL" -H "Connection: keep-alive" -H "Upgrade-Insecure-Requests: 1" -H "Cache-Control: max-age=0" -H "Origin: https://www.zecaifu.com" --data $TRANS_DATA --compressed -i -o $TRANSFER_PAGE

KEY=$(grep -Po '(?<=publicKey = ")[^"]+' $TRANSFER_PAGE) 
if [ "$KEY" == "" ];then
	MESSAGE=$(cat $TRANSFER_PAGE|grep Message|grep -Po "(?<=value=\")[^\"]+")
	doLog "[$SESSION][$CAR_ID]Exit, counter page error, message=$MESSAGE"
	exit
fi
PAYPASS=$(grep $(echo "$SESSION"|awk -F'_' '{print $1}') user.list |awk -F'|' '{print $3}')
ENCRYPT_PAYPASS=$(nodejs tools/encrypt.js "$KEY" "$PAYPASS")
ENCRYPT_PAYPASS_URL=$(php tools/urlencode.php "$ENCRYPT_PAYPASS")
PAY_ID=$(grep -Po "(?<=mid:)[0-9]+" $TRANSFER_PAGE)

doLog "[$SESSION][$CAR_ID]Verify pay password, pubkey=$KEY, payid=$PAY_ID"
curl -b $TRANSFER_PAGE "https://transfer.moneymoremore.com/loan/loanverifycode.action" -H "Host: transfer.moneymoremore.com" -H "Accept-Encoding: gzip, deflate, sdch, br" -H "Accept-Language: zh-CN,zh;q=0.8" -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.152 Safari/537.36" -H "Accept: */*; q=0.01" -H "Referer: https://transfer.moneymoremore.com/loan/loan.action" -H "Connection: keep-alive" -H "Origin: https://transfer.moneymoremore.com" -H "X-Requested-With: XMLHttpRequest" -H "Content-Type: application/x-www-form-urlencoded" --data "LoanMoneymoremore=$PAY_ID&verifycode=$ENCRYPT_PAYPASS_URL&verifytype=2&isEncrypt=1" --compressed -i -o $PASS_VERIFY_PAGE
RET=$(cat $PASS_VERIFY_PAGE|egrep "^[0-9]")
if [ "$RET" != "2" ]; then
	doLog "[$SESSION][$CAR_ID]Exit, verify error, status=$RET"
	exit
fi

awk 'BEGIN{line=0}{if(index($0, "<form id=\"myForm\"")){line=1;print $0;}else if(index($0, "</form>")&&line==1){line=0;print $0;}if(line==1&&index($0, "<input")&&index($0, "name=")) print $0}' $TRANSFER_PAGE > $TRANSFER_FORM
FORM_DATA=$(php tools/form_serialize.php $TRANSFER_FORM)
FORM_DATA=${FORM_DATA/payPassword=/payPassword=$ENCRYPT_PAYPASS_URL}
FORM_DATA_URL=$(php tools/urlencode.php "$FORM_DATA")
doLog "[$SESSION][$CAR_ID]Sign pay info"
curl -b $TRANSFER_PAGE "https://transfer.moneymoremore.com/loan/itrussign.action" -H "Host: transfer.moneymoremore.com" -H "Accept-Encoding: gzip, deflate, sdch, br" -H "Accept-Language: zh-CN,zh;q=0.8" -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.152 Safari/537.36" -H "Accept: */*; q=0.01" -H "Referer: https://transfer.moneymoremore.com/loan/loan.action" -H "Connection: keep-alive" -H "Origin: https://transfer.moneymoremore.com" -H "X-Requested-With: XMLHttpRequest" -H "Content-Type: application/x-www-form-urlencoded" --data "data=$FORM_DATA_URL" --compressed -o $PAYSIGN
SIGN_DATA=$(php tools/urlencode.php "$(cat $PAYSIGN)")
FORM_DATA=${FORM_DATA/itrusdata=/itrusdata=$SIGN_DATA}

doLog "[$SESSION][$CAR_ID]Submit pay"
curl -b $TRANSFER_PAGE "https://transfer.moneymoremore.com/loan/loanact.action" -H "Host: transfer.moneymoremore.com" -H "Accept-Encoding: gzip, deflate, sdch, br" -H "Accept-Language: zh-CN,zh;q=0.8" -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.152 Safari/537.36" -H "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8" -H "Referer: https://transfer.moneymoremore.com/loan/loan.action" -H "Connection: keep-alive" -H "Origin: https://transfer.moneymoremore.com" -H "Upgrade-Insecure-Requests: 1" -H "Cache-Control: max-age=0" -H "Content-Type: application/x-www-form-urlencoded" --data "$FORM_DATA" --compressed -o $PAY_SUBMIT_PAGE
MESSAGE=$(cat $PAY_SUBMIT_PAGE |grep Message|grep -Po "(?<=value=\")[^\"]+")
if [ "$MESSAGE" != "成功" ]; then
	doLog "[$SESSION][$CAR_ID]Exit, pay error, message=$MESSAGE"
	exit
fi

doLog "[$SESSION][$CAR_ID]Buyin callback, message=$MESSAGE"
FORM_DATA=$(php tools/form_serialize.php $PAY_SUBMIT_PAGE)
curl -b $COOKIE_FILE -b $DETAIL_PAGE -b $DETAIL_POST_PAGE "https://www.zecaifu.com/detail/back" -H "Host: www.zecaifu.com" -H "Accept-Encoding: gzip, deflate, sdch, br" -H "Accept-Language: zh-CN,zh;q=0.8" -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.152 Safari/537.36" -H "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8" -H "Referer: https://transfer.moneymoremore.com/loan/loanact.action" -H "Connection: keep-alive" -H "Upgrade-Insecure-Requests: 1" -H "Origin: https://transfer.moneymoremore.com" -H "Cache-Control: max-age=0" -H "Content-Type: application/x-www-form-urlencoded" --data "$FORM_DATA" --compressed -i -o $CALLBACK_PAGE
BACK_URL=$(grep -Po "(?<=1;url=)[^\"]+" $CALLBACK_PAGE|sed -e "s/amp;//g")

doLog "[$SESSION][$CAR_ID]Return account, url=$BACK_URL"
curl -b $COOKIE_FILE -b $CALLBACK_PAGE "$BACK_URL" -H "Host: www.zecaifu.com" -H "Accept-Encoding: gzip, deflate, sdch, br" -H "Accept-Language: zh-CN,zh;q=0.8" -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.152 Safari/537.36" -H "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8" -H "Referer: https://transfer.moneymoremore.com/loan/loanact.action" -H "Connection: keep-alive" -H "Upgrade-Insecure-Requests: 1" -H "Cache-Control: max-age=0" -H "Content-Type: application/x-www-form-urlencoded" --compressed -i -o $RETURN_PAGE

doLog "Exit"
