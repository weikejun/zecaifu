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
REMOTE_ADDR=$(nslookup www.zecaifu.com|grep Address|grep -v "#53"|awk '{print $2}')
#DETAIL_PAGE="http/detail_"$SESSION"_"$CAR_ID
#DETAIL_POST_PAGE="http/detail_post_"$SESSION"_"$CAR_ID
#SUBMIT_PAGE="http/submit_"$SESSION"_"$CAR_ID
#TRANSFER_PAGE="http/transfer_"$SESSION"_"$CAR_ID
#PUBKEY="http/pubkey_"$SESSION"_"$CAR_ID
#TRANSFER_FORM="http/transfer_form_"$SESSION"_"$CAR_ID
#PUBKEY="http/paysign_"$SESSION"_"$CAR_ID
#PAY_SUBMIT_PAGE="http/pay_submit_"$SESSION"_"$CAR_ID
#CALLBACK_PAGE="http/callback_"$SESSION"_"$CAR_ID
DETAIL_PAGE="http/detail_13811311608_1488089999203610968_NqcirS3D"
DETAIL_POST_PAGE="http/detail_post_13811311608_1488089999203610968_NqcirS3D"
SUBMIT_PAGE="http/submit_13811311608_1488089999203610968_NqcirS3D"
PUBKEY="http/pubkey_13811311608_1488089999203610968_NqcirS3D"
TRANSFER_PAGE="http/transfer_13811311608_1488089999203610968_NqcirS3D"
TRANSFER_FORM="http/transfer_form_13811311608_1488089999203610968_NqcirS3D"
PAYSIGN="http/paysign_13811311608_1488089999203610968_NqcirS3D"
PAY_SUBMIT_PAGE="http/pay_submit_13811311608_1488089999203610968_NqcirS3D"
CALLBACK_PAGE="http/callback_13811311608_1488089999203610968_NqcirS3D"

if [ "$AMOUNT" == "" ];then
	doLog "Session $1 get money error"
	exit
fi

if [ "$AMOUNT" == "0.00" ];then
	doLog "Session $1 has not enough money"
	#exit
fi

doLog "detail request, amount=$AMOUNT, car_id=$CAR_ID, session=$SESSION"
#curl -b $COOKIE_FILE "https://www.zecaifu.com/detail/$CAR_ID" -H 'Accept-Encoding: gzip, deflate, sdch, br' -H 'Accept-Language: zh-CN,zh;q=0.8' -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.152 Safari/537.36' -H 'Upgrade-Insecure-Requests: 1' -H 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8' -H 'X-Requested-With: XMLHttpRequest' -H 'Connection: keep-alive' -H "Referer: https://www.zecaifu.com/list/car/run" --compressed -i -o $DETAIL_PAGE
TOKEN=$(grep 'id="_token"' $DETAIL_PAGE|grep -Po '(?<=value=")[^"]+')
MAX_AMOUNT=$(grep -Po "(?<=最多买)[0-9]+" $DETAIL_PAGE)
MAX_AMOUNT=$[$MAX_AMOUNT * 100]
NUM=$(echo $AMOUNT $MAX_AMOUNT|awk '{printf "%d", ($1>$2?$2:$1)/200}')

doLog "submit amount request, amount=$AMOUNT, car_id=$CAR_ID, session=$SESSION"
#curl -b $COOKIE_FILE -b $DETAIL_PAGE "https://www.zecaifu.com/detail/$CAR_ID" -H "Host: www.zecaifu.com" -H "Accept-Encoding: gzip, deflate, br" -H "Accept-Language: zh-CN,zh;q=0.8" -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.152 Safari/537.36" -H "Accept: application/json, text/javascript, */*; q=0.01" -H "Referer: https://www.zecaifu.com/detail/$CAR_ID" -H "Connection: keep-alive" -H "Content-Type: application/x-www-form-urlencoded; charset=UTF-8" -H "Origin: https://www.zecaifu.com" -H "X-Requested-With: XMLHttpRequest" -H "X-CSRF-TOKEN: $TOKEN" --data "num=$NUM&_token=$TOKEN" --compressed -i -o $DETAIL_POST_PAGE
STATUS=$(grep -Po '(?<=status":)[0-9]+' $DETAIL_POST_PAGE)
if [ $STATUS != '2' ];then
	doLog "submit amount response error, status=$STATUS"
	exit
