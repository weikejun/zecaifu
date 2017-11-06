// 类库加载
const Https = require('https');
const Zlib = require('zlib');
const Fs = require('fs');
const Events = require('events');
const Query = require('querystring');
const Util = require('util');
const Url = require('url');
const Encrypt = require('./tools/encrypt.js');
const Http = require('http');
const Crypto = require('crypto');
const Cmd = require('child_process');
var paySubmitWait = 5000;
var detectorType = process.argv[2] || 'car';
var systemParams = { 
	'workerNum': 4,
	'payDelay': 2000,
	'detectTs': 60000
	};

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

// captcha OCR对象
var CaptchaHacker = {
	'appID': 47723,
	'user': 'xxxwkj',
	'password': 'wkj12345678',
	'appKey': 'fbc784438071426f6c0b954984570c15',
	getPwd: function() {
		var hashU = Crypto.createHash('md5')
			.update(this.user).digest('hex');
		var hashP = Crypto.createHash('md5')
			.update(this.password).digest('hex');
		var hashUP = Crypto.createHash('md5')
			.update(hashU+hashP).digest('hex');
		return Crypto.createHash('md5')
			.update(this.appKey+hashUP).digest('hex');
	},
	getSign: function(data) {
		return Crypto.createHash('md5')
			.update(this.appKey+this.user+data.toString('binary')).digest('hex')
			.substr(0, 8);
	},
	decode: function(data, outFile, imgFile) {
		var chunks = [];
		var postData = Query.stringify({
			'appID' : this.appID,
		    	'user': this.user,
			'pwd' : this.getPwd(),
			'sign' :this.getSign(data),
			'type': 42,
		    	'fileData': data.toString('hex')
		});
		var options = {
			hostname: "api.dama2.com",
			port: 7766,
			path: "/app/d2File?"+postData,
			method: "POST",
			headers: {
				'Content-Type': 'text/html;charset=utf8',
				'Content-Length': Buffer.byteLength(postData)
			}
		};
		var req = Http.request(options, (res) => {
			res.on('data', (chunk) => { chunks.push(chunk); });
			res.on('end', () => {
				var code = Fs.readFileSync(outFile, {encoding:'utf8'});
				if (code.length >= 4) {
					return;
				}
				var body = chunkToStr(Buffer.concat(chunks));
				var res = JSON.parse(body);
				if(res.ret == 0) {
					timeLog('[CaptchaHacker:decode]code='+res.result);
					Fs.writeFileSync(outFile, res.result);
					var ntime = (new Date()).getTime().toString().substr(0, 10);
					Fs.utimesSync(imgFile, ntime, ntime);
				}
			});
		});

		//req.write(postData);
		req.end();
	}
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
	this.id = user.id; // robot id
	this.auth = 0; // 
	this.events = new Events;
	this.capRetry = 0;
	this.loginRetry = 0;
	var _ref = this;
	var _dispatched = false;
	var _balance = 0;
	var _detailSubmit = 0;

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

	this.doDispatch = function(car) {
		if (_dispatched) {
			return false;
		}
		var no = car.borrowName.match(/第([0-9]+)/);
		if (!_ref.strategys || _ref.strategys[no[1]] || _ref.strategys['*']) {
			timeLog('[CFRobot:doDispatch][User:'+_ref.userName+'][Id:'+_ref.id+'][Car:' + car.borrowName + ']Hit');
			_ref.events.emit('car.detail', car);
			return _dispatched = true;
		}
		return false;
	};

	this.events.on('user.login', () => { // 登录页
		timeLog('[Event:user.login][User:'+_ref.userName+'][Id:'+_ref.id+']');
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
				Fs.writeFileSync('http/user.login-' + _ref.userName + '-' + _ref.id, body);
				_ref.setCookie(res.headers['set-cookie'], options.hostname);
				var match = body.match(/_token" value="[^"]+/);
				if (!match) {
					timeLog('[Event:user.login][User:'+_ref.userName+'][Id:'+_ref.id+']Exit, message=登录错误');
					return;
				}
				_ref.events.emit('user.captcha', match[0].replace('_token" value="', ''), body.match(/id="verify_code"/));
			});
		});
		var subTimer = setInterval(function() {
			if(sLock[_ref.userName]) {
				return;
			}
			sLock[_ref.userName]++;
			clearInterval(subTimer);
			req.end();
		}, 1);
	});

	this.events.on('user.captcha', (token, vcode)=>{ // 登录验证码
		timeLog('[Event:user.captcha][User:'+_ref.userName+'][Id:'+_ref.id+']');
		if (!vcode) {
			timeLog('[Event:user.captcha][User:'+_ref.userName+'][Id:'+_ref.id+']No captcha, go next');
			_ref.events.emit('user.login.submit', token);
			return;
		}
		var _chunks = [];
		var options = {
			hostname: "www.zecaifu.com",
			port: 443,
			path: "/code?" + Math.random(),
			method: "GET",
			headers: {
				'User-Agent' : 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.152 Safari/537.36',
				'Accept': 'image/webp,image/*,*/*;q=0.8',
				'Accept-Encoding': 'gzip,deflate,sdch,br',
				'Accept-Language': 'zh-CN,zh;q=0.8,en;q=0.6',
				'Host': 'www.zecaifu.com',
				'Connection': 'keep-alive',
				'Referer': 'https://www.zecaifu.com/login',
				'Cookie': _ref.cookies['www.zecaifu.com'],
			}
		};
		var _capFile = 'www/captcha/login/' + _ref.userName + '-' + _ref.id + '.png';
		var _resFile = 'www/captcha/login/' + _ref.userName + '-' + _ref.id + '.res';
		var req = Https.request(options, (res) => {
			res.on('data', (chunk) => { _chunks.push(chunk); });
			res.on('end', () => {
				Fs.writeFileSync(_capFile, Buffer.concat(_chunks));
				var _filePath = "login/" + _ref.userName + '-' + _ref.id;
				Cmd.execSync("php tools/pre_captcha.php "  + _filePath);
				//Cmd.execSync("./auto_ocr.sh " + _filePath);
				var ntime = (new Date()).getTime().toString().substr(0, 10);
				Fs.utimesSync(_capFile, ntime, ntime);
				//CaptchaHacker.decode(Buffer.concat(_chunks), _resFile, _capFile);
			});
		});
		Fs.writeFileSync(_resFile, '');
		Fs.chmodSync(_resFile, 1023);
		Fs.watch(_resFile, function(eType, fName) {
			var code = (Fs.readFileSync(_resFile, {encoding:'utf8'}).replace(/^\s+|\s+$/g, ''));
			if (true || code.length == 4) {
				timeLog('[Event:user.captcha][User:'+_ref.userName+'][Id:'+_ref.id+']Get captcha code=' + code);
				_ref.events.emit('user.login.submit', token, code);
				this.close();
			}
		});
		req.end();
	});

	this.events.on('user.login.submit', function(token, code) { // 登录页
		timeLog('[Event:user.login.submit][User:'+_ref.userName+'][Id:'+_ref.id+']');
		var cookiePath = 'cookies/www.zecaifu.com-' + _ref.userName + '-' + _ref.id;
		var chunks = [];
		/*if (Fs.existsSync(cookiePath)) {
			_ref.cookies = JSON.parse(Fs.readFileSync(cookiePath, 'utf8'));
			_ref.auth = 1;
			_ref.events.emit('user.profile');
			return;
		}*/
		var postData = Query.stringify({
			'_token' : token,
		    	'verify_code': (code ? code : ''),
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
				sLock[_ref.userName]--;
				var body = chunkToStr(Buffer.concat(chunks), res.headers['content-encoding']);
				_ref.setCookie(res.headers['set-cookie'], options.hostname);
				var match = _ref.cookies['www.zecaifu.com'].match(/username=/);
				if (!match) {
					if (_ref.loginRetry >= 5) {
						timeLog('[Event:user.login.submit][User:'+_ref.userName+'][Id:'+_ref.id+']Login error, retry=' + _ref.loginRetry);
						return;
					}
					if (code) {
						timeLog('[Event:user.login.submit][User:'+_ref.userName+'][Id:'+_ref.id+']Captcha error, retry=' + _ref.loginRetry);

						_ref.events.emit('user.captcha', token, true);
						_ref.loginRetry++;
					} else {
						_ref.events.emit('user.login');
					}
					_ref.auth = 0;
					return;
				}
				_ref.auth = 1;
				Fs.writeFileSync(cookiePath, JSON.stringify(_ref.cookies));
				_ref.events.emit('user.profile');
			});
		});

		req.write(postData);
		req.end();
	});

	this.events.on('user.profile', ()=>{ // 获取余额
		timeLog('[Event:user.profile][User:'+_ref.userName+'][Id:'+_ref.id+']');
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
				try {
					_ref.profile = JSON.parse(body);
				} catch(e) {
					timeLog('[Event:user.profile][User:'+_ref.userName+'][Id:'+_ref.id+']Exit, get balance error');
					return;
				}
				_balance = _ref.profile[0].replace(',', '');  
				timeLog('[Event:user.profile][User:'+_ref.userName+'][Id:'+_ref.id+']Get balance=' + _ref.profile[0]);
			});
		});

		req.end();
	});

	this.events.on('car.detail', (car) => { // 登录页
		timeLog('[Event:car.detail][User:'+_ref.userName+'][Id:'+_ref.id+'][Car:' + car.borrowName + ']');
		if (_ref.profile.length < 1) {
			timeLog('[Event:car.detail][User:'+_ref.userName+'][Id:'+_ref.id+'][Car:' + car.borrowName + ']Exit, message=余额未正常取回, auth=' + _ref.auth);
			return;
		}
		var _chunks = [];
		var investment = _ref.profile[0].replace(',', '');
		if (investment < 100) {
			timeLog('[Event:car.detail][User:'+_ref.userName+'][Id:'+_ref.id+'][Car:' + car.borrowName + ']Exit, message=余额不足');
			return;
		}
		if (_ref.strategys) {
			var no = car.borrowName.match(/第([0-9]+)/);
			if (!(investment = _ref.strategys[no[1]])) {
				if (!(investment = _ref.strategys['*'])) {
					timeLog('[Event:car.detail][User:'+_ref.userName+'][Id:'+_ref.id+'][Car:' + car.borrowName + ']Exit, message=未命中策略');
					return;
				}
			}
		}
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
				if (car.borrowMax > 1) {
					investNum = (investNum > car.borrowMax ? car.borrowMax : investNum);
				}
				/*
				if (_balance >= investNum * 100) {
					_balance -= investNum * 100;
				} else {
					investNum = Math.floor(_balance / 100);
					_balance = 0;
				} 
				*/
			       	if (investNum < 1) {
					timeLog('[Event:car.detail][User:'+_ref.userName+'][Id:'+_ref.id+'][Car:' + car.borrowName + ']Exit, message=资金耗尽');
					return;
				}
				timeLog('[Event:car.detail][User:'+_ref.userName+'][Id:'+_ref.id+'][Car:' + car.borrowName + ']Get pay token=' + token + ', num=' + investNum);
				_ref.events.emit('car.captcha', car, token, investNum);
				Fs.writeFileSync('http/car.detail-' + _ref.userName + '-' + car.sid, body);
			});
		});
		req.end();
	});

	this.events.on('car.captcha', (car, token, num)=>{ // 提交众筹
		timeLog('[Event:car.captcha][User:'+_ref.userName+'][Id:'+_ref.id+'][Car:' + car.borrowName + ']');
		var _chunks = [];
		var options = {
			hostname: "www.zecaifu.com",
			port: 443,
			path: "/investorCode?" + Math.random(),
			method: "GET",
			headers: {
				'User-Agent' : 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.152 Safari/537.36',
				'Accept': 'image/webp,image/*,*/*;q=0.8',
				'Accept-Encoding': 'gzip,deflate,sdch,br',
				'Accept-Language': 'zh-CN,zh;q=0.8,en;q=0.6',
				'Host': 'www.zecaifu.com',
				'Connection': 'keep-alive',
				'Referer': 'https://www.zecaifu.com/detail/' + car.sid,
				'Cookie': _ref.cookies['www.zecaifu.com'],
			}
		};
		var _resFile = 'www/captcha/captcha-' + _ref.userName + '-' + car.sid+ '.res';
		var _capFile = 'www/captcha/captcha-' + _ref.userName + '-' + car.sid + '.png';
		var req = Https.request(options, (res) => {
			res.on('data', (chunk) => { _chunks.push(chunk); });
			res.on('end', () => {
				Fs.writeFileSync(_capFile, Buffer.concat(_chunks));
				var _filePath = "captcha-" + _ref.userName + '-' + car.sid;
				Cmd.execSync("php tools/car_captcha.php "  + _filePath);
				//Cmd.execSync("./auto_ocr.sh " + _filePath);
				var ntime = (new Date()).getTime().toString().substr(0, 10);
				Fs.utimesSync(_capFile, ntime, ntime);
				//CaptchaHacker.decode(Buffer.concat(_chunks), _resFile, _capFile);
			});
		});
		Fs.writeFileSync(_resFile, '');
		Fs.chmodSync(_resFile, 1023);
		Fs.watch(_resFile, function(eType, fName) {
			var code = (Fs.readFileSync(_resFile, {encoding:'utf8'}).replace(/^\s+|\s+$/g, ''));
			if (true || code.length == 4) {
				timeLog('[Event:car.captcha][User:'+_ref.userName+'][Id:'+_ref.id+'][Car:' + car.borrowName + ']Get captcha code=' + code + ', retry=' + _ref.capRetry);
				setTimeout(function() {
					_ref.events.emit('pay.url', car, token, num, code);
					_ref.capRetry++;
				}, _ref.capRetry == 0 ? systemParams.payDelay : 1);
				this.close();
			}
		});
		req.end();
	});

	this.events.on('pay.url', (car, token, num, code)=>{ // 提交众筹
		timeLog('[Event:pay.url][User:'+_ref.userName+'][Id:'+_ref.id+'][Car:' + car.borrowName + ']');
		var _chunks = [];
		var postData = Query.stringify({
			'_token' : token,
			'verify_code' : code,
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
					if (body.msg == '验证码不正确') {
						timeLog('[Event:pay.url][User:'+_ref.userName+'][Id:'+_ref.id+'][Car:' + car.borrowName + ']Retry, message=' + body.msg);
						_ref.events.emit('car.captcha', car, token, num);
					} else {
						timeLog('[Event:pay.url][User:'+_ref.userName+'][Id:'+_ref.id+'][Car:' + car.borrowName + ']Exit, message=' + body.msg);
					}
					return;
				}
				timeLog('[Event:pay.url][User:'+_ref.userName+'][Id:'+_ref.id+'][Car:' + car.borrowName + ']Pay start, url=' + body.msg);
				_ref.events.emit('pay.redirect', car, body.msg);
				Fs.writeFileSync('http/pay.url-' + _ref.userName + '-' + car.sid, JSON.stringify(body));
			});
		});
		req.write(postData);
		req.end();
	});

	this.events.on('pay.redirect', (car, url)=>{ // 众筹中转页
		timeLog('[Event:pay.redirect][User:'+_ref.userName+'][Id:'+_ref.id+'][Car:' + car.borrowName + ']');
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
				timeLog('[Event:pay.redirect][User:'+_ref.userName+'][Id:'+_ref.id+'][Car:' + car.borrowName + ']Redirect form size=' + formData.length);
				_ref.events.emit('pay.detail', car, url, formData);
				Fs.writeFileSync('http/pay.redirect-' + _ref.userName + '-' + car.sid, body);
			});
		});
		req.end();
	});

	this.events.on('pay.detail', (car, url, formData) => { // 支付详情
		timeLog('[Event:pay.detail][User:'+_ref.userName+'][Id:'+_ref.id+'][Car:' + car.borrowName + ']');
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
				_detailSubmit--;
				var body = chunkToStr(Buffer.concat(_chunks), res.headers['content-encoding']);
				_ref.setCookie(res.headers['set-cookie'], options.hostname);
				var message = body.match(/name="Message" value="([^"]+)"/);
				if (message) {
					timeLog('[Event:pay.detail][User:'+_ref.userName+'][Id:'+_ref.id+'][Car:' + car.borrowName + ']Exit, message=' + message[1]);
					if(message[1] == "转账失败") {
						_ref.events.emit('pay.detail', car, url, formData);
					}
					return;
				}
				timeLog('[Event:pay.detail][User:'+_ref.userName+'][Id:'+_ref.id+'][Car:' + car.borrowName + ']Success, detail page size=' + body.length);
				_ref.events.emit('pay.verify', car, body);
				Fs.writeFileSync('http/pay.detail-' + _ref.userName + '-' + car.sid, body);
			});
		});

		req.write(formData);
		var subTimer = setInterval(function() {
			if(_detailSubmit) {
				return;
			}
			_detailSubmit++;
			clearInterval(subTimer);
			req.end();
		}, 1);
	});

	this.events.on('pay.verify', (car, detail)=>{ // 密码验证
		timeLog('[Event:pay.verify][User:'+_ref.userName+'][Id:'+_ref.id+'][Car:' + car.borrowName + ']');
		var _chunks = [];
		var matches = detail.match(/publicKey = "([^"]+)"/);
		if (!matches) {
			_ref.events.emit('car.detail', car);
			timeLog(
				'[Event:pay.verify][User:'
				+ _ref.userName
				+ '][Car:' 
				+ car.borrowName 
				+ ']Retry, publickKey not found'
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
					timeLog('[Event:pay.verify][User:'+_ref.userName+'][Id:'+_ref.id+'][Car:' + car.borrowName + ']Retry, message=' + message[1]);
					_ref.events.emit('car.detail', car);
					return;
				}
				if (body != 2) {
					timeLog('[Event:pay.verify][User:'+_ref.userName+'][Id:'+_ref.id+'][Car:' + car.borrowName + ']Exit, message=支付密码验证失败, ret=' + body);
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
		timeLog('[Event:pay.sign][User:'+_ref.userName+'][Id:'+_ref.id+'][Car:' + car.borrowName + ']');
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
					timeLog('[Event:pay.sign][User:'+_ref.userName+'][Id:'+_ref.id+'][Car:' + car.borrowName + ']Exit, message=' + message[1]);
					return;
				}
				formObj['itrusdata'] = body;
				timeLog('[Event:pay.sign][User:'+_ref.userName+'][Id:'+_ref.id+'][Car:' + car.borrowName + ']Done, itrusdata size=' + body.length);
				_ref.events.emit('pay.submit', car, formObj);
				Fs.writeFileSync('http/pay.sign-' + _ref.userName + '-' + car.sid, body);
			});
		});

		req.write(postData);
		req.end();
	});

	this.events.on('pay.submit', (car, formObj) => { // 支付提交
		timeLog('[Event:pay.submit][User:'+_ref.userName+'][Id:'+_ref.id+'][Car:' + car.borrowName + ']');
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
				sLock[_ref.userName]--;
				_dispatched = false;
				var body = chunkToStr(Buffer.concat(_chunks), res.headers['content-encoding']);
				_ref.setCookie(res.headers['set-cookie'], options.hostname);
				var message = body.match(/name="Message" value="([^"]*)"/);
				if (!message) {
					timeLog('[Event:pay.submit][User:'+_ref.userName+'][Id:'+_ref.id+'][Car:' + car.borrowName + ']Exit, pay error message=未知错误');
					Fs.writeFileSync('http/pay.submit-' + _ref.userName + '-' + car.sid, body);
					_ref.events.emit('car.detail', car);
					return;
				}
				if (message[1] != "成功") {
					timeLog('[Event:pay.submit][User:'+_ref.userName+'][Id:'+_ref.id+'][Car:' + car.borrowName + ']Exit, pay error message=' + message[1]);
					Fs.writeFileSync('http/pay.submit-' + _ref.userName + '-' + car.sid, body);
					if (message[1] == '转账信息已过期') {
						_ref.events.emit('car.detail', car);
					}
					return;
				}
				timeLog('[Event:pay.submit][User:'+_ref.userName+'][Id:'+_ref.id+'][Car:' + car.borrowName + ']Done, message=' + message[1]);
				_ref.events.emit('pay.callback', car, body);
				Fs.writeFileSync('http/pay.submit-' + _ref.userName + '-' + car.sid, body);
			});
		});

		req.write(postData);
		var subTimer = setInterval(function() {
			if(sLock[_ref.userName]) {
				return;
			}
			sLock[_ref.userName]++;
			clearInterval(subTimer);
			req.end();
			setTimeout(function() {
				sLock[_ref.userName]--;
			}, paySubmitWait)
		}, 1);
	});

	this.events.on('pay.callback', (car, detail)=>{ // 支付回调
		timeLog('[Event:pay.callback][User:'+_ref.userName+'][Id:'+_ref.id+'][Car:' + car.borrowName + ']');
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
				timeLog('[Event:pay.callback][User:'+_ref.userName+'][Id:'+_ref.id+'][Car:' + car.borrowName + ']Done, return url=' + res.headers['location']);
				_ref.events.emit('pay.return', car, res.headers['location']);
				Fs.writeFileSync('http/pay.callback-' + _ref.userName + '-' + car.sid, body);
			});
		});
		req.write(postData);
		req.end();
	});

	this.events.on('pay.return', (car, url) => { // 返回页
		timeLog('[Event:pay.return][User:'+_ref.userName+'][Id:'+_ref.id+'][Car:' + car.borrowName + ']');
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
				timeLog('[Event:pay.return][User:'+_ref.userName+'][Id:'+_ref.id+'][Car:' + car.borrowName + ']Done, status=' + res.statusCode);
				Fs.writeFileSync('http/pay.return-' + _ref.userName + '-' + car.sid, body);
			});
		});
		req.end();
	});
};

