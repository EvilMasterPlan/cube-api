const uuid = require('uuid');
const config = require('../util/config.js');
const db = require('./db.js');
const cookieOptions = config.get('cookie.options') || {};
const readOnlyCookieOptions = config.get('cookie.readOnlyOptions') || {};
const crypto = require('crypto');
const asyncHandler = require('express-async-handler');
const utility = require('./utility.js');

module.exports.deriveMasterKey = (salt, passwordHash) => {
	const hash = crypto.createHash('sha512');
	const masterKey = hash.update(`${salt}${passwordHash}`).digest('hex');
	return masterKey;
}

module.exports.requestPasswordReset = asyncHandler(async(req, res, next) => {
	let error;

	const email = req.body.email;

	const user = await db.getUserByEmail(email);

	if (user == null) {
		error = new Error('No account exists with this email');
		error.status = 404;
		return next(error);
	}

	next(error);
});

module.exports.requestAccountVerification = asyncHandler(async(req, res, next) => {
	let error;

	const email = req.body.email;

	const user = await db.getUserByEmail(email);

	if (user == null) {
		error = new Error('no user with that email');
		error.status = 404;
		return next(error);
	}

	if (user.Verified === 1) {
		error = new Error('account already verified');
		error.status = 409;
		return next(error);
	}

	req.userID = user.UserID;

	next(error);
});

module.exports.createNewAccount = asyncHandler(async(req, res, next) => {
	let error;

	const email = req.body.email;
	const passwordHash = req.body.passwordHash;

	const user = await db.getUserByEmail(email);

	if (user != null) {
		error = new Error('Account already exists with this email');
		error.status = 409;
		return next(error);
	}

	const userID = utility.randomAlphaNumericString(8);
	req.userID = userID;

	const salt = crypto.randomBytes(64).toString('hex').slice(0, 64);
	const masterKey = module.exports.deriveMasterKey(salt, passwordHash);

	await db.createAccount(userID, email);
	await db.updateAccountAuthentication(userID, salt, masterKey);

	req.user = {
		UserID: userID,
		Email: email
	}

	next(error);
});

module.exports.verifyPasswordResetCode = asyncHandler(async(req, res, next) => {
	let error;

	const email = req.body.email;
	const verificationCode = req.body.verificationCode;

	const user = await db.getUserByEmail(email);

	if (user == null) {
		error = new Error('no user with that email');
		error.status = 404;
		return next(error);
	}

	const tokenInfo = await db.getAccountToken(email, 'PassReset');
	const token = (tokenInfo != null) ? tokenInfo.Token : null;

	if (token !== verificationCode) {
		error = new Error('invalid verification code');
		error.status = 401;
		return next(error);
	}

	req.userID = user.UserID;

	next(error);
});

module.exports.verifyAccount = asyncHandler(async(req, res, next) => {
	let error;

	const email = req.body.email;
	const verificationCode = req.body.verificationCode;

	const user = await db.getUserByEmail(email);

	if (user == null) {
		error = new Error('no user with that email');
		error.status = 404;
		return next(error);
	}

	if (user.Verified === 1) {
		error = new Error('account already verified');
		error.status = 409;
		return next(error);
	}

	const tokenInfo = await db.getAccountToken(email, 'Verify');
	const token = (tokenInfo != null) ? tokenInfo.Token : null;

	if (token !== verificationCode) {
		error = new Error('invalid verification code');
		error.status = 401;
		return next(error);
	}

	await db.verifyAccount(user.UserID);

	req.userID = user.UserID;

	next(error);
});

module.exports.clearAccountVerificationToken = asyncHandler(async(req, res, next) => {
	const email = req.body.email;

	await db.clearAccountToken(email, 'Verify');

	next();
});

module.exports.clearAccountResetToken = asyncHandler(async(req, res, next) => {
	const email = req.body.email;

	await db.clearAccountToken(email, 'PassReset');

	next();
});

