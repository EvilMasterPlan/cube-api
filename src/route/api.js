var express = require('express');
var router = express.Router();

const middleware = require('../middleware/api.js');
const email = require('../middleware/email.js');
const authentication = require('../middleware/authentication.js');
const authorization = require('../middleware/authorization.js');
const validate = require('../middleware/validate.js');
const analytics = require('../middleware/analytics.js');
const stripe = require('../middleware/stripe.js');
const cube = require('../middleware/cube.js');

// ===================================
// Test
// ===================================

router.get('/test', [
	authentication.verifyAuthentication,
	middleware.getTestData,
	middleware.return
]);

// ===================================
// Payments
// ===================================

router.post('/payments/create-session', [
	authentication.verifyAuthentication,
	validate.body(['type']),
	stripe.createSession,
	middleware.return
]);

router.post('/payments/manage-billing', [
	authentication.verifyAuthentication,
	validate.body('customerID'),
	stripe.manageBilling,
	middleware.return
]);

router.post('/payments/event', [
	validate.body(['data', 'type']),
	stripe.handleEvent,
	middleware.return
]);

router.post('/payments/event/test', [
	validate.body(['data', 'type']),
	stripe.handleTestEvent,
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

router.post('/account/create', [
	validate.body(['email', 'passwordHash']),
	authentication.createNewAccount,
	authentication.createSession,
	email.sendNewAccountNotification,
	middleware.return
]);

router.post('/account/setup', [
	validate.body(['cubeNames']),
	authentication.verifyAuthentication,
	cube.checkSetup,
	cube.setUp,
	middleware.return
])

// ===================================
// CUBES
// ===================================

router.post('/cube/create', [
	validate.body(['metricNames']),
	authentication.verifyAuthentication,
	cube.createCube,
	middleware.return
]);

router.post('/cube/title/edit', [
	validate.body(['cubeID', 'newTitle']),
	authentication.verifyAuthentication,
	cube.editCubeTitle,
	middleware.return
]);

router.post('/cube/delete', [
	validate.body(['cubeIDs']),
	authentication.verifyAuthentication,
	cube.deleteCube,
	middleware.return
]);

router.post('/cube/persist', [
	validate.body(['cube']),
	authentication.verifyAuthentication,
	cube.persistCube,
	middleware.return
]);

// ===================================
// USER
// ===================================

router.post('/me/get-profile', [
	authentication.verifyAuthentication,
	cube.getMe,
	middleware.return
]);

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
