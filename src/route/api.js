var express = require('express');
var router = express.Router();

const middleware = require('../middleware/api.js');
const email = require('../middleware/email.js');
const authentication = require('../middleware/authentication.js');
const authorization = require('../middleware/authorization.js');
const validate = require('../middleware/validate.js');
const analytics = require('../middleware/analytics.js');

// ===================================
// Test
// ===================================

router.get('/test', [
	authentication.verifyAuthentication,
	middleware.getTestData,
	middleware.return
]);

// ===================================
// Account
// ===================================

router.post('/authentication/login', [
	validate.body(['email', 'passwordHash']),
	authentication.authenticate,
	authentication.createSession,
	middleware.return
]);

router.post('/authentication/logout', [
	authentication.destroySession,
	middleware.return
]);

// ===================================
// USER
// ===================================

// ===================================
// Analytics
// ===================================

router.post('/a/page', [
	validate.body([
		{name: 'page', maxLength: 255},
		{name: 'a', minValue: 0, maxValue: 50, optional: true},
		{name: 'b', minValue: 0, maxValue: 50, optional: true},
		{name: 'c', minValue: 0, maxValue: 50, optional: true}
	]),
	authentication.observeSession,
	analytics.logPageView,
	middleware.return
]);


// ===================================
// Emergency
// ===================================

// router.post('/emergency/email', [
// 	email.validateEmail,
// 	email.sendEmergencyMail,
// 	middleware.return
// ]);

module.exports = router;