module.exports.generateVerificationToken = asyncHandler(async(req, res, next) => {
	const email = req.body.email;

	const verificationToken = crypto.randomBytes(64).toString('hex').slice(0, 8);
	req.token = verificationToken;

	await db.updateAccountToken(email, verificationToken, 'Verify');

	next();
});

module.exports.generateResetToken = asyncHandler(async(req, res, next) => {
	const email = req.body.email;

	const verificationToken = crypto.randomBytes(64).toString('hex').slice(0, 8);
	req.token = verificationToken;

	await db.updateAccountToken(email, verificationToken, 'PassReset');

	next();
});

module.exports.resetPassword = asyncHandler(async(req, res, next) => {
	let error;

	const email = req.body.email;
	const passwordHash = req.body.newPasswordHash;

	const salt = crypto.randomBytes(64).toString('hex').slice(0, 64);
	const masterKey = module.exports.deriveMasterKey(salt, passwordHash);

	await db.updateAccountAuthentication(req.userID, salt, masterKey);

	next();
});

module.exports.observeSession = asyncHandler(async(req, res, next) => {
	let error;

	let userID;

	if (req.cookies != null && req.cookies.session != null) {
		const sessionID = req.cookies.session;
		const session = await db.getSession(sessionID);
		if (session != null && session.UserID != null) {
			userID = session.UserID;
		}
	}

	if (req.user == null) {
		req.user = {
			UserID: userID
		}
	} else {
		req.user.UserID = userID;
	}

	return next(error);
});

module.exports.verifyAuthentication = asyncHandler(async(req, res, next) => {
	let error;

	if (req.cookies == null || req.cookies.session == null) {
		error = new Error('unauthenticated');
		error.status = 401;
		return next(error);
	}

	const sessionID = req.cookies.session;
	const session = await db.getSession(sessionID);

	if (session == null || session.UserID == null) {
		error = new Error('unauthenticated');
		error.status = 401;

		res.clearCookie('session');
		res.clearCookie('active');
		
		return next(error);
	}

	if (session.expiration != null && session.expiration < Date.now()) {
		error = new Error('unauthenticated');
		error.status = 401;

		res.clearCookie('session');
		res.clearCookie('active');
		destroySession(sessionID);

		return next(error);
	}

	const user = await db.getUserAuthorization(session.UserID);

	if (user == null) {
		error = new Error('unauthenticated');
		error.status = 401;

		res.clearCookie('session');
		res.clearCookie('active');
		await db.destroySession(sessionID);

		return next(error);
	}

	req.user = user;

	next(error);
});

module.exports.authenticate = asyncHandler(async(req, res, next) => {
	let error;

	const email = req.body.email;
	const passwordHash = req.body.passwordHash;

	const authenticationInfo = await db.getAuthenticationInfo(email);

	if (authenticationInfo != null) {
		const salt = authenticationInfo.Salt;
		const userID = authenticationInfo.UserID;
		const masterKey = module.exports.deriveMasterKey(salt, passwordHash);

		const authenticated = masterKey === authenticationInfo.Signature;

		if (authenticated === false) {
			error = new Error('invalid credentials');
			error.status = 401;
		}

		req.userID = userID;

	} else {
		error = new Error('invalid credentials');
		error.status = 401;
	}

	next(error);
});

module.exports.createSession = asyncHandler(async(req, res, next) => {
	let error;

	if (req.userID != null) {
		const sessionID = uuid.v4();
		res.cookie('session', sessionID, cookieOptions);
		res.cookie('active', 'true', readOnlyCookieOptions);
		const now = new Date();
		const expiration = new Date(now.getTime() + (cookieOptions.maxAge || 5184000000));
		await db.createSession(req.userID, sessionID, expiration.getTime());
	} else {
		error = new Error('no such user');
		error.status = 500;
	}

	next(error);
});

module.exports.destroySession = asyncHandler(async(req, res, next) => {
	let error;

	if (req.cookies != null && req.cookies.session != null) {
		const sessionID = req.cookies.session;
		res.clearCookie('session');
		res.clearCookie('active');
		await db.destroySession(sessionID);
	}

	next();
});

