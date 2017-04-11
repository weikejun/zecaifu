// 类库加载
const Https = require('https');
const Zlib = require('zlib');
const Fs = require('fs');
const Events = require('events');
const Query = require('querystring');
const Util = require('util');
const Url = require('url');
const Encrypt = require('./tools/encrypt.js');

// 通用函数
var chunkToStr = function(chunk, enc) {
	var body = null;
	switch (enc) {
		case 'gzip':
			body = Zlib.unzipSync(chunk).toString();
			break;
		case 'deflate':
			body = Zlib.deflateSync(chunk).toString();
			break;
		default:
			body = chunk.toString();
	}
	return body;
};

var page = 200;
var listenTimer = setInterval(function() { // 创建监听器
	if (page == 130) {
		clearInterval(listenTimer);
		return;
	}
	var _chunks = [];
	var options = {
		hostname: "api.zecaifu.com",
		port: 443,
		path: '/api/v2/list/car/all/all?page=' + page,
		method: "GET",
		headers: {
			'Host': 'api.zecaifu.com',
			'User-Agent': 'Dalvik/2.1.0 (Linux; U; Android 7.0; VIE-AL10 Build/HUAWEIVIE-AL10)',
			'Connection': 'Keep-Alive',
			'Accept-Encoding': 'gzip'
		}
	};
	var req = Https.request(options, (res) => {
		res.on('data', (chunk) => { _chunks.push(chunk); });
		res.on('end', () => {
			var body = chunkToStr(Buffer.concat(_chunks), res.headers['content-encoding']);
			body = JSON.parse(body);
			if (body.code == 0) { // 成功
				var list = body.data.borrow.borrowList;
				for (i = 0; i < list.length; i++) {
					var dt = new Date();
					dt.setTime(list[i].addTime + '' + '000');
					console.log(list[i].money + '|' + list[i].factPrice + '|' + Math.ceil(10000 * (list[i].factPrice/list[i].money - 1))/100 + '|' + dt.getFullYear() + '-' + parseInt(dt.getMonth() + 1) +  '-' + dt.getDate() +  '|' + list[i].updatedAt);
				}
			}
			page++;
		});
	});
	req.end();
}, 800);

