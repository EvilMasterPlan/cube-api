const db = require('./db.js');
const aws = require('./aws.js');
const asyncHandler = require('express-async-handler');
const utility = require('./utility.js');

module.exports.validateEmail = asyncHandler(async(req, res, next) => {
	let err;

	if (req.body.email != null) {
		const emailRegex = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
		if (!emailRegex.test(req.body.email)) {
			err = new Error('invalid email');
			err.status = 400;
		}
	} else {
		err = new Error('missing email in body');
		err.status = 400;
	}

	next(err);
});

module.exports.sendWelcome = asyncHandler(async(req, res, next) => {

	const to = req.body.email;
	const from = "no-reply@prioritycube.com";
	const fromName = "Team Cube";
	const subject = "Welcome to the Priority Cube";
	const message = ``;

	await aws.sendEmail(to, from, fromName, subject, message);

	next();
});

module.exports.sendNewAccountNotification = asyncHandler(async(req, res, next) => {

	const to = req.body.email;

	const from = "no-reply@prioritycube.com";
	const fromName = "Team Cube";
	const subject = `Welcome to Priority Cube`;
	const message = `You have a cool new cube to try out! Do so here: www.prioritycube.com`;

	let html = `
		<html>
			<div></div>
			You have a cool new cube to try out! Do so here:
			www.prioritycube.com
			<br/>
			<br/>
		</html>
	`;

	await aws.sendEmail(to, from, fromName, subject, message, html);
	await db.markEmailAsSent(utility.generateItemID('OBX'), 'cube', to, 'ResetPassword');

	next();
});

module.exports.sendResetPasswordNotification = asyncHandler(async(req, res, next) => {

	const to = req.body.email;
	const url = `www.prioritycube.com/reset?email=${to}&code=${req.token}`;

	const from = "no-reply@prioritycube.com";
	const fromName = "Team Cube";
	const subject = `Priority Cube Reset: ${req.token}`;
	const message = ``;

	let html = ``;

	await aws.sendEmail(to, from, fromName, subject, message, html);
	await db.markEmailAsSent(utility.generateItemID('OBX'), 'cube', to, 'ResetPassword');

	next();
});

module.exports.sendEmergencyMail = asyncHandler(async(req, res, next) => {

	let err;

	const to = req.body.email;
	const from = "no-reply@prioritycube.com";
	const fromName = "Team Cube";
	const subject = ``;

	let message = ``;
	message += ``;
	

	let html = `
		<html>
			<div></div>
			<br/>
			<br/>
		</html>
	`;

	console.log(`sending emergency message to ${to}`);
	await aws.sendEmail(to, from, fromName, subject, message, html);
	await db.markEmailAsSent(utility.generateItemID('OBX'), 'cube', to, 'WaitComplete');

	next(err);
});