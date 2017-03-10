// 类库加载
const Https = require('https');
const Zlib = require('zlib');
const Fs = require('fs');
const Events = require('events');
const Query = require('querystring');
const Util = require('util');

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
	this.strategys = {}; // 策略信息
	this.cookies = {}; // cookie信息
	this.profile = {}; // 账户信息
	this.auth = 0; // 
	this.events = new Events;
	var _ref = this;

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
			res.on('data', function(chunk) {
				var body = chunkToStr(chunk, res.headers['content-encoding']);
				_ref.setCookie(res.headers['set-cookie'], options.hostname);
				var match = body.match(/_token" value="[^"]+/);
				_ref.events.emit('user.login.submit', match[0].replace('_token" value="', ''));
			});
		});
		req.end();
	});

	this.events.on('user.login.submit', function(token) { // 登录页
		timeLog('[Event:user.login.submit][User:'+_ref.userName+']');
		var cookiePath = 'cookies/www.zecaifu.com-' + _ref.userName;
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
			res.on('data', function(chunk) {
				var body = chunkToStr(chunk, res.headers['content-encoding']);
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
			res.on('data', function(chunk) {
				var body = chunkToStr(chunk, res.headers['content-encoding']);
				_ref.profile = JSON.parse(body);
				timeLog('[Event:user.profile][User:'+_ref.userName+']Get balance=' + _ref.profile[0]);
			});
		});

		req.end();
	});

	this.events.on('car.detail', (car) => { // 登录页
		timeLog('[Event:car.detail][User:'+_ref.userName+'][Car:' + car.borrowName + ']');
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
			res.on('data', function(chunk) {
				var body = chunkToStr(chunk, res.headers['content-encoding']);
				_ref.setCookie(res.headers['set-cookie'], options.hostname);
				var match = body.match(/_token" value="[^"]+/g);
				token = match[0].replace('_token" value="', '')
				timeLog('[Event:car.detail][User:'+_ref.userName+'][Car:' + car.borrowName + ']Get Pay token=' + token);
			});
		});
		req.end();
	});

	this.events.on('car.submit', (ref)=>{ // 提交众筹
		console.log('car.submit');
		var options = {
			hostname: 'www.zecaifu.com',
			port: 443,
			path: '/detail/' + carId,
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
				'Referer': 'https://www.zecaifu.com/detail/' + carId,
				'Content-Type' : 'application/x-www-form-urlencoded; charset=UTF-8',
				'Origin' : 'https://www.zecaifu.com'
			}
		};
		var req = Https.request(options, (res) => {
			res.on('data', function(chunk) {
				var body = chunkToStr(chunk, res.headers['content-encoding']);
			});
		});
		ref.events.emit('pay.redirect', ref);
	});

	this.events.on('car.redirect', (ref, url)=>{ // 众筹中转页
		console.log('pay.redirect');
		var options = {
		};
		var req = Https.request(options, (res) => {
			res.on('data', function(chunk) {
				var body = chunkToStr(chunk, res.headers['content-encoding']);
			});
		});
		ref.events.emit('pay.redirect', ref);
	});

	this.events.on('pay.detail', (ref)=>{ // 支付详情
		console.log('pay.detail');
		var options = {
		};
		var req = Https.request(options, (res) => {
			res.on('data', function(chunk) {
			var body = chunkToStr(chunk, res.headers['content-encoding']);
			});
		});
		ref.events.emit('pay.verify', ref);
	});

	this.events.on('pay.verify', (ref)=>{ // 密码验证
		console.log('pay.verify');
		var options = {
		};
		var req = Https.request(options, (res) => {
			res.on('data', function(chunk) {
				var body = chunkToStr(chunk, res.headers['content-encoding']);
			});
		});
		ref.events.emit('pay.sign', ref);
	});

	this.events.on('pay.sign', (ref)=>{ // 数据签名
		console.log('pay.sign');
		var options = {
		};
		var req = Https.request(options, (res) => {
			res.on('data', function(chunk) {
				var body = chunkToStr(chunk, res.headers['content-encoding']);
			});
		});
		ref.events.emit('pay.submit', ref);
	});

	this.events.on('pay.submit', (ref)=>{ // 支付提交
		console.log('pay.submit');
		var options = {
		};
		var req = Https.request(options, (res) => {
			res.on('data', function(chunk) {
				var body = chunkToStr(chunk, res.headers['content-encoding']);
			});
		});
		ref.events.emit('pay.callback', ref);
	});

	this.events.on('pay.callback', (ref)=>{ // 支付回调
		console.log('pay.callback');
		var options = {
		};
		var req = Https.request(options, (res) => {
			res.on('data', function(chunk) {
				var body = chunkToStr(chunk, res.headers['content-encoding']);
			});
		});
		ref.events.emit('pay.return', ref);
	});

	this.events.on('pay.return', (ref)=>{ // 支付返回
	});

	this.events.on('error', (ref)=> { // 访问异常
	});
};

var Detector = function() {
	var _ref = this;
	var _dispatched = [];

	this.on('car.list', ()=>{ // 标的列表
		var options = {
			hostname: "api.zecaifu.com",
			port: 443,
			path: "/api/v2/list/car/all/all?page=1",
			method: "GET",
			headers: {
				'Host': 'api.zecaifu.com',
				'User-Agent': 'Dalvik/2.1.0 (Linux; U; Android 7.0; VIE-AL10 Build/HUAWEIVIE-AL10)',
				'Accept-Encoding': 'gzip'
			}
		};
		var req = Https.request(options, (res) => {
			res.on('data', function(chunk) {
				var body = chunkToStr(chunk, res.headers['content-encoding']);
				body = JSON.parse(body);
				if (body.code == 0 && body.data.borrow.totalItems > 0) { // 成功
					var list = body.data.borrow.borrowList;
					for (i = 0; i < list.length; i++) {
						if(list[i].status == 'run' 
								|| _dispatched[list[i].sid]) // 车辆状态未就绪或者已分配
							continue;
						_dispatched[list[i].sid] = 1;
						for(n = 0; n < robots.length; n++) {
							robots[n].events.emit('car.detail', list[i]);
						}
						break;
					}
				}
				//_ref.emit('car.list');
			});
		});
		req.end();
	});
};

Detector.prototype = new Events;

// 配置文件加载
// config/strategy.dat
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
	robot.strategys = strategys[user[0]] || {};
	robot.events.emit('user.login');
	robots.push(robot);
}

var detector = new Detector();
detector.emit('car.list');