// 系统参数加载
// config/system.dat
timeLog('[Process]Loading system settings');
var systems = {};
var systemList = Fs
	.readFileSync(__dirname + '/config/system.dat', 'utf8')
	.replace(/(^\s+|\s+$)/g, '')
	.split("\n");
for(i in systemList) {
	var system = systemList[i].replace(/\s+/g, '').split('=');
	if (system.length == 2) {
		systemParams[system[0]] = parseInt(system[1]);
	}
}

// 配置文件加载
// config/strategy.dat
timeLog('[Process]Loading strategys');
var strategys = {};
var strategyList = Fs
	.readFileSync(__dirname + '/config/strategy.dat', 'utf8')
	.replace(/(^\s+|\s+$)/g, '')
	.split("\n");
for(i in strategyList) {
	var strategy = strategyList[i].replace(/\s+/g, '').split('|');
	if (!strategy[0]) continue;
	if(!strategys[strategy[0]]) {
		strategys[strategy[0]] = {};
	}
	
	if(strategy[1].match(/,/)) {
		strategy[1] = strategy[1].split(',');
		for(var i = 0; i < strategy[1].length; i++) {
			strategys[strategy[0]][strategy[1][i]] = strategy[2];
		}
	} else {
		strategys[strategy[0]][strategy[1]] = strategy[2];
	}
}

