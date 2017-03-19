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

var timeLog = function(logStr) {
	var t = new Date();
	console.log(
			t.toLocaleDateString() + ' ' 
			+ t.getHours() + ':' 
			+ t.getMinutes() + ':'
			+ t.getSeconds() + '.' 
			+ t.getMilliseconds() + ' '
			+ logStr);
};

// 众筹抢标器定义，响应事件注册
var CFRobot = function(user){
	this.userName = user.name; // 用户名
	this.loginPass = user.loginPass; // 登录密码
	this.payPass = user.payPass; // 支付密码
	this.notifyMail = user.notifyMail; // 通知邮箱
	this.strategys = null; // 策略信息
	this.cookies = {}; // cookie信息
	this.profile = []; // 账户信息
	this.auth = 0; // 
	this.events = new Events;
	var _ref = this;
	var _dispatched = 0;

	this.setCookie = function(cookies, hostname) {
		this.cookies[hostname] = this.cookies[hostname] || '';
		for(i in cookies) {
			cookieParam = cookies[i].split(';');
			cookieKV = cookieParam[0].split('=');
			var regex = new RegExp(cookieKV[0] + '=[^;]+; ');
			this.cookies[hostname] = this.cookies[hostname].replace(regex, '');
			this.cookies[hostname] += cookieParam[0] + "; ";
		}
	};

	this.events.on('user.login', () => { // 登录页
		timeLog('[Event:user.login][User:'+_ref.userName+']');
		var chunks = []; 
		var options = {
			hostname: "www.zecaifu.com",
			port: 443,
			path: "/login",
			method: "GET",
			headers: {
				'Origin': 'https://www.zecaifu.com',
				'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
				'Accept-Encoding': 'gzip,deflate',
				'Accept-Language': 'zh-CN,zh;q=0.8',
				'Upgrade-Insecure-Requests': '1',
				'Host': 'www.zecaifu.com',
				'Connection': 'keep-alive',
				'Cache-Control': 'max-age=0',
			   	'Referer': 'https://www.zecaifu.com',
			}
		};
		var req = Https.request(options, (res) => {
			res.on('data', (chunk) => { chunks.push(chunk); });
			res.on('end', () => {
				var body = chunkToStr(Buffer.concat(chunks), res.headers['content-encoding']);
				_ref.setCookie(res.headers['set-cookie'], options.hostname);
				var match = body.match(/_token" value="[^"]+/);
				if (!match) {
					timeLog('[Event:user.login][User:'+_ref.userName+']Exit, message=登录错误');
					Fs.writeFileSync('http/user.login-' + _ref.userName, body);
					return;
				}
				_ref.events.emit('user.login.submit', match[0].replace('_token" value="', ''));
			});
		});
		req.end();
	});

	this.events.on('user.login.submit', function(token) { // 登录页
		timeLog('[Event:user.login.submit][User:'+_ref.userName+']');
		var cookiePath = 'cookies/www.zecaifu.com-' + _ref.userName;
		var chunks = [];
		if (Fs.existsSync(cookiePath)) {
			_ref.cookies = JSON.parse(Fs.readFileSync(cookiePath, 'utf8'));
			_ref.auth = 1;
			_ref.events.emit('user.profile');
			return;
		}
		var postData = Query.stringify({
			'_token' : token,
			'username' : _ref.userName,
			'password' : _ref.loginPass
		});
		var options = {
			hostname: "www.zecaifu.com",
			port: 443,
			path: "/login",
			method: "POST",
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
				'Origin': 'https://www.zecaifu.com',
				'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
				'Accept-Encoding': 'gzip,deflate',
				'Accept-Language': 'zh-CN,zh;q=0.8',
				'Upgrade-Insecure-Requests': '1',
				'Host': 'www.zecaifu.com',
				'Connection': 'keep-alive',
				'Cache-Control': 'max-age=0',
			   	'Referer': 'https://www.zecaifu.com/login',
				'Cookie': _ref.cookies['www.zecaifu.com'],
				'Content-Length': Buffer.byteLength(postData)
			}
		};
		var req = Https.request(options, (res) => {
			res.on('data', (chunk) => { chunks.push(chunk); });
			res.on('end', () => {
				var body = chunkToStr(Buffer.concat(chunks), res.headers['content-encoding']);
				_ref.setCookie(res.headers['set-cookie'], options.hostname);
				_ref.auth = 1;
				Fs.writeFileSync(cookiePath, JSON.stringify(_ref.cookies));
				_ref.events.emit('user.profile');
			});
		});

		req.write(postData);
		req.end();
	});

	this.events.on('user.profile', ()=>{ // 获取余额
		timeLog('[Event:user.profile][User:'+_ref.userName+']');
		var chunks = [];
		var options = {
			hostname: "www.zecaifu.com",
			port: 443,
			path: "/profile/myAccountPie",
			method: "GET",
			headers: {
				'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
				'Accept-Encoding': 'gzip,deflate',
				'Accept-Language': 'zh-CN,zh;q=0.8',
				'Host': 'www.zecaifu.com',
				'Connection': 'keep-alive',
				'Cache-Control': 'max-age=0',
			   	'Referer': 'https://www.zecaifu.com/profile',
				'Cookie': _ref.cookies['www.zecaifu.com'],
				'X-Requested-With': 'XMLHttpRequest'
			}
		};
		var req = Https.request(options, (res) => {
			res.on('data', (chunk) => { chunks.push(chunk); });
			res.on('end', () => {
				var body = chunkToStr(Buffer.concat(chunks), res.headers['content-encoding']);
				_ref.profile = JSON.parse(body);
				timeLog('[Event:user.profile][User:'+_ref.userName+']Get balance=' + _ref.profile[0]);
			});
		});

		req.end();
	});

	this.events.on('car.detail', (car) => { // 登录页
		timeLog('[Event:car.detail][User:'+_ref.userName+'][Car:' + car.borrowName + ']');
		if (_ref.profile.length < 1) {
			timeLog('[Event:car.detail][User:'+_ref.userName+'][Car:' + car.borrowName + ']Exit, message=余额未正常取回, auth=' + _ref.auth);
			return;
		}
		var _chunks = [];
		var investment = _ref.profile[0].replace(',', '');
		if (investment < 100) {
			timeLog('[Event:car.detail][User:'+_ref.userName+'][Car:' + car.borrowName + ']Exit, message=余额不足');
			return;
		}
		if (_ref.strategys) {
			var no = car.borrowName.match(/第([0-9]+)/);
			if (!(investment = _ref.strategys[no[1]])) {
				timeLog('[Event:car.detail][User:'+_ref.userName+'][Car:' + car.borrowName + ']Exit, message=未命中策略');
				return;
			}
		}
		if (_dispatched > 0) {
			timeLog('[Event:pay.url][User:'+_ref.userName+'][Car:' + car.borrowName + ']Exit, robot dispatched, user=' + _ref.userName);
			return;
		}
		_dispatched++;
		var options = {
			hostname: "www.zecaifu.com",
			port: 443,
			path: "/detail/" + car.sid,
			method: "GET",
			headers: {
				'Origin': 'https://www.zecaifu.com',
				'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
				'Accept-Encoding': 'gzip,deflate',
				'Accept-Language': 'zh-CN,zh;q=0.8',
				'Upgrade-Insecure-Requests': '1',
				'Host': 'www.zecaifu.com',
				'Connection': 'keep-alive',
				'Cache-Control': 'max-age=0',
			   	'Referer': 'https://www.zecaifu.com/list/car/run',
				'Cookie': _ref.cookies['www.zecaifu.com'],
				'X-Requested-With': 'XMLHttpRequest'
			}
		};
		var req = Https.request(options, (res) => {
			res.on('data', (chunk) => { _chunks.push(chunk); });
			res.on('end', () => {
				var body = chunkToStr(Buffer.concat(_chunks), res.headers['content-encoding']);
				_ref.setCookie(res.headers['set-cookie'], options.hostname);
				var match = body.match(/_token" value="[^"]+/g);
				token = match[0].replace('_token" value="', '')
				var investNum = Math.floor(investment / 100);
				investNum = (investNum > car.borrowMax ? car.borrowMax : investNum);
				timeLog('[Event:car.detail][User:'+_ref.userName+'][Car:' + car.borrowName + ']Get pay token=' + token + ', num=' + investNum);
				_ref.events.emit('pay.url', car, token, investNum);
				Fs.writeFileSync('http/car.detail-' + _ref.userName + '-' + car.sid, body);
			});
		});
		req.end();
	});

	this.events.on('pay.url', (car, token, num)=>{ // 提交众筹
		timeLog('[Event:pay.url][User:'+_ref.userName+'][Car:' + car.borrowName + ']');
		var _chunks = [];
		var postData = Query.stringify({
			'_token' : token,
			'num' : num,
		});
		var options = {
			hostname: 'www.zecaifu.com',
			port: 443,
			path: '/detail/' + car.sid,
			method: 'POST',
			headers: {
				'Host' : 'www.zecaifu.com',
				'Accept-Encoding' : 'gzip, deflate, sdch, br',
				'Accept-Language' : 'zh-CN,zh;q=0.8',
				'User-Agent' : 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.152 Safari/537.36',
				'Upgrade-Insecure-Requests' : '1',
				'Accept' : 'application/json, text/javascript, */*; q=0.01',
				'X-Requested-With' : 'XMLHttpRequest',
		       	'Connection' : 'keep-alive',
				'Referer': 'https://www.zecaifu.com/detail/' + car.sid,
				'Content-Type' : 'application/x-www-form-urlencoded; charset=UTF-8',
				'Cookie': _ref.cookies['www.zecaifu.com'],
				'Origin' : 'https://www.zecaifu.com',
				'X-CSRF-TOKEN': token
			}
		};
		var req = Https.request(options, (res) => {
			res.on('data', (chunk) => { _chunks.push(chunk); });
			res.on('end', () => {
				var body = chunkToStr(Buffer.concat(_chunks), res.headers['content-encoding']);
				_ref.setCookie(res.headers['set-cookie'], options.hostname);
				body = JSON.parse(body);
				if (body.status != 2) {
					timeLog('[Event:pay.url][User:'+_ref.userName+'][Car:' + car.borrowName + ']Exit, message=' + body.msg);
					return;
				}
				timeLog('[Event:pay.url][User:'+_ref.userName+'][Car:' + car.borrowName + ']Pay start, url=' + body.msg);
				_ref.events.emit('pay.redirect', car, body.msg);
				Fs.writeFileSync('http/pay.url-' + _ref.userName + '-' + car.sid, JSON.stringify(body));
			});
		});
		req.write(postData);
		req.end();
	});

	this.events.on('pay.redirect', (car, url)=>{ // 众筹中转页
		timeLog('[Event:pay.redirect][User:'+_ref.userName+'][Car:' + car.borrowName + ']');
		var _chunks = [];
		var urlParam = Url.parse(url)
		var options = {
			hostname: urlParam.hostname,
			port: 443,
			path: urlParam.path,
			method: 'GET',
			headers: {
				'Host' : 'www.zecaifu.com',
				'Accept-Encoding' : 'gzip, deflate, sdch, br',
				'Accept-Language' : 'zh-CN,zh;q=0.8',
				'User-Agent' : 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.152 Safari/537.36',
				'Upgrade-Insecure-Requests' : '1',
				'Accept' : 'application/json, text/javascript, */*; q=0.01',
		       	'Connection' : 'keep-alive',
				'Referer' : 'https://www.zecaifu.com/detail/' + car.sid,
				'Cookie' : _ref.cookies['www.zecaifu.com']
			}
		};
		var req = Https.request(options, (res) => {
			res.on('data', (chunk) => { _chunks.push(chunk); });
			res.on('end', () => {
				var body = chunkToStr(Buffer.concat(_chunks), res.headers['content-encoding']);
				_ref.setCookie(res.headers['set-cookie'], options.hostname);
				var formArray = body.match(/<input [^>]+>/g);
				var formObj = [];
				for(i = 0; i < formArray.length; i++) {
					var arr = formArray[i]
						.replace(/\s/g, '')
						.match(/name="([^"]+)".*value="([^"]*)"/);
					formObj[arr[1]] = arr[2];
				}
				var formData = Query.stringify(formObj);
				timeLog('[Event:pay.redirect][User:'+_ref.userName+'][Car:' + car.borrowName + ']Redirect form=' + formData);
				_ref.events.emit('pay.detail', car, url, formData);
				Fs.writeFileSync('http/pay.redirect-' + _ref.userName + '-' + car.sid, body);
			});
		});
		req.end();
	});

	this.events.on('pay.detail', (car, url, formData) => { // 支付详情
		timeLog('[Event:pay.detail][User:'+_ref.userName+'][Car:' + car.borrowName + ']');
		var _chunks = [];
		var options = {
			hostname: 'transfer.moneymoremore.com',
			port: 443,
			path: '/loan/loan.action',
			method: 'POST',
			headers: {
				'Host' : 'transfer.moneymoremore.com',
				'Accept-Encoding' : 'gzip, deflate',
				'Accept-Language' : 'zh-CN,zh;q=0.8',
				'User-Agent' : 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.152 Safari/537.36',
				'Upgrade-Insecure-Requests' : '1',
				'Accept' : 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
		       	'Connection' : 'keep-alive',
				'Referer': url,
				'Content-Type' : 'application/x-www-form-urlencoded; charset=UTF-8',
				'Origin' : 'https://www.zecaifu.com',
				'Content-Length': Buffer.byteLength(formData),
				'Cache-Control' : 'max-age=0'
			}
		};
		var req = Https.request(options, (res) => {
			res.on('data', (chunk) => { _chunks.push(chunk); });
			res.on('end', () => {
				var body = chunkToStr(Buffer.concat(_chunks), res.headers['content-encoding']);
				_ref.setCookie(res.headers['set-cookie'], options.hostname);
				var message = body.match(/name="Message" value="([^"]+)"/);
				if (message) {
					timeLog('[Event:pay.detail][User:'+_ref.userName+'][Car:' + car.borrowName + ']Exit, message=' + message[1]);
					return;
				}
				timeLog('[Event:pay.detail][User:'+_ref.userName+'][Car:' + car.borrowName + ']Success, detail page size=' + body.length);
				_ref.events.emit('pay.verify', car, body);
				Fs.writeFileSync('http/pay.detail-' + _ref.userName + '-' + car.sid, body);
			});
		});

		req.write(formData);
		req.end();
	});

	this.events.on('pay.verify', (car, detail)=>{ // 密码验证
		timeLog('[Event:pay.verify][User:'+_ref.userName+'][Car:' + car.borrowName + ']');
		var _chunks = [];
		var matches = detail.match(/publicKey = "([^"]+)"/);
		if (!matches) {
			timeLog(
				'[Event:pay.verify][User:'
				+ _ref.userName
				+ '][Car:' 
				+ car.borrowName 
				+ ']Exit, publickKey not found'
			);
			return;
		}
		var encrypt = new Encrypt.JSEncrypt();
		encrypt.setPublicKey(matches[1]);
		var verifyCode = encrypt.encrypt(_ref.payPass);
		var postData = Query.stringify({
			'LoanMoneymoremore' : detail.match(/mid:([0-9]+)/)[1],
			'verifycode' : verifyCode,
			'verifytype' : 2,
			'isEncrypt' : 1
		});
		var options = {
			hostname: 'transfer.moneymoremore.com',
			port: 443,
			path: '/loan/loanverifycode.action',
			method: 'POST',
			headers: {
				'Host' : 'transfer.moneymoremore.com',
				'Accept-Encoding' : 'gzip, deflate',
				'Accept-Language' : 'zh-CN,zh;q=0.8',
				'User-Agent' : 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.152 Safari/537.36',
				'Upgrade-Insecure-Requests' : '1',
				'Accept' : '*/*; q=0.01',
		       	'Connection' : 'keep-alive',
				'Referer': 'https://transfer.moneymoremore.com/loan/loan.action',
				'Content-Type' : 'application/x-www-form-urlencoded; charset=UTF-8',
				'Origin' : 'https://transfer.moneymoremore.com',
				'Cookie' : _ref.cookies['transfer.moneymoremore.com'],
				'X-Requested-With' : 'XMLHttpRequest',
				'Cache-Control' : 'max-age=0'
			}
		};
		var req = Https.request(options, (res) => {
			res.on('data', (chunk) => { _chunks.push(chunk); });
			res.on('end', () => {
				var body = chunkToStr(Buffer.concat(_chunks), res.headers['content-encoding']);
				_ref.setCookie(res.headers['set-cookie'], options.hostname);
				var message = body.match(/name="Message" value="([^"]+)"/);
				if (message) {
					timeLog('[Event:pay.verify][User:'+_ref.userName+'][Car:' + car.borrowName + ']Exit, message=' + message[1]);
					return;
				}
				if (body != 2) {
					timeLog('[Event:pay.verify][User:'+_ref.userName+'][Car:' + car.borrowName + ']Exit, message=支付密码验证失败, ret=' + body);
					return;
				}
				_ref.events.emit('pay.sign', car, detail, verifyCode);
				Fs.writeFileSync('http/pay.verify-' + _ref.userName + '-' + car.sid, body);
			});
		});

		req.write(postData);
		req.end();
	});

	this.events.on('pay.sign', (car, detail, verifyCode) => { // 支付签名
		timeLog('[Event:pay.sign][User:'+_ref.userName+'][Car:' + car.borrowName + ']');
		var _chunks = [];
		var start = detail.search('<form id="myForm"');
		var end = detail.search("/form>");
		var formStr = detail.substring(start, end + "/form>".length);
		var formArray = formStr.match(/<input [^>]+>/g);
		var formObj = [];
		for(i = 0; i < formArray.length; i++) {
			var inputName = formArray[i].match(/name="([^"]+)"/);
			var inputVal = formArray[i].match(/value="([^"]*)"/);
			if (!inputName) {
				continue;
			}
			formObj[inputName[1]] = inputVal[1];
		}
		formObj['payPassword'] = verifyCode;
		var postData = Query.stringify({
			'data' : Query.stringify(formObj)
		});
		var options = {
			hostname: 'transfer.moneymoremore.com',
			port: 443,
			path: '/loan/itrussign.action',
			method: 'POST',
			headers: {
				'Host' : 'transfer.moneymoremore.com',
				'Accept-Encoding' : 'gzip, deflate',
				'Accept-Language' : 'zh-CN,zh;q=0.8',
				'User-Agent' : 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.152 Safari/537.36',
				'Accept' : '*/*; q=0.01',
		       	'Connection' : 'keep-alive',
				'Referer': 'https://transfer.moneymoremore.com/loan/loan.action',
				'Content-Type' : 'application/x-www-form-urlencoded; charset=UTF-8',
				'Origin' : 'https://transfer.moneymoremore.com',
				'X-Requested-With' : 'XMLHttpRequest',
				'Cookie' : _ref.cookies['transfer.moneymoremore.com']
			}
		};
		var req = Https.request(options, (res) => {
			res.on('data', (chunk) => { _chunks.push(chunk); });
			res.on('end', () => {
				var body = chunkToStr(Buffer.concat(_chunks), res.headers['content-encoding']);
				_ref.setCookie(res.headers['set-cookie'], options.hostname);
				var message = body.match(/name="Message" value="([^"]+)"/);
				if (message) {
					timeLog('[Event:pay.sign][User:'+_ref.userName+'][Car:' + car.borrowName + ']Exit, message=' + message[1]);
					return;
				}
				formObj['itrusdata'] = body;
				timeLog('[Event:pay.sign][User:'+_ref.userName+'][Car:' + car.borrowName + ']Done, itrusdata=' + body);
				_ref.events.emit('pay.submit', car, formObj);
				Fs.writeFileSync('http/pay.sign-' + _ref.userName + '-' + car.sid, body);
			});
		});

		req.write(postData);
		req.end();
	});

	this.events.on('pay.submit', (car, formObj) => { // 支付提交
		timeLog('[Event:pay.submit][User:'+_ref.userName+'][Car:' + car.borrowName + ']');
		var _chunks = [];
		var postData = Query.stringify(formObj);
		var options = {
			hostname: 'transfer.moneymoremore.com',
			port: 443,
			path: '/loan/loanact.action',
			method: 'POST',
			headers: {
				'Host' : 'transfer.moneymoremore.com',
				'Accept-Encoding' : 'gzip, deflate',
				'Accept-Language' : 'zh-CN,zh;q=0.8',
				'User-Agent' : 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.152 Safari/537.36',
				'Accept' : '*/*; q=0.01',
		       	'Connection' : 'keep-alive',
				'Referer': 'https://transfer.moneymoremore.com/loan/loan.action',
				'Content-Type' : 'application/x-www-form-urlencoded; charset=UTF-8',
				'Origin' : 'https://transfer.moneymoremore.com',
				'Upgrade-Insecure-Requests' : '1',
				'Cache-Control' : 'max-age=0',
				'Content-Length' : Buffer.byteLength(postData),
				'Cookie' : _ref.cookies['transfer.moneymoremore.com']
			}
		};
		var req = Https.request(options, (res) => {
			res.on('data', (chunk) => { _chunks.push(chunk); });
			res.on('end', () => {
				var body = chunkToStr(Buffer.concat(_chunks), res.headers['content-encoding']);
				_ref.setCookie(res.headers['set-cookie'], options.hostname);
				var message = body.match(/name="Message" value="([^"]*)"/);
				if (!message) {
					timeLog('[Event:pay.submit][User:'+_ref.userName+'][Car:' + car.borrowName + ']Exit, pay error message=未知错误');
					Fs.writeFileSync('http/pay.submit-' + _ref.userName, body);
					return;
				}
				if (message[1] != "成功") {
					timeLog('[Event:pay.submit][User:'+_ref.userName+'][Car:' + car.borrowName + ']Exit, pay error message=' + message[1]);
					Fs.writeFileSync('http/pay.submit-' + _ref.userName, body);
					return;
				}
				timeLog('[Event:pay.submit][User:'+_ref.userName+'][Car:' + car.borrowName + ']Done, message=' + message[1]);
				_ref.events.emit('pay.callback', car, body);
				Fs.writeFileSync('http/pay.submit-' + _ref.userName + '-' + car.sid, body);
			});
		});

		req.write(postData);
		req.end();
	});

	this.events.on('pay.callback', (car, detail)=>{ // 支付回调
		timeLog('[Event:pay.callback][User:'+_ref.userName+'][Car:' + car.borrowName + ']');
		var _chunks = [];
		var start = detail.search('<form id="form1"');
		var end = detail.search("/form>");
		var formStr = detail.substring(start, end + "/form>".length);
		var formArray = formStr.match(/<input [^>]+>/g);
		var formObj = [];
		for(i = 0; i < formArray.length; i++) {
			var inputName = formArray[i].match(/name="([^"]+)"/);
			var inputVal = formArray[i].match(/value="([^"]*)"/);
			if (!inputName) {
				continue;
			}
			formObj[inputName[1]] = inputVal[1].replace(/\s+/g, '');
		}
		var postData = Query.stringify(formObj);
		var options = {
			hostname: 'www.zecaifu.com',
			port: 443,
			path: '/detail/back',
			method: 'POST',
			headers: {
				'Host' : 'www.zecaifu.com',
				'Accept-Encoding' : 'gzip, deflate, sdch, br',
				'Accept-Language' : 'zh-CN,zh;q=0.8',
				'User-Agent' : 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.152 Safari/537.36',
				'Upgrade-Insecure-Requests' : '1',
		       	'Connection' : 'keep-alive',
				'Referer': 'https://transfer.moneymoremore.com/loan/loanact.action',
				'Content-Type' : 'application/x-www-form-urlencoded; charset=UTF-8',
				'Cookie': _ref.cookies['www.zecaifu.com'],
				'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
				'Origin' : 'https://transfer.moneymoremore.com'
			}
		};
		var req = Https.request(options, (res) => {
			res.on('data', (chunk) => { _chunks.push(chunk); });
			res.on('end', () => {
				var body = chunkToStr(Buffer.concat(_chunks), res.headers['content-encoding']);
				_ref.setCookie(res.headers['set-cookie'], options.hostname);
				timeLog('[Event:pay.callback][User:'+_ref.userName+'][Car:' + car.borrowName + ']Done, return url=' + res.headers['location']);
				_ref.events.emit('pay.return', car, res.headers['location']);
				Fs.writeFileSync('http/pay.callback-' + _ref.userName + '-' + car.sid, body);
			});
		});
		req.write(postData);
		req.end();
	});

	this.events.on('pay.return', (car, url) => { // 返回页
		timeLog('[Event:pay.return][User:'+_ref.userName+'][Car:' + car.borrowName + ']');
		var _chunks = [];
		var urlParam = Url.parse(url)
		var options = {
			hostname: urlParam.hostname,
			port: 443,
			path: urlParam.path,
			method: 'GET',
			headers: {
				'Host' : 'www.zecaifu.com',
				'Accept-Encoding' : 'gzip, deflate, sdch, br',
				'Accept-Language' : 'zh-CN,zh;q=0.8',
				'User-Agent' : 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.152 Safari/537.36',
				'Upgrade-Insecure-Requests' : '1',
				'Accept' : 'application/json, text/javascript, */*; q=0.01',
		       	'Connection' : 'keep-alive',
				'Referer' : 'https://www.zecaifu.com/detail/' + car.sid,
				'Cookie' : _ref.cookies['www.zecaifu.com']
			}
		};
		var req = Https.request(options, (res) => {
			res.on('data', (chunk) => { _chunks.push(chunk); });
			res.on('end', () => {
				var body = chunkToStr(Buffer.concat(_chunks), res.headers['content-encoding']);
				_ref.setCookie(res.headers['set-cookie'], options.hostname);
				timeLog('[Event:pay.return][User:'+_ref.userName+'][Car:' + car.borrowName + ']Done, status=' + res.statusCode);
				Fs.writeFileSync('http/pay.return-' + _ref.userName + '-' + car.sid, body);
			});
		});
		req.end();
	});
};

