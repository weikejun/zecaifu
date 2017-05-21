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

var page = 1;
var categorys = ['car', 'house', 'parking'];
var stats = ['saling', 'voting', 'paying'];
var cate_idx = 0;
var stats_idx = 0;
var result = {};
for(var i = 0; i < categorys.length; i++) {
	result[categorys[i]] = {};
	for(var j = 0; j < stats.length; j++) {
		result[categorys[i]][stats[j]] = 0;
	}
}
var listenTimer = setInterval(function() { // 创建监听器
	var _chunks = [];
	var options = {
		hostname: "api.zecaifu.com",
		port: 443,
		path: '/api/v2/list/' + categorys[cate_idx] + '/all/' + stats[stats_idx] + '?page=' + page,
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
					//console.log(list[i].money + '|' + list[i].factPrice + '|' + Math.ceil(10000 * (list[i].factPrice/list[i].money - 1))/100 + '|' + dt.getFullYear() + '-' + parseInt(dt.getMonth() + 1) +  '-' + dt.getDate() +  '|' + list[i].updatedAt);
					//console.log(categorys[cate_idx] + '|' + list[i].money + '|' + list[i].status);
					result[categorys[cate_idx]][stats[stats_idx]] += parseInt(list[i].money);
				}
				//console.log("stats_ids="+stats_idx+"|cate_idx="+cate_idx+"|page="+page);
				if (list.length < 10) {
					stats_idx++;
					page = 1;
					if (stats_idx >= stats.length) {
						cate_idx++;
						stats_idx = 0;
						if (cate_idx >= categorys.length){
							for(cat in result) {
								for(st in result[cat]) {
									console.log((new Date()).toLocaleDateString()+'|'+cat+'|'+st+'|'+result[cat][st]);
								}
							}
							clearInterval(listenTimer);
							return;
						}
					}
				} else {
					page++;
				}
			}
		});
	});
	req.end();
}, 200);