// 创建众筹机器人
timeLog('[Process]Create robots');
var robots = [];
var robotsList = [];
var userList = Fs
	.readFileSync(__dirname + '/user.list','utf8')
	.replace(/(^\s+|\s+$)/g, '')
	.split("\n");
if (userList.length <= 1) {
	if(!userList[0]) {
		timeLog('[Process]Exit, no user join');
		process.exit();
	}
	paySubmitWait = 5000;
}
var workerNum = systemParams.workerNum;
var sLock = [];
for(i in userList) {
	if (userList[i][0] == '#') {
		continue;
	}
	var user = userList[i].split('|');
	sLock[user[0]] = 0;
	robots = [];
	for (var wn = 1000; wn < 1000 + workerNum; wn++) {
		var robot = new CFRobot({
			id: wn,
			name: user[0],
			loginPass: user[1],
			payPass: user[2],
			notifyMail: user[3]
		});
		robot.strategys = strategys[user[0]] || null;
		timeLog('[Process]Robot user=' + user[0] + ', id=' + wn + ' ready');
		robot.events.emit('user.login');
		robots.push(robot);
	}
	robotsList[user[0]] = robots;
}

timeLog('[Process]Create detector, type=' + detectorType);
var detectDispatched = { length: 0 };
var startTs = null;
(doDetect = function() { // 创建监听器
	var _ts = new Date();
	var _waitElapse = 5;
	if (_ts.getSeconds() % 5 != 0) {
		setTimeout(function() {
			doDetect();
		}, _waitElapse);
		return;
	}
	var _chunks = [];
	var options = {
		hostname: "api.zecaifu.com",
		port: 443,
		path: '/api/v2/list/'+detectorType+'/all/run?page=1&app_token=03b22a29e10a9fe2fc3cf72ba7e07688&',
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
					for(var rname in robotsList) {
						var robots = robotsList[rname];
						for(n = 0; n < robots.length; n++) {
							if(robots[n].doDispatch(list[i])) break;
						}
					}
					detectDispatched[list[i].sid] = 1;
					detectDispatched['length']++;
					if (detectDispatched['length'] == 1) {
						startTs = new Date();
					}
					_waitElapse = 1000;
					break;
				}
			}
			if (startTs && _ts.getTime() - startTs.getTime() > systemParams.detectTs) {
				timeLog('[Detector:listen]Dispatched done, total=' + detectDispatched.length);
				return;
			}
			setTimeout(function() {
				doDetect();
			}, _waitElapse);
		});
	});
	req.end();
})();