// 配置文件加载
// config/strategy.dat
timeLog('[Process]Loading strategys');
var strategys = {};
var strategyList = Fs
	.readFileSync(__dirname + '/config/strategy.dat', 'utf8')
	.replace(/(^\s+|\s+$)/g, '')
	.split("\n");
for(i in strategyList) {
	var strategy = strategyList[i].split('|');
	if(!strategys[strategy[0]]) {
		strategys[strategy[0]] = {};
	}

	strategys[strategy[0]][strategy[1]] = strategy[2];
}
// 创建众筹机器人
timeLog('[Process]Create robots');
var robots = [];
var userList = Fs
	.readFileSync(__dirname + '/user.list','utf8')
	.replace(/(^\s+|\s+$)/g, '')
	.split("\n");
for(i in userList) {
	var user = userList[i].split('|');
	var robot = new CFRobot({
		name: user[0],
		loginPass: user[1],
		payPass: user[2],
		notifyMail: user[3]
	});
	robot.strategys = strategys[user[0]] || null;
	timeLog('[Process]Robot user=' + user[0] + ' ready');
	robot.events.emit('user.login');
	robots.push(robot);
}

timeLog('[Process]Create detector');
var detectDispatched = { length: 0 };
var listenTimer = setInterval(function() { // 创建监听器
	var _chunks = [];
	var options = {
		hostname: "api.zecaifu.com",
		port: 443,
		path: '/api/v2/list/car/all/run?page=1&app_token=03b22a29e10a9fe2fc3cf72ba7e07688&',
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
			try {
				body = JSON.parse(body);
				if (body.code != 0) {
					timeLog('[Detector:listen]Get car list, code=' + body.code + ', data=' + JSON.stringify(body));
					clearInterval(listenTimer);
					return;
				}
			} catch (err) {
				timeLog('[Detector:listen]Get car list error, retry');
				body = {code: -1};
			}
			if (body.code == 0) { // 成功
				var list = body.data.borrow.borrowList;
				for (i = 0; i < list.length; i++) {
					if(list[i].status != 'run' 
							|| detectDispatched[list[i].sid]) // 车辆状态未就绪或者已分配
						continue;
					for(n = 0; n < robots.length; n++) {
						robots[n].events.emit('car.detail', list[i]);
					}
					detectDispatched[list[i].sid] = 1;
					detectDispatched['length']++;
				}
			}
			if (detectDispatched.length >= 4) {
				clearInterval(listenTimer);
				timeLog('[Detector:listen]Dispatched done, total=' + detectDispatched.length);
				clearInterval(listenTimer);
				return;
			}
		});
	});
	req.end();
}, 800);