fi

RESP_URL=$(grep -Po '(?<=msg":")[^"]+' $DETAIL_POST_PAGE)
RESP_URL=${RESP_URL//\\\//\/}
#curl -b $COOKIE_FILE -b $DETAIL_PAGE -b $DETAIL_POST_PAGE "$RESP_URL" -H "Host: www.zecaifu.com" -H "Accept-Encoding: gzip, deflate, sdch, br" -H "Accept-Language: zh-CN,zh;q=0.8" -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.152 Safari/537.36" -H "Accept: application/json, text/javascript, */*; q=0.01" -H "Referer: https://www.zecaifu.com/detail/$CAR_ID" -H "Connection: keep-alive" -H "Upgrade-Insecure-Requests: 1" --compressed -o $SUBMIT_PAGE

doLog "transfer request, amount=$AMOUNT, car_id=$CAR_ID, session=$SESSION"
TRANS_DATA=$(php form_serialize.php $SUBMIT_PAGE)
#curl "https://transfer.moneymoremore.com/loan/loan.action" -H "Host: transfer.moneymoremore.com" -H "Accept-Encoding: gzip, deflate, br" -H "Accept-Language: zh-CN,zh;q=0.8" -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.152 Safari/537.36" -H "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8" -H "Referer: $RESP_URL" -H "Connection: keep-alive" -H "Upgrade-Insecure-Requests: 1" -H "Cache-Control: max-age=0" -H "Origin: https://www.zecaifu.com" -F $TRANS_DATA --compressed -o $TRANSFER_PAGE

doLog "paypass verify request, amount=$AMOUNT, car_id=$CAR_ID, session=$SESSION"
echo "-----BEGIN PUBLIC KEY-----" > $PUBKEY
grep -Po '(?<=publicKey = ")[^"]+' $TRANSFER_PAGE >> $PUBKEY
echo "-----END PUBLIC KEY-----" >> $PUBKEY
ENCRYPT_PAYPASS=$(openssl rsautl -pkcs -encrypt -pubin -inkey $PUBKEY -in payPass.txt|base64)
PAY_ID=$(grep -Po "(?<=mid:)[0-9]+" $TRANSFER_PAGE)
#RET=$(curl  -b $TRANSFER_PAGE "https://transfer.moneymoremore.com/loan/loanverifycode.action" -H "Host: transfer.moneymoremore.com" -H "Accept-Encoding: gzip, deflate, sdch, br" -H "Accept-Language: zh-CN,zh;q=0.8" -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.152 Safari/537.36" -H "Accept: */*; q=0.01" -H "Referer: https://transfer.moneymoremore.com/loan/loan.action" -H "Connection: keep-alive" -H "Origin: https://transfer.moneymoremore.com" -H "X-Requested-With: XMLHttpRequest" -H "Content-Type: application/x-www-form-urlencoded" --data "LoanMoneymoremore=$PAY_ID&verifycode=$ENCRYPT_PAYPASS&verifytype=2&isEncrypt=1" --compressed|sed -r "s/\s+//g") 
RET=2
doLog "paypass verify response, ret=$RET, car_id=$CAR_ID, session=$SESSION"
if [ $RET != "2" ]; then
	doLog "Exit"
	exit
fi

awk 'BEGIN{line=0}{if(index($0, "<form id=\"myForm\"")){line=1;print $0;}else if(index($0, "</form>")&&line==1){line=0;print $0;}if(line==1&&index($0, "<input")&&index($0, "name=")) print $0}' $TRANSFER_PAGE > $TRANSFER_FORM
FORM_DATA=$(php form_serialize.php $TRANSFER_FORM)
ENCRYPT_PAYPASS_URL=$(php urlencode.php "$ENCRYPT_PAYPASS")
FORM_DATA=${FORM_DATA/payPassword=/payPassword=$ENCRYPT_PAYPASS_URL}
FORM_DATA_URL=$(php urlencode.php "$FORM_DATA")
doLog "pay sign request, amount=$AMOUNT, car_id=$CAR_ID, session=$SESSION"
#curl -b $TRANSFER_PAGE "https://transfer.moneymoremore.com/loan/itrussign.action" -H "Host: transfer.moneymoremore.com" -H "Accept-Encoding: gzip, deflate, sdch, br" -H "Accept-Language: zh-CN,zh;q=0.8" -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.152 Safari/537.36" -H "Accept: */*; q=0.01" -H "Referer: https://transfer.moneymoremore.com/loan/loan.action" -H "Connection: keep-alive" -H "Origin: https://transfer.moneymoremore.com" -H "X-Requested-With: XMLHttpRequest" -H "Content-Type: application/x-www-form-urlencoded" --data "data=$FORM_DATA_URL" --compressed -o $PAYSIGN
SIGN_DATA=$(php urlencode.php "$(cat $PAYSIGN)")
FORM_DATA=${FORM_DATA/itrusdata=/itrusdata=$SIGN_DATA}

doLog "pay submit request, amount=$AMOUNT, car_id=$CAR_ID, session=$SESSION"
#curl -b $TRANSFER_PAGE "https://transfer.moneymoremore.com/loan/loanact.action" -H "Host: transfer.moneymoremore.com" -H "Accept-Encoding: gzip, deflate, sdch, br" -H "Accept-Language: zh-CN,zh;q=0.8" -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.152 Safari/537.36" -H "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8" -H "Referer: https://transfer.moneymoremore.com/loan/loan.action" -H "Connection: keep-alive" -H "Origin: https://transfer.moneymoremore.com" -H "Upgrade-Insecure-Requests: 1" -H "Cache-Control: max-age=0" -H "Content-Type: application/x-www-form-urlencoded" --data "$FORM_DATA" --compressed -o $PAY_SUBMIT_PAGE

doLog "pay callback request, amount=$AMOUNT, car_id=$CAR_ID, session=$SESSION"
FORM_DATA=$(php form_serialize.php $PAY_SUBMIT_PAGE)
#curl -b $COOKIE_FILE -b $DETAIL_PAGE -b $DETAIL_POST_PAGE "https://www.zecaifu.com/detail/back" -H "Host: www.zecaifu.com" -H "Accept-Encoding: gzip, deflate, sdch, br" -H "Accept-Language: zh-CN,zh;q=0.8" -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.152 Safari/537.36" -H "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8" -H "Referer: https://transfer.moneymoremore.com/loan/loanact.action" -H "Connection: keep-alive" -H "Upgrade-Insecure-Requests: 1" -H "Origin: https://transfer.moneymoremore.com" -H "Cache-Control: max-age=0" -H "Content-Type: application/x-www-form-urlencoded" --compressed -o -i $CALLBACK_PAGE
BACK_URL=$(grep -Po "(?<=1;url=)[^\"]+" $CALLBACK_PAGE|sed -e "s/amp;//g")
echo $BACK_URL
exit

doLog "return request, amount=$AMOUNT, car_id=$CAR_ID, session=$SESSION"
curl -b $COOKIE_FILE -b $CALLBACK_PAGE "$BACK_URL" -H "Host: www.zecaifu.com" -H "Accept-Encoding: gzip, deflate, sdch, br" -H "Accept-Language: zh-CN,zh;q=0.8" -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.152 Safari/537.36" -H "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8" -H "Referer: https://transfer.moneymoremore.com/loan/loanact.action" -H "Connection: keep-alive" -H "Upgrade-Insecure-Requests: 1" -H "Cache-Control: max-age=0" -H "Content-Type: application/x-www-form-urlencoded" --compressed -o -i 

exit

doLog "Exit"
