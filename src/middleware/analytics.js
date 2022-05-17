const db = require('./db.js');
const asyncHandler = require('express-async-handler');
const utility = require('./utility.js');
const uuid = require('uuid');

const getBrowser = (browserNumber) => {
	let browser = "Unknown";

	if (browserNumber === 1) {
		browser = "Safari";
	} else if (browserNumber === 2) {
		browser = "Chrome/Chromium";
	} else if (browserNumber === 3) {
		browser = "Microsoft Edge";
	} else if (browserNumber === 4) {
		browser = "Internet Explorer";
	} else if (browserNumber === 5) {
		browser = "Opera";
	} else if (browserNumber === 6) {
		browser = "Samsung Internet";
	} else if (browserNumber === 7) {
		browser = "Mozilla Firefox";
	} else if (browserNumber === 8) {
		browser = "Crawler - Alexa";
	} else if (browserNumber === 9) {
		browser = "Crawler - Facebook";
	} else if (browserNumber === 10) {
		browser = "Crawler - Exabot";
	} else if (browserNumber === 11) {
		browser = "Crawler - Sogou";
	} else if (browserNumber === 12) {
		browser = "Crawler - Yandex";
	} else if (browserNumber === 13) {
		browser = "Crawler - Baidu";
	} else if (browserNumber === 14) {
		browser = "Crawler - DuckDuckGo";
	} else if (browserNumber === 15) {
		browser = "Crawler - Slurp";
	} else if (browserNumber === 16) {
		browser = "Crawler - Bing";
	} else if (browserNumber === 17) {
		browser = "Crawler - Google";
	}
	
	return browser;
}

const getOS = (OSNumber) => {
	let OS = "Unknown";

	if (OSNumber === 1) {
		OS = "Mac";
	} else if (OSNumber === 2) {
		OS = "iOS";
	} else if (OSNumber === 3) {
		OS = "Windows";
	} else if (OSNumber === 4) {
		OS = "Android";
	} else if (OSNumber === 5) {
		OS = "Linux";
	}

	return OS;
}

const getDevice = (deviceNumber) => {
	let device = "Unknown";

	if (deviceNumber === 1) {
		device = "Desktop";
	} else if (deviceNumber === 2) {
		device = "Mobile";
	}

	return device;
}

module.exports.logPageView = asyncHandler(async(req, res, next) => {
	let err;

	const a = req.body.a || 0; // Browser Number
	const b = req.body.b || 0; // OS Number
	const c = req.body.c || 0; // Device Number

	const browserString = getBrowser(a);
	const OSString = getOS(b);
	const deviceString = getDevice(c);

	const ip = req.header('x-forwarded-for') || req.connection.remoteAddress;

	const hitID = uuid.v4();
	db.logPageView(hitID, 'cube', req.body.page, ip, req.user.UserID, browserString, deviceString, OSString);

	next(err);
});